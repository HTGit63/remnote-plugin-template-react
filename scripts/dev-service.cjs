const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const pidPath = path.join(rootDir, '.remnote-dev-server.pid');
const logPath = path.join(rootDir, '.remnote-dev-server.log');
const devServerPath = path.join(rootDir, 'scripts', 'dev-server.cjs');
const defaultPort = Number(process.env.PORT || 8080);

function getInstallUrl(port = defaultPort) {
  return `http://localhost:${port}`;
}

function request(url, parseJson, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (response) => {
      if (!parseJson) {
        const statusCode = response.statusCode ?? 0;
        response.resume();
        response.on('end', () => resolve(statusCode));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({
            statusCode: response.statusCode ?? 0,
            json: body ? JSON.parse(body) : {},
          });
        } catch (error) {
          reject(new Error(`Invalid JSON from ${url}: ${error.message}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

function fetchJson(url) {
  return request(url, true);
}

function fetchStatus(url) {
  return request(url, false);
}

async function probeDevServer(options) {
  const port = options.port ?? defaultPort;
  const installUrl = getInstallUrl(port);
  const getJson = options.fetchJson ?? fetchJson;
  const getStatus = options.fetchStatus ?? fetchStatus;
  let manifest;

  try {
    manifest = await getJson(`${installUrl}/manifest.json`);
  } catch {
    return {
      status: 'stopped',
      message: 'RemNote dev server is stopped. Run: npm run dev:start',
    };
  }

  if (manifest.statusCode !== 200 || manifest.json?.id !== options.expectedPluginId) {
    return {
      status: 'port_conflict',
      message: `Port ${port} is serving another app. Stop it, then run: npm run dev:start`,
    };
  }

  const requiredAssets = [
    'bridge-status-sandbox.js',
    'bridge-status-sandbox.css',
  ];
  for (const asset of requiredAssets) {
    let statusCode = 0;
    try {
      statusCode = await getStatus(`${installUrl}/${asset}`);
    } catch {
      statusCode = 0;
    }
    if (statusCode !== 200) {
      return {
        status: 'asset_missing',
        message: `RemNote dev server is running, but ${asset} is missing. Check ${path.basename(logPath)}.`,
      };
    }
  }

  return {
    status: 'ready',
    message: `RemNote dev server ready: ${installUrl}`,
  };
}

function readPid() {
  try {
    const pid = Number(fs.readFileSync(pidPath, 'utf8').trim());
    return Number.isSafeInteger(pid) && pid > 1 ? pid : null;
  } catch {
    return null;
  }
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isOwnedDevServerCommand(commandLine, expectedRootDir = rootDir) {
  const expectedScript = path.join(expectedRootDir, 'scripts', 'dev-server.cjs');
  return commandLine.includes(expectedScript);
}

function processIsOwnedDevServer(pid) {
  if (process.platform !== 'linux') {
    return false;
  }
  try {
    const commandLine = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8');
    return isOwnedDevServerCommand(commandLine);
  } catch {
    return false;
  }
}

function removePidFile() {
  fs.rmSync(pidPath, { force: true });
}

function loadExpectedPluginId() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'public', 'manifest.json'), 'utf8')
  );
  if (typeof manifest.id !== 'string' || !manifest.id) {
    throw new Error('public/manifest.json has no plugin id.');
  }
  return manifest.id;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readLogTail(maxChars = 4000) {
  try {
    const log = fs.readFileSync(logPath, 'utf8');
    return log.slice(-maxChars).trim();
  } catch {
    return '';
  }
}

async function waitForReady(expectedPluginId, timeoutMs = 20000, shouldContinue = () => true) {
  const deadline = Date.now() + timeoutMs;
  let result = await probeDevServer({ expectedPluginId });
  while (
    Date.now() < deadline &&
    result.status !== 'ready' &&
    result.status !== 'port_conflict' &&
    shouldContinue()
  ) {
    await wait(250);
    result = await probeDevServer({ expectedPluginId });
  }
  return result;
}

async function startService(expectedPluginId) {
  const initial = await probeDevServer({ expectedPluginId });
  if (initial.status === 'ready') {
    console.log(initial.message);
    console.log('RemNote install URL: ' + getInstallUrl());
    return 0;
  }
  if (initial.status === 'port_conflict') {
    console.error(initial.message);
    return 1;
  }

  const existingPid = readPid();
  if (existingPid && processIsAlive(existingPid)) {
    if (!processIsOwnedDevServer(existingPid)) {
      console.error(`Refusing to reuse PID ${existingPid}: it is not this repository dev server.`);
      return 1;
    }
    const result = await waitForReady(expectedPluginId);
    console[result.status === 'ready' ? 'log' : 'error'](result.message);
    return result.status === 'ready' ? 0 : 1;
  }
  removePidFile();

  if (initial.status === 'asset_missing') {
    console.error(initial.message);
    console.error('A matching foreground server owns the port. Check its terminal or stop it first.');
    return 1;
  }

  const logFd = fs.openSync(logPath, 'a', 0o600);
  const child = spawn(process.execPath, [devServerPath], {
    cwd: rootDir,
    detached: true,
    env: { ...process.env, PORT: String(defaultPort) },
    stdio: ['ignore', logFd, logFd],
  });
  fs.closeSync(logFd);
  fs.writeFileSync(pidPath, `${child.pid}\n`, { mode: 0o600 });
  child.unref();

  const result = await waitForReady(
    expectedPluginId,
    20000,
    () => processIsAlive(child.pid)
  );
  if (result.status === 'ready') {
    console.log(result.message);
    console.log('RemNote install URL: ' + getInstallUrl());
    console.log('Server log: ' + logPath);
    return 0;
  }

  if (!processIsAlive(child.pid)) {
    removePidFile();
  }
  console.error(result.message);
  const tail = readLogTail();
  if (tail) {
    console.error(tail);
  }
  return 1;
}

async function stopService(expectedPluginId) {
  const pid = readPid();
  if (!pid) {
    const probe = await probeDevServer({ expectedPluginId });
    if (probe.status === 'ready') {
      console.error('Matching server is running without this service PID. Stop its foreground terminal.');
      return 1;
    }
    console.log('RemNote dev server already stopped.');
    return 0;
  }

  if (!processIsAlive(pid)) {
    removePidFile();
    console.log('Removed stale RemNote dev server PID file.');
    return 0;
  }
  if (!processIsOwnedDevServer(pid)) {
    console.error(`Refusing to stop PID ${pid}: it is not this repository dev server.`);
    return 1;
  }

  process.kill(pid, 'SIGTERM');
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && processIsAlive(pid)) {
    await wait(100);
  }
  if (processIsAlive(pid)) {
    console.error(`PID ${pid} did not stop. Check it manually; no force-kill was sent.`);
    return 1;
  }
  removePidFile();
  console.log('RemNote dev server stopped.');
  return 0;
}

async function main() {
  const command = process.argv[2] || 'status';
  const expectedPluginId = loadExpectedPluginId();
  let exitCode = 1;

  if (command === 'start') {
    exitCode = await startService(expectedPluginId);
  } else if (command === 'stop') {
    exitCode = await stopService(expectedPluginId);
  } else if (command === 'status' || command === 'doctor') {
    const result = await probeDevServer({ expectedPluginId });
    console[result.status === 'ready' ? 'log' : 'error'](result.message);
    if (result.status !== 'ready') {
      console.error('RemNote install URL must be exactly: ' + getInstallUrl());
      console.error('Do not add /manifest.json.');
    }
    exitCode = result.status === 'ready' ? 0 : 1;
  } else {
    console.error('Usage: node scripts/dev-service.cjs <start|status|doctor|stop>');
  }

  process.exitCode = exitCode;
}

module.exports = {
  getInstallUrl,
  isOwnedDevServerCommand,
  probeDevServer,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
