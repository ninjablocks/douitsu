'use strict';

module.exports = function (args) {

  var seneca = args.seneca;
  var app = args.app;
  var opts = args.options;

  var oauth2routes = require('./lib/oauth2-routes')(args);

  function render(res, pageName) {
    var page = (opts.theme && opts.theme.page && opts.theme.page[pageName]) ? opts.theme.page[pageName] : pageName;
    res.render(page);
  }

  // Upload files
  app.post('/upload', function(req, res, next) {
    res.end(JSON.stringify({url:'/uploads/' + req.files.file.path.split('/').pop()}));
  });

  app.get('/', function(req, res, next) {
    render(res, 'index');
  });
  app.get('/account', function(req, res, next) {
    render(res, 'account');
  });

  app.use( function( req, res, next ){
    if( 0 === req.url.indexOf('/signup') ||
        0 === req.url.indexOf('/forgot') ||
        0 === req.url.indexOf('/reset') ||
        0 === req.url.indexOf('/confirm') )
    {
      render(res, 'index');
    }
    else {
      next();
    }
  });

};
