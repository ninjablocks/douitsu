;(function(){
  function noop(){for(var i=0;i<arguments.length;i++)if('function'==typeof(arguments[i]))arguments[i]()}
  function empty(val) { return null == val || 0 == ''+val }

  var account_module = angular.module('account',['ngRoute','cookiesModule','senecaSettingsModule']).
        config(['$routeProvider', function($routeProvider) {
          $routeProvider.
            when('/Applications', {
              tab:'Applications'
            }).
            when('/Settings', {
              tab:'Settings'
            }).
            when('/Account', {
              tab:'Account'
            }).
            otherwise({tab:'Applications'})}])

  var msgmap = {
    'unknown': 'Unable to perform your request at this time - please try again later.',
    'user-updated': 'Your user details have been updated.',
    'user-exists-email': 'A user with that email already exists.',
    'user-exists-nick': 'A user with that username already exists.',
    'password-updated': 'Your password has been updated.',
    'org-updated': 'Your organisations details have been updated.',
    'application-updated': 'Application updated.',
    'application-deleted': 'Application deleted.',
    'token-deleted': "Token deleted."
  }



  account_module.service('auth', ['$http', '$window', function($http,$window) {
    return {
      instance: function(win,fail){
        $http({method:'GET', url: '/auth/instance', cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      logout: function(win,fail){
        $http({method:'POST', url: '/auth/logout', cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
            return $window.location.href='/'
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      change_password: function(creds,win,fail){
        $http({method:'POST', url: '/auth/change_password', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      update_user: function(fields,win,fail){
        $http({method:'POST', url: '/auth/update_user', data:fields, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      update_org: function(fields,win,fail){
        $http({method:'POST', url: '/account/update', data:fields, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },
    }
  }])


  account_module.service('api', ['$http', '$window', function($http,$window) {
    return {
      get: function(path,win,fail){
        this.call('GET',path,null,null,win,fail)
      },
      post: function(path,data,win,fail){
        this.call('POST',path,data,null,win,fail)
      },
      del: function(path,win,fail){
        this.call('DELETE',path,null,null,win,fail)
      },
      call: function(method,path,data,meta,win,fail){
        var params = {
          method:method,
          url: path, 
          data:data, 
          cache:false}

        $http( params ).
          success(function(out, status) {
            if( win ) return win(out);
          }).
          error(function(out, status) {
            if( fail ) return fail(out);
          })
      }
    }
  }])

  account_module.service('pubsub', function() {
    var cache = {};
    return {
      publish: function(topic, args) { 
	cache[topic] && $.each(cache[topic], function() {
	  this.apply(null, args || []);
	});
      },
      
      subscribe: function(topic, callback) {
	if(!cache[topic]) {
	  cache[topic] = [];
	}
	cache[topic].push(callback);
	return [topic, callback]; 
      },
      
      unsubscribe: function(handle) {
	var t = handle[0];
	cache[t] && d.each(cache[t], function(idx){
	  if(this == handle[1]){
	    cache[t].splice(idx, 1);
	  }
	});
      }
    }
  });


  account_module.controller('Main', ['$scope', 'auth', 'pubsub', function($scope, auth, pubsub) {
    //var path = window.location.pathname

    auth.instance(function(out){
      $scope.user = out.user
      $scope.account = out.account
      pubsub.publish('user',[out.user])
      pubsub.publish('account',[out.account])
    })

    pubsub.subscribe('user',function(user){
      $scope.user = user
    })
  }])


  account_module.controller('NavBar', ['$scope', 'auth', 'pubsub', function($scope, auth, pubsub) {

    $scope.btn_applications = function() {
      pubsub.publish('view',['Applications'])
    }
    
    $scope.btn_account = function() {
      pubsub.publish('view',['Account'])
    }

    $scope.btn_signout = function() {
      auth.logout()
    }
    
  }])


  account_module.controller('Account', ['$scope', 'auth', 'pubsub', function($scope, auth, pubsub) {
    pubsub.subscribe('view',function(view){
      if( 'Account' != view ) return;
    })

    pubsub.subscribe('user',function(user){
      $scope.field_name  = user.name
      $scope.field_email = user.email
      $scope.field_gravatar = user.gravatar
      $scope.field_image = user.image
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
  }])


  account_module.controller('TabView', ['$scope', '$route', '$location', 'pubsub', function($scope, $route, $location, pubsub) {
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
  }])

  account_module.directive('imageUrl', function () {
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

  account_module.controller('Applications', ['$scope', 'api', 'pubsub', function($scope, api, pubsub) {
    $scope.applications = []

    $scope.show_applications_list   = true
    $scope.show_application_details = false

    function load() {
      load_applications();
      load_tokens();
    }

    function load_applications() {
      api.get('/api/rest/application?account='+$scope.account.id,function(out){
        $scope.applications = out
      })
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

      $scope.show_applications_list   = false
      $scope.show_application_details = true

      $scope.application_msg = null
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

    load();

    pubsub.subscribe('application.change',load)
  }])

})();


