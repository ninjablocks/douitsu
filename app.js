"use strict";


var _       = require('underscore')
var nid     = require('nid')
var express = require('express')

var seneca = require('seneca')()


var oauth2 = require('./oauth2')

process.on('uncaughtException', function(err) {
  console.error('uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})

seneca.use('options','options.mine.js')

var argv = require('optimist').argv
var env = argv.env || process.env['NODE_ENV']


if( 'production' == env ) {
  seneca.use('redis-store')

  // seneca.use('ldap-store', {
  //   map: {
  //     '-/sys/user':'*'
  //   }
  // })
}
else {
  seneca.use('mem-store',{web:{dump:true}})
}

seneca.use('user',{confirm:true})
seneca.use('mail')
seneca.use('auth')
seneca.use('account')
seneca.use('project',{web:false})
seneca.use('settings')
seneca.use('data-editor')
seneca.use('admin')

seneca.use('jsonrest-api',{
  prefix:'/api/rest/',
  meta:false,
  canonalias: {
    'application':'sys_project'
  }
})


seneca.use('./douitsu')

seneca.ready(function(err){
  if( err ) return process.exit( !console.error(err) );


  var options = seneca.export('options')

  if ('production' == env && options.auth.ldap.enabled)
    seneca.use('./ldap');

  var web = seneca.export('web')

  seneca.act('role:settings, cmd:define_spec, kind:user',{spec:options.settings.spec})

  var app = express()

  app.engine('ejs',require('ejs-locals'))
  app.set('views', __dirname + '/views')
  app.set('view engine','ejs')

  app.use( express.cookieParser() )
  app.use( express.query() )

  app.use( express.bodyParser({uploadDir: __dirname + '/public/uploads', keepExtensions: true}) )

  app.use( express.methodOverride() )
  app.use( express.json() )

  app.use( express.session({secret:'seneca', store: seneca.export('douitsu/session-store')}) )

  app.use( web )


  var clientent = seneca.make('sys/project')
  var accesstokenent = seneca.make('accesstoken')
  var projectpin = seneca.pin({role:'project',cmd:'*'});

  var oauth2srv = oauth2.init({seneca:seneca})
  app.use(function(req,res,next){
    if( !req.body ) return next();

    var clientId = req.body['client_id']
    var clientSecret = req.body['client_secret']

    if( clientId && clientSecret ) {
      clientent.load$({appid:clientId,secret:clientSecret},function(err,client){
        if(err) return next(err);
        req.user = client
        next()
      })
    }
    else return next();
  })

  app.get('/dialog/authorize', oauth2srv.authorization);
  app.post('/dialog/authorize/decision', oauth2srv.decision);
  app.post('/oauth/token', oauth2srv.token);

  app.get('/api/userinfo', function(req,res,next){
    var access_token = req.query.access_token
    if( !access_token ) {
      access_token = req.headers.authorization
      if( access_token ) {
        access_token = access_token.substring('Bearer '.length)
      }
    }

    if( access_token ) {
      accesstokenent.load$(access_token,function(err,at){
        if(err) return next(err);

        else res.send({hi:1})
      })
    }
    else res.send({nope:1})
  })

  // Upload files
  app.post('/upload', function(req, res, next) {
    res.end(JSON.stringify({url:"/uploads/" + req.files.file.path.split('/').pop()}));
  });

  app.use( function( req, res, next ){
    if( 0 == req.url.indexOf('/signup') ||
        0 == req.url.indexOf('/forgot') ||
        0 == req.url.indexOf('/reset') ||
        0 == req.url.indexOf('/confirm') )
    {
      req.url = '/'
    }

    next()
  })


  app.use( express.static(__dirname+options.main.public) )

  app.listen( options.main.port )

  seneca.log.info('listen',options.main.port)

  if (options.listen && options.listen.port)
    seneca.listen( options.listen.port );
  else
    seneca.listen();

  // TODO Only run dev fixtures if not in production env? How will admin user be created though?
  dev_fixtures()

})

function dev_fixtures() {
  var u = seneca.pin({role:'user',cmd:'*'})
  var projectpin = seneca.pin({role:'project',cmd:'*'})
  var accesstokenent = seneca.make('accesstoken')

  function registerUser() {
    u.register({nick:'u1@example.com',name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){
      if(out.ok) {
        projectpin.save( {
          account:out.user.accounts[0],
          name:'app1',
          appid:'123',
          secret:'456789',
          homeurl: 'http://example.com',
          callback: 'http://example.com/oauth',
          desc: 'example app',
          image: 'https://pbs.twimg.com/profile_images/432897163673075713/7lcs7v8c.png'
        })
        accesstokenent.make$({id$:'i1afk49ulwybf46j4cwkhe7ejt121m3no1r0d3eg', userID:out.user.id, clientID:'123', clientName: 'app1'}).save$();

        seneca.act('role:settings, cmd:save, kind:user, settings:{a:"aaa"}, ref:"'+out.user.id+'"')
      }
    })
    u.register({nick:'u2@example.com',name:'nu2',email:'u2@example.com',password:'u2',active:true})
    u.register({nick:'a1@example.com',name:'na1',email:'a1@example.com',password:'a1',active:true,admin:true})
  }

  seneca.make("sys/user").load$({nick:"u1"}, function(err, user){
    if(!user) {
      registerUser()
    }
  })

  seneca.act('role:util, cmd:define_sys_entity', {list:['authcode','accesstoken']})
}
