'use strict';

module.exports = function (args) {

  var app = args.app;
  var opts = args.options;

  var userpin = args.seneca.pin({role:'user',cmd:'*'})

  require('./lib/oauth2-routes')(args);

  function render(res, pageName) {
    var page = (opts.theme && opts.theme.page && opts.theme.page[pageName]) ? opts.theme.page[pageName] : pageName;
    res.render(page);
  }

  // Upload files
  app.post('/upload', function(req, res) {
    res.end(JSON.stringify({url:'/uploads/' + req.files.file.path.split('/').pop()}));
  });

  app.get('/', function(req, res) {
    render(res, 'index');
  });

  app.get('/account', function(req, res) {
    render(res, 'account');
  });

  // let the user enter an email and submit a post to reset -> /auth/create_reset {"email": "me@here.com"}
  app.get('/reset', function(req, res) {
    render(res, 'reset');
  });

  // accept the reset link and show password reset form which gets posted to /auth/execute_reset
  app.get('/reset/:token', function(req, res) {
    userpin.load_reset({
      token: req.params.token
    }, function (err, out) {
      delete(out.user);
      res.render('reset_request', {tokenInfo: out});
    })
  });

  app.use( function( req, res, next ){
    if( 0 === req.url.indexOf('/signup') ||
        0 === req.url.indexOf('/forgot') ||
        0 === req.url.indexOf('/confirm') ||
        0 === req.url.indexOf('/doconfirm'))
    {
      render(res, 'index');
    }
    else {
      next();
    }
  });

};
