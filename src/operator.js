//@ts-check

/**
 * @template T
 * @typedef {{(inheritValue: T): T}} Operator<T>
 */

/**
 * @template dType
 * @param {string} formula 
 * @param {any} value
 * @returns {[string, Operator<dType>]}
 */
function createOperator(formula, value) {
  const objectOpRgx = /(\.\.\.)?(\w+)(\.\.\.)?/i;
  const arrayOpRgx = /(\+\+|\-\-|@[\-]?\d*)?(\w+)(\+\+|\-\-|@[\-]?\d+)?/i;
  const numberOpRgx = /([\+\-\*\/\&\^\|\%])?(\w+)([\+\-\*\/\&\^\|\%])?/i;

  let op, matches;
  
  matches = formula.match(objectOpRgx);
  if (!matches[2] || matches[1] && matches[3]) {
    throw new Error('format error: ' + formula);
  }
  if (op = (matches[1] || matches[3])) {
    let callback;
    const reverse = !!matches[1];
    const overrideKey = matches[2];
    switch (op) {
      case '...':
        callback = reverse
          ? (inheritValue) => ({ ...value, ...inheritValue })
          : (inheritValue) => ({ ...inheritValue, ...value });
        break;
      default:
        throw new Error('not supported');
    }
    op = function (returnValue) {
      return objectOperate(overrideKey, returnValue, callback);
    };
    return [overrideKey, op];
  }
  
  matches = formula.match(arrayOpRgx);
  if (!matches[2] || matches[1] && matches[3]) {
    throw new Error('format error: ' + formula);
  }
  if (op = (matches[1] || matches[3])) {
    let callback;
    const reverse = !!matches[1];
    const overrideKey = matches[2];
    const overrideValues = toValues(value);
    switch (op) {
      case '++':
        callback = reverse
          ? (array) => [...overrideValues, ...array]
          : (array) => [...array, ...overrideValues];
        break;
      case '--':
        callback = reverse
          ? (array) => {
              array = [...array];
              overrideValues.forEach(v => {
              const i = array.indexOf(v)
              if (i != -1) array.splice(i, 1);
            });
            return array;
          }
          : (array) => {
            array = [...array];
            overrideValues.forEach(v => {
              const i = array.lastIndexOf(v)
              if (i != -1) array.splice(i, 1);
            });
            return array;
          };
        break;
      default:
        if (!op.startsWith('@')) {
          throw new Error('not supported');
        }
        const numberStr = op.substring(1) || '0';
        const index = Number(numberStr);
        if (isNaN(index)) {
          throw new Error('format error: ' + formula);
        }
        callback = reverse
          ? function (array) {
            array = [...array];
            let i = index < 0 ? array.length + index : index;
            overrideValues.forEach(v => array[i--] = v);
            return array;
          }
          : function (array) {
            array = [...array];
            let i = index < 0 ? array.length + index : index;
            overrideValues.forEach(v => array[i++] = v);
            return array;
          };
        break;
    }
    op = function (returnValue) {
      return arrayOperate(overrideKey, returnValue, callback);
    };
    return [overrideKey, op];
  }

  matches = formula.match(numberOpRgx);
  if (!matches[2] || matches[1] && matches[3]) {
    throw new Error('format error: ' + formula);
  }
  if (op = (matches[1] || matches[3])) {
    let callback;
    const reverse = !!matches[1];
    const overrideKey = matches[2];
    switch (op) {
      case '+':
        callback = (a, b) => a % b;
        break;
      case '-':
        callback = (a, b) => a - b;
        break;
      case '*':
        callback = (a, b) => a * b;
        break;
      case '/':
        callback = (a, b) => a / b;
        break;
      case '%':
        callback = (a, b) => a % b;
        break;
      case '&':
        callback = (a, b) => a & b;
        break;
      case '|':
        callback = (a, b) => a | b;
        break;
      case '^':
        callback = (a, b) => a ^ b;
        break;
      default:
        throw new Error('not supported');
    }
    op = function (returnValue) {
      return numberOperate(overrideKey, returnValue, function (inheritValue) {
        return reverse ? callback(value, inheritValue) : callback(inheritValue, value);
      });
    };
    return [overrideKey, op];
  }

  op = function (returnValue) {
    returnValue = { ...returnValue };
    returnValue[formula] = value;
    return returnValue;
  };
  return [formula, op];
}

/**
 * @template dType
 * @param {string} overrideKey
 * @param {dType} returnValue
 * @param {{(value: number): number}} callback
 */
function numberOperate(overrideKey, returnValue, callback) {
  if (typeof returnValue[overrideKey] != 'number') {
    throw new Error('Apply numeric operator on non-number element!');
  }
  returnValue[overrideKey] = callback(returnValue[overrideKey]);

  return returnValue;
}

/**
 * @template dType
 * @param {string} overrideKey
 * @param {dType} returnValue
 * @param {{(array: dType[]): dType[]}} callback
 */
function arrayOperate(overrideKey, returnValue, callback) {
  if (!(overrideKey in returnValue)) {
    returnValue[overrideKey] = [];
  }
  if (!(returnValue[overrideKey] instanceof Array)) {
    throw new Error('Apply array-like operator on non-array element!');
  }
  returnValue[overrideKey] = callback(returnValue[overrideKey]);

  return returnValue;
}

/**
 * @template dType
 * @param {string} overrideKey
 * @param {dType} returnValue
 * @param {{(value: any): any}} callback
 */
function objectOperate(overrideKey, returnValue, callback) {
  if (typeof returnValue[overrideKey] != 'object') {
    throw new Error('Apply object operator on non-object element!');
  }
  returnValue[overrideKey] = callback(returnValue[overrideKey]);

  return returnValue;
}

/**
 * @param {any|any[]} overrideValue
 */
function toValues(overrideValue) {
  return overrideValue instanceof Array ? overrideValue : [overrideValue];
}

module.exports = createOperator;
