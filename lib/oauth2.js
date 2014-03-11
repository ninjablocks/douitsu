/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize')
  , url         = require('url')
  , nid         = require('nid');


function init( args ) {
  var seneca = args.seneca
  var opts   = args.options

  var userent        = seneca.make('sys/user')
  var clientent      = seneca.make('application')
  var authcodeent    = seneca.make('authcode')
  var accesstokenent = seneca.make('accesstoken')


  // create OAuth 2.0 server
  var server = oauth2orize.createServer();

  // Register serialialization and deserialization functions.
  //
  // When a client redirects a user to user authorization endpoint, an
  // authorization transaction is initiated.  To complete the transaction, the
  // user must authenticate and approve the authorization request.  Because this
  // may involve multiple HTTP request/response exchanges, the transaction is
  // stored in the session.
  //
  // An application must supply serialization functions, which determine how the
  // client object is serialized into the session.  Typically this will be a
  // simple matter of serializing the client's ID, and deserializing by finding
  // the client by ID from the database.

  server.serializeClient(function(client, done) {
    return done(null, client.appid);
  });

  server.deserializeClient(function(id, done) {
    clientent.load$({appid:id}, function(err, client) {
      if (err) { return done(err); }
      return done(null, client);
    });
  });

  function grantCode(client, redirectURI, user, done) {
    var code = nid(16)
    authcodeent.make$({code:code, clientID:client.appid, redirectURI:redirectURI, userID:user.id}).save$(function(err) {
      if (err) { return done(err); }
      done(null, code);
    });
  }

  // Register supported grant types.
  //
  // OAuth 2.0 specifies a framework that allows users to grant client
  // applications limited access to their protected resources.  It does this
  // through a process of the user granting access, and the client exchanging
  // the grant for an access token.

  // Grant authorization codes.  The callback takes the `client` requesting
  // authorization, the `redirectURI` (which is used as a verifier in the
  // subsequent exchange), the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application.  The application issues a code, which is bound to these
  // values, and will be exchanged for an access token.

  server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    grantCode(client, redirectURI, user.user, done);
  }));

  // Grant implicit authorization.  The callback takes the `client` requesting
  // authorization, the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application.  The application issues a token, which is bound to these
  // values.

  server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
    var token = nid(40);

    accesstokenent.make$({id$:token, userID:user.id, clientID:client.appid, clientName:client.name}).save$(function(err) {
      if (err) { return done(err); }
      done(null, token);
    });
  }));

  // Exchange authorization codes for access tokens.  The callback accepts the
  // `client`, which is exchanging `code` and any `redirectURI` from the
  // authorization request for verification.  If these values are validated, the
  // application issues an access token on behalf of the user who authorized the
  // code.

  server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    authcodeent.load$({code:code}, function(err, authCode) {
      if (err) { return done(err); }
      if (client.appid !== authCode.clientID) { return done(null, false); }
      if (redirectURI !== authCode.redirectURI) { return done(null, false); }

      var token = nid(40)
      accesstokenent.make$({id$:token, userID:authCode.userID, clientID:authCode.clientID, clientName:client.name}).save$(function(err) {
        if (err) { return done(err); }
        done(null, token);
      });
    });
  }));

  // Exchange user id and password for access tokens.  The callback accepts the
  // `client`, which is exchanging the user's name and password from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the user who authorized the code.

  server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {

    //Validate the client
    clientent.load$({appid:client.appid}, function(err, localClient) {
      if (err) { return done(err); }
      if(localClient === null) {
        return done(null, false);
      }
      if(localClient.secret !== client.secret) {
        return done(null, false);
      }
      //Validate the user
      userent.load$({email:username}, function(err, user) {
        if (err) { return done(err); }
        if(user === null) {
          return done(null, false);
        }
        if(password !== user.password) {
          return done(null, false);
        }
        //Everything validated, return the token
        var token = nid(40);
        accesstokenent.make$({id$:token, userID:user.id, clientID:client.appid, clientName:client.name}).save$(function(err) {
          if (err) { return done(err); }
          done(null, token);
        });
      });
    });
  }));

  // Exchange the client id and password/secret for an access token.  The callback accepts the
  // `client`, which is exchanging the client's id and password/secret from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the client who authorized the code.

  server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {

    //Validate the client
    clientent.load$({appid:client.appid}, function(err, localClient) {
      if (err) { return done(err); }
      if(localClient === null) {
        return done(null, false);
      }
      if(localClient.secret !== client.secret) {
        return done(null, false);
      }
      var token = nid(40);
      //Pass in a null for user id since there is no user with this grant type
      accesstokenent.make$({id$:token, userID:null, clientID:client.appid, clientName:client.name}).save$( function(err) {
        if (err) { return done(err); }
        done(null, token);
      });
    });
  }));

  // user authorization endpoint
  //
  // `authorization` middleware accepts a `validate` callback which is
  // responsible for validating the client making the authorization request.  In
  // doing so, is recommended that the `redirectURI` be checked against a
  // registered value, although security requirements may vary accross
  // implementations.  Once validated, the `done` callback must be invoked with
  // a `client` instance, as well as the `redirectURI` to which the user will be
  // redirected after an authorization decision is obtained.
  //
  // This middleware simply initializes a new authorization transaction.  It is
  // the application's responsibility to authenticate the user and render a dialog
  // to obtain their approval (displaying details about the client requesting
  // authorization).  We accomplish that here by routing through `ensureLoggedIn()`
  // first, and rendering the `dialog` view.


  var srv = {}

  function renderDialog(req, res) {
    var page = (opts.theme && opts.theme.page && opts.theme.page.dialog) ? opts.theme.page.dialog : 'dialog';
    res.render(page, { transactionID: req.oauth2.transactionID, user: req.seneca.user, client: req.oauth2.client });
  }

  srv.authorization = [

    server.authorization(function(clientID, redirectURI, done) {
      clientent.load$({appid:clientID}, function(err, client) {
        if (err) { return done(err); }
        if (!client || (client.callback !== redirectURI)) {
          return done(null, false);
        }
        return done(null, client, redirectURI);
      });
    }),
    function(req, res, next){
      if( req.seneca && req.seneca.user ) {
        userent.load$({email:req.seneca.user.email}, function(err, user) {
          // Unknown user, render oauth dialog
          if (err || !user) { return renderDialog(req, res); }

          accesstokenent.load$({userID:user.id, clientID: req.oauth2.client.appid},function(err, token){
            // No access token, render oauth dialog
            if (err || !token) { return renderDialog(req, res); }

            // User has already authorized this client, redirect to req.oauth2.redirectURI with new code
            grantCode(req.oauth2.client, req.oauth2.redirectURI, user, function(err, code) {
              if (err) { return next(err); }
              var parsed = url.parse(req.oauth2.redirectURI, true);
              parsed.query.code = code;
              var location = url.format(parsed);
              return res.redirect(location);
            });
          })
        });
      }
      else {
        // Not logged in, render oauth dialog
        renderDialog(req, res);
      }
    }
  ]

  // user decision endpoint
  //
  // `decision` middleware processes a user's decision to allow or deny access
  // requested by a client application.  Based on the grant type requested by the
  // client, the above grant middleware configured above will be invoked to send
  // a response.

  srv.decision = [

    function(req,res,next) {
      // If user has denied auth
      // then proceed as it does not matter if they are not logged in
      if ( req.body.cancel ) return next();

      if( req.seneca && req.seneca.user ) return next();

      // TODO: url option
      res.redirect('/')
    },

    server.decision()
  ]


  // token endpoint
  //
  // `token` middleware handles client requests to exchange authorization grants
  // for access tokens.  Based on the grant type being exchanged, the above
  // exchange middleware will be invoked to handle the request.  Clients must
  // authenticate when making requests to this endpoint.

  srv.token = [

    // FIX
    //passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),

    function(req,res,next){
      next()
    },

    server.token(),
    server.errorHandler()
  ]

  return srv;
}



module.exports = {
  init: init
}
