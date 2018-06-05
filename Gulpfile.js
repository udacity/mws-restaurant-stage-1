/* eslint-disable no-console, fp/no-mutating-methods, prefer-destructuring */

const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const babel = require("gulp-babel");
const del = require("del");
const imageMin = require("gulp-imagemin");
const pngquant = require("imagemin-pngquant");
const imageminWebp = require("imagemin-webp");
const eslint = require("gulp-eslint");
// const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const webp = require("gulp-webp");
const sass = require("gulp-sass");
const cssNano = require("gulp-cssnano");
const size = require("gulp-size");
const htmlMin = require("gulp-htmlmin");
const gulpIf = require("gulp-if");
const sourcemaps = require("gulp-sourcemaps");
const useRef = require("gulp-useref");

gulp.task("clean", () => del([".tmp", "dist/*", "!dist/.git"], {dot: true}));

gulp.task("styles", () =>
    gulp.src([
        "css/**/*.scss",
        "css/**/*.css",
    ])
        .pipe(sass())
        .pipe(gulpIf("*.css", cssNano()))
        .pipe(size({title: "styles"}))
        .pipe(gulp.dest("dist/css")));

gulp.task("lint", () =>
    gulp.src(["js/**/*.js", "!node_modules/**"])
        .pipe(eslint({"quiet": true, "fix": true, "configFile": ".eslintrc.js"}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError()));

gulp.task("webp", () =>
    gulp.src("img/**/*.jpg")
        .pipe(webp({
            quality: 80,
            preset: "photo",
            method: 6,
        }))
        .pipe(gulp.dest("dist/img"))
);

gulp.task("images", gulp.series(["webp"], () =>
    gulp.src("img/**/*")
        .pipe(imageMin({
            progressive: true,
            interlaced: true,
            use: [imageminWebp({quality: 60}), pngquant()],
        }))
        .pipe(size({title: "images"}))
        .pipe(gulp.dest("dist/img")))
);

gulp.task("copy_manifest", () =>
    gulp.src([
        "./manifest.json",
        "node_modules/apache-server-configs/dist/.htaccess",
    ], {
        dot: true,
    })
        .pipe(gulp.dest("dist"))
        .pipe(size({title: "copy"}))
);

gulp.task("minify-html", () =>
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
        .pipe(gulp.dest("dist")));

gulp.task("serve", () => {
    const reload = browserSync.reload;
    browserSync.init({
        notify: false,
        logPrefix: "MWS",
        server: "./",
        // https: true,
        port: 8000,
    });
    gulp.watch(["./*.html"], gulp.series(reload));
    gulp.watch(["css/**/*.{scss,css}"], gulp.series(["styles", reload]));
    gulp.watch(["js/**/*.js"], gulp.series(["lint", "scripts-dist", reload]));
    gulp.watch(["./serviceWorker.js"], gulp.series(["lint", "scripts-sw", reload]));
    gulp.watch(["img/**/*"], gulp.series(reload));
});

gulp.task("serve:dist", () => {
    const reload = browserSync.reload;
    browserSync.init({
        notify: false,
        logPrefix: "MWS",
        server: "dist",
        https: true,
        port: 8001,
    });
    gulp.watch(["./*.html"], gulp.series(reload));
    gulp.watch(["css/**/*.{scss,css}"], gulp.series(["styles", reload]));
    gulp.watch(["js/**/*.js"], gulp.series(["lint", "scripts-dist", reload]));
    gulp.watch(["./serviceWorker.js"], gulp.series(["lint", "scripts-sw", reload]));
    gulp.watch(["img/**/*"], gulp.series(reload));
});

gulp.task("scripts-dist", gulp.series(["lint"], () =>
    gulp.src("js/**/*.js")
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write())
        // .pipe(concat("all.js"))
        .pipe(uglify())
        .pipe(size({title: "scripts"}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist/js"))));

gulp.task("scripts-sw", gulp.series(["lint"], () =>
    gulp.src("./serviceWorker.js")
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(uglify())
        .pipe(size({title: "serviceWorker"}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist"))));

gulp.task("default", gulp.series(["clean", "images", "styles", "lint", "scripts-dist", "scripts-sw", "minify-html", "copy_manifest"], done => done()));
