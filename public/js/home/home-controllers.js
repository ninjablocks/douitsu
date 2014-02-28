'use strict';

;(function(){

	function noop(){for(var i=0;i<arguments.length;i++)if('function'==typeof(arguments[i]))arguments[i]()}
  function empty(val) { return null == val || 0 == ''+val }

	// Error messages defined in ../locales/
  var msgmap = {
    'unknown': 'msg.unknown',
    'missing-fields': 'msg.missing-fields',
    'user-not-found': 'msg.user-not-found',
    'invalid-email': 'msg.invalid-email',
    'invalid-password': 'msg.invalid-password',
    'mismatch-password': 'msg.mismatch-password',
    'email-exists': 'msg.email-exists',
    'nick-exists': 'msg.nick-exists',
    'reset-sent': 'msg.reset-sent',
    'activate-reset': 'msg.activate-reset',
    'invalid-reset': 'msg.invalid-reset',
    'reset-done': 'msg.reset-done',
    'confirmed': 'msg.confirmed',
    'invalid-confirm-code': 'msg.invalid-confirm-code',
    'only-images-allowed': 'msg.only-images-allowed'
  }

	var home_controllers = angular.module('homeControllers', ['cookiesModule', 'configService', 'authService', 'fileUploadService', 'angular-md5', 'validatorService']);

	home_controllers.controller('Main', function($scope,$location,features) {
	  var path = window.location.pathname;

	  var page_login   = true
	  var page_signup  = 0==path.indexOf('/signup')
	  var page_forgot  = 0==path.indexOf('/forgot')
	  var page_reset   = 0==path.indexOf('/reset')
	  var page_confirm = 0==path.indexOf('/confirm')

	  if (page_signup && !features.signup) {
	    return window.location.href = "/";
	  }

	  page_login = !page_signup && !page_forgot && !page_confirm && !page_reset

	  $scope.show_login   = page_login
	  $scope.show_signup  = page_signup
	  $scope.show_forgot  = page_forgot
	  $scope.show_reset   = page_reset
	  $scope.show_confirm = page_confirm

	  $scope.msg = "blank"
	});

	home_controllers.controller('Login', function($scope, $rootScope, auth, features) {

    $scope.signup_enabled = features.signup;

    function read() {
      return {
        email:    !empty($scope.input_email),
        password: !empty($scope.input_password)
      }
    }


    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) return;
        $scope['seek_'+field] = !full
      })

      //$scope.seek_signup = !state.email || !state.password
      $scope.seek_signin = !state.email || !state.password
      $scope.seek_send   = !state.email
    }


    /*
    function perform_signup() {
      auth.register({
        name:$scope.input_name,
        email:$scope.input_email,
        password:$scope.input_password
      }, null, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        if( 'email-exists' == out.why ) $scope.seek_email = true;
        if( 'nick-exists'  == out.why ) $scope.seek_email = true;
        $scope.showmsg = true
      })
    }
     */


    function perform_signin() {
      auth.login({
        email:$scope.input_email,
        password:$scope.input_password
      }, null, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        $scope.showmsg = true
        if( 'user-not-found' == out.why ) $scope.seek_email = true;
        if( 'invalid-password' == out.why ) $scope.seek_password = true;
      })
    }


    function perform_send() {
      auth.reset({
        email:$scope.input_email,

      }, function(){
        $scope.cancel()
        $scope.msg = msgmap['reset-sent']
        $scope.showmsg = true

      }, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        $scope.showmsg = true
        if( 'user-not-found' == out.why ) $scope.seek_email = true;
      })
    }

