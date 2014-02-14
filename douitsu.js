
var nid = require('nid')

var connect = require('connect')

module.exports = function( options ) {
  var seneca = this
  var plugin = 'douitsu'

  seneca.add({role:plugin,cmd:'get_user_token'}, cmd_get_user_token )
  seneca.add({role:plugin,cmd:'del_user_token'}, cmd_del_user_token )

  var accesstokenent = seneca.make('accesstoken')

  function cmd_get_user_token( args, done ) {
    var user = args.user

    if( user ) {
      accesstokenent.list$({userID:user.id},function(err, tokens){
        if(err) return done(err);

        done( null, {tokens:tokens})
      })
    } 
    else return done(null,{tokens:[]})
  }

  function cmd_del_user_token( args, done ) {
    var user = args.user
    var access_token = args.access_token

    if( user && access_token) {
      accesstokenent.load$(access_token,function(err,at){
        if(err) return done(err);

        if (at.userID == user.id) {
          accesstokenent.remove$(at.id, function(err){
            if(err) return next(err);
            done(null,{id:at.id})
          })
        } else {
          done(null,{id:null})  
        }
      })
    } 
    else return done(null,{id:null})
  }

  function buildcontext(req,res,args,act,respond) {
    args.user = req.seneca.user
    if (req.query.access_token)
      args.access_token = req.query.access_token
    act(args,respond)
  }  

  seneca.act({role:'web',use:{
    prefix:'/api/user/',
    pin:{role:plugin,cmd:'*'},
    map:{
      get_user_token: { alias:'token', GET:buildcontext },
      del_user_token: { alias:'token', DELETE:buildcontext }
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
