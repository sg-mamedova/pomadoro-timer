#!/usr/bin/env node

var argv = require('yargs').argv;

process.env.NODE_ENV = argv.env || process.env.NODE_ENV || 'production';

var gulp        = require('gulp');
var gulpif      = require('gulp-if');
var gutil       = require('gulp-util');
var concat      = require('gulp-concat');
var cssNano     = require('gulp-cssnano');
var sass        = require('gulp-sass');
var uglify      = require('gulp-uglify');
var jade        = require('gulp-jade');
var merge      = require('merge-stream');
var autoprefixer = require('gulp-autoprefixer');

var path = {
  'public': {
    root: 'www',
    styles: 'www/css',
    scripts: 'www/js',
    images: 'www/img',
    audio: 'www/audio',
    sprite: 'www/css/',
    fonts: 'www/fonts'
  },
  client: {
    root: 'client',
    styles: ['client/styles/**/*.sass','client/styles/**/*.sass'],
    sprite: 'client/styles/sprite/*.png',
    scripts: 'client/scripts/**/*.js',
    images: 'client/images/**/*.*',
    audio: 'client/audio/**/*.*',
    fonts: 'client/fonts/**/*.*',
    templates: 'client/jade/**/*.jade'
  }
};

function isUglify() {
  return ['production', 'testing'].indexOf(process.env.NODE_ENV) > -1;
}

gulp.task('default', [
  'scripts',
  'styles',
  'fonts',
  'images',
  'audio',
  'templates',
  'vendor-scripts',
  'vendor-css',
  'vendor-fonts'
]);

gulp.task('watch', function() {
  gulp.watch(path.client.scripts, ['scripts']);
  gulp.watch(path.client.styles, ['styles']);
  gulp.watch(path.client.images, ['images']);
  gulp.watch(path.client.audio, ['audio']);
  gulp.watch(path.client.templates, ['templates']);
  gulp.watch(path.client.fonts, ['fonts']);
});

/**
 * build scripts
 */
gulp.task('scripts', function(done) {
  gulp.src(path.client.scripts)
    .pipe(gulpif(isUglify(), uglify()))
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest(path.public.scripts))
    .on('error', function(err){
      throw new gutil.PluginError('scripts', err);
    })
    .on('end', done);
});
/**
 * build vendor scripts
 */
gulp.task('vendor-scripts', function(done) {
  gulp.src([
      './node_modules/jquery/dist/jquery.min.js',
      './node_modules/bootstrap/dist/js/bootstrap.min.js',
      './node_modules/moment/min/moment.min.js'
    ])
    .pipe(concat('vendor.bundle.js'))
    .pipe(gulp.dest(path.public.scripts))
    .on('error', function(err){
      throw new gutil.PluginError('vendor scripts', err);
    })
    .on('end', done);
});

/**
 * build styles
 */
gulp.task('styles', function(done) {
  gulp.src(path.client.styles)
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(autoprefixer())
    .pipe(gulpif(isUglify(), cssNano()))
    .pipe(concat('bundle.css'))
    .pipe(gulp.dest(path.public.styles))
    .on('error', sass.logError)
    .on('end', done);
});

/**
 * build vendor css
 */
gulp.task('vendor-css', function(done) {
  gulp.src([
      './node_modules/bootstrap/dist/css/bootstrap.css'
  ])
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(cssNano())
    .pipe(concat('vendor.bundle.css'))
    .pipe(gulp.dest(path.public.styles))
    .on('error', function(err){
      throw new gutil.PluginError('vendor-css', err);
    })
    .on('end', done);
});
/**
 * build fonts
 */
gulp.task('fonts', function(done) {
  gulp.src(path.client.fonts)
    .pipe(gulp.dest(path.public.fonts))
    .on('error', function(err){
      throw new gutil.PluginError('fonts', err);
    })
    .on('end', done);
});

/**
 * build vendor fonts
 */
gulp.task('vendor-fonts', function(done) {
  gulp.src('./node_modules/bootstrap/fonts/*.*')
    .pipe(gulp.dest(path.public.fonts))
    .on('error', function(err){
      throw new gutil.PluginError('vendor fonts', err);
    })
    .on('end', done);
});

/**
 * build images
 */
gulp.task('images', function(done) {
  gulp.src(path.client.images)
    .pipe(gulp.dest(path.public.images))
    .on('error', function(err){
      throw new gutil.PluginError('images', err);
    })
    .on('end', done);
});

/**
 * build audio
 */
gulp.task('audio', function(done) {
  gulp.src(path.client.audio)
    .pipe(gulp.dest(path.public.audio))
    .on('error', function(err){
      throw new gutil.PluginError('audio', err);
    })
    .on('end', done);
});


/**
 * build templates
 */
gulp.task('templates', function(done) {
  gulp.src('client/jade/**/*.jade')
    .pipe(jade({
      pretty: isUglify()
    }))
    .pipe(gulp.dest(path.public.root))
    .on('error', function(err){
      throw new gutil.PluginError('templates', err);
    })
    .on('end', done);
});


