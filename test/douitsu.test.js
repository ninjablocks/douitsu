"use strict";

// mocha douitsu.test.js


var seneca  = require('seneca')


var assert = require('assert')
var util   = require('util')


var si = seneca()




describe('douitsu', function() {

  var tmp = {}
  
  it('load_plugin', function(fin) {
    si = seneca()
    si.use('../douitsu')
    si.ready(fin)
  })


  it('cmd_get_user_token', function(fin) {
    si = seneca()
    si.use('user')
    si.use('../douitsu')

    var accesstokenent = si.make('accesstoken')

    si.ready(function(){
      si.act('role:douitsu, cmd:get_user_token', function(err,out){
        assert.ok(null==err)
        assert.equal( "{ tokens: [] }", util.inspect(out))

        var u = si.pin({role:'user',cmd:'*'})
        u.register({nick:'u1',name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){        
          assert.ok(null==err)
          tmp.u1 = out.user

          accesstokenent.make$({id$:'i1afk49ulwybf46j4cwkhe7ejt121m3no1r0d3eg', 
                                userID:tmp.u1.id, 
                                clientID:'123', 
                                clientName: 'app1'})
            .save$(function(err,out){
              assert.ok(null==err)    

              si.act('role:douitsu, cmd:get_user_token', {user:tmp.u1}, function(err,out){
                assert.ok(null==err)
                assert.equal( 1, out.tokens.length)
                assert.equal( tmp.u1.id, out.tokens[0].userID)

                fin()
              });
            });
        })
      })
    })
  })
  
})

