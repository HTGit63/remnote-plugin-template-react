const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 8080);
const manifestPath = path.join(rootDir, 'public', 'manifest.json');
const manifestUrl = `http://127.0.0.1:${port}/manifest.json`;
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function loadLocalManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function canListen(targetPort) {
  return new Promise((resolve) => {
    const server = http.createServer();

    server.once('error', (error) => {
      if (error && error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      resolve(error);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(targetPort, '127.0.0.1');
  });
}

function fetchJson(url, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      const chunks = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            statusCode: response.statusCode ?? 0,
            json: body ? JSON.parse(body) : {},
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Timed out after ${timeoutMs}ms`));
    });

    request.on('error', reject);
  });
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[extension] || 'application/octet-stream';
  response.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'baggage, sentry-trace',
    'Content-Type': contentType,
  });
  fs.createReadStream(filePath).pipe(response);
}

function createStaticServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/manifest.json' : url.pathname);
    const safeRelativePath = pathname.replace(/^\/+/, '');
    const filePath = path.resolve(distDir, safeRelativePath);

    if (!filePath.startsWith(distDir)) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        response.writeHead(404, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/plain; charset=utf-8',
        });
        response.end(`Not found: ${pathname}`);
        return;
      }

      sendFile(response, filePath);
    });
  });
}

async function main() {
  const localManifest = loadLocalManifest();
  const portCheck = await canListen(port);

  if (portCheck instanceof Error) {
    console.error(`Failed to check port ${port}: ${portCheck.message}`);
    process.exit(1);
  }

  if (!portCheck) {
    try {
      const response = await fetchJson(manifestUrl);
      if (response.statusCode === 200 && response.json?.id === localManifest.id) {
        console.log(`A matching RemNote dev server is already running at http://localhost:${port}.`);
        console.log('Reuse that server, or stop it first if you want a fresh watcher.');
        process.exit(0);
      }

      console.error(`Port ${port} is already in use by another service.`);
      console.error(`Free http://localhost:${port} and run npm run dev again.`);
      process.exit(1);
    } catch (error) {
      console.error(`Port ${port} is already in use, and the existing service did not answer ${manifestUrl}.`);
      console.error('Stop the process using port 8080, then run npm run dev again.');
      console.error('Windows help: netstat -ano | findstr :8080');
      process.exit(1);
    }
  }

  console.log(`Starting RemNote watch build + static server at http://localhost:${port}`);

  const child = spawn(
    process.execPath,
    [
      path.join(rootDir, 'node_modules', 'webpack', 'bin', 'webpack.js'),
      '--watch',
      '--color',
    ],
    {
      cwd: rootDir,
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'inherit',
    }
  );

  child.on('error', (error) => {
    console.error(`Failed to start webpack watcher: ${error.message}`);
    process.exit(1);
  });

  const server = createStaticServer();

  server.listen(port, '127.0.0.1', () => {
    console.log(`Serving dist files from ${distDir}`);
    console.log('Use http://localhost:' + port + ' in RemNote. No /manifest.json.');
    console.log('Wait for first webpack compile before loading plugin.');
  });

  const shutdown = () => {
    server.close(() => {});
    if (!child.killed) {
      child.kill();
    }
  };

  process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
  });

  child.on('close', (code) => {
    server.close(() => {});
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