/*
    $scope.signup = function(){
      if( 'signup' != $scope.mode ) {
        show({name:true,password:true,signup:true,signin:false,cancel:true,send:false})
      }
      $scope.showmsg = false

      var state = read()
      markinput(state)

      if( state.name && state.email && state.password ) {
        perform_signup()
      }
      else {
        $scope.msg = msgmap['missing-fields']
        $scope.showmsg = true
      }

      $scope.signup_hit = true
      $scope.mode = 'signup'
    }
*/


    $scope.signin = function() {
      $scope.showmsg = false

      var state = read()
      markinput(state,{})

      if( state.email && state.password ) {
        perform_signin()
      }
      else {
        $scope.msg = msgmap['missing-fields']
        $scope.showmsg = true
      }

      $scope.signin_hit = true
      $scope.mode = 'signin'
    }


    $scope.send = function() {
      if( 'send' != $scope.mode ) {
        show({name:false,password:false,signup:false,signin:false,cancel:true,send:true})
      }
      $scope.send_hit = true
      $scope.showmsg = false

      var state = read()
      if( state.email ) {
        perform_send()
      }
      else {
        markinput(state)
      }

      $scope.mode = 'send'
    }




    $scope.forgot = function() {
      window.location.href='/forgot'
    }



    $scope.goaccount = function() {
      window.location.href='/account'
    }

    $scope.signup = function() {
      window.location.href='/signup'
    }


    $scope.user = null

    $scope.showmsg = false

    $scope.signin_hit = false

    $scope.input_email = ''
    $scope.input_password = ''

    $scope.$watch('input_email',function(){ $scope.seek_email=false})
    $scope.$watch('input_password',function(){ $scope.seek_password=false})


    $scope.seek_email = false
    $scope.seek_password = false

    $scope.hasuser = !!$scope.user

    auth.instance(function(out){
      $scope.user = out.user
      $scope.hasuser = !!$scope.user
      $rootScope.$emit('instance',{user:out.user})
    })
  })

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
        verify_password: !empty($scope.input_verify_password)
        //, gravatar: !empty($scope.input_gravatar)
      }
    }


    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) return;
        $scope['seek_'+field] = !full
      })

      if (!state.email_valid)
        $scope.seek_email = true

      $scope.seek_signup = !state.email || !state.password
      $scope.seek_send   = !state.email
    }

    function gravatar(email) {
      return (features.gravatar) ? "http://www.gravatar.com/avatar/" + md5.createHash(email.toLowerCase().trim()) + "?d=blank" + "&s=200" : null;
    }

    function perform_signup() {
      auth.register({
        name:$scope.input_name,
        email:$scope.input_email,
        password:$scope.input_password,
        image:$scope.imageUrl || gravatar($scope.input_email),
        gravatar:$scope.input_gravatar
      }, null, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        if( 'email-exists' == out.why ) $scope.seek_email = true;
        if( 'nick-exists'  == out.why ) $scope.seek_email = true;
        $scope.showmsg = true
      })
    }

    $scope.signup = function(){
      // if( 'signup' != $scope.mode ) {
      //   show({name:true,password:true,signup:true,signin:false,cancel:true,send:false})
      // }
      $scope.showmsg = false

      var state = read()
      markinput(state)

      if( state.name && state.email && state.password && state.verify_password) {
        if (state.email_valid && ($scope.input_password == $scope.input_verify_password)) {
          perform_signup()
        } else if (!state.email_valid) {
          $scope.msg = msgmap['invalid-email']
          $scope.showmsg = true
        } else {
          $scope.msg = msgmap['mismatch-password']
          $scope.showmsg = true
        }
      }
      else {
        $scope.msg = msgmap['missing-fields']
        $scope.showmsg = true
      }

      $scope.signup_hit = true
      $scope.mode = 'signup'
    }

    $scope.onFileSelect = function($files) {
    	$scope.showmsg = false;
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        if (fileUpload.isImage(file)) {
        	$scope.upload = fileUpload.upload(file, function(data, err) {
	        	if (data) {
	        		$scope.imageUrl = data.url;
	        	}
	        	else {
	        		$scope.msg = msgmap['upload-failed'];
	        		$scope.showmsg = true;
	        	}
	        });
        } else {
        	$scope.msg = msgmap['only-images-allowed'];
        	$scope.showmsg = true;
      	}
      }
    };

    $scope.showmsg = false

    $scope.signup_hit = false

    $scope.input_email = ''
    $scope.input_password = ''
    $scope.input_verify_password = ''
    $scope.input_gravatar = ''

    $scope.$watch('input_email',function(){ $scope.seek_email=false})
    $scope.$watch('input_password',function(){ $scope.seek_password=false})
    $scope.$watch('input_verify_password',function(){ $scope.seek_verify_password=false})
    $scope.$watch('input_gravatar',function(){ $scope.seek_gravatar=false})

    $scope.seek_email = false
    $scope.seek_password = false
    $scope.seek_verify_password = false
    $scope.seek_gravatar = false
  })

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
      }
    }

    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) return;
        $scope['seek_'+field] = !full
      })

      $scope.seek_forgot = !state.email
      $scope.seek_send   = !state.email
    }

    function perform_send() {
      auth.reset({
        email:$scope.input_email,

      }, function(){
        $scope.msg = msgmap['reset-sent']
        $scope.showmsg = true

      }, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        $scope.showmsg = true
        if( 'user-not-found' == out.why ) $scope.seek_email = true;
      })
    }

    $scope.forgot = function(){
      $scope.showmsg = false

      var state = read()
      markinput(state)

      if( state.email) {
        perform_send()
      }
      else {
        $scope.msg = msgmap['missing-fields']
        $scope.showmsg = true
      }

      $scope.forgot_hit = true
      $scope.mode = 'forgot'
    }

    $scope.showmsg = false

    $scope.forgot_hit = false

    $scope.input_email = ''

    $scope.$watch('input_email',function(){ $scope.seek_email=false})

    $scope.seek_email = false
  })


  home_controllers.controller('Reset', function($scope, $http, auth) {
    if( !$scope.show_reset ) return;

    $scope.show_resetpass = true
    $scope.show_gohome    = false


    var path  = window.location.pathname
    var token = path.replace(/^\/reset\//,'')

    auth.reset_load({
      token:token

    }, function( out ){
      $scope.msg = msgmap['activate-reset']
      $scope.nick = out.nick
      $scope.show_reset = true

    }, function( out ){
      $scope.msg = msgmap['invalid-reset']
    })


    $scope.reset = function(){
      $scope.seek_password = empty($scope.input_password)
      $scope.seek_repeat   = empty($scope.input_repeat)
      $scope.seek_reset    = $scope.seek_password || $scope.seek_repeat

      if( !$scope.seek_password && !$scope.seek_repeat ) {
        auth.reset_execute({
          token:    token,
          password: $scope.input_password,
          repeat:   $scope.input_repeat,

        }, function( out ){
          $scope.msg = msgmap['reset-done']
          $scope.show_gohome = true
          $scope.show_resetpass = false

        }, function( out ){
          $scope.msg = msgmap['invalid-reset']
        })
      }
      else {
        $scope.msg = msgmap['missing-fields']
      }
    }

    $scope.gohome = function() {
      window.location.href='/'
    }

    $scope.goaccount = function() {
      window.location.href='/account'
    }
  })

  home_controllers.controller('Confirm', function($scope, $rootScope, auth) {
    if( !$scope.show_confirm ) return;

    $rootScope.$on('instance', function(event,args){
      $scope.show_goaccount = !!args.user
      $scope.show_gohome    = !args.user
    })

    var path = window.location.pathname
    var code = path.replace(/^\/confirm\//,'')

    auth.confirm({
      code:code

    }, function( out ){
      $scope.msg = msgmap['confirmed']

    }, function( out ){
      $scope.msg = msgmap['invalid-confirm-code']
    })

    $scope.gohome = function() {
      window.location.href='/'
    }

    $scope.goaccount = function() {
      window.location.href='/account'
    }
  })

})();