module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		'grunt-npm-check-updates': {
		    include: {
		        production: true,
		        develop: true,
		        optional: false,
		        jsonFile: 'package.json',
		    },
		    output: {
		        visual: true,
		        xml: true,
		        xmlFilename: 'grunt-npm-check-updates.xml',
		        xmlTemplate: '<?xml version="1.0"?><modules>{{#each modules}}<module name="{{{ this.name }}}" installed="{{{ this.installed }}}" latest="{{{ this.latest }}}" missedMajors="{{{ this.missedMajors }}}" missedMinors="{{{ this.missedMinors }}}" missedPatches="{{{ this.missedPatches }}}" status="{{{ this.status }}}"><versions>{{{ this.versions }}}</versions></module>{{/each}}</modules>',
		        json: true,
		        jsonFilename: 'grunt-npm-check-updates.json',
		        jsonTemplate: '{"modules": [{{#each modules}}{{#if @last }}{"name": "{{{ this.name }}}","installed": "{{{ this.installed }}}","latest": "{{{ this.latest }}}","missedMajors": "{{{ this.missedMajors }}}","missedMinors": "{{{ this.missedMinors }}}","missedPatches": "{{{ this.missedPatches }}}","versions": "{{{ this.versions }}}","status": "{{{ this.status }}}"}{{else}}{"name": "{{{ this.name }}}","installed": "{{{ this.installed }}}","latest": "{{{ this.latest }}}","missedMajors": "{{{ this.missedMajors }}}","missedMinors": "{{{ this.missedMinors }}}","missedPatches": "{{{ this.missedPatches }}}","versions": "{{{ this.versions }}}","status": "{{{ this.status }}}"},{{/if}}{{/each}}]}',
		    },
		    global: {
		        missedMajors: {
		            allowed: 0,
		            level: 'error',
		        },
		        missedMinors: {
		            allowed: 1,
		            level: 'warn',
		        },
		        missedPatches: {
		            allowed: 0,
		            level: 'warn',
		        },
		        showVersions: false,
		    },
		    modules: {},
		},

		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
				'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
				' Licensed <%= pkg.license %> */\n'
		},

		//  Convert SASS files into CSS  
		sass: {
			options: {
				sourceMap: true
			},
			dist: {
				files:  [{
					expand: true,
					cwd: 'scss/',
					src: ['*.scss','!variable.scss','*/*.scss'],
					dest: 'css/',
					ext: '.css'
				}]
			}
		},

		//  Minify CSS  
		cssmin: {
			target: {
				files: {
					'min/app.min.css': 'css/*.css'
				}
			}
		},

		//  Autoprefix CSS  
		autoprefixer: {
			styles: {
				files: {
					'min/app.min.css': 'min/app.min.css'
				}
			}
		},

		//  Minify JS
		uglify: {
			options: {
				mangle: false
			},
			my_target: {
				files: {
					'min/app.min.js': ['js/*.js', '!js/jquery.dlmenu.js']
				}
			}
		},

		//  Watch 
		watch: {
			sass: {
				files: ['scss/*'],
				tasks: ['styles', 'sftp:changedfiles'],
				options: {
					livereload: true,
					spawn: false
				},
			},

			scripts: {
				files: ['js/*'],
				tasks: ['uglify', 'sftp:changedfiles'],
				options: {
					livereload: true,
					spawn: false
				},
			},

			php: {
				files: ['*.php','*/*.php'],
				tasks: ['sftp:changedfiles'],
				options: {
					livereload: true,
					spawn: false
				},
			},
		},

		//  Deploy the whole thing
		"sftp-deploy": {
			build: {
				auth: {
					host: "home430615955.1and1-data.host",
					port: 22,
					authKey: "key1"
				},
				cache: 'sftpCache.json',
				src: 'min/',
				dest: 'clickandbuilds/Portfolio/wp-content/themes/starter/min/',
				exclusions: ['min/**/.DS_Store', 'min/**/Thumbs.db', 'dist/tmp'],
				serverSep: '/',
				concurrency: 4,
				progress: true
			}
		},

		//  Clean .css and .css.map from sass files
		clean: ["css/*.css.map"],


		secret: grunt.file.readJSON('ftppass.json'),
		sftp: {
		  changedfiles: {
		    files: {
		      './': 'min/app.min.css'
		    },
		    options: {
		      path: 'clickandbuilds/Portfolio/wp-content/themes/starter',
		      host: '<%= secret.host %>',
		      username: '<%= secret.username %>',
		      password: '<%= secret.password %>',
		      showProgress: true,
		    }
		  }
		},
		sshexec: {
		  changedfiles: {
		    command: 'uptime',
		    options: {
		      host: '<%= secret.host %>',
		      username: '<%= secret.username %>',
		      password: '<%= secret.password %>'
		    }
		  }
		}

	});

	grunt.event.on('watch', function(action, filepath, target) {
		if ( target =="sass") {
			grunt.log.writeln('******************  SASS CHANGED  ******************');
			grunt.config('sftp.changedfiles.files', {"./": 'min/app.min.css'});
		} else if ( target =="scripts") {
			grunt.log.writeln('******************  JS CHANGED  ******************');
			grunt.config('sftp.changedfiles.files', {"./": 'min/app.min.js'});
		} else if ( target =="php") {
			grunt.log.writeln('******************  PHP CHANGED  ******************');
			grunt.config('sftp.changedfiles.files', {"./": filepath});
		}
	});

	// load grunt modules
	require('load-grunt-tasks')(grunt);

	// Default task(s)
	grunt.registerTask('default', ['work', 'watch']);

	grunt.registerTask('test', ['grunt-npm-check-updates']);
	grunt.registerTask('build', ['work', 'imagemin']);
	grunt.registerTask('work', ['styles', 'uglify', 'sftp-deploy:build', 'watch']);
	grunt.registerTask('styles', ['sass', 'cssmin', 'autoprefixer:styles', 'clean']);

};
