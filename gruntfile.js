module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [{
            name: 'small',
            width: 300,
            quality: 30
          },
          {
            name: 'normal',
            width: 400,
            quality: 30
          },
          {
            name: 'normal',
            width: 800,
            suffix: '_2x',
            quality: 30
          }]
        },

        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img/',
          dest: 'images/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['images'],
      },
    },

    /*
    watch: {
      dev: {
        files: ['src/images/*.{jpg,png}'],
        tasks: ['responsive_images']
      }
    },
    */

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['images']
        },
      },
    }

  });
  
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  /*grunt.loadNpmTasks('grunt-contrib-copy');*/
  grunt.loadNpmTasks('grunt-mkdir');

  /* register default tasks */
  grunt.registerTask('default', ['clean', 'mkdir', 'responsive_images']);

};