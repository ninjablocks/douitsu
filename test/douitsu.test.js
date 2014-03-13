'use strict';

// mocha douitsu.test.js


var seneca  = require('seneca')();

var assert = require('assert');
var util   = require('util');

function empty(val) { return null === val || 0 === ''+val; }

describe('douitsu', function() {

  var tmp = {};
  var fixtures;
  var accesstokenent;

  function ready(cb) {
    seneca.use('../lib/douitsu');
    seneca.use('../test/test-fixtures');
    seneca.export('douitsu/init-store')();
    fixtures = seneca.export('test-fixtures/fixtures');
    accesstokenent = seneca.make('accesstoken');

    seneca.ready(function() {
      var userent = seneca.make('sys/user');
      userent.load$({email:'u1@example.com'}, function(err, user){
        assert.ok(null===err);
        tmp.u1 = user;
        cb();
      });
    });
  }

  it('cmd_get_user_applications', function(fin) {

    ready(function(){

      seneca.act('role:douitsu, cmd:get_user_applications', {user:tmp.u1}, function(err,out){
        assert.ok(null===err);
        assert.equal( 1, out.applications.length);
        assert.equal( tmp.u1.id, out.applications[0].userID);
        assert.equal( '123', out.applications[0].clientID);
        assert.equal( 'app1', out.applications[0].clientName);
        fin();
      });

    });
  });


  it('cmd_del_user_application', function(fin) {

    ready(function(){

      var accesstoken = fixtures.accesstoken(tmp.u1);
      accesstokenent.make$(accesstoken).save$(function(err,out){
        assert.ok(null===err);
        seneca.act('role:douitsu, cmd:del_user_application', {user:tmp.u1, clientid:out.clientID}, function(err,out){
          assert.ok(null===err);
          assert.equal( '{ ok: true }', util.inspect(out));
          fin();
        });
      });

    });

  });

  it('save_application', function(fin) {

    var app = fixtures.application();
    seneca.act('role:jsonrest-api,prefix:/api/rest/,method:post,name:application', {data:app}, function(err, out){
      assert.ok(null===err);
      assert.equal(app.name, out.name);
      assert.equal(app.homeurl, out.homeurl);
      assert.equal(app.callback, out.callback);
      assert.equal(app.description, out.description);
      assert.equal(app.image, out.image);
      assert.ok(!empty(app.appid));
      assert.ok(!empty(app.secret));
      assert.ok(app.active);
      fin();
    });

  });

  it('del_application', function(fin) {

    // Make new application
    var app = fixtures.application();
    seneca.act('role:jsonrest-api,prefix:/api/rest/,method:post,name:application', {data:app}, function(err, app$){
      assert.ok(null===err);
      assert.ok(!empty(app$.id));

      // Make new access token for tmp.u1 authorizing app$
      var accesstoken = fixtures.accesstoken(tmp.u1);
      accesstoken.clientID = app$.appid;
      accesstokenent.make$(accesstoken).save$(function(err,accesstoken$){
        assert.ok(null===err);
        assert.ok(!empty(accesstoken$.id));

        // Delete application
        seneca.act('role:jsonrest-api,prefix:/api/rest/,method:delete,name:application', {id:app$.id}, function(err, deletedapp$){
          assert.ok(null===err);
          assert.equal( '{ id: \'' + app$.id + '\' }', util.inspect(deletedapp$));

          // Assert that access token has also been deleted
          accesstokenent.load$(accesstoken$.id, function(err,out){
            assert.ok(null===err);
            assert.ok(null===out);
            fin();
          });
        });

      });
    });

  });

  it('update_user_with_existing_email', function(fin) {

    seneca.act('role:auth,cmd:update_user', {data:{email:'u1@example.com'}}, function(err, out){
      assert.ok(null===err);
      assert.equal(out.why, 'user-exists-email');
      fin();
    });

  });

});

