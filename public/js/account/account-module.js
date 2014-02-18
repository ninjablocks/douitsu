'use strict';

;(function(){

  var account_module = angular.module('account',['ngRoute', 'accountControllers', 'i18nModule']);

  account_module.config(['$routeProvider', function($routeProvider) {
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
      otherwise({tab:'Applications'});
  }]);

})();