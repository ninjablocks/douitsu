'use strict';

// languages[0] is set in ejs views

// i18n works directly with data-i18n html attributes when rendering ejs templates
i18n.init(
	{
    lng: languages[0],
    useCookie: false,
    useLocalStorage: false,
    resGetPath: '/locales/__lng__/__ns__.json',
    fallbackLng: 'en'
  }
	, function() {
		$('.container').i18n();
	}
);

(function(){

  var i18n_module = angular.module('i18nModule',['jm.i18next']);

  i18n_module.config(['$i18nextProvider', function($i18nextProvider) {

    // languages[0] is set in ejs views
    $i18nextProvider.options = {
      lng: languages[0],
      useCookie: false,
      useLocalStorage: false,
      resGetPath: '../locales/__lng__/__ns__.json',
      fallbackLng: 'en'
    };

  }]);

})();