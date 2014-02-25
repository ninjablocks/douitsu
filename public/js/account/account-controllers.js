'use strict';

;(function(){
  function noop(){for(var i=0;i<arguments.length;i++)if('function'==typeof(arguments[i]))arguments[i]()}
  function empty(val) { return null == val || 0 == ''+val }

  // Error messages defined in ../locales/
  var msgmap = {
    'unknown': 'msg.unknown',
    'user-updated': 'msg.user-updated',
    'user-exists-email': 'msg.user-exists-email',
    'user-exists-nick': 'msg.user-exists-nick',
    'password-updated': 'msg.password-updated',
    'org-updated': 'msg.org-updated',
    'application-updated': 'msg.application-updated',
    'application-deleted': 'msg.application-deleted',
    'token-deleted': 'msg.token-deleted',
    'only-images-allowed': 'msg.only-images-allowed'
  }

  var account_controllers = angular.module('accountControllers',['ngRoute', 'cookiesModule', 'configService', 'senecaSettingsModule', 'authService', 'apiService', 'pubsubService', 'fileUploadService']);

  account_controllers.controller('Main', function($scope, features, auth, pubsub) {
    //var path = window.location.pathname

    $scope.show_account = true;
    if (!features.account) {
      $scope.show_account = false;
    }

    $scope.application_msg = 'blank';
    $scope.details_msg = 'blank';
    $scope.password_msg = 'blank';

    auth.instance(function(out){
      $scope.user = out.user
      $scope.account = out.account
      pubsub.publish('user',[out.user])
      pubsub.publish('account',[out.account])
    })

    pubsub.subscribe('user',function(user){
      $scope.user = user
    })
  })


  account_controllers.controller('NavBar', function($scope, features, auth, pubsub) {

    $scope.btn_applications = function() {
      pubsub.publish('view',['Applications'])
    }

    if (features.account) {
      $scope.btn_account = function() {
        pubsub.publish('view',['Account'])
      }
    }

    $scope.btn_signout = function() {
      auth.logout()
    }

  })


  account_controllers.controller('Account', function($scope, features, auth, pubsub, fileUpload) {
    if (!features.account) {
      return;
    }

    pubsub.subscribe('view',function(view){
      if( 'Account' != view ) return;
    })

    pubsub.subscribe('user',function(user){
      $scope.field_name  = user.name
      $scope.field_email = user.email
      $scope.field_gravatar = user.gravatar
      $scope.imageUrl = user.image
    })

    pubsub.subscribe('account',function(account){
      $scope.field_org_name  = account.name
      $scope.field_org_web   = account.web
    })


    function read_user() {
      return {
        name:  $scope.field_name,
        email: $scope.field_email,
        gravatar: $scope.field_gravatar,
        image: $scope.imageUrl
      }
    }

    function read_pass() {
      return {
        password:  $scope.field_password,
        repeat:    $scope.field_repeat
      }
    }

    function read_org() {
      return {
        name: $scope.field_org_name,
        web:  $scope.field_org_web
      }
    }


    $scope.update_user = function() {
      var data = read_user()
      auth.update_user(
        data,
        function( out ){
          $scope.details_msg = msgmap['user-updated']
          pubsub.publish('user',[out.user])
        },
        function( out ){
          $scope.details_msg = msgmap[out.why] || msgmap.unknown
        }
      )
    }


    $scope.change_pass = function() {
      var data = read_pass()
      auth.change_password(
        data,
        function( out ){
          $scope.password_msg = msgmap['password-updated']
        },
        function( out ){
          $scope.password_msg = msgmap[out.why] || msgmap.unknown
        }
      )
    }


    $scope.update_org = function() {
      var data = read_org()
      auth.update_org(
        data,
        function( out ){
          $scope.org_msg = msgmap['org-updated']
          pubsub.publish('account',[out.account])
        },
        function( out ){
          $scope.org_msg = msgmap[out.why] || msgmap.unknown
        }
      )
    }

    $scope.onFileSelect = function($files) {
      $scope.details_msg = "blank";
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        if (fileUpload.isImage(file)) {
          $scope.upload = fileUpload.upload(file, function(data, err) {
            if (data) {
              $scope.imageUrl = data.url;
            }
            else {
              $scope.details_msg = msgmap['upload-failed'];
            }
          });
        } else {
          $scope.details_msg = msgmap['only-images-allowed'];
        }
      }
    };

  })


  account_controllers.controller('TabView', function($scope, $route, $location, pubsub) {
    var views = ['Dashboard','Applications','Settings','Account']

    $scope.views = _.filter(views,function(n){return n!='Account'})

    pubsub.subscribe('view',function(name){
      console.log('fired:'+name)

      _.each(views,function(v){
        $scope['show_view_'+v] = (name==v)
      })
      $scope.curtab = name

      $location.path(name)
    })

    $scope.tabview = function( name ){
      pubsub.publish('view',[name])
    }

    $scope.$on(
      "$routeChangeSuccess",
      function(event,route){
        if( route.tab && $scope.curtab != route.tab ) {
          $scope.tabview( route.tab )
        }
      })
  })

  account_controllers.controller('Applications', function($scope, auth, api, pubsub, fileUpload) {
    $scope.applications = []

    $scope.show_applications_list   = true
    $scope.show_application_details = false

    function load() {
      load_applications();
      load_tokens();
    }

    function load_applications() {
      auth.instance(function(out){
        api.get('/api/rest/application?account='+out.account.id,function(applications){
          $scope.applications = applications;
        });
      });
    }

    function load_tokens() {
      api.get('/api/user/token',function(out){
        $scope.tokens = out.tokens
      })
    }

    $scope.new_application = function(){ $scope.open_application() }

    $scope.open_application = function( applicationid ) {
      if( void 0 != applicationid ) {
        api.get( '/api/rest/application/'+applicationid, function( out ){
          $scope.show_application(out)
        })
      }
      else $scope.show_application()
    }

    $scope.show_application = function( application ) {
      $scope.application = (application = application || {})

      $scope.field_name = application.name
      $scope.field_homeurl = application.homeurl
      $scope.field_callback = application.callback
      $scope.field_desc = application.desc
      $scope.appid = application.appid
      $scope.secret = application.secret
      $scope.imageUrl = application.image

      $scope.show_applications_list   = false
      $scope.show_application_details = true

      $scope.application_msg = "blank"
    }

    $scope.close_application = function() {
      $scope.show_applications_list   = true
      $scope.show_application_details = false
    }

    function read_application() {
      return {
        account: $scope.account.id,
        name: $scope.field_name,
        appid: $scope.appid,
        secret: $scope.secret,
        homeurl: $scope.field_homeurl,
        callback: $scope.field_callback,
        desc: $scope.field_desc,
        image: $scope.imageUrl
      }
    }

    $scope.save_application = function() {
      $scope.application = _.extend($scope.application,read_application())

      api.post( '/api/rest/application', $scope.application, function( out ){
        $scope.show_application(out)
        $scope.application_msg = msgmap['application-updated']
        pubsub.publish('application.change',[out])
      }, function( out ){
        $scope.application_msg = msgmap[out.why] || msgmap.unknown
      })
    }


    $scope.delete_application = function( applicationid ) {
      if( confirm('Are you sure?') ) {
        api.del( '/api/rest/application/'+applicationid, function(){
          $scope.application_msg = msgmap['application-deleted']
          pubsub.publish('application.change',[])
        }, function( out ){
          $scope.application_msg = msgmap[out.why] || msgmap.unknown
        })
      }
    }

    $scope.revoke_token = function( tokenid ) {
      if( confirm('Are you sure?') ) {
        api.del( '/api/user/token?access_token='+tokenid, function(){
          pubsub.publish('application.change',[])
        }, function( out ){
          $scope.token_msg = msgmap[out.why] || msgmap.unknown
        })
      }
    }

    $scope.onFileSelect = function($files) {
      $scope.application_msg = "blank";
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        if (fileUpload.isImage(file)) {
          $scope.upload = fileUpload.upload(file, function(data, err) {
            if (data) {
              $scope.imageUrl = data.url;
            }
            else {
              $scope.application_msg = msgmap['upload-failed'];
            }
          });
        } else {
          $scope.application_msg = msgmap['only-images-allowed'];
        }
      }
    };

    load();

    pubsub.subscribe('application.change',load)
  })

})();
