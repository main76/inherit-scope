const Strategy = require('./strategy');
const { DEFAULT_SCOPE_NAME, InputLoaders, InputType } = require('./loader');

/**
 * @template T
 * @typedef {Entry<T>} Entry<T>
 */

/**
 * @template dType
 */
class Entry {
  /**
   * @type {dType}
   */
  #default = {};
  /**
   * @type {{[scope: string]: Strategy<dType>}}
   */
  #scopes = {};
  /**
   * @type {Set<string>}
   */
  #visiting = new Set();

  /**
   * @param {import('./loader').EntryObject<dType>} entryObject
   * @param {import('./loader').Loader<import('./strategy').StrategyObject<dType>>} loader
   */
  constructor(entryObject, loader) {
    if (entryObject == null || loader == null) {
      throw new Error('arugument entryObject or loader is null');
    }

    this.#default = entryObject.default;

    for (const scope of entryObject.scopes) {
      const strategyObj = loader(scope);
      if (strategyObj == null) {
        throw new Error('failed to load strategy for scope: ' + scope);
      }
      this.setScope(scope, new Strategy(strategyObj, this));
    }
  }

  get default() {
    return this.#default;
  }

  /**
   * @param {string} name
   * @param {Strategy<dType>} strategy
   */
  value(name) {
    if (name == DEFAULT_SCOPE_NAME || !(name in this.#scopes)) {
      return this.#default;
    }
    if (this.#visiting.has(name)) {
      this.#visiting.clear();
      throw new Error("circular reference!")
    }
    const strategy = this.#scopes[name];
    this.#visiting.add(name);
    const value = strategy.value;
    this.#visiting.delete(name);

    return value;
  }

  /**
   * @param {string} name
   * @param {Strategy<dType>} strategy
   */
  setScope(name, strategy) {
    this.#scopes[name] = strategy;
  }

  /**
   * @param {string} name
   */
  unsetScope(name) {
    delete this.#scopes[name];
  }
};

/**
 * @template dType
 * @param {import('./loader').InputType} inputType 
 * @param {any} arugument 
 * @param {import('./loader').LoaderWrapper<dType>} customLoaderWrapper
 * 
 * @returns {Entry<dType>}
 */
function createEntry(aruguments, inputType = InputType.JSON_FILE, customLoaderWrapper = null) {
  const loaderWrapper = inputType == InputType.CUSTOM 
    ? customLoaderWrapper : InputLoaders[inputType];
  if (loaderWrapper == null) {
    throw new Error('loader is null');
  }
  
  return new Entry(...loaderWrapper(aruguments))
}

module.exports = {
  InputType,
  createEntry
};
