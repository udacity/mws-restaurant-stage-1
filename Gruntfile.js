/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

    pkg: grunt.file.readJSON('package.json'),

    grunt.initConfig({
      responsive_images: {
        dev: {
          options: {
            engine: 'im',
            sizes: [{
              name: 'large',
              width: 800,
              suffix: '_2x',
              quality: 30
            },{
              name: 'normal',
              width: 400,
              suffix: '_1x',
              quality: 30
            },{
                name: 'small',
                width: 300,
                quality: 60
              }]
          },
  
          /*
          You don't need to change this part if you don't change
          the directory structure.
          */
          files: [{
            expand: true,
            src: ['*.{gif,jpg,png}'],
            cwd: 'img/',
            dest: 'img/'
          }]
        }
      },
  
      /* Clear out the images directory if it exists */
      clean: {
        dev: {
          src: ['images'],
        },
      },
    
      /* Generate the images directory if it is missing */
      mkdir: {
        dev: {
          options: {
            create: ['images']
          },
        },
      },
  
      /* Copy the "fixed" images that don't go through processing into the images/directory */
      copy: {
        dev: {
          files: [{
            expand: true,
            src: 'images_src/fixed/*.{gif,jpg,png}',
            dest: 'img/'
          }]
        },
      },


      // Uglify JS
      uglify: {
          build: {
              src: 'js/*.js',
              dest: 'dest/js/script.min.js'
          },

          dev: {
              options: {
                  beautify: true,
                  mangel: false,
                  compress: false,
                  preserveComments: 'all'
              },
              src: 'js/*.js',
              dest: 'dest/js/script.min.js'
          }
      },


      // Remove unused CSS across multiple files
      // Minify CSS
      cssmin: {
          build: {
              //options: {
              //  banner: '/* Minified CSS */'
              //},

              files: {
                  'dest/css/style.min.css' : ['css/**/*.css']
              }   
          }
      },

      uncss: {
        dist: {
            files: {
                'dest/css/tidy.css': ['index.html', 'restaurant.html']
            }
        }
      },
    });
    
    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-uncss');
    grunt.registerTask('default', ['clean', 'uncss', 'mkdir', 'copy', 'cssmin', 'uglify', 'responsive_images']);
  
};