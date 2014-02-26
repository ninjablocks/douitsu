var sprintf = require('util').format;
var ldap = require('ldapjs');

module.exports = function( options ) {
  var seneca = this
  var plugin = 'ldap'

  options = seneca.util.deepextend({
    auth: {
      ldap:{
        url: 'ldap://localhost:389',
        base: 'ou=people,dc=ec2,dc=internal',
        filter: '(&(ObjectClass=person)(uid=%s))'
      }
    }
  },options);

  if (process.env['LDAP_URL']) {
    options.auth.ldap.url = process.env['LDAP_URL'];
  }

  function authenticate(user, pass, callback) {
    var client = ldap.createClient({
      url: options.auth.ldap.url
    });

    var opts = {
      filter: sprintf(options.auth.ldap.filter, user),
      scope: 'sub'
    };

    var entry;
    return client.search(options.auth.ldap.base, opts, function (err, res) {
      if (err)
        return callback(err);

      res.on('searchEntry', function (_entry) {
        entry = _entry;
      });

      res.on('error', function (err) {
        return callback(err);
      });

      res.on('end', function () {
        if (!entry)
          return callback(new Error(user + ' not found'));

        return client.bind(entry.dn.toString(), pass, function (err) {
          if (err)
            return callback(err);

          return client.unbind(function (err) {
            // assert.ifError(err);
            return callback(null, entry.toObject());
          });
        });
      });
    });
  }

  var userent = seneca.make('sys/user');

  seneca.add('role:user, cmd:login', function(args, done){
    var seneca = this;
    var _prior = seneca.prior;

    authenticate(args.nick, args.password, function(err, auth) {
      var why = null;
      if (err && err.message) {
        if (err.message === args.nick + " not found") {
          why = "user-not-found";
        }
        else if (err.message === "Invalid Credentials") {
          why = "invalid-password";
        }
      }
      if (err) { return done(null, {ok:false, why:why}); }

      if (!auth) { return done(null, {ok:false}); }

      userent.load$({nick:args.nick}, function(err,user){
        //if (err) { return done(err, {ok:false}); }
        if (user) {
          args.user = user;
          return _prior(args, done);
        }

        seneca.act('role:user, cmd:register', {nick:args.nick, name:auth.cn, email:auth.mail, active:true}, function(err,out){
          //if (err) { return done(err, {ok:false}); }
          if (!out.ok) { return done(null,out); }
          args.user = out.user;
          return _prior(args,done);
        });

      });
    });
  });

  seneca.add('role:user, cmd:verify_password', function(args,done){
    done(null, {ok:true});
  });

  return {
    name: plugin
  }
}
