;(function(){
  function noop(){for(var i=0;i<arguments.length;i++)if('function'==typeof(arguments[i]))arguments[i]()}
  function empty(val) { return null == val || 0 == ''+val }

  var home_module = angular.module('home',['cookiesModule', 'services.config'])

  home_module.controller('Main', function($scope,$location,configuration) {
    var path = window.location.pathname

    var page_login   = true
    var page_signup  = 0==path.indexOf('/signup')
    var page_forgot  = 0==path.indexOf('/forgot')
    var page_reset   = 0==path.indexOf('/reset')
    var page_confirm = 0==path.indexOf('/confirm')

    if (page_signup && !configuration.signup_enabled) {
      return window.location.href = "/";
    }

    page_login = !page_signup && !page_forgot && !page_confirm && !page_reset

    $scope.show_login   = page_login
    $scope.show_signup  = page_signup
    $scope.show_forgot  = page_forgot
    $scope.show_reset   = page_reset
    $scope.show_confirm = page_confirm
  })



  var msgmap = {
    'unknown': 'Unable to perform your request at this time - please try again later.',
    'missing-fields': 'Please enter the missing fields.',
    'user-not-found': 'That email address is not recognized.',
    'invalid-password': 'That password is incorrect',
    'mismatch-password': 'Password mismatch',
    'email-exists': 'That email address is already in use. Please login, or ask for a password reset.',
    'nick-exists': 'That email address is already in use. Please login, or ask for a password reset.',
    'reset-sent': 'An email with password reset instructions has been sent to you.',
    'activate-reset': 'Please enter your new password.',
    'invalid-reset': 'This is not a valid reset.',
    'reset-done': 'Your password has been reset.',
    'confirmed': 'Your account has been confirmed',
    'invalid-confirm-code': 'That confirmation code is not valid.'
  }


  home_module.service('auth', function($http,$window) {
    return {
      login: function(creds,win,fail){
        $http({method:'POST', url: '/auth/login', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
            return $window.location.href='/account'
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      register: function(details,win,fail){
        $http({method:'POST', url: '/auth/register', data:details, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
            return $window.location.href='/account'
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      instance: function(win,fail){
        $http({method:'GET', url: '/auth/instance', cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      reset: function(creds,win,fail){
        $http({method:'POST', url: '/auth/create_reset', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      reset_load: function(creds,win,fail){
        $http({method:'POST', url: '/auth/load_reset', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      reset_execute: function(creds,win,fail){
        $http({method:'POST', url: '/auth/execute_reset', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      confirm: function(creds,win,fail){
        $http({method:'POST', url: '/auth/confirm', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

    }
  })

  home_module.controller('Login', function($scope, $rootScope, auth, configuration) {

    $scope.signup_enabled = configuration.signup_enabled;

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

  home_module.directive('imageUrl', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          // set the initial value of the textbox
          element.val(scope.imageUrl);
          element.data('old-value', scope.imageUrl);

          // detect outside changes and update our input
          scope.$watch('imageUrl', function (val) {
              element.val(scope.imageUrl);
          });

          // on blur, update the value in scope
          element.bind('onchange propertychange keyup paste', function (blurEvent) {
              if (element.data('old-value') != element.val()) {
                  scope.$apply(function () {
                      scope.imageUrl = element.val();
                      element.data('old-value', element.val());
                  });
              }
          });
        }
    };
  });

  home_module.controller('Signup', function($scope, $rootScope, auth) {

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

      $scope.seek_signup = !state.email || !state.password
      $scope.seek_send   = !state.email
    }


    function perform_signup() {
      auth.register({
        name:$scope.input_name,
        email:$scope.input_email,
        password:$scope.input_password,
        image:$scope.imageUrl,
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
        if ($scope.input_password == $scope.input_verify_password) {
          perform_signup() 
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

  home_module.controller('Forgot', function($scope, $rootScope, auth) {

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


  home_module.controller('Reset', function($scope, $http, auth) {
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



  home_module.controller('Confirm', function($scope, $rootScope, auth) {
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


