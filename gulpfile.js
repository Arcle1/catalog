'use strict';

// Set global shared core
const lhcore = require('./script/gulp/index.js');
global.lhcore = lhcore;

// External modules as aliases
const gulpHub = require('gulp-hub');

// Load tasks into the registry of gulp

gulpHub([
    'script/gulp/**/task.*.js',
]);
