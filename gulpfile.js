const gulp = require("gulp");
const responsive = require("gulp-responsive");
const babel = require("gulp-babel");

gulp.task("responsive", () =>
  gulp
    .src("imgsrc/*")
    .pipe(
      responsive({
        "*.jpg": [
          {
            width: 400,
            quality: 50,
            rename: { suffix: "_1x" }
          },
          {
            rename: { suffix: "_2x" }
          }
        ]
      })
    )
    .pipe(gulp.dest("img"))
);

gulp.task("babel", () =>
  gulp
    .src("js/indexdb.js")
    .pipe(
      babel({
        presets: ["env"]
      })
    )
    .pipe(gulp.dest("dist"))
);
