
'use strict';

var nid    = require('nid');

module.exports = function( options ) {
  var seneca = this;
  var plugin = 'test-fixtures';

  function Fixtures() {

    this.application = function() {
      return {
        name: 'testapp-' + nid(10),
        homeurl: 'http://example.com',
        callback: 'http://example.com/oauth',
        description: 'test app desc',
        image: 'http://example.com/test.png'
      };
    };

    this.accesstoken = function(user) {
      return {
        id$:nid(20),
        userID:user.id,
        clientID:nid(10),
        clientName: 'test client'
      };
    };

    return this;
  }

  return {
    name: plugin,
    exportmap:{
      'fixtures': new Fixtures()
    }
  };
};
