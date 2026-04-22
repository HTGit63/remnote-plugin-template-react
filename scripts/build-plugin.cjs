const { spawnSync } = require('child_process');
const { rmSync } = require('fs');
const path = require('path');
const bestzip = require('bestzip');

const rootDir = path.resolve(__dirname, '..');

function runNodeScript(relativePath, args = [], env = {}) {
  const result = spawnSync(process.execPath, [path.join(rootDir, relativePath), ...args], {
    cwd: rootDir,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  runNodeScript('node_modules/typescript/bin/tsc');
  runNodeScript('node_modules/@remnote/plugin-sdk/scripts/index.js', ['validate']);

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
  process.exit(1);
});

