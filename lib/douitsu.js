
var _          = require('underscore')
var argv       = require('optimist').argv
var nid        = require('nid')
var connect    = require('connect')
var async      = require('async')
var url        = require('url')
var mysqlStore = require('seneca-mysql-store')

module.exports = function( options ) {
  var seneca = this
  var plugin = 'douitsu'

  var env = argv.env || process.env['NODE_ENV']
  var DB_URL = process.env['DB_URL']
  var CACHE_URL = process.env['CACHE_URL']
  var fixtures = argv.fixtures
  var memstore = false

  var accesstokenent = seneca.make('accesstoken')

  function init() {

    if( 'production' == env ) {
      seneca.use(mysqlStore, mysqlSpec());

      var redisSpec = redisDbSpec();
      redisSpec.map = {'-/-/session':'*'};
      seneca.use('redis-store', redisSpec);
    }
    else {
      seneca.log.info("using mem store");
      memstore = true;
      seneca.use('mem-store',{web:{dump:true}})
    }

    // Map when to created field
    seneca.use("fieldmap", {
      map: {
        '-/sys/user': {
          alias: {
            when:'created'
          }
        }
      }
    });

    // Add updated field
    seneca.use("./lib/store-extend", {
      map: {
          '-/sys/user': {
            alias: {
              updated:'updated'
            }
          }
        }
    });

    seneca.use('user',{confirm:true})
    seneca.use('mail')
    seneca.use('auth')
    seneca.use('account')
    seneca.use('settings')
    seneca.use('data-editor')
    seneca.use('admin')

    // User application API
    seneca.use('jsonrest-api',{
      prefix:'/api/rest/',
      meta:false
    })
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

    // Intercept POST to /api/rest and generate appid and secret for new instances
    seneca.add({role:'jsonrest-api',prefix:'/api/rest/',method:'post',name:'application'},function(args,done){
      var data = args.data

      if (!data.active)
        data.active = true
      if (!data.appid)
        data.appid = nid(20);
      if (!data.secret)
        data.secret = nid(40);

      this.prior(args,done)
    });

    // Intercept update_user and check email is unique
    // TODO Remove once update_user in seneca-auth is fixed, throws unknown error if email exists
    seneca.add({role:'auth',cmd:'update_user'},function(args,done){
      var instance = this;
      var data = args.data;

      if (!data.email) {
        instance.prior(args, done);
      }
      else {
        seneca.make("sys/user").load$({email:data.email}, function(err, user){
          if(!user) {
            instance.prior(args, done);
          }
          else {
            return done(null, {ok: false, why: 'user-exists-email'});
          }
        })
      }
    });

    if(options.auth.ldap.enabled) {
      seneca.use('./lib/ldap', options);
    }

  }

  function mysqlSpec() {
    var spec = options.mysql || {};
    if (DB_URL) {
      var db = url.parse(DB_URL)
      var dbAuth = db.auth.split(':');
      spec.name   = db.path.substring(1);
      spec.port   = db.port;
      spec.host = db.hostname;
      spec.user = dbAuth[0];
      spec.password = dbAuth[1];
      spec.port = spec.port ? parseInt(spec.port,10) : null;
    }

    seneca.log.info('mysql', "mysql://" + spec.host + ":" + spec.port + "/" + spec.name, "user: " + spec.user);

    return spec;
  }

  function redisDbSpec() {
    var spec = options.redis || {};
    if (CACHE_URL) {
      var db = url.parse(CACHE_URL)
      spec.host = db.hostname;
      spec.port   = db.port;
      spec.port = spec.port ? parseInt(spec.port,10) : null;
    }

    seneca.log.info('redis', "redis://" + spec.host + ((spec.port) ? ":" + spec.port : ""));

    return spec;
  }

  function cmd_get_user_applications( args, done ) {
    var user = args.user

    if( user ) {
      accesstokenent.list$({userID:user.id},function(err, tokens){
        if(err) return done(err);

        var uniqueTokens = _.uniq(tokens, function (token) {
          return token.clientId;
        });
        var applications = []
        _.each(uniqueTokens, function(token) {
          applications.push(_.pick(token, 'userID', 'clientID', 'clientName'));
        });

        done( null, {applications:applications})
      })
    }
    else return done(null,{applications:[]})
  }

  function cmd_del_user_application( args, done ) {
    var user = args.user
    var clientid = args.id

    if( user && clientid) {
      accesstokenent.list$({userID:user.id, clientID: clientid},function(err, tokens){
        if(err) return done(err);

        function removeAccessToken(token, next) {
          accesstokenent.remove$(token.id, function(err){
            if(err) return next(err);
            next(null)
          })
        }

        async.map(tokens, removeAccessToken, function(err){
          if(err) return done(err);
          done(null,{ok: true})
        });
      })
    }
    else return done(null,{ok:true})
  }

  function buildcontext(req,res,args,act,respond) {
    args.user = req.seneca.user
    act(args,respond)
  }

  // express needs a scalable session store if you want to deploy to more than one machine
  // this is simple implementation using seneca entities
  function SessionStore() {
    var self = new connect.session.Store(this)
    var sess_ent = seneca.make$('session')

    self.get = function(sid, cb) {
      sess_ent.load$(sid,function(err,sess){
        cb(err,sess&&sess.data)
      })
    }
    self.set = function(sid, data, cb) {
      sess_ent.load$(sid,function(err,sess){
        if(err) return cb(err);
        sess = sess||sess_ent.make$({id$:sid})
        sess.last = new Date().getTime()
        sess.data = data
        sess.save$(cb)
      })

    }
    self.destroy = function(sid, cb) {
      sess_ent.remove$(sid,cb)
    }
    return self
  }

  function initStore() {
    seneca.act('role:util, cmd:define_sys_entity', {list:['application', 'authcode', 'accesstoken']});

    var userent = seneca.make("sys/user");
    var u = seneca.pin({role:'user',cmd:'*'});

    // Create admin user if not already present
    var admin = options.admin || {email:"a1@example.com", name: "admin", password:"a1"};
    seneca.log.info('admin user', admin.email);
    userent.load$({nick:admin.email}, function(err, user){
      if(!user) {
        u.register({nick:admin.email, name:admin.name, email:admin.email, password:admin.password, active:true, admin:true})
      }
    });

    // To save fixtures include --fixtures, eg node app.js --fixtures
    // Note that fixtures will always be saved if using memstore
    if (fixtures || memstore) {
      seneca.use("./lib/fixtures");
    }
  }

  init();

  return {
    name: plugin
    , exportmap:{
      'session-store': new SessionStore(),
      'init-store': initStore
    }
  }
}
