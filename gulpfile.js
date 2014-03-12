'use strict';

var gulp = require('gulp');

// Load plugins
var $ = require('gulp-load-plugins')({camelize: true});

var paths = {
    jsFiles: ['./**/*.js', '!./**/*min.js', '!./public/bower_components/**/*.js', '!./node_modules/**/*.js'],
    publicJsFiles: ['./public/**/*.js', '!./public/**/*min.js', '!./public/bower_components/**/*.js']
};

gulp.task('jshint', function () {
  return gulp.src(paths.jsFiles)
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter('default'));
});

gulp.task('scripts', function () {
    return gulp.src(paths.publicJsFiles)
        .pipe($.concat('main.min.js'))
        .pipe($.ngmin())
        .pipe($.uglify())
        .pipe($.size())
        .pipe(gulp.dest('./public/js'));
});

gulp.task('clean', function () {
	// Clean up build directories, eg:
    // return gulp.src(['./dist'], {read: false}).pipe($.clean());
});

// Build
gulp.task('build', ['jshint', 'scripts']);

// Default task
gulp.task('default', ['clean'], function () {
    gulp.start('build', function() {
        console.log('\nWatching for file changes. Press Ctrl+C to exit.');

        // watch for JS changes
        gulp.watch(paths.publicJsFiles, function() {
            gulp.run('scripts');
        });
    });
});
