'use strict';

// External modules as aliases
const core = global.lhcore;
const gulp = core.amd.gulp;
const registry = core.amd.registry;
const path = core.amd.path;
const through2 = core.amd.through2;
const File = core.amd.file;
const schema = core.amd.schema;

// Import functions
const bufferToJson = core.fnc.bufferToJson;
const jsonToBuffer = core.fnc.jsonToBuffer;

/**
 * Add in meta fields from schema such as schema uri, version and package uri
 * @param {object} meta - object with linter meta
 * @return {object} meta - object with linter meta & schema properties
 */
const getPackageSchema = (meta) => {
    return {
        $schema: schema.package.$id,
        $version: schema.package.$version,
        package: `${meta.name}:${meta.version}`,
        name: meta.name,
        description: meta.description,
        url: meta.url,
        license: meta.license,
        version: meta.version
    }
};

/**
 * Get array of objects, where each contains meta of linter and base & path where it will be stored
 * @return {array} obj - array of objects with data of linters
 */
const getMeta = () => {
    return through2.obj(async function (file, enc, next) {
        const packages = bufferToJson(file.contents);

        const manager = registry.getManager(packages.manager);
        let metaLinters = await Promise.all(
            packages.linters.map(async (lint) => {
                let meta = await manager.getMeta(lint);
                return getPackageSchema(meta);
            })
        );

        metaLinters.map(obj => {
            const base = path.join(file.path, obj.name);
            this.push(new File({
                base: base,
                path: path.join(base, 'package.json'),
                contents: jsonToBuffer(obj),
            }));
        });

        next();
    });
};

// Gulp build task
const build = () => gulp
    .src(core.cfg.src.linters)
    .pipe(getMeta())
    .pipe(gulp.dest((file) => {
        const content = bufferToJson(file.contents);
        return path.join(core.cfg.build.dir, content.name);
    }))
    .pipe(gulp.dest((file) => {
        const content = bufferToJson(file.contents);
        return path.join(core.cfg.build.dir, content.name, content.version);
    }));

// Tasks
gulp.task('build', build);
