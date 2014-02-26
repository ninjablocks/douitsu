
var _       = require('underscore')
var nid     = require('nid')
var connect = require('connect')
var async   = require('async')

module.exports = function( options ) {
  var seneca = this
  var plugin = 'douitsu'

  seneca.add({role:plugin,cmd:'get_user_applications'}, cmd_get_user_applications )
  seneca.add({role:plugin,cmd:'del_user_application'}, cmd_del_user_application )

  var accesstokenent = seneca.make('accesstoken')

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

  seneca.act({role:'web',use:{
    prefix:'/api/user/',
    pin:{role:plugin,cmd:'*'},
    map:{
      get_user_applications: { alias:'application', GET:buildcontext },
      del_user_application: { alias:'application/:id', DELETE:buildcontext }
    }
  }})

  // Intercept POST to /api/rest and generate appid and secret for new instances
  seneca.add({role:'jsonrest-api',prefix:'/api/rest/',method:'post',base:'sys',name:'project'},function(args,done){
    var data = args.data

    if (!data.appid)
      data.appid = nid(20);
    if (!data.secret)
      data.secret = nid(40);

    this.prior(args,done)
  })

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
  })

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

  return {
    name: plugin
    , exportmap:{
      'session-store': new SessionStore()
    }
  }
}
