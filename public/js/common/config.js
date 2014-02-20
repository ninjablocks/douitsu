'use strict';

;(function(){

	angular.module('configService', [])
	  .constant('configuration', {
	    signup_enabled: false,
	    account_enabled: false
	  });

})();