"use strict";

// mocha issue_8_update_user.test.js

var seneca  = require('seneca')

var assert = require('assert')
var util   = require('util')

var si = seneca()

// See https://github.com/ninjablocks/douitsu/issues/8
describe('issue_8', function() {

  var tmp = {}
  
  it('update_user', function(fin) {
    si = seneca()
    si.use('user')
    si.use('auth', {user:{updatefields: ['name', 'email']}})

    si.ready(function(){
      
      var u = si.pin({role:'user',cmd:'*'})
      u.register({name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){        
        assert.ok(null==err)
        tmp.u1 = out.user
        si.act('role:auth, cmd:update_user', {user:tmp.u1, data:{name:'new name', email:tmp.u1.email}}, function(err,out){
          if (err)
            console.dir(err);
          assert.ok(null==err)          

          fin()
        });
      })

    })
  })
  
})

