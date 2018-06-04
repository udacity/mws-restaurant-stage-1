/* eslint-disable no-console, fp/no-mutating-methods, prefer-destructuring */

const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const babel = require("gulp-babel");
const del = require("del");
const imageMin = require("gulp-imagemin");
const pngquant = require("imagemin-pngquant");
const eslint = require("gulp-eslint");
// const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const sass = require("gulp-sass");
const cssNano = require("gulp-cssnano");
const size = require("gulp-size");
const htmlMin = require("gulp-htmlmin");
const gulpIf = require("gulp-if");
const sourcemaps = require("gulp-sourcemaps");
const runSequence = require("run-sequence");
const useRef = require("gulp-useref");

gulp.task("clean", () => del([".tmp", "dist/*", "!dist/.git"], {dot: true}));

gulp.task("styles", () => {
    gulp.src([
        "css/**/*.scss",
        "css/**/*.css",
    ])
        .pipe(sass())
        .pipe(gulpIf("*.css", cssNano()))
        .pipe(size({title: "styles"}))
        .pipe(gulp.dest("dist/css"));
});

gulp.task("lint", () => {
    gulp.src(["js/**/*.js", "!node_modules/**"])
        .pipe(eslint({"quiet": true, "fix": true, "configFile": ".eslintrc.js"}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("images", () => {
    gulp.src("img/**/*")
        .pipe(imageMin({
            progressive: true,
            interlaced: true,
            use: [pngquant()],
        }))
        .pipe(gulp.dest("dist/img"))
        .pipe(size({title: "images"}));
});

gulp.task("minify-html", () => {
    gulp.src("./*.html")
        .pipe(useRef({
            searchPath: "{.tmp,js,css}",
            noAssets: true,
        }))
        .pipe(htmlMin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true,
        }))
        .pipe(gulpIf("*.html", size({title: "html", showFiles: true})))
        .pipe(gulp.dest("dist"));
});

gulp.task("serve", () => {
    const reload = browserSync.reload;
    browserSync.init({
        notify: false,
        logPrefix: "MWS",
        server: "./",
        // https: true,
        port: 8000,
    });
    gulp.watch(["./*.html"], reload);
    gulp.watch(["css/**/*.{scss,css}"], ["styles", reload]);
    gulp.watch(["js/**/*.js"], ["lint", "scripts-dist", reload]);
    gulp.watch(["./serviceWorker.js"], ["lint", "scripts-sw", reload]);
    gulp.watch(["img/**/*"], reload);
});

gulp.task("serve:dist", () => {
    browserSync.init({
        notify: false,
        logPrefix: "MWS",
        server: "dist",
        // https: true,
        port: 8001,
    });
});

gulp.task("scripts-dist", ["lint"], () => {
    gulp.src("js/**/*.js")
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write())
        // .pipe(concat("all.js"))
        .pipe(uglify())
        .pipe(size({title: "scripts"}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist/js"));
});

gulp.task("scripts-sw", ["lint"], () => {
    gulp.src("./serviceWorker.js")
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write())
        // .pipe(concat("all.js"))
        .pipe(uglify())
        .pipe(size({title: "serviceWorker"}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist"));
});

gulp.task("default", ["clean"], done => {
    runSequence(["images", "styles"],
        ["lint", "scripts-dist", "scripts-sw"],
        ["minify-html"]
    );
    done();
});
