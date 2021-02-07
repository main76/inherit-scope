//@ts-check

/**
 * @template dType
 * @typedef {object} StrategyObject
 * @property {dType} overrides
 * @property {string[]} inherits
 */

/**
 * @template T
 * @typedef {import('./entry').Entry<T>} Entry<T>
 */

/** 
 * @template T
 * @typedef {import('./operator').Operator<T>} Operator<T>
 */

const createOperator = require('./operator');

/**
 * @template dType
 */
class Strategy {
  /**
   * @type {{[key: string]: Operator<dType>}}
   */
  #overrides;
  /**
   * @type {string[]}
   */
  #inherits;
  /**
   * @type {Entry<dType>}
   */
  #entry;

  /**
   * @param {StrategyObject<dType>} sobj
   * @param {Entry<dType>} entry
   */
  constructor(sobj, entry) {
    this.#overrides = {};
    for (const formula in sobj.overrides) {
      const [overrideKey, operator] = createOperator(formula, sobj.overrides[formula]);
      this.#overrides[overrideKey] = operator;
    }
    this.#inherits = sobj.inherits || [];
    this.#entry = entry;
  }

  get overrides() {
    return this.#overrides;
  }

  get inherits() {
    return this.#inherits;
  }

  /**
   * @type {dType}
   */
  get value() {
    let returnValue = { ...this.#entry.default };
    for (const inherit of this.#inherits) {
      Object.assign(returnValue, this.#entry.value(inherit));
    }
    for (const overrideKey in this.#overrides) {
      const operator = this.#overrides[overrideKey];
      returnValue = operator(returnValue);
    }
    return returnValue;
  }
};

module.exports = Strategy;
