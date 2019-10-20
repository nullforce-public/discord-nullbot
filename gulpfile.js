"use strict";

const gulp = require("gulp");
const nodemon = require("gulp-nodemon");
const gulpSourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const tslint = require("gulp-tslint");
var tsProject = ts.createProject("tsconfig.json");

// Lint
gulp.task("lint", () => {
    // Use tslint with rules configured in tslint.json
    return gulp.src("./src/**/*.ts")
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report({
            summarizeFailureOutput: true
        }));
});

// Build
gulp.task("build", gulp.series("lint", () => {
    // source -> TypeScript -> dist
    return gulp.src("./src/**/*.ts")
        .pipe(gulpSourcemaps.init())
        .pipe(tsProject())
        .pipe(gulpSourcemaps.write("."))
        .pipe(gulp.dest("dist/"));
}));

// Test
gulp.task("test", gulp.series("build", () => {
    // TODO: implement tests
}));

// Watch
gulp.task("watch", gulp.series("build", () => {
    // Watch the TypeScript source files and recompile as needed
    gulp.watch("./src/**/*.ts", gulp.series("build"));
}));

// start
gulp.task("start", gulp.parallel("watch", () => {
    // Have nodemon watch for changes in dist and restart the bot as needed
    return nodemon({
        script: "./dist/index.js",
        watch: "./dist"
    });
}));
