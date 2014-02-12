
// Based on https://github.com/merty/simple-file-uploader

;(function($, window) {

	"use strict";

	var document = window.document;

	$(document).ready(function() {

		var all_files = [],
		    current_file_id = 0,
		    locked = false,
		    prev_count_files = 0,
		    waiting = 0,
		    drop, dropzone, handleNextFile, handleReaderLoad, noopHandler;

		noopHandler = function(evt) {
			evt.stopPropagation();
			evt.preventDefault();
		};

		drop = function(evt) {

			noopHandler(evt);

			var files = evt.dataTransfer.files,
			    count = files.length,
			    i, j;

			if ( count > 0 ) {

				if ( count > 1 ) {
					alert("Multiple files not supported");
					return;
				}

				var fileExtension = files[0].name.split('.').pop();
				if (!fileExtension.toLowerCase().match("jpg|jpeg|png|gif")) {
					alert("Unsupported file type");
					return;
				}

				prev_count_files = all_files.length;

				waiting += count;

				if ( ! locked ) {
					waiting -= count;
					all_files.push.apply(all_files, files);
					handleNextFile();
				}
			}
		};

		handleReaderLoad = function(evt) {

			var current_file = {};

			current_file.name = all_files[current_file_id].name;
			current_file.type = all_files[current_file_id].type;
			current_file.contents = evt.target.result;

			$("#dropzoneLabel").html("Uploading...");

			$.post('/upload', current_file, function(data, textStatus, jqXHR) {
				if ( jqXHR.status == 200 ) {
					var imgUrl = JSON.parse(data).url;
					$("#dropzone img").attr('src', imgUrl);
					$("#field_image").val(imgUrl);
					$("#field_image").trigger('propertychange');
				} else {
					alett("Upload failed");
				}

				all_files[current_file_id] = 1;
				current_file_id++;
				handleNextFile();
			});
		};

		handleNextFile = function() {

			if ( current_file_id < all_files.length ) {

				locked = true;

				var current_file = all_files[current_file_id],
				    reader = new FileReader();

				reader.onload = handleReaderLoad;
				reader.readAsDataURL(current_file);

			} else {
				locked = false;
			}
		};

		// TODO Temp fix - wait for angular?
		window.setTimeout(function () {
			dropzone = document.getElementById("dropzone");
			dropzone.addEventListener("dragenter", noopHandler, false);
			dropzone.addEventListener("dragexit", noopHandler, false);
			dropzone.addEventListener("dragover", noopHandler, false);
			dropzone.addEventListener("drop", drop, false);
		}, 200);

	});

}(jQuery, window));