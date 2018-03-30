let gulp = require('gulp');
let $ = require('gulp-load-plugins')();

gulp.task('responsive-images-dev', function () {
    createResponsiveImages ('src/img');
});

gulp.task('responsive-images-prod', function () {
    createResponsiveImages ('dist/img');
});

const createResponsiveImages = function(output){
    return gulp.src('src/images/*.*')
        .pipe($.responsive(
            {
                '*.*':
                [
                    {
                        width: 320,
                        rename: {
                            suffix: '',
                            extname: '.jpg',
                        },
                        format: 'jpeg',
                    },
                    {
                        width: 640,
                        rename: {
                            suffix: '-medium',
                            extname: '.jpg',
                        },
                        // format option can be omitted because
                        // format of output image is detected from new filename
                        // format: 'jpeg'
                    },
                    {
                        width: 800,
                        rename: {
                            suffix: '-large',
                            extname: '.jpg',
                        },
                        // Do not enlarge the output image if the input image are already less than the required dimensions.
                        withoutEnlargement: true,
                    },
                    {
                        // Convert images to the webp format
                        width: 320,
                        rename: {
                            suffix: '',
                            extname: '.webp',
                        },
                    },
                    {
                        // Convert images to the webp format
                        width: 640,
                        rename: {
                            suffix: '-medium',
                            extname: '.webp',
                        },
                    },
                    {
                        // Convert images to the webp format
                        width: 800,
                        rename: {
                            suffix: '-large',
                            extname: '.webp',
                        },
                        withoutEnlargement: true,
                    }
                ],
            },
            {
                // Global configuration for all images
                // The output quality for JPEG, WebP and TIFF output formats
                quality: 80,
                // Use progressive (interlace) scan for JPEG and PNG output
                progressive: true,
                // Strip all metadata
                withMetadata: false,
                // Do not emit the error when image is enlarged.
                errorOnEnlargement: false,
            }
        ))
        .pipe(gulp.dest(output));
};
