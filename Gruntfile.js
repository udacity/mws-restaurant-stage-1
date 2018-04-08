/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/
// require('load-grunt-tasks')(grunt);

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      options: { livereload: true },
      files: ['src/**'],
      tasks: [],
      // Watch .scss files
      sass: {
        files: ['src/css/sass/**/*.scss'],
        tasks: ['sass:dev'],
      },

      // Live reload files
      livereload: {
        options: { livereload: true },
        files: [
          'css/**/*.css',
          'js/**/*.js',
          '**/*.html',
        ]
      }
    },
    express: {
      all: {
        options: {
          port: 3000,
          hostname: 'localhost',
          bases: ['./src'],
          livereload: true
        }
      }
    },

    sass: {

      // Sass development options
      dev: {
        options: {
          style: 'expanded',
        },
        files: {
          'src/css/styles.css': 'src/css/sass/styles.scss'
        }
      },
      dist: {
        options: {
          style: 'compressed'
        },
        files: {
          'css/main.css': 'css/sass/global.scss'
        }
      },
    },


    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            width: 700,
            rename: false,
            quality: 80
          }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['src/images_src/*.{gif,jpg,png}'],
          cwd: 'src/images_src/',
          dest: 'src/img/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['src/img'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['src/img']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: 'images_src/fixed/*.{gif,jpg,png}',
          dest: 'src/img/fixed',
          flatten: true,
          filter: 'isFile',
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: 'images_src/fixed/*.{gif,jpg,png}',
          dest: 'src/img/fixed',
          flatten: true,
          filter: 'isFile',
        }]
      },
    },
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.registerTask('server', ['express', 'watch']);
  grunt.registerTask('default', ['clean', 'mkdir', 'copy']);
  grunt.registerTask('images', ['responsive_images']);
  grunt.registerTask('dist', ['clean', 'mkdir', 'sass:dist', 'copy:dist']);
};
