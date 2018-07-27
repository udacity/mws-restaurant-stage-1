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
						name: 'large',
						width: '50%',
						suffix: '_large',
						quality: 40,
					},{
						name: 'small',
						width: '40%',
						suffix: '_small',
						quality: 30,
					}]
				},
				files: [{
					expand: true,
					src: ['*.{gif,jpg,png}'],
					cwd: 'img/',
					dest: 'image/'
				}]
			}
		},
	});

	grunt.loadNpmTasks('grunt-responsive-images');
	grunt.registerTask('default', ['responsive_images']);

};
