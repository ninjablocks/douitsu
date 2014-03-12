'use strict';

(function(){
  function noop(){for(var i=0;i<arguments.length;i++){if('function'===typeof(arguments[i])){arguments[i]();}}}
  function empty(val) { return null === val || 0 === ''+val; }

  var dialog_controllers = angular.module('dialogControllers',['authService', 'validatorService']);

  dialog_controllers.controller('Main', function($scope, $http, auth, validator) {

    resetScope();

    auth.instance(function(out){
      if (out.user) {
        $scope.user = out.user;
      }
      else {
        $scope.show_signin = true;
      }
    });

    function resetScope() {
      $scope.msg = 'blank';
      $scope.name = '';
      $scope.email = '';
      $scope.password = '';
      $scope.verifyPassword = '';
      resetSeek();
    }

    function resetSeek() {
      $scope.seek_name = false;
      $scope.seek_email = false;
      $scope.seek_password = false;
      $scope.seek_verifyPassword = false;
    }

    $scope.btn_signin = function() {
      resetScope();
      $scope.show_signin = true;
      $scope.show_signup = false;
    };

    $scope.btn_signup = function() {
      resetScope();
      $scope.show_signin = false;
      $scope.show_signup = true;
    };

    // Prevents form from automatically being submitted when allow is clicked
    $('#allow').on('click', function(e) {
      e.preventDefault();
      e.returnValue = false;
    });

    $scope.btn_allow = function() {

      resetSeek();

      if (!$scope.show_signin && !$scope.show_signup) {
        $('#dialogForm').submit();
        return;
      }

      if ($scope.show_signin) {
        if (empty($scope.email) || empty($scope.password)) {
          $scope.seek_email = empty($scope.email);
          $scope.seek_password = empty($scope.password);
          $scope.msg = 'msg.missing-fields';
        } else {

          var details = {email:$scope.email, password:$scope.password};
          $http({method:'POST', url: '/auth/login', data:details, cache:false}).
          success(function(data, status) {
            $('#dialogForm').submit();
          }).
          error(function(data, status) {
            $scope.msg = (data.why) ? 'msg.' + data.why : "msg.signin-failed";
          });

        }
      }

      if ($scope.show_signup) {
        if (empty($scope.name) || empty($scope.email) || empty($scope.password) || empty($scope.verifyPassword)) {
          $scope.seek_name = empty($scope.name);
          $scope.seek_email = empty($scope.email);
          $scope.seek_password = empty($scope.password);
          $scope.seek_verifyPassword = empty($scope.verifyPassword);
          $scope.msg = 'msg.missing-fields';

        } else if (!validator.email($scope.email)) {
          $scope.seek_email = true;
          $scope.msg = 'msg.invalid-email';

        } else if (!validator.password($scope.password)) {
          $scope.seek_password = true;
          $scope.msg = 'msg.weak-password';

        } else if ($scope.password !== $scope.verifyPassword) {
          $scope.seek_password = true;
          $scope.seek_verifyPassword = true;
          $scope.msg = 'msg.mismatch-password';

        } else {

          var details = {name:$scope.name, email:$scope.email, password:$scope.password};

          $http({method:'POST', url: '/auth/register', data:details, cache:false}).
          success(function(data, status) {
            $('#dialogForm').submit();
          }).
          error(function(data, status) {
            $scope.msg = (data.why) ? 'msg.' + data.why : "msg.signup-failed";
          });

        }
      }

    };
  });

})();
