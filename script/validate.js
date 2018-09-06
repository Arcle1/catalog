// Import external modules
const config = require('./config.json');
const fs = require('fs-extra');
const glob = require('glob');
const schema = require('@linterhub/schema');
const JsonSchemaValidator = require('jsonschema').Validator;
const validator = new JsonSchemaValidator();

/**
 * Validation of all schemas
 * @param {string} mask - mask to get schemas
 */
const validate = (mask) => {
    glob.sync(mask).map((file) => {
        const json = JSON.parse(fs.readFileSync(file));
        const result = validator.validate(json, json.$schema);
        if (result.errors.length > 0) throw (new Error(result.errors));
    });
};

// Preload all validation schemas from package @linterhub/schema
const upload = () => {
    Object.keys(schema).map((name) => {
        validator.addSchema(schema[name], schema[name].$id);
    });
};

upload();
validate(config.build.schema);

