'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    browserify: {
      game: {
        files: {
          'js/bundle.js': ['src/**/*.js']
        }
      }
    },
    concurrent: {
      game: {
        tasks: ["connect:game", "watch:game"],
        options: {
          logConcurrentOutput: true
        }
      }
    },
    connect: {
      game: {
        options: {
          port: 8001,
          keepalive: true
        }
      }
    },
    watch: {
      game: {
        files: ['src/**/*.js'],
        tasks: ['browserify:game']
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.registerTask('default', ['browserify:game', 'concurrent:game']);
};
