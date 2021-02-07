//@ts-check

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/** 
 * @template T
 * @typedef {import('./strategy').StrategyObject<T>} StrategyObject<T>
 */

/**
 * @template dType
 * @typedef {object} EntryObject
 * @property {dType} default
 * @property {string[]} scopes
 */

/** 
 * @template dType
 * @typedef {{(scope: string): dType}} Loader
 * @typedef {{(aruguments: any): [
 *  EntryObject<dType>, 
 *  Loader<StrategyObject<dType>>
 * ]}} LoaderWrapper
 */

/**
 * @readonly
 * @enum {number}
 */
const InputType = {
  JSON_FILE: 0,
  YAML_FILE: 1,
  OBJECT: 2,
  CUSTOM: 3
};

const DEFAULT_SCOPE_NAME = 'default';
const SCOPES_PROP_NAME = 'scopes';

/**
 * @template dType
 * @type {{[type: number]: LoaderWrapper<dType>}}
 */
const InputLoaders = {
  [InputType.JSON_FILE]: json_loaderWrapper,
  [InputType.YAML_FILE]: yaml_loaderWrapper,

  [InputType.OBJECT]: object_loaderWrapper,
};

/**
 * @template dType
 * @param {string} entryPath 
 * @param {{(filePath: string): any}} loader 
 * @returns {[EntryObject<dType>, Loader<StrategyObject<dType>>]}
 */
function file_loaderWrapper(entryPath, loader) {
  if (!path.isAbsolute(entryPath)) {
    entryPath = path.join(process.cwd(), entryPath);
  }

  const entryObject = loader(entryPath);
  
  if (!(DEFAULT_SCOPE_NAME in entryObject)) {
    console.error(`Cannot find the ${DEFAULT_SCOPE_NAME}!`);
    entryObject[DEFAULT_SCOPE_NAME] = {};
  }

  if (!(SCOPES_PROP_NAME in entryObject)) {
    console.error(`Cannot find the ${SCOPES_PROP_NAME}!`);
    entryObject[SCOPES_PROP_NAME] = [];
  }
  
  const scopeMap = {};
  const scopes = entryObject[SCOPES_PROP_NAME];
  for (const [scopeName, scopePath] of scopes.map(resolve(entryPath))) {
    scopeMap[scopeName] = scopePath;
  }
  
  /**
   * @type {Loader<any>}
   */
  function file_loader(scope) {
    return loader(scopeMap[scope]);
  }

  return [{
    [DEFAULT_SCOPE_NAME]: entryObject[DEFAULT_SCOPE_NAME],
    [SCOPES_PROP_NAME]: Object.keys(scopeMap)
  }, file_loader];
}

/**
 * @template dType
 * @type {LoaderWrapper<dType>}
 */
function json_loaderWrapper(entryPath) {
  return file_loaderWrapper(entryPath, require);
}

/**
 * @template dType
 * @type {LoaderWrapper<dType>}
 */
function yaml_loaderWrapper(entryPath) {
  return file_loaderWrapper(entryPath, function (fullPath) {
    const stringContent = fs.readFileSync(fullPath, 'utf8');
    return yaml.load(stringContent);
  });
}

/**
 * @param {string} currentFile
 */
function resolve(currentFile) {
  const currentDir = path.dirname(currentFile);
  const extname = path.extname(currentFile);
  /**
   * @param {string} include
   */
  function resolver(include) {
    try {
      const [name, target] = include;
      if (!name) {
        throw new Error('name is null');
      }
      if (!target) {
        return [name, path.join(currentDir, name + extname)];
      }
      if (path.isAbsolute(target)) return [name, target];
      return [name, path.resolve(currentDir, target)];
    }
    catch (error) {
      throw new Error(`parse property includes failed in file [${currentFile}], inner exception: ${error.message}`);
    }
  }
  return resolver;
}

/**
 * @template dType
 * @type {LoaderWrapper<dType>}
 */
function object_loaderWrapper(object) {
  if (object == null) {
    throw new Error('arugument object is null');
  }
  if (typeof object != 'object') {
    throw new Error('not an object');
  }
  if (object.data == null && object.scopes && object.scopes.length) {
    throw new Error('object.data is null');
  }
  function object_loader(scope) {
    return object.data[scope];
  };
  return [{
    [DEFAULT_SCOPE_NAME]: object[DEFAULT_SCOPE_NAME],
    [SCOPES_PROP_NAME]: object[SCOPES_PROP_NAME] || []
  }, object_loader];
}

module.exports = {
  DEFAULT_SCOPE_NAME,
  InputLoaders,
  InputType
};
