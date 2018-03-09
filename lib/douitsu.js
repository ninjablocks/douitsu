
'use strict';

var underscore = require('underscore');
var argv       = require('optimist').argv;
var connect    = require('connect');
var async      = require('async');
var url        = require('url');
var mysqlStore = require('seneca-mysql-store');
var tokens     = require('./tokens');

module.exports = function( options ) {
  var seneca = this;
  var plugin = 'douitsu';

  var env = argv.env || process.env.NODE_ENV;
  var DB_URL = process.env.DB_URL;
  var CACHE_URL = process.env.CACHE_URL;
  var fixtures = argv.fixtures;
  var memstore = false;

  var userent        = seneca.make('sys/user');
  var applicationent = seneca.make('application');
  var accesstokenent = seneca.make('accesstoken');

  function init() {

    if( 'production' === env ) {
      seneca.use(mysqlStore, mysqlSpec());

      var redisSpec = redisDbSpec();
      redisSpec.map = {'-/-/session':'*'};
      seneca.use('redis-store', redisSpec);
    }
    else {
      seneca.log.info('using mem store');
      memstore = true;
      seneca.use('mem-store',{web:{dump:true}});
    }

    // Ordering of fieldmap, datetimemap and store-extend is important, where the last is the first to intercept actions

    // Map when to created field
    seneca.use('fieldmap', {
      map: {
        '-/sys/user': {
          alias: {
            when:'created'
          }
        }
      }
    });

    // Convert ISO datetime to datetime acceptable by MySQL
    seneca.use('./lib/datetimemap', {
      map: {
        '-/sys/user': {
          alias: ['when', 'updated']
        },
        '-/sys/login': {
          alias: ['when']
        }
      }
    });

    // Add updated field
    seneca.use('./lib/store-extend', {
      map: {
          '-/sys/user': {
            alias: {
              updated:'updated'
            }
          }
        }
      }
    );

    seneca.use('user',{confirm:true});
    seneca.use('mail');
    seneca.use('auth');
    seneca.use('account');
    seneca.use('settings');
    seneca.use('data-editor');
    seneca.use('admin');

    if( options.auth.sendemail ) {
      seneca.depends(plugin,['mail']);
      var mailact = seneca.pin({role:'mail',cmd:'*'});
    }

    // User application API
    seneca.use('jsonrest-api',{
      prefix:'/api/rest/',
      meta:false
    });
    seneca.add({role:plugin,cmd:'get_user_applications'}, cmd_get_user_applications );
    seneca.add({role:plugin,cmd:'del_user_application'}, cmd_del_user_application );
    seneca.act({role:'web',use:{
      prefix:'/api/user/',
      pin:{role:plugin,cmd:'*'},
      map:{
        get_user_applications: { alias:'application', GET:buildcontext },
        del_user_application: { alias:'application/:id', DELETE:buildcontext }
      }
    }});

    // Intercept POST to /api/rest/application and generate appid and secret for new instances
    seneca.add({role:'jsonrest-api',prefix:'/api/rest/',method:'post',name:'application'},function(args,done){
      var data = args.data;

      if (!data.active) {
        data.active = true;
      }
      if (!data.appid) {
        data.appid = tokens.generate_token('app_');
      }
      if (!data.secret) {
        data.secret = tokens.generate_token('sk_');
      }

      this.prior(args,done);
    });

    // Intercept DELETE to /api/rest/application/:id and delete associated access tokens
    seneca.add({role:'jsonrest-api',prefix:'/api/rest/',method:'delete',name:'application'},function(args,done){
      var instance = this;

      applicationent.load$(args.id, function(err, application){
        if (err) {return done(err);}
        if(application) {
          removeAccessTokens({clientID: application.appid}, function(err) {
            if (err) {return done(err);}
            instance.prior(args,done);
          });
        }
        else {
          done('Application not found [' + args.id + ']');
        }
      });
    });

    // If options.auth.confirm is enabled then intercept signin and check user has confirmed their email
    if (options.auth.confirm) {
      seneca.add({role:'user', cmd:'login'},function(args,done){
        var instance = this;

        if (!args.nick) {
          instance.prior(args, done);
        }
        else {
          seneca.make('sys/user').load$({nick:args.nick}, function(err, user){
            if(!user || user.confirmed) {
              instance.prior(args, done);
            }
            else {
              done(null, {ok: false, why: 'user-not-confirmed'});
            }
          });
        }
      });
      seneca.add({role:'auth', cmd:'register'},function(args,done){
        this.prior(args, function(err, out) {
          if( options.auth.sendemail && 'user-not-confirmed' === out.why ) {
            // send confirm email as user-not-confirmed error would have prevented the email being sent in auth seneca plugin
            userent.load$({email:args.data.email}, function(err, user){
              if (err) {return done(err);}
              if(!user) {return done(null, {ok:false, user:null, login:null});}
              mailact.send( {code:'auth-register',
                             to:user.email,
                             subject:options.auth.email.subject.register,
                             content:{name:user.name,
                                      confirmcode:user.confirmcode,
                                      confirmlink:options.auth.email.content.confirmlinkprefix+'/'+user.confirmcode}} );
              done(err, out);
            });
          }
          else {
            done(err, out);
          }
        });
      });
    }

    // Intercept update_user and check email is unique
    // TODO Remove once update_user in seneca-auth is fixed, throws unknown error if email exists
    seneca.add({role:'auth',cmd:'update_user'},function(args,done){
      var instance = this;
      var data = args.data;

      if (!data.email) {
        instance.prior(args, done);
      }
      else {
        seneca.make('sys/user').load$({email:data.email}, function(err, user){
          if(!user) {
            instance.prior(args, done);
          }
          else {
            return done(null, {ok: false, why: 'user-exists-email'});
          }
        });
      }
    });

    if(options.auth && options.auth.ldap && options.auth.ldap.enabled) {
      seneca.use('./lib/ldap', options);
    }

  }

  function mysqlSpec() {
    var spec = options.mysql || {};
    if (DB_URL) {
      var db = url.parse(DB_URL);
      var dbAuth = db.auth.split(':');
      spec.name   = db.path.substring(1);
      spec.port   = db.port;
      spec.host = db.hostname;
      spec.user = dbAuth[0];
      spec.password = dbAuth[1];
      spec.port = spec.port ? parseInt(spec.port,10) : null;
    }

    seneca.log.info('mysql', 'mysql://' + spec.host + ':' + spec.port + '/' + spec.name, 'user: ' + spec.user);

    return spec;
  }

  function redisDbSpec() {
    var spec = options.redis || {};
    if (CACHE_URL) {
      var db = url.parse(CACHE_URL);
      spec.host = db.hostname;
      spec.port   = db.port;
      spec.port = spec.port ? parseInt(spec.port,10) : null;
    }

    seneca.log.info('redis', 'redis://' + spec.host + ((spec.port) ? ':' + spec.port : ''));

    return spec;
  }

  function cmd_get_user_applications( args, done ) {
    var user = args.user;

    if( user ) {
      accesstokenent.list$({userID:user.id},function(err, tokens){
        if(err) {return done(err);}

        var uniqueTokens = underscore.uniq(tokens, function (token) {
          return token.clientId;
        });
        var applications = [];
        underscore.each(uniqueTokens, function(token) {
          applications.push(underscore.pick(token, 'userID', 'clientID', 'clientName'));
        });

        done( null, {applications:applications});
      });
    }
    else {
      return done(null,{applications:[]});
    }
  }

  function cmd_del_user_application( args, done ) {
    var user = args.user;
    var clientid = args.id;

    if( user && clientid) {
      removeAccessTokens({userID:user.id, clientID: clientid}, done);
    }
    else {
      return done(null,{ok:true});
    }
  }

  function removeAccessTokens(query, done) {
    accesstokenent.list$(query,function(err, tokens){
      if(err) {return done(err);}

      function removeAccessToken(token, next) {
        accesstokenent.remove$(token.id, function(err){
          if(err) {return next(err);}
          next(null);
        });
      }

      async.map(tokens, removeAccessToken, function(err){
        if(err) {return done(err);}
        done(null,{ok: true});
      });
    });
  }

  function buildcontext(req,res,args,act,respond) {
    args.user = req.seneca.user;
    act(args,respond);
  }

  // express needs a scalable session store if you want to deploy to more than one machine
  // this is simple implementation using seneca entities
  function SessionStore() {
    var self = new connect.session.Store(this);
    var sess_ent = seneca.make$('session');

    self.get = function(sid, cb) {
      sess_ent.load$(sid,function(err,sess){
        cb(err,sess&&sess.data);
      });
    };
    self.set = function(sid, data, cb) {
      sess_ent.load$(sid,function(err,sess){
        if(err) {return cb(err);}
        sess = sess||sess_ent.make$({id$:sid});
        sess.last = new Date().getTime();
        sess.data = data;
        sess.save$(cb);
      });

    };
    self.destroy = function(sid, cb) {
      sess_ent.remove$(sid,cb);
    };
    return self;
  }

  function initStore() {
    seneca.act('role:util, cmd:define_sys_entity', {list:['application', 'authcode', 'accesstoken']});

    var u = seneca.pin({role:'user',cmd:'*'});

    // Create admin user if not already present
    var admin = options.admin || {email:'a1@example.com', name: 'admin', password:'a1'};
    seneca.log.info('admin user', admin.email);
    userent.load$({nick:admin.email}, function(err, user){
      if(!user) {
        u.register({nick:admin.email, name:admin.name, email:admin.email, password:admin.password, active:true, admin:true, confirmed:true, confirmcode:'789'});
      }
    });

    // To save fixtures include --fixtures, eg node app.js --fixtures
    // Note that fixtures will always be saved if using memstore
    if (fixtures || memstore) {
      seneca.use('./lib/fixtures');
    }
  }

  init();

  return {
    name: plugin,
    exportmap:{
      'session-store': new SessionStore(),
      'init-store': initStore
    }
  };
};
