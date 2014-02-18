
'use strict';

;(function(){

	var api_module = angular.module('apiService', []);

	api_module.service('api', function($http,$window) {
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
  });

})();