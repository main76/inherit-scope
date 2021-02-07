const { InputType, createEntry } = require('../src/entry');
const path = require('path');

if (require.main == module) {
  const entryJsonPath = path.join(__dirname, 'sep', 'index.json');
  const entry = createEntry(entryJsonPath, InputType.JSON_FILE);

  const testCases = [
    test_load,
    test_general_inherit,
    test_number_bitwise,
    test_extend_obj,
    test_array_append,
    test_array_set
  ];

  let nSuccess = 0;
  for (const testCase of testCases) {
    const success = testCase(entry);
    console.log(testCase.name, success);
    success && nSuccess++;
  }

  console.log('overall status: %d/%d', nSuccess, testCases.length);
}

/**
 * @typedef {object} TestObject
 * @property {string} author
 * @property {string[]} collaborators
 * @property {number} flag
 * @property {{happy: boolean, fun: boolean}} magic
 */

/**
 * @param {Entry<TestObject>} entry 
 */
function test_load(entry) {
  try {
    return entry.value('pr') != entry.default;
  }
  catch {
    return false;
  }
}

/**
 * @param {Entry<TestObject>} entry 
 */
function test_general_inherit(entry) {
  try {
    return entry.value('initial').author == 'master76';
  }
  catch {
    return false;
  }
}

/**
 * @param {Entry<TestObject>} entry 
 */
function test_number_bitwise(entry) {
  try {
    if (entry.value('pr').flag != (0 & 65535 ^ 65521)) {
      return false;
    }
    return true;
  }
  catch {
    return false;
  }
}

/**
 * @param {Entry<TestObject>} entry 
 */
function test_extend_obj(entry) {
  try {
    const oldKeys = Object.keys(entry.default.magic);
    const newKeys = Object.keys(entry.value('main').magic);
    if (oldKeys.length != 1) {
      throw new Error('bad test data')
    }
    if (newKeys.length != 2 || !newKeys.includes('fun') || !newKeys.includes('happy')) {
      return false;
    }
    return true;
  }
  catch {
    return false;
  }
}

/**
 * @param {Entry<TestObject>} entry 
 */
function test_array_append(entry) {
  try {
    const collaborators = entry.value('main').collaborators
    if (collaborators.length != 3) {
      return false;
    }
    if (collaborators[0] == entry.default.collaborators[0]
      && collaborators[1] == 'but' && collaborators[2] == 'you') {
      return true;
    }
    return false;
  }
  catch {
    return false;
  }
}

/**
 * @param {Entry<TestObject>} entry 
 */
function test_array_set(entry) {
  try {
    const collaborators = entry.value('initial').collaborators
    if (collaborators.length != 1 || collaborators[0] != 'chairman') {
      return false;
    }
    return true;
  }
  catch {
    return false;
  }
}
