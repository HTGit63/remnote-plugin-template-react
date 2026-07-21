const childProcess = require('node:child_process');
const path = require('node:path');

const pluginRoot = path.resolve(__dirname, '..');
const originalExecSync = childProcess.execSync;

childProcess.execSync = (command, options) => {
  if (command === 'git rev-parse --show-toplevel') {
    const output = `${pluginRoot}\n`;
    return options?.encoding ? output : Buffer.from(output);
  }
  if (command === 'git remote -vv') {
    return options?.encoding ? '' : Buffer.alloc(0);
  }
  return originalExecSync(command, options);
};

require('../node_modules/@remnote/plugin-sdk/scripts/index.js');
