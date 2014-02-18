
'use strict';

;(function(){

  var fileupload_module = angular.module('fileUploadService', ['angularFileUpload']);

  fileupload_module.service('fileUpload', function($upload) {
    return {
      isImage: function(file) {
        var fileExtension = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
        return $.inArray(file.name.split('.').pop().toLowerCase(), fileExtension) != -1;
      },
      upload: function(file, callback) {
        return $upload.upload({
            url: '/upload',
            file: file,
          }).progress(function(evt) {
            console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
          }).success(function(data, status, headers, config) {
            callback(data);
          }).error(function(err) {
            callback(null, err);
          });
      }
    }
  });

})();