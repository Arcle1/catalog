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
 * Get versions of linter from linters file
 * @param {object} lint - linter from linters file
 * @param {string} manager - package manager (npm, pip, etc.)
 * @return {array} - list of versions
 */
const getVersions = async (lint, manager) => {
    if (!lint.version) return await manager.getVersions(lint.name);
    return lint.version === 'latest' ? [] :
        Array.isArray(lint.version) ? lint.version : [lint.version];
};

/**
 * Get meta for all linters & all versions from linters file
 * @param {stream} file - stream from linters file
 * @return {array} - two-dimensional array with linters meta
 */
const getMeta = (file) => {
    const packages = bufferToJson(file.contents);
    const manager = registry.getManager(packages.manager);
    return Promise.all(
        packages.linters.map(async (lint) => {
            const versions = await getVersions(lint, manager);
            if (versions.length === 0) {
                const meta = await manager.getMeta(lint.name);
                return [getPackageSchema(meta)];
            }
            return Promise.all(versions.map(async (version) => {
                const meta = await manager.getMeta(lint.name, version);
                return getPackageSchema(meta);
            }));
        })
    );
};

/**
 * Get array of objects, where each contains meta of linter and base & path where it will be stored
 * @return {array} obj - array of objects with data of linters
 */
const getFiles = () => {
    return through2.obj(async function (file, enc, next) {

        let metaLinters = await getMeta(file);
        metaLinters.map(obj => {
            obj.map((elem) => {
                const base = path.join(file.path, elem.name);
                this.push(new File({
                    base: base,
                    path: path.join(base, 'package.json'),
                    contents: jsonToBuffer(elem),
                }));
            })
        });

        next();
    });
};

// Gulp build task
const build = () => gulp
    .src(core.cfg.src.linters)
    .pipe(getFiles())
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
