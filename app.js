"use strict";

var _       = require('underscore')
var nid     = require('nid')
var express = require('express')
var expose  = require('express-expose')
var argv    = require('optimist').argv
var seneca  = require('seneca')()

process.on('uncaughtException', function(err) {
  console.error('uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})

seneca.use('options', argv.options || 'options.mine.js')
var options = seneca.export('options')

seneca.use('./lib/douitsu', options);

seneca.ready(function(err){
  if( err ) return process.exit( !console.error(err) );

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

  app.expose(options.features, 'features', 'features');

  app.use(function(req,res,next){
    var lang = req.acceptedLanguages || ['en'];
    res.expose(lang, 'languages', 'languages');
    next();
  })

  var routes = require('./routes')({seneca:seneca, app:app});

  app.use( express.static(__dirname+options.main.public) )

  seneca.log.info('listen',options.main.port)
  app.listen( options.main.port )

  if (options.listen && options.listen.port)
    seneca.listen( options.listen.port );
  else
    seneca.listen();

  seneca.export('douitsu/fixtures')(options);

})
