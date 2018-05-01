/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {
  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            name: 'small',
            width: '460px',
            suffix: '_1x',
            quality: 40,
          }, {
            name: 'small',
            width: '100%',
            suffix: '_2x',
            quality: 60,
          }, {
            name: 'larg',
            width: '100%',
            suffix: '_2x',
            quality: 100,
          }, {
            name: 'larg',
            width: '636px',
            suffix: '_1x',
            quality: 60,
          }],
        },

        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img/',
          dest: 'images/',
        }],
      },
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
          create: ['images'],
        },
      },
    },

  });
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
 grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
};
