module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [{
            name: 'small',
            width: '30%',
            quality: 20
          },{
            name: 'medium',
            width: '40%',
            quality: 40
          },{
            width: 800,
            suffix: '_large_1x',
            quality: 50
          },{
            width: 1600,
            suffix: '_large_2x',
            quality: 30
          }]
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'img_src/',
          dest: 'img/'
        }]
      }
    },
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.registerTask('default', ['responsive_images']);

};
