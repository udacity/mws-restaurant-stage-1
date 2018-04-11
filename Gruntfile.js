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
          'src/css/styles.css': 'src/css/sass/styles.scss'
        }
      },
    },


    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [{
            width: 800,
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
          src: ['*.{gif,jpg,png}'],
          cwd: 'src/img/images_src/',
          dest: 'src/img/'
        }]
      },
      icon: {
        options: {
          engine: 'im',
          sizes: [{
            width: 48,
            quality: 80
          },
          {
            width: 72,
            quality: 80
          },
          {
            width: 96,
            quality: 80
          },
          {
            width: 144,
            quality: 80
          },
          {
            width: 168,
            quality: 80
          },
          {
            width: 192,
            quality: 80
          },
          {
            width: 720,
            quality: 80
          }]
        },

        files: [{
          expand: true,
          cwd: 'src/img/images_src/',
          src: ['favicon/icon.{gif,jpg,png}'],
          dest: 'src/img/'
        }]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['src/img/*', '!src/img/images_src', '!src/img/favicon'],
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
          src: 'img/*.{gif,jpg,png}',
          dest: 'dist/',
          flatten: false,
          filter: 'isFile',
        },
        {
          expand: true,
          cwd: 'src/',
          src: 'img/favicon/*.{gif,jpg,png}',
          dest: 'dist/',
        },
        {
          expand: true,
          cwd: 'src/',
          src: '*',
          dest: 'dist/',
        },
        {
          expand: true,
          cwd: 'src/',
          src: 'data/*.{json}',
          dest: 'dist/',
        },]
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
  // grunt.registerTask('default', ['clean', 'mkdir', 'copy:dist']);
  grunt.registerTask('images', ['clean', 'responsive_images:dev']);
  grunt.registerTask('icon', ['responsive_images:icon']);
  grunt.registerTask('dist', ['sass:dist', 'copy:dist']);
};
