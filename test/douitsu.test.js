"use strict";

// mocha douitsu.test.js


var seneca  = require('seneca')


var assert = require('assert')
var util   = require('util')


describe('douitsu', function() {

  var tmp = {}

  it('load_plugin', function(fin) {
    var si = seneca()
    si.use('user')
    si.use('../lib/douitsu')
    si.ready(fin)
  })


  it('cmd_get_user_applications', function(fin) {

    var si = seneca()
    si.use('user')
    si.use('../lib/douitsu')

    var accesstokenent = si.make('accesstoken')

    si.ready(function(){
      si.act('role:douitsu, cmd:get_user_applications', function(err,out){
        assert.ok(null==err)
        assert.equal( "{ applications: [] }", util.inspect(out))

        var u = si.pin({role:'user',cmd:'*'})
        u.register({nick:'u1',name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){
          assert.ok(null==err)
          tmp.u1 = out.user
          var at = '123'
          var clientID = '456'
          var clientName = 'app1'

          accesstokenent.make$({id$:at,
                                userID: tmp.u1.id,
                                clientID: clientID,
                                clientName: clientName})
            .save$(function(err,out){
              assert.ok(null==err)

              si.act('role:douitsu, cmd:get_user_applications', {user:tmp.u1}, function(err,out){
                assert.ok(null==err)
                assert.equal( 1, out.applications.length)
                assert.equal( tmp.u1.id, out.applications[0].userID)
                assert.equal( clientID, out.applications[0].clientID)
                assert.equal( clientName, out.applications[0].clientName)

                fin()
              });
            });
        })
      })
    })
  })


  it('cmd_del_user_application', function(fin) {

    var si = seneca()
    si.use('user')
    si.use('../lib/douitsu')

    var accesstokenent = si.make('accesstoken')

    si.ready(function(){
      si.act('role:douitsu, cmd:del_user_application', function(err,out){
        assert.ok(null==err)
        assert.equal( "{ ok: true }", util.inspect(out))

        var u = si.pin({role:'user',cmd:'*'})
        u.register({nick:'u1',name:'nu1',email:'u1@example.com',password:'u1',active:true}, function(err,out){
          assert.ok(null==err)
          tmp.u1 = out.user
          var at = '123'

          accesstokenent.make$({id$:at,
                                userID:tmp.u1.id,
                                clientID:'123',
                                clientName: 'app1'})
            .save$(function(err,out){
              assert.ok(null==err)
              si.act('role:douitsu, cmd:del_user_application', {user:tmp.u1, clientid:out.clientID}, function(err,out){
                assert.ok(null==err)
                assert.equal( "{ ok: true }", util.inspect(out))

                fin()
              });
            });
        })
      })
    })
  })

})

