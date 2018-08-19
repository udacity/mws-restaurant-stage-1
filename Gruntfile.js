module.exports = function(grunt) {

	grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    responsive_images: {
      dev: {
        options: {
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

    /* Clear out the assets directory if it exists */
    clean: {
      dev: {
        src: ['build'],
      },
    },

    /* Generate the images directory if it is missing */
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