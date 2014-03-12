'use strict';

(function(){
  function noop(){for(var i=0;i<arguments.length;i++){if('function'===typeof(arguments[i])){arguments[i]();}}}
  function empty(val) { return null === val || 0 === ''+val; }

  var account_controllers = angular.module('accountControllers',['ngRoute', 'cookiesModule', 'configService', 'senecaSettingsModule', 'authService', 'apiService', 'pubsubService', 'fileUploadService', 'validatorService']);

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
      $scope.user = out.user;
      $scope.account = out.account;
      pubsub.publish('user',[out.user]);
      pubsub.publish('account',[out.account]);
    });

    pubsub.subscribe('user',function(user){
      $scope.user = user;
    });
  });


  account_controllers.controller('NavBar', function($scope, features, auth, pubsub) {

    $scope.btn_applications = function() {
      pubsub.publish('application.change');
      pubsub.publish('view',['Applications']);
    };

    if (features.account) {
      $scope.btn_account = function() {
        pubsub.publish('view',['Account']);
      };
    }

    $scope.btn_signout = function() {
      auth.logout();
    };

  });


  account_controllers.controller('Account', function($scope, features, auth, pubsub, fileUpload, validator) {
    if (!features.account) {
      return;
    }

    pubsub.subscribe('view',function(view){
      if( 'Account' != view ) return;
    });

    pubsub.subscribe('user',function(user){
      $scope.field_name  = user.name;
      $scope.field_email = user.email;
      $scope.imageUrl = user.image;

      // Keep to check if email has changed when details are updated
      $scope.email  = user.email;
    });

    pubsub.subscribe('account',function(account){
      $scope.field_org_name  = account.name;
      $scope.field_org_web   = account.web;
    });

    function read_user_state() {
      return {
        name: !empty($scope.field_name),
        email: !empty($scope.field_email),
        email_valid: validator.email($scope.field_email)
      };
    }

    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) return;
        $scope['seek_'+field] = !full;
      });

      if (!state.email_valid)
        $scope.seek_email = true;
    }


    function read_user() {
      return {
        name:  $scope.field_name,
        email: $scope.field_email,
        image: $scope.imageUrl
      };
    }

    function read_pass() {
      return {
        password:  $scope.field_password,
        repeat:    $scope.field_repeat
      };
    }

    function read_org() {
      return {
        name: $scope.field_org_name,
        web:  $scope.field_org_web
      };
    }


    $scope.update_user = function() {
      var state = read_user_state();
      markinput(state);

      if( state.name && state.email) {
        if( state.email_valid ) {
          var data = read_user();

          // Do not send email to be updated if it is the same as before
          if ($scope.email == data.email) {
            delete data.email;
          }

          auth.update_user(
            data,
            function( out ){
              $scope.details_msg = 'msg.user-updated';
              pubsub.publish('user',[out.user]);
            },
            function( out ){
              $scope.details_msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
            }
          );
        }
        else {
          $scope.details_msg = 'msg.invalid-email';
        }
      }
      else {
        $scope.details_msg = 'msg.missing-fields';
      }
    };


    $scope.change_pass = function() {
      if (validator.password($scope.field_password)) {
        if ($scope.field_password == $scope.field_repeat) {
          var data = read_pass();
          auth.change_password(
            data,
            function( out ){
              $scope.password_msg = 'msg.password-updated';
            },
            function( out ){
              $scope.password_msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
            }
          );
        }
        else {
          $scope.password_msg = 'msg.mismatch-password';
        }
      }
      else {
        $scope.password_msg = 'msg.weak-password';
      }
    };


    $scope.update_org = function() {
      var data = read_org();
      auth.update_org(
        data,
        function( out ){
          $scope.org_msg = 'msg.org-updated';
          pubsub.publish('account',[out.account]);
        },
        function( out ){
          $scope.org_msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
        }
      );
    };

    $scope.onFileSelect = function($files) {
      $scope.details_msg = 'blank';
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        if (fileUpload.isImage(file)) {
          $scope.upload = fileUpload.upload(file, function(data, err) {
            if (data) {
              $scope.imageUrl = data.url;
            }
            else {
              $scope.details_msg = 'msg.upload-failed';
            }
          });
        } else {
          $scope.details_msg = 'msg.only-images-allowed';
        }
      }
    };

  });


  account_controllers.controller('TabView', function($scope, $route, $location, pubsub) {
    var views = ['Dashboard','Applications','Settings','Account'];

    $scope.views = _.filter(views,function(n){return n!='Account';});

    pubsub.subscribe('view',function(name){
      console.log('fired:'+name);

      _.each(views,function(v){
        $scope['show_view_'+v] = (name==v);
      });
      $scope.curtab = name;

      $location.path(name);
    });

    $scope.tabview = function( name ){
      pubsub.publish('view',[name]);
    };

    $scope.$on(
      '$routeChangeSuccess',
      function(event,route){
        if( route.tab && $scope.curtab != route.tab ) {
          $scope.tabview( route.tab );
        }
      });
  });

  account_controllers.controller('Applications', function($scope, auth, api, pubsub, fileUpload, validator) {

    $scope.applications = [];

    $scope.show_applications_list   = true;
    $scope.show_application_details = false;

    function load() {
      load_applications();
      load_user_applications();
    }

    function load_applications() {
      auth.instance(function(out){
        api.get('/api/rest/application?account='+out.account.id,function(applications){
          $scope.applications = applications;
        });
      });
    }

    function load_user_applications() {
      api.get('/api/user/application',function(out){
        $scope.user_applications = out.applications;
      });
    }

    $scope.new_application = function(){ $scope.open_application(); };

    $scope.open_application = function( applicationid ) {
      if( void 0 != applicationid ) {
        api.get( '/api/rest/application/'+applicationid, function( out ){
          $scope.show_application(out);
        });
      }
      else $scope.show_application();
    };

    $scope.show_application = function( application ) {
      $scope.application = (application = application || {});

      $scope.field_name = application.name;
      $scope.field_homeurl = application.homeurl;
      $scope.field_callback = application.callback;
      $scope.field_desc = application.desc;
      $scope.appid = application.appid;
      $scope.secret = application.secret;
      $scope.imageUrl = application.image;

      $scope.show_applications_list   = false;
      $scope.show_application_details = true;

      $scope.application_msg = 'blank';
    };

    $scope.close_application = function() {
      $scope.show_applications_list   = true;
      $scope.show_application_details = false;
    };

    function read() {
      return {
        name: !empty($scope.field_name),
        homeurl: !empty($scope.field_homeurl),
        homeurl_valid: validator.url($scope.field_homeurl),
        callback: !empty($scope.field_callback),
        callback_valid: validator.url($scope.field_callback),
        desc: !empty($scope.field_desc)
      };
    }

    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) return;
        $scope['seek_'+field] = !full;
      });

      if (!state.homeurl_valid)
        $scope.seek_homeurl = true;

      if (!state.callback_valid)
        $scope.seek_callback = true;
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
      };
    }

    $scope.save_application = function() {
      var state = read();
      markinput(state);

      if( state.name && state.homeurl && state.callback && state.desc) {
        if (state.homeurl_valid && state.callback_valid) {
          $scope.application = _.extend($scope.application,read_application());

          api.post( '/api/rest/application', $scope.application, function( out ){
            $scope.show_application(out);
            $scope.application_msg = 'msg.application-updated';
            pubsub.publish('application.change',[out]);
          }, function( out ){
            $scope.application_msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
          });
        } else {
          $scope.application_msg = 'msg.invalid-url';
        }
      } else {
        $scope.application_msg = 'msg.missing-fields';
      }
    };


    $scope.delete_application = function( applicationid ) {
      if( confirm('Are you sure?') ) {
        api.del( '/api/rest/application/'+applicationid, function(){
          $scope.application_msg = 'msg.application-deleted';
          pubsub.publish('application.change',[]);
        }, function( out ){
          $scope.application_msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
        });
      }
    };

    $scope.revoke_user_application = function( clientid ) {
      if( confirm('Are you sure?') ) {
        api.del( '/api/user/application/'+clientid, function(){
          pubsub.publish('application.change',[]);
        }, function( out ){
          $scope.token_msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
        });
      }
    };

    $scope.onFileSelect = function($files) {
      $scope.application_msg = 'blank';
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        if (fileUpload.isImage(file)) {
          $scope.upload = fileUpload.upload(file, function(data, err) {
            if (data) {
              $scope.imageUrl = data.url;
            }
            else {
              $scope.application_msg = 'msg.upload-failed';
            }
          });
        } else {
          $scope.application_msg = 'msg.only-images-allowed';
        }
      }
    };

    load();

    pubsub.subscribe('application.change',load);
  });

})();
