
'use strict';

module.exports = function() {
  var seneca = this;
  var plugin = 'fixtures';

  var userent = seneca.make('sys/user');
  var applicationent = seneca.make('application');
  var accesstokenent = seneca.make('accesstoken');
  var u = seneca.pin({role:'user',cmd:'*'});

  function init() {
    // Save fixtures if they haven't been saved already
    userent.load$({email:'u1@example.com'}, function(err, user){
      if(!user) {
        saveFixtures();
      }
    });
  }

  function saveFixtures() {
    seneca.log.info('saving fixtures');
    u.register({nick:'u1@example.com',name:'nu1',email:'u1@example.com',password:'u1',active:true, confirmed:true, confirmcode:'123'}, function(err,out){
      if(out.ok) {
        applicationent.make$( {
          account:out.user.accounts[0],
          name:'app1',
          appid:'123',
          secret:'456789',
          homeurl: 'http://example.com',
          callback: 'http://localhost:3001/auth/example-oauth2orize/callback',
          desc: 'example app',
          image: 'https://pbs.twimg.com/profile_images/432897163673075713/7lcs7v8c.png'
        }).save$();

        accesstokenent.make$({id$:'i1afk49ulwybf46j4cwkhe7ejt121m3no1r0d3eg', userID:out.user.id, clientID:'123', clientName: 'app1'}).save$();

        seneca.act('role:settings, cmd:save, kind:user, settings:{a:"aaa"}, ref:"'+out.user.id+'"');
      }
    });
    u.register({nick:'u2@example.com',name:'nu2',email:'u2@example.com',password:'u2',active:true, confirmed:true, confirmcode:'456'});
  }

  init();

  return {
    name: plugin
  };
};
