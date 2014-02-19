'use strict';

// i18n works directly with data-i18n html attributes when rendering ejs templates
i18n.init(
	{
    useCookie: false,
    useLocalStorage: false,
    resGetPath: "/locales/__lng__/__ns__.json"
  }
	, function(t) {
		$(".container").i18n();
	}
);

;(function(){

  var i18n_module = angular.module('i18nModule',['jm.i18next']);

  i18n_module.config(['$i18nextProvider', function($i18nextProvider) {

    $i18nextProvider.options = {
      useCookie: false,
      useLocalStorage: false,
      resGetPath: '../locales/__lng__/__ns__.json'
    };

  }]);

})();