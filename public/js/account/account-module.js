'use strict';

;(function(){

  var account_module = angular.module('account',['ngRoute', 'configService', 'accountControllers', 'i18nModule']);

  account_module.config(function($routeProvider, configuration) {
    $routeProvider.
      when('/Applications', {
        tab:'Applications'
      });

    $routeProvider.
      when('/Settings', {
        tab:'Settings'
      });

    if (configuration.account_enabled) {
      $routeProvider.
        when('/Account', {
          tab:'Account'
        });
    }

    $routeProvider.otherwise({tab:'Applications'});
  });

})();