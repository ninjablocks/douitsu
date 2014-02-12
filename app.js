"use strict";


var _       = require('underscore')
var nid     = require('nid')
var express = require('express')
var fs      = require('fs');

var seneca = require('seneca')()


var oauth2 = require('./oauth2')

process.on('uncaughtException', function(err) {
  console.error('uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})



seneca.use('options','options.mine.js')


seneca.use('mem-store',{web:{dump:true}})

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
  var web = seneca.export('web')

  seneca.act('role:settings, cmd:define_spec, kind:user',{spec:options.settings.spec})


  var app = express()

  app.engine('ejs',require('ejs-locals'))
  app.set('views', __dirname + '/views')
  app.set('view engine','ejs')

  app.use( express.cookieParser() )
  app.use( express.query() )
  app.use( express.bodyParser() )
  app.use( express.methodOverride() )
  app.use( express.json() )

  app.use( express.session({secret:'seneca'}) )

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

  app.post('/api/application', function(req,res,next){
    var project = req.body;
    if (!project.appid)
      project.appid = nid(20);
    if (!project.secret)
      project.secret = nid(40);
    projectpin.save(project, function(err, out) {
      if(err) return next(err);
      return res.send(out.project);
    });
  })

  app.get('/api/user/token', function(req,res,next){
    if ( req.seneca && req.seneca.user ) {
      accesstokenent.list$({userID:req.seneca.user.id},function(err, tokens){
        if(err) return next(err);
        res.send(tokens);
      })
    } else {
      res.send({});
    }
  })

  app.delete('/api/user/token', function(req,res,next){
    if ( req.seneca && req.seneca.user ) {
      var access_token = req.query.access_token
      
      if( access_token ) {
        accesstokenent.load$(access_token,function(err,at){
          if(err) return next(err);

          if (at.userID == req.seneca.user.id) {
            accesstokenent.remove$(at.id, function(err){
              if(err) return next(err);
              res.send({id:at.id})
            })
          } else {
            res.send({id:null})  
          }
        })
      }
      else res.send({id:null})
    } else {
      res.send({id:null});
    }
  })

  // Upload files
  app.post('/upload', function(req, res) {
    upload(res, req.body, "./uploads/", false);
  });

  app.get('/uploads/:file', function (req, res){
    var file = req.params.file;
    var img = fs.readFileSync("./uploads/" + file);
    res.writeHead(200, {'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  });

  app.use( function( req, res, next ){
    if( 0 == req.url.indexOf('/signup') ||
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

  seneca.listen()


  dev_fixtures()
})

function upload(response, postData, filePathBase, s3Enabled) {
    
    var file                 = postData,
        fileRootName         = nid(20),
        fileExtension        = file.name.split('.').pop(),
        fileRootNameWithBase = filePathBase + fileRootName,
        filePath             = fileRootNameWithBase + '.' + fileExtension,
        fileID               = 2,
        fileBuffer;
    
    while (fs.existsSync(filePath)) {
        filePath = fileRootNameWithBase + '(' + fileID + ').' + fileExtension;
        fileID += 1;
    }
    
    file.contents = file.contents.split(',').pop();
    
    fileBuffer = new Buffer(file.contents, "base64");
    
    if (s3Enabled) {

        var knox = require('knox'),
            client = knox.createClient(config.s3),
            headers = {'Content-Type': file.type};
        
        client.putBuffer(fileBuffer, fileRootName, headers, function (err, res) {
            
            if (typeof res !== "undefined" && 200 === res.statusCode) {
                console.log('Uploaded to: %s', res.client._httpMessage.url);
                response.statusCode = 200;
            } else {
                console.log('Upload failed!');
                response.statusCode = 500;
            }
            
            response.end(JSON.stringify({url:res.client._httpMessage.url}));
        });
        
    } else {
      if (!fs.existsSync(filePathBase)) {
        fs.mkdirSync(filePathBase);
      }
      fs.writeFileSync(filePath, fileBuffer);
      response.statusCode = 200;
      response.end(JSON.stringify({url:"/uploads/" + fileRootName + "." + fileExtension}));
    }
}
  
function dev_fixtures() {
  var u = seneca.pin({role:'user',cmd:'*'})
  var projectpin = seneca.pin({role:'project',cmd:'*'})
  var accesstokenent = seneca.make('accesstoken')

  u.register({nick:'u1',name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){
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
  })
  u.register({nick:'u2',name:'nu2',email:'u2@example.com',password:'u2',active:true})
  u.register({nick:'a1',name:'na1',email:'a1@example.com',password:'a1',active:true,admin:true})

  seneca.act('role:util, cmd:define_sys_entity', {list:['authcode','accesstoken']})
}
