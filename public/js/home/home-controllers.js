'use strict';

(function(){
	function empty(val) { return null === val || 0 === ''+val; }

	var home_controllers = angular.module('homeControllers', ['cookiesModule', 'configService', 'authService', 'fileUploadService', 'angular-md5', 'validatorService']);

	home_controllers.controller('Main', function($scope,$location,features) {
	  var path = window.location.pathname;

	  var page_login   = true;
	  var page_signup  = 0===path.indexOf('/signup');
	  var page_forgot  = 0===path.indexOf('/forgot');
	  var page_reset   = 0===path.indexOf('/reset');
	  var page_confirm = 0===path.indexOf('/confirm');
    var page_doconfirm = 0===path.indexOf('/doconfirm');

	  if (page_signup && !features.signup) {
	    window.location.href = '/';
      return;
	  }

	  page_login = !page_signup && !page_forgot && !page_confirm && !page_reset && !page_doconfirm;

	  $scope.show_login   = page_login;
	  $scope.show_signup  = page_signup;
	  $scope.show_forgot  = page_forgot;
	  $scope.show_reset   = page_reset;
	  $scope.show_confirm = page_confirm;
    $scope.show_doconfirm = page_doconfirm;

	  $scope.msg = 'blank';
	});

	home_controllers.controller('Login', function($scope, $rootScope, auth, features) {

    $scope.signup_enabled = features.signup;

    function read() {
      return {
        email:    !empty($scope.input_email),
        password: !empty($scope.input_password)
      };
    }


    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) {return;}
        $scope['seek_'+field] = !full;
      });

      //$scope.seek_signup = !state.email || !state.password
      $scope.seek_signin = !state.email || !state.password;
      $scope.seek_send   = !state.email;
    }


    function perform_signin() {
      var email = $scope.input_email;
      auth.login({
        email:email,
        password:$scope.input_password
      }, null, function( out ){
        if ('user-not-confirmed' === out.why) {
          window.location.href = '/doconfirm/' + email;
        }
        else {
          $scope.msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
          $scope.showmsg = true;
          if( 'user-not-found' === out.why ) {$scope.seek_email = true;}
          if( 'invalid-password' === out.why ) {$scope.seek_password = true;}
        }
      });
    }


    function perform_send() {
      auth.reset({
        email:$scope.input_email,

      }, function(){
        $scope.cancel();
        $scope.msg = 'msg.reset-sent';
        $scope.showmsg = true;

      }, function( out ){
        $scope.msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
        $scope.showmsg = true;
        if( 'user-not-found' === out.why ) {$scope.seek_email = true;}
      });
    }

    $scope.signin = function() {
      $scope.showmsg = false;

      var state = read();
      markinput(state,{});

      if($scope.frmSignin.$valid) {
        perform_signin();
      }
      else {
        $scope.msg = 'msg.missing-fields';
        $scope.showmsg = true;
      }

      $scope.signin_hit = true;
      $scope.mode = 'signin';
    };

    var visible = {
      name:true,
      email:true,
      password:true,
      forgot:true,
      signup:true,
      signin:true,
      cancel:false,
    };

    function show(fademap) {
      _.each( fademap, function(active,name){
        $scope['hide_'+name]=!active;

        if( active && !visible[name] ) {
          visible[name]           = true;
          $scope['fadeout_'+name] = false;
          $scope['fadein_'+name]  = true;
        }

        if( !active && visible[name] ) {
          visible[name]           = false;
          $scope['fadein_'+name]  = false;
          $scope['fadeout_'+name] = true;
        }
      });

      if( fademap.cancel ) {
        $scope.float_cancel = $scope.fadein_signup ? 'right' : 'left';
      }
    }

    $scope.send = function() {
      if( 'send' !== $scope.mode ) {
        show({name:false,password:false,signup:false,signin:false,cancel:true,send:true});
      }
      $scope.send_hit = true;
      $scope.showmsg = false;

      var state = read();
      if( state.email ) {
        perform_send();
      }
      else {
        markinput(state);
      }

      $scope.mode = 'send';
    };




    $scope.forgot = function() {
      window.location.href='/forgot';
    };



    $scope.goaccount = function() {
      window.location.href='/account';
    };

    $scope.signup = function() {
      window.location.href='/signup';
    };


    $scope.user = null;

    $scope.showmsg = false;

    $scope.signin_hit = false;

    $scope.input_email = '';
    $scope.input_password = '';

    $scope.$watch('input_email',function(){ $scope.seek_email=false; });
    $scope.$watch('input_password',function(){ $scope.seek_password=false; });


    $scope.seek_email = false;
    $scope.seek_password = false;

    $scope.hasuser = !!$scope.user;

    auth.instance(function(out){
      $scope.user = out.user;
      $scope.hasuser = !!$scope.user;
      $rootScope.$emit('instance',{user:out.user});
    });
  });

  home_controllers.controller('Signup', function($scope, $rootScope, auth, fileUpload, features, md5, validator) {

    auth.instance(function(out){
      if (out.user) {
        $scope.show_signup = false;
        window.location.href='/account';
      }
    });

    function read() {
      return {
        name:     !empty($scope.input_name),
        email:    !empty($scope.input_email),
        email_valid: validator.email($scope.input_email),
        password: !empty($scope.input_password),
        password_valid: validator.password($scope.input_password),
        verify_password: !empty($scope.input_verify_password)
      };
    }


    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) {return;}
        $scope['seek_'+field] = !full;
      });

      if (!state.email_valid) {
        $scope.seek_email = true;
      }

      if (!state.password_valid) {
        $scope.seek_password = true;
      }

      $scope.seek_signup = !state.email || !state.password;
      $scope.seek_send   = !state.email;
    }

    function gravatar(email) {
      return (features.gravatar) ? '//www.gravatar.com/avatar/' + md5.createHash(email.toLowerCase().trim()) + '?d=blank' + '&s=200' : null;
    }

    function perform_signup() {
      var email = $scope.input_email;
      auth.register({
        name:$scope.input_name,
        email:email,
        password:$scope.input_password,
        image:$scope.imageUrl || gravatar($scope.input_email)
      }, null, function( out ){
        if ('user-not-confirmed' === out.why) {
          window.location.href = '/doconfirm/' + email;
        }
        else {
          $scope.msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
          if( 'email-exists' === out.why ) {$scope.seek_email = true;}
          if( 'nick-exists'  === out.why ) {$scope.seek_email = true;}
          $scope.showmsg = true;
        }
      });
    }

    $scope.signup = function(){
      // if( 'signup' != $scope.mode ) {
      //   show({name:true,password:true,signup:true,signin:false,cancel:true,send:false})
      // }
      $scope.showmsg = false;

      var state = read();
      markinput(state);

      if( state.name && state.email && state.password && state.verify_password) {
        if (state.email_valid && state.password_valid && ($scope.input_password === $scope.input_verify_password)) {
          perform_signup();
        } else if (!state.email_valid) {
          $scope.msg = 'msg.invalid-email';
          $scope.showmsg = true;
        } else if (!state.password_valid) {
          $scope.msg = 'msg.weak-password';
          $scope.showmsg = true;
        } else {
          $scope.msg = 'msg.mismatch-password';
          $scope.showmsg = true;
        }
      }
      else {
        $scope.msg = 'msg.missing-fields';
        $scope.showmsg = true;
      }

      $scope.signup_hit = true;
      $scope.mode = 'signup';
    };

    $scope.removeImage = function() {
      $scope.imageUrl = '';
    };

    $scope.onFileSelect = function($files) {
      $scope.showmsg = false;
      var dataUploaded = function(data) {
        if (data) {
          $scope.imageUrl = data.url;
        }
        else {
          $scope.details_msg = 'msg.upload-failed';
        }
      };
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        if (fileUpload.isImage(file)) {
          $scope.upload = fileUpload.upload($scope, file, dataUploaded);
        } else {
          $scope.msg = 'msg.only-images-allowed';
          $scope.showmsg = true;
        }
      }
    };

    $scope.showmsg = false;

    $scope.signup_hit = false;

    $scope.input_email = '';
    $scope.input_password = '';
    $scope.input_verify_password = '';

    $scope.$watch('input_email',function(){ $scope.seek_email=false; });
    $scope.$watch('input_password',function(){ $scope.seek_password=false; });
    $scope.$watch('input_verify_password',function(){ $scope.seek_verify_password=false; });

    $scope.seek_email = false;
    $scope.seek_password = false;
    $scope.seek_verify_password = false;
  });

  home_controllers.controller('Forgot', function($scope, $rootScope, auth) {

    auth.instance(function(out){
      if (out.user) {
        $scope.show_forgot = false;
        window.location.href='/account';
      }
    });

    function read() {
      return {
        email:    !empty($scope.input_email)
      };
    }

    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) {return;}
        $scope['seek_'+field] = !full;
      });

      $scope.seek_forgot = !state.email;
      $scope.seek_send   = !state.email;
    }

    function perform_send() {
      auth.reset({
        email:$scope.input_email,

      }, function(){
        $scope.msg = 'msg.reset-sent';
        $scope.showmsg = true;

      }, function( out ){
        $scope.msg = (out.why) ? 'msg.' + out.why : 'msg.unknown';
        $scope.showmsg = true;
        if( 'user-not-found' === out.why ) {$scope.seek_email = true;}
      });
    }

    $scope.forgot = function(){
      $scope.showmsg = false;

      var state = read();
      markinput(state);

      if( state.email) {
        perform_send();
      }
      else {
        $scope.msg = 'msg.missing-fields';
        $scope.showmsg = true;
      }

      $scope.forgot_hit = true;
      $scope.mode = 'forgot';
    };

    $scope.showmsg = false;

    $scope.forgot_hit = false;

    $scope.input_email = '';

    $scope.$watch('input_email',function(){ $scope.seek_email=false; });

    $scope.seek_email = false;
  });


  home_controllers.controller('Reset', function($scope, $http, auth) {
    if( !$scope.show_reset ) {return;}

    $scope.show_resetpass = true;
    $scope.show_gohome    = false;


    var path  = window.location.pathname;
    var token = path.replace(/^\/reset\//,'');

    auth.reset_load({
      token:token

    }, function( out ){
      $scope.msg = 'msg.activate-reset';
      $scope.nick = out.nick;
      $scope.show_reset = true;

    }, function(){
      $scope.msg = 'msg.invalid-reset';
    });


    $scope.reset = function(){
      $scope.seek_password = empty($scope.input_password);
      $scope.seek_repeat   = empty($scope.input_repeat);
      $scope.seek_reset    = $scope.seek_password || $scope.seek_repeat;

      if( !$scope.seek_password && !$scope.seek_repeat ) {
        auth.reset_execute({
          token:    token,
          password: $scope.input_password,
          repeat:   $scope.input_repeat,

        }, function(){
          $scope.msg = 'msg.reset-done';
          $scope.show_gohome = true;
          $scope.show_resetpass = false;

        }, function(){
          $scope.msg = 'msg.invalid-reset';
        });
      }
      else {
        $scope.msg = 'msg.missing-fields';
      }
    };

    $scope.gohome = function() {
      window.location.href='/';
    };

    $scope.goaccount = function() {
      window.location.href='/account';
    };
  });

  home_controllers.controller('Confirm', function($scope, $rootScope, auth) {
    if( !$scope.show_confirm ) {return;}

    $rootScope.$on('instance', function(event,args){
      $scope.show_goaccount = !!args.user;
      $scope.show_gohome    = !args.user;
    });

    var path = window.location.pathname;
    var code = path.replace(/^\/confirm\//,'');

    auth.confirm({
      code:code

    }, function(){
      $scope.msg = 'msg.confirmed';

    }, function(){
      $scope.msg = 'msg.invalid-confirm-code';
    });

    $scope.gohome = function() {
      window.location.href='/';
    };

    $scope.goaccount = function() {
      window.location.href='/account';
    };
  });

  home_controllers.controller('DoConfirm', function($scope) {
    if( !$scope.show_doconfirm ) {return;}

    var path = window.location.pathname;
    $scope.email = path.replace(/^\/doconfirm\//,'');

  });

})();
