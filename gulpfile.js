var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var tsPaths = require('./tsconfig.json')

var tsProject = ts.createProject('tsconfig.json');
var exitOnError = require('yargs').argv.exitOnError;
let errorCount = 0;

gulp.task('compile', function() {
    
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .once("error", function() { 
            this.once("finish", () => {
                if (exitOnError) {
                    process.exit(1);
                }
            })}
        ).js        
        .pipe(sourcemaps.write(".", {sourceRoot: ""}))
        .pipe(gulp.dest('Tasks/authenticode-sign'));
});

gulp.task('build', ['compile'], function() {
    return gulp.src(['Tasks/common/*', '!Tasks/common/*.ts'])
        .pipe(gulp.dest('Tasks/authenticode-sign/'))
});

gulp.task('watch', ['build'], function() {
    gulp.watch(tsPaths.include, ['build']);
});