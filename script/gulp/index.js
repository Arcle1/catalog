'use strict';

// Shared configuration
const cfg = require('./config.json');

// Shared node modules
const amd = {
    gulp: require('gulp'),
    gulpData: require('gulp-data'),
    registry: require('@linterhub/registry'),
    path: require('path'),
    fs: require('path'),
    through2: require('through2'),
    file: require('vinyl'),
    schema: require('@linterhub/schema'),
};

// Shared functions
const fnc = {
    readJson: (path) => JSON.parse(amd.fs.readFileSync(path)),
    jsonToBuffer: (json) => Buffer.from(JSON.stringify(json), 'utf8'),
    bufferToJson: (buffer) => JSON.parse(buffer.toString('utf8')),
};

// Exported shared config, modules and functions
module.exports = {
    cfg: cfg,
    amd: amd,
    fnc: fnc,
};
