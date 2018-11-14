module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      tiles: {
        options: {
          engine: 'im',
          sizes: [{
            width: 300,
            suffix: '_1x',
            quality: 30
          }, 
          {
            width: 600,
            suffix: '_2x',
            quality: 30
          }]
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'images/tiles/'
        }]
      },
      banners: {
        options: {
          engine: 'im',
          sizes: [{
            width: 400,
            suffix: '_1x',
            quality: 30
          }, 
          {
            width: 800,
            suffix: '_2x',
            quality: 30
          }]
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'images/banners/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['images/tiles', 'images/banners'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['images/tiles', 'images/banners']
        },
      },
    },

  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'responsive_images',]);

};
