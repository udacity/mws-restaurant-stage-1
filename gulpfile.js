const gulp = require('gulp');
const browserify = require("browserify");
const babelify = require("babelify");
const source = require("vinyl-source-stream");
const gulpLoadPlugins = require("gulp-load-plugins");
const browserSync = require("browser-sync").create();
const del = require('del');
const reload = browserSync.reload;
const runSequence = require("run-sequence");
const $ = gulpLoadPlugins();

const folder = {
    src: 'app/',
    build: 'build/'
};

const devBuild = true;
// image processing
gulp.task("images", () => {
    const out = folder.build + 'img/';
    return gulp
        .src("app/img/**/*")
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest("build/img"));
});

gulp.task("css", () => {
    return gulp
        .src("app/css/*.css")
        .pipe($.if(devBuild, $.sourcemaps.init()))
        .pipe(
            $.autoprefixer({ browsers: ["> 1%", "last 2 versions", "Firefox ESR"] })
        )
        .pipe($.if(devBuild, $.sourcemaps.write()))
        .pipe($.cssnano({ safe: true, autoprefixer: false }))
        .pipe(gulp.dest("build/css"))
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task("js", () => {
    return gulp
        .src("app/js/**/*.js")
        .pipe($.if(devBuild, $.sourcemaps.init()))
        .pipe($.babel())
        .pipe($.uglify({ compress: { drop_console: true } }))
        //.pipe($.uglify({ compress: { drop_console: true } }))
        .pipe(gulp.dest("build/js"))
        .pipe(browserSync.reload({ stream: true }));
});



gulp.task("sw", () => {
    const b = browserify({
        debug: true
    });
    return b
        .transform(babelify.configure({
            presets: ["es2015"]
        }))
        .require("app/sw.js", { entry: true })
        .bundle()
        .on('error', function (error) {
            console.log(error)
        })
        .pipe(source("sw.js"))
        .pipe(gulp.dest(folder.build))
});

gulp.task("dbhelper", () => {
    const b = browserify({
      debug: true
    });
     return b
     .transform(babelify.configure({
        presets: ["es2015"]
    }))
      .require("app/js/dbhelper.js", { entry: true })
      .bundle()
      .on('error', function (error) {
        console.log(error)
    })
      .pipe(source("dbhelper.js"))
      .pipe(gulp.dest("build/js/"));
  });

gulp.task("html", gulp.series("css", "js","dbhelper", "sw", () => {
    return gulp
        .src("app/*.html")
        .pipe(
            $.if(
                /\.html$/,
                $.htmlmin({
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: { compress: { } },
                    processConditionalComments: true,
                    removeComments: true,
                    removeEmptyAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true
                })
            )
        )
        .pipe(gulp.dest(folder.build));
}));


gulp.task("copy_static",() => {
    return gulp.src([
        `${folder.src}/*.json`,
    ],  {base: folder.src}) 
    .pipe(gulp.dest(`${folder.build}`));
});

gulp.task("clean", del.bind(null, "build"));

const build_all = gulp.series("clean", "html", "images","copy_static");

gulp.task('watch', () => {
    gulp.watch([folder.src], build_all)
});

gulp.task("serve", gulp.series("clean", "css",  "js","dbhelper", "sw"), () => {   
        browserSync.init({
            notify: false,
            port: 8000,
            server: {
                baseDir: [".tmp", "app"]               
            }
        });  
});


gulp.task('default', gulp.series(build_all, 'watch'), () => {
    console.log('Development started');
});