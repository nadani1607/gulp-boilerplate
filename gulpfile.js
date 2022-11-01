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
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');

/**
 * De-caching for data.json file on changes
 */
function requireUncached($module) {
  delete require.cache[require.resolve($module)];
  return require($module);
}

/**
 * All paths for tasks
 * If 'watch' is not exists then will be watched 'source'
 */
const path = {
  build: './build',
  css: {
    source: './src/**/*.scss',
    dest: './build/styles/',
  },
  html: {
    source: './src/pages/*/index.pug',
    dest: './build/',
    watch: './src/**/*.pug',
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

/**
 * Clean build folder
 */
task('clean', done => {
  del.sync(path.build);
  done();
});

/**
 * Transform scss to css
 */
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

/**
 * Transform pug to html
 */
task('html', done => {
  src(path.html.source)
    .pipe(plumber())
    .pipe(data(() => requireUncached(path.data)))
    .pipe(pug({ basedir: './' }))
    .pipe(rename((path) => {
      path.basename = path.dirname === 'home' ? 'index' : path.dirname;
      path.dirname = '';

      return path;
    }))
    .pipe(dest(path.build))
    .pipe(browserSync.stream());
  done();
});

/**
 * Concat and obfuscate all js file into one
 */
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

/**
 * Optimize images
 */
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

/**
 * Copy fonts
 */
task('fonts', done => {
  src(path.fonts.source)
    .pipe(dest(path.fonts.dest));
  done();
});

/**
 * Reload browser function
 */
function reload(done) {
  browserSync.reload();
  done();
}

/**
 * Create synchronisation for dev server from 'build' folder
 */
task('browser-sync', done => {
  browserSync.init({
    server: {
      baseDir: path.build,
    },
    notify: false,
  });
  done();
});

/**
 * Listen every changing and reload browser for each path in list
 */
task('watch', done => {
  watch(path.css.source, series('css', reload));
  watch(path.html.watch, series('html', reload));
  watch(path.data, series('html', reload));
  watch(path.images.source, series('images', reload));
  watch(path.scripts.source, series('scripts', reload));
  done();
});

/**
 * Run dev server and listen changes
 */
task(
  'default',
  series(
    parallel('css', 'html', 'scripts', 'fonts', 'images'),
    parallel('browser-sync', 'watch'),
  ),
);

/**
 * Just build files
 */
task(
  'build',
  series('clean',
    parallel('css', 'html', 'scripts', 'fonts', 'images'),
  ),
);
