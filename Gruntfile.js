module.exports = function(grunt) {

	grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    /*
    Creating images for the to go with all
    viewports they are displayed on
    Note: source image size is only 800x600 that's
          generated images with widths > 800
          have an 'upscale=true'
     */
    responsive_images: {
      dev: {
        options: {
          /*
          Using GraphicsMagick as graphics engine.
          Although 'gm' is the default graphics engine
          I specified it here for reading purposes.
          */
          engine: 'gm',
          /* Specifying image sizes to generate */
          sizes: [{
            width: 300,
            suffix: 'w',
            quality: 80
          },{
            width: 400,
            suffix: 'w',
            quality: 80
          }, {
            width: 500,
            suffix: 'w',
            quality: 80
          }, {
            width: 600,
            suffix: 'w',
            quality: 80
          }, {
            width: 800,
            suffix: 'w',
            quality: 80
          }, {
            width: 1000,
            suffix: 'w',
            quality: 60,
            upscale: true
          }, {
            width: 1200,
            suffix: 'w',
            quality: 60,
            upscale: true
          }]
        },

        files: [{
          expand: true,
          src: ['img/*.{gif,jpg,png}'],
          cwd: 'src',
          dest: 'build'
        }]
      }
    },

    /* Clear out the 'build' directory if it exists */
    clean: {
      dev: {
        src: ['build'],
      },
    },

    /* Generate the build directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['build/']
        },
      },
		},

    /* Copy the assets that don't go through any task */
    copy: {
      dev: {
        files: [{
					expand: true,
					cwd: 'src',
					src: ['css/**', 'data/**', 'js/**'],
					dest: 'build/'
        }]
			}
    },
	});

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');

  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
};