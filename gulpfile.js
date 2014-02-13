'use strict';

var gulp = require('gulp');

// Load plugins
var $ = require('gulp-load-plugins')({camelize: true});

var jsFiles = ['./public/**/ninja-*.js', '!./public/**/ninja-*.min.js'];
gulp.task('jshint', function () {
  return gulp.src(jsFiles)
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter('default'));
});

gulp.task('ninja-account-script', function () {
    return gulp.src('./public/account/ninja-account.js')
    	.pipe($.rename('ninja-account.min.js'))
        .pipe($.uglify())        
        .pipe($.size())
        .pipe(gulp.dest('./public/account'));
});

gulp.task('ninja-public-script', function () {
    return gulp.src('./public/js/ninja-public.js')
    	.pipe($.rename('ninja-public.min.js'))
        .pipe($.uglify())        
        .pipe($.size())
        .pipe(gulp.dest('./public/js'));
});

gulp.task('clean', function () {
	// Clean up build directories, eg: 
    // return gulp.src(['./dist'], {read: false}).pipe($.clean());
});

// Build
gulp.task('scripts', ['ninja-account-script', 'ninja-public-script']);
gulp.task('build', ['jshint', 'scripts']);

// Default task
gulp.task('default', ['clean'], function () {
    gulp.start('build');

    // watch for JS changes
    gulp.watch(jsFiles, function() {
        gulp.run('scripts');
    });
});