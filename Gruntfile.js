module.exports = function(grunt){

    grunt.initConfig({
        responsive_images:{
            dev:{
                options:{
                  engine:'im',
                  sizes:[{
                    width:1600,
                    suffix:'_large',
                    quality: 30
                  },
                  {
                    width:800,
                    suffix:'_small',
                    quality: 30
                  }]
                },
                files: [{
                    expand: true,
                    src: ['*.{gif,jpg,png}'],
                    cwd: 'images_src/',
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
    grunt.registerTask('default', ['clean', 'mkdir'])

};