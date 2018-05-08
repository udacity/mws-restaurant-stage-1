module.exports = function(grunt){

    grunt.initConfig({
        responsive_images:{
            dev:{
                options:{
                  engine:'im',
                  sizes:[{
                    width:800,
                    suffix:'_2x',
                    quality: 30
                  },
                  {
                    width:400,
                    suffix:'_1x',
                    quality: 30
                  }]
                },
                files: [{
                    expand: true,
                    src: ['*.{gif,jpg,png}'],
                    cwd: 'images_src/restaurants',
                    dest: 'img/'
                }]
            }
        },
        icon_images:{
            dev:{
                options:{
                  engine:'im',
                  sizes:[{
                    width:96,
                    suffix:'_2x',
                    quality: 30
                  },
                  {
                    width:48,
                    suffix:'_1x',
                    quality: 30
                  }]
                },
                files: [{
                    expand: true,
                    src: ['images_src/*.png'],
                    cwd: 'images_src',
                    dest: 'img/'
                }]
            }
        },
        clean:{
            dev:{
                src:['img']
            }
        },
        mkdir:{
            dev:{
                options:{
                    create: ['img']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.registerTask('default', ['clean', 'mkdir', 'responsive_images', 'icon-images'])

};