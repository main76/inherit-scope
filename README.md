# INHERIT JSON
Inheritable configurations with very simple design and usage.

**Does not support recursive inheritance.**

## Install
```
npm i https://github.com/main76/inherit-scope
```

### Dependency

js-yaml

## Usage
The 2nd parameter is optional, whose default value is `InputType.JSON_FILE`.

```javascript
const { InputType, createEntry } = require('inherit-scope');
const entry = createEntry(entryJsonPath, InputType.JSON_FILE);
```

### Supported Inputs
- JSON
- YAML
- Object
- Custom

### Samples
Please refer to the files under sub directory `samples`.

## Tests
```bash
npm run test
```

## TODOs
Add more samples:
- YAML.
- Object.
- Custom loader.
