module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

    /* Clear out the assets directory if it exists */
    clean: {
      dev: {
        src: ['build', 'build'],
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
					src: ['css/**', 'img/**', 'data/**', 'js/**'],
					dest: 'build/'
        }]
			}
    },
	});

	 grunt.loadNpmTasks('grunt-contrib-clean');
	 grunt.loadNpmTasks('grunt-contrib-copy');
	 grunt.loadNpmTasks('grunt-mkdir');
	 grunt.registerTask('default', ['clean', 'mkdir', 'copy']);
};

//MAPBOX_TOKEN=pk.eyJ1Ijoic2FsYWhoYW16YSIsImEiOiJjamtyaHJubW4xbDJwM3FxbDV1cTlkb3c4In0.womB79P_M4exflxmpIX4_A