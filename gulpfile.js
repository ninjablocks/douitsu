'use strict';

var gulp = require('gulp');

// Load plugins
var plugin = require('gulp-load-plugins')({camelize: true});

var paths = {
    jsFiles: ['./**/*.js', '!./**/*min.js', '!./public/bower_components/**/*.js', '!./node_modules/**/*.js'],
    publicJsFiles: ['./public/**/*.js', '!./public/**/*min.js', '!./public/bower_components/**/*.js']
  };

gulp.task('jshint', function () {
  return gulp.src(paths.jsFiles)
    .pipe(plugin.jshint('.jshintrc'))
    .pipe(plugin.jshint.reporter('default'));
});

gulp.task('scripts', function () {
    return gulp.src(paths.publicJsFiles)
        .pipe(plugin.concat('main.min.js'))
        .pipe(plugin.ngmin())
        .pipe(plugin.uglify())
        .pipe(plugin.size())
        .pipe(gulp.dest('./public/js'));
  });

gulp.task('clean', function () {
	// Clean up build directories, eg:
    // return gulp.src(['./dist'], {read: false}).pipe(plugin.clean());
});

// Build
gulp.task('build', ['jshint', 'scripts']);

// Default task
gulp.task('default', ['clean'], function () {
    gulp.start('build', function() {
        console.log('\nWatching for file changes. Press Ctrl+C to exit.');

        // watch for JS changes
        gulp.watch(paths.publicJsFiles, function() {gulp.run('scripts');});
      });
  });
