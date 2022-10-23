const { src, dest, task, parallel, series, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const del = require('del');
const imagemin = require('gulp-imagemin');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');
const pug = require('gulp-pug');
const data = require('gulp-data');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const pump = require('pump');

// De-caching for data.json file
function requireUncached($module) {
  delete require.cache[require.resolve($module)];
  return require($module);
}

// src/build paths
const path = {
  build: './build',
  css: {
    source: './src/**/*.scss',
    dest: './build/styles/',
  },
  html: {
    source: './src/pages/**/*.pug',
    dest: './build/',
  },
  scripts: {
    source: './src/scripts/**/*.js',
    dest: './build/scripts/',
  },
  images: {
    source: './src/assets/images/**/*',
    dest: './build/images/',
  },
  fonts: {
    source: './src/fonts/**/*',
    dest: './build/fonts/',
  },
  data: './src/assets/data.json',
};

// Clean
task('clean', done => {
  del.sync(path.build);
  done();
});

// Css
task('css', done => {
  src(path.css.source)
    .pipe(concat('main.scss'))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer(['last 5 versions', '> 1%'], { cascade: true }))
    .pipe(csso())
    .pipe(dest(path.css.dest))
    .pipe(browserSync.stream());
  done();
});

// Html
task('html', done => {
  src(path.html.source)
    .pipe(data(() => requireUncached(path.data)))
    .pipe(pug({ basedir: './' }))
    .pipe(dest(path.build))
    .pipe(browserSync.stream());
  done();
});

// Scripts
task('scripts', cb => {
  pump([
      src(path.scripts.source),
      babel({ presets: ['@babel/env'] }),
      concat('index.js'),
      uglify(),
      dest(path.scripts.dest),
    ],
    cb,
  );
});

// Images
task('images', done => {
  src(path.images.source)
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false },
        ],
      }),
    ]))
    .pipe(dest(path.images.dest));
  done();
});

// Fonts
task('fonts', done => {
  src(path.fonts.source)
    .pipe(dest(path.fonts.dest));
  done();
});

// BrowserSync
function reload(done) {
  browserSync.reload();
  done();
}

task('browser-sync', done => {
  browserSync.init({
    server: {
      baseDir: path.build,
    },
    notify: false,
  });
  done();
});

// Watch files
task('watch', done => {
  watch(path.css.source, series('css', reload));
  watch(path.html.source, series('html', reload));
  watch(path.data, series('html', reload));
  watch(path.scripts.source, series('scripts', reload));
  done();
});

// Gulp scripts
task('default', parallel('clean', 'css', 'html', 'scripts', 'fonts', 'images', 'browser-sync', 'watch'));
