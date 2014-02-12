
var nid = require('nid')



module.exports = function( options ) {
  var seneca = this
  var plugin = 'douitsu'


  seneca.add({role:plugin,cmd:'get_user_token'}, cmd_get_user_token )

  var accesstokenent = seneca.make('accesstoken')



  
  function cmd_get_user_token( args, done ) {
    var user = args.user
    var userent = this.make('sys/user')

    if( user ) {
      accesstokenent.list$({userID:user.id},function(err, tokens){
        if(err) return done(err);

        done( null, {tokens:tokens})
      })
    } 
    else return done(null,{tokens:[]})
  }



  seneca.add({role:'jsonrest-api',prefix:'/api/rest/',method:'post',base:'sys',name:'project'},function(args,done){
    var data = args.data

    if (!data.appid)
      data.appid = nid(20);
    if (!data.secret)
      data.secret = nid(40);

    this.prior(args,done)
  })

  
  /*

  app.post('/api/application', function(req,res,next){
    var project = req.body;
    if (!project.appid)
      project.appid = nid(20);
    if (!project.secret)
      project.secret = nid(40);
    projectpin.save(project, function(err, out) {
      if(err) return next(err);
      return res.send(out.project);
    });
  })
   */



  function buildcontext(req,res,args,act,respond) {
    args.user = req.seneca.user
    act(args,respond)
  }
  

  seneca.act({role:'web',use:{
    prefix:'/api/user/',
    pin:{role:plugin,cmd:'*'},
    map:{
      get_user_token: { alias:'token', GET:buildcontext }
    }
  }})


  return {
    name: plugin
  }
}
