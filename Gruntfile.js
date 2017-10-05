module.exports = function(grunt) {
    grunt.initConfig({
        sass: {   
            dist: {   
                options : {
                    sourcemap : 'none'
                },  
                files: {                         
                    'library/dist/css/force-reload-admin.built.css' : 'library/src/sass/force-reload-admin.scss'
                }
            }
        },
        watch: {
            css : {
                files: ['library/src/sass/**/*'],
                tasks: ['buildDevCSS'],
                options: {
                    livereload : true,
                },
            },
            js : {
                files: ['library/src/js/**/*'],
                tasks: ['buildDevJS'],
                options: {
                    livereload : true,
                },
            }
        },
        concat: {

            options: {
                separator: '\n',
            },

            // Admin JS
            admin_js: {
                src: [
                'library/src/js/force-reload-admin.js'
                ],
                dest: 'library/dist/js/force-reload-admin.built.js',
            },

            // Regular JS
            regular_js: {
                src: [
                'library/src/js/force-reload.js'
                ],
                dest: 'library/dist/js/force-reload.built.js',
            }

        },
        uglify: {
            site_dist: {
                files: [{
                    expand: true,
                    cwd: 'library/dist/js/',
                    src: ['**/*.js', '!**/*built.js'],
                    dest: 'library/dist/js/'
                }]
            },
        },
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'library/dist/css',
                    src: ['*.css', '!*.min.css'],
                    dest: 'library/dist/css',
                    ext: '.built.min.css'
                }]

            }
        },
        jshint: {
            options: {
                es3     : true,
                curly   : true,
                eqeqeq  : true,
                eqnull  : true,
                browser : true,
                evil    : true,
                globals: {
                    jQuery: true
                },
            },
            all: [
            'library/src/**/*.js',
            ]
        },
        csslint: {
            strict: {
                options: {
                    'import'                 : 2,
                    'ids'                    : false,
                    'unique-headings'        : false,
                    'important'              : false,
                    'font-sizes'             : false,
                    'adjoining-classes'      : false,
                    'overqualified-elements' : false,
                    'qualified-headings'     : false,
                    'box-sizing'             : false,
                },
                src: ['library/dist/css/**/*.css', '!library/dist/css/**/*.min.css']
            }
        },
        removelogging: {
            options: {
                methods : ['log', 'debug']
            },
            dist: {
                src: "library/dist/js/**/*.js"
            }
        },
        copy: {
            css: {
                files: [
                {
                    expand: true,
                    cwd: 'library/dist/css',
                    src: ['**/*.css', '!**/*min.css'],
                    dest: 'library/dist/css/',
                    rename: function(dest, src) {
                        return dest + src.replace(/\.css$/, ".min.css");
                    }
                }
                ]
            },
            js: {
                files: [
                {
                    expand: true,
                    cwd: 'library/dist/js/',
                    src: ['**/*.js', '!**/*min.js'],
                    dest: 'library/dist/js/',
                    rename: function(dest, src) {
                        return dest + src.replace(/\.js$/, ".min.js");
                    }
                }
                ]
            }
        }
    });

grunt.loadNpmTasks('grunt-contrib-copy');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-contrib-cssmin');
grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-contrib-sass');
grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-contrib-csslint');
grunt.loadNpmTasks("grunt-remove-logging");

grunt.task.registerTask('buildDev', ['buildDevJS', 'buildDevCSS']);
grunt.task.registerTask('buildDevCSS',  ['sass', 'copy', 'csslint'])
grunt.task.registerTask('buildDevJS',   ['concat', 'copy', 'jshint']);
grunt.task.registerTask('buildAlpha', ['concat', 'copy','uglify', 'sass', 'cssmin','jshint', 'csslint']);
grunt.task.registerTask('buildProd', ['concat', 'copy', 'removelogging', 'uglify', 'sass', 'cssmin','jshint', 'csslint']);

};
