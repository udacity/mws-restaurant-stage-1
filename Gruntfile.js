module.exports = function(grunt) {
  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          concurrency: 4,
          engine: 'gm',
          sizes: [{
            width: 800,
            suffix: '_large',
            quality: 80
          }, {
            width: 640,
            suffix: '_medium',
            quality: 60
          }, {
            width: 320,
            suffix: '_small',
            quality: 40
          }]
        },

        files: [{
          expand: true,
          src: ['*.jpg'],
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
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'responsive_images']);
};
