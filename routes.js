
module.exports = function (options) {

  var seneca = options.seneca;
  var app = options.app;

  var oauth2routes = require('./lib/oauth2-routes')(options);

  // Upload files
  app.post('/upload', function(req, res, next) {
    res.end(JSON.stringify({url:"/uploads/" + req.files.file.path.split('/').pop()}));
  });

  app.get('/', function(req, res, next) {
    res.render('index');
  });
  app.get('/account', function(req, res, next) {
    res.render('account');
  });

  app.use( function( req, res, next ){
    if( 0 == req.url.indexOf('/signup') ||
        0 == req.url.indexOf('/forgot') ||
        0 == req.url.indexOf('/reset') ||
        0 == req.url.indexOf('/confirm') )
    {
      res.render('index');
    }
    else {
      next();
    }
  })

}