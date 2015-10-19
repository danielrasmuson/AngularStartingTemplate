var gulp    = require('gulp');
var sync    = require('run-sequence');
var browser = require('browser-sync');
var webpack = require('webpack-stream');
var todo    = require('gulp-todoist');
var path    = require('path');
var argv    = require('yargs').argv;
var tpl     = require('gulp-template');
var rename  = require('gulp-rename');
var uglify = require('gulp-uglify');
var webpackOpts = require('./webpack.config');

/*
map of paths for using with the tasks below
 */
var paths = {
  entry: 'client/app/app.js',
  app: ['client/app/**/*.{js,css,html}', 'client/styles/**/*.css'],
  js: 'client/app/**/*!(.spec.js).js',
  toCopy: ['client/index.html'],
  html: ['client/index.html', 'client/app/**/*.html'],
  dest: 'dist',
  blankTemplates: 'templates/component/**'
};

// helper funciton
var resolveToComponents = function(glob){
  glob = glob || '';
  return path.join('client', 'app/components', glob); // app/components/{glob}
};

gulp.task('todo', function() {
  return gulp.src(paths.js)
    .pipe(todo({silent: false, verbose: true}));
});

gulp.task('build', ['todo'], function() {
  return gulp.src(paths.entry)
    .pipe(webpack(webpackOpts))
    .pipe(gulp.dest(paths.dest));
});

gulp.task('prod-webpack', function() {
  webpackOpts.devtool = '';
  return gulp.src(paths.entry)
    .pipe(webpack(webpackOpts))
    .pipe(gulp.dest(paths.dest));
});

// this needs to wait for webpack to finish
gulp.task('prod', ['prod-webpack', 'copy'], function(){
  return gulp.src(paths.dest+'/'+webpackOpts.output.filename)
    .pipe(uglify())
    .pipe(gulp.dest(paths.dest));
})


gulp.task('serve', function() {
  browser({
    port: process.env.PORT || 4500,
    open: false,
    ghostMode: false,
    server: {
      baseDir: 'dist'
    }
  });
});

/*
simple task to copy over needed files to dist
 */
gulp.task('copy', function() {
  return gulp.src(paths.toCopy, { base: 'client' })
    .pipe(gulp.dest(paths.dest));
});

/*
task to watch files for changes and call build and copy tasks
 */
gulp.task('watch', function() {
  gulp.watch(paths.app, ['build', browser.reload]);
  gulp.watch(paths.toCopy, ['copy', browser.reload]);
});

gulp.task('component', function(){
  var cap = function(val){
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  var name = argv.name;
  var parentPath = argv.parent || '';
  var destPath = path.join(resolveToComponents(), parentPath, name);

  return gulp.src(paths.blankTemplates)
    .pipe(tpl({
      name: name,
      upCaseName: cap(name)
    }))
    .pipe(rename(function(path){
      path.basename = path.basename.replace('component', name);
    }))
    .pipe(gulp.dest(destPath));
});


gulp.task('default', function(done) {
  sync('build', 'copy', 'serve', 'watch', done)
});
