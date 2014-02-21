'use strict';

;(function(){

	angular.module('configService', [])
	  .constant('configuration', {
	    signup_enabled: true,
	    account_enabled: true
	  });

})();