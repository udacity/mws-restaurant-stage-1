const gulp = require('gulp');
const gulpLoadPlugins = require("gulp-load-plugins");
const browserSync = require("browser-sync").create();

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
        .pipe(gulp.dest(".tmp/css"))
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task("js", () => {
    return gulp
        .src("app/js/**/*.js")
        .pipe($.if(devBuild, $.sourcemaps.init()))
        //.pipe($.babel())
        .pipe($.if(devBuild, $.sourcemaps.write(".")))
        .pipe(gulp.dest(".tmp/js"))
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task("html", gulp.series("css", "js", () => {
    return gulp
        .src("app/*.html")
        .pipe($.useref({ searchPath: [".tmp", "app", "."] }))
        .pipe($.if(/\.js$/, $.uglify({ compress: { drop_console: true } })))
        .pipe($.if(/\.css$/, $.cssnano({ safe: true, autoprefixer: false })))
        .pipe(
            $.if(
                /\.html$/,
                $.htmlmin({
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: { compress: { drop_console: true } },
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
