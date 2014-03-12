
'use strict';

var oauth2 = require('./oauth2');

module.exports = function (args) {

  var seneca = args.seneca;
  var app = args.app;
  var opts = args.options;

  var oauth2srv = oauth2.init({seneca:seneca, options:opts});

  var userent = seneca.make('sys/user');
  var clientent = seneca.make('application');
  var accesstokenent = seneca.make('accesstoken');

  function buildClientContext(req, res, next) {
    if( !req.body ) {return next();}

    var clientId = req.body['client_id'];
    var clientSecret = req.body['client_secret'];

    if( clientId && clientSecret ) {
      clientent.load$({appid:clientId,secret:clientSecret},function(err,client){
        if(err) {return next(err);}
        req.user = client;
        next();
      });
    }
    else {
      return next();
    }
  }

  function info(req, res, next) {
    var access_token = req.query.access_token;
    if( !access_token ) {
      access_token = req.headers.authorization;
      if( access_token ) {
        access_token = access_token.substring('Bearer '.length);
      }
    }

    if( access_token ) {
      accesstokenent.load$(access_token,function(err,at){
      	if(err) {return next(err);}
      	if (at) {
          userent.load$(at.userID, function(err, user){
            if(user) {
              res.send({email:user.email, nick:user.nick, name:user.name, image:user.image, active:user.active, confirmed:user.confirmed});
            }
            else {
              res.send(400, 'Invalid access token');
            }
          });
      	} else {
      		res.send(400, 'Invalid access token');
      	}
      });
    }
    else {
      res.send(400, 'Missing access token');
    }
  }

  app.use(buildClientContext);

  app.get('/dialog/authorize', oauth2srv.authorization);
  app.post('/dialog/authorize/decision', oauth2srv.decision);
  app.post('/oauth/token', oauth2srv.token);
  app.get('/api/v1/userinfo', info);

  return {
    buildClientContext: buildClientContext,
    info: info
  };

};
