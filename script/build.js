// Import external modules
const config = require('./config.json');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const registry =  require('@linterhub/registry');
const schema = require('@linterhub/schema');

/**
 * Add in deps fields from schema such as schema uri, version and package uri
 * @param {object} deps - object with linter deps
 * @param {object} meta - package object from package.json
 * @return {object} - object with linter deps & schema properties
 */
const getDepsSchema = (deps, meta) => {
    return {
        $schema: schema.deps.$id,
        $version: schema.deps.$version,
        package: meta.package,
        name: meta.name,
        version: meta.version,
        dependency: deps,
    }
};

/**
 * Add in meta fields from schema such as schema uri, version and package uri
 * @param {object} data - object with linter data
 * @param {string} manager - name of package manager (npm, pip, etc.)
 * @return {object} meta - object with linter meta & schema properties
 */
const getMetaSchema = (data, manager) => {
    return {
        $schema: schema.package.$id,
        $version: schema.package.$version,
        package: `https://hub.linterhub.com/${data.name}/${data.version}/package.json`,
        name: data.name,
        description: data.description,
        url: data.url,
        license: data.license,
        version: data.version,
        manager: manager
    }
};

/**
 * Create package directory
 * @param {string} name - name of package
 * @param {string} version - version of package
 * @return {string} folder - folder
 */
const mkPackageDir = (name, version = '') => {
    const folder =  path.join(config.build.dir, name, version);
    fs.mkdirsSync(folder);
    return folder;
};

/**
 * Write file with schema for package
 * @param {string} folder - folder to write
 * @param {string} fileName - name of schema
 * @param {object} content - JSON-schema for package
 */
const writeFile = (folder, fileName, content) => {
    fs.writeFileSync(path.join(folder, fileName), JSON.stringify(content, null, 4));
};

/**
 * Get versions of linter from linters file
 * @param {object} linter - linter from linters file
 * @param {string} manager - package manager (npm, pip, etc.)
 * @return {array} - list of versions
 */
const getVersions =  async (linter, manager) => {
    const versions = await manager.getVersions(linter.name);
    return linter.version === 'latest' ? [versions[versions.length - 1]] :
            !linter.version ? versions : Array.isArray(linter.version)
                ? linter.version : [linter.version];
};

// Run build
const run = () => {
    try {
        fs.removeSync(path.join(config.build.dir));
        glob.sync(config.src.linters).map(async (file) => {
            const json = JSON.parse(fs.readFileSync(file));
            const manager = registry.getManager(json.manager);
            await json.linters.map(async (linter) => {
                const versions = await getVersions(linter, manager);
                await versions.map(async (version) => {
                    const metaData = await manager.getMeta(linter.name, version);
                    const depsData = await manager.getDeps(linter.name, version);

                    const metaSchema = getMetaSchema(metaData, json.manager);
                    const depsSchema = getDepsSchema(depsData, metaSchema);

                    const linterDir = mkPackageDir(linter.name);
                    const linterVersionDir = mkPackageDir(linter.name, version);

                    writeFile(linterVersionDir, config.schemas.package, metaSchema);
                    writeFile(linterVersionDir, config.schemas.deps, depsSchema);

                    const lastVersion = versions[versions.length - 1];
                    if (metaSchema.version === lastVersion) {
                        writeFile(linterDir, config.schemas.package, metaSchema);
                        writeFile(linterDir, config.schemas.deps, depsSchema);
                    }
                });
            });
        });
    } catch (error) {
        console.log(`ERROR: ${error}`);
    }
};

run();
