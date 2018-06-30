module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.initConfig({
    jshint: {
      files: ['index.js']
    },

    browserify: {
      test: {
        options: {
          transform: ['./index.js'],
          debug: true 
        },
        src: ['test/mocha/**/*.js'],
        dest: 'test/testbundle.js'
      }
    },

    mocha: {
      test: {
        src: ['test/test.html'],
        options: {
          run: true
        }
      } 
    }
  });

  grunt.registerTask('test', ['jshint', 'browserify:test', 'mocha:test']);
};
