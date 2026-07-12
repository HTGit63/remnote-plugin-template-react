const { spawnSync } = require('child_process');
const { copyFileSync, existsSync, rmSync } = require('fs');
const path = require('path');
const bestzip = require('bestzip');

const rootDir = path.resolve(__dirname, '..');
let temporaryReadmePath = null;

function runNodeScript(relativePath, args = [], env = {}) {
  const result = spawnSync(process.execPath, [path.join(rootDir, relativePath), ...args], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    const error = new Error(`${relativePath} failed with exit code ${result.status ?? 1}`);
    error.exitStatus = result.status ?? 1;
    throw error;
  }
}

function ensureTemporaryReadmeForSdkValidation() {
  const readmePath = path.join(rootDir, 'README.md');
  if (existsSync(readmePath)) {
    return;
  }

  copyFileSync(path.join(rootDir, 'docs', 'engineering-guide.md'), readmePath);
  temporaryReadmePath = readmePath;
}

function cleanupTemporaryReadme() {
  if (!temporaryReadmePath) {
    return;
  }

  rmSync(temporaryReadmePath, { force: true });
  temporaryReadmePath = null;
}

async function main() {
  const validateOnly = process.argv.includes('--validate-only');
  if (!validateOnly) {
    runNodeScript('node_modules/typescript/bin/tsc');
  }

  try {
    ensureTemporaryReadmeForSdkValidation();
    runNodeScript('node_modules/@remnote/plugin-sdk/scripts/index.js', ['validate']);
  } finally {
    cleanupTemporaryReadme();
  }

  if (validateOnly) {
    return;
  }

  rmSync(path.join(rootDir, 'dist'), { force: true, recursive: true });
  rmSync(path.join(rootDir, 'PluginZip.zip'), { force: true });

  runNodeScript('node_modules/webpack/bin/webpack.js', ['--color', '--progress'], {
    NODE_ENV: 'production',
  });

  await bestzip({
    cwd: path.join(rootDir, 'dist'),
    destination: '../PluginZip.zip',
    source: ['*'],
  });

  console.log('Plugin zip written to PluginZip.zip');
}

main().catch((error) => {
  console.error(error);
  process.exit(error.exitStatus ?? 1);
});
