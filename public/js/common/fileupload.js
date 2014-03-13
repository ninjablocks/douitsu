
'use strict';

(function(){

  var fileupload_module = angular.module('fileUploadService', ['angularFileUpload']);

  fileupload_module.service('fileUpload', function($upload) {
    return {
      isImage: function(file) {
        var fileExtension = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
        return $.inArray(file.name.split('.').pop().toLowerCase(), fileExtension) !== -1;
      },
      upload: function($scope, file, callback) {
        $scope.show_progress = true;
        $scope.progress = '0%';
        return $upload.upload({
            url: '/upload',
            file: file,
          }).progress(function(evt) {
            $scope.progress = parseInt(100.0 * evt.loaded / evt.total) + "%";
          }).success(function(data) {
            $scope.show_progress = false;
            $scope.progress = '0%';
            callback(data);
          }).error(function(err) {
            $scope.show_progress = false;
            $scope.progress = '0%';
            callback(null, err);
          });
      }
    };
  });

})();