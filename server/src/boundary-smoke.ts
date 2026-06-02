import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = join(process.cwd(), '..');
const remnotePluginSdkSpec = ['@remnote', 'plugin-sdk'].join('/');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const output: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
      output.push(...walk(path));
    } else if (/\.(ts|tsx|js)$/.test(entry)) {
      output.push(path);
    }
  }
  return output;
}

function rel(path: string): string {
  return relative(repoRoot, path).replace(/\\/g, '/');
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function failIf(matches: string[], title: string) {
  if (!matches.length) return;
  console.error(title);
  for (const match of matches) {
    console.error(`- ${match}`);
  }
  process.exitCode = 1;
}

function importSpecifiers(source: string): string[] {
  const specs: string[] = [];
  const patterns = [
    /import\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /export\s+(?:type\s+)?(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      specs.push(match[1]);
    }
  }
  return specs;
}

function sourceImportViolations() {
  const serverFiles = walk(join(repoRoot, 'server/src'));
  const sharedFiles = walk(join(repoRoot, 'shared'));
  const pluginFiles = walk(join(repoRoot, 'src'));
  const violations: string[] = [];

  for (const file of serverFiles) {
    const specs = importSpecifiers(read(file));
    for (const spec of specs) {
      if (
        spec.includes('/src/remnote') ||
        spec.includes('/src/widgets') ||
        spec.includes('/src/bridge/client') ||
        spec.includes('/src/bridge/handlers') ||
        spec.includes('/src/bridge/pairing') ||
        spec === remnotePluginSdkSpec ||
        spec === 'react'
      ) {
        violations.push(`${rel(file)} imports forbidden server dependency ${spec}`);
      }
    }
  }

  for (const file of sharedFiles) {
    const specs = importSpecifiers(read(file));
    for (const spec of specs) {
      if (
        spec === remnotePluginSdkSpec ||
        spec === 'react' ||
        spec.includes('/server/src') ||
        spec.startsWith('../server') ||
        spec.startsWith('../../server')
      ) {
        violations.push(`${rel(file)} imports forbidden shared dependency ${spec}`);
      }
    }
  }

  for (const file of pluginFiles) {
    const specs = importSpecifiers(read(file));
    for (const spec of specs) {
      if (spec.includes('/server/src') || spec.startsWith('../server') || spec.startsWith('../../server')) {
        violations.push(`${rel(file)} imports forbidden server dependency ${spec}`);
      }
    }
  }

  return violations;
}

function distViolations() {
  const distRoot = join(repoRoot, 'server/dist');
  if (!existsSync(distRoot)) return [];
  return walk(distRoot)
    .map(rel)
    .filter((path) =>
      path.includes('server/dist/src/remnote/') ||
      path.includes('server/dist/src/widgets/') ||
      path.includes('server/dist/src/bridge/client.') ||
      path.includes('server/dist/src/bridge/handlers.') ||
      path.includes('server/dist/src/bridge/pairing.')
    );
}

function localEsmImportViolations() {
  const distRoot = join(repoRoot, 'server/dist');
  if (!existsSync(distRoot)) return [];
  const violations: string[] = [];
  
  const coreJs = join(distRoot, 'shared/bridge/protocol-core.js');
  if (!existsSync(coreJs)) {
    violations.push('server/dist/shared/bridge/protocol-core.js is missing');
  }

  const files = walk(distRoot).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const content = read(file);
    const specs = importSpecifiers(content);
    for (const spec of specs) {
      if (spec.startsWith('.')) {
        if (!spec.endsWith('.js') && !spec.endsWith('.json')) {
          violations.push(`${rel(file)} has extensionless local ESM import: "${spec}"`);
        }
      }
    }
  }
  return violations;
}

failIf(sourceImportViolations(), 'Boundary source import violations:');
failIf(distViolations(), 'Boundary server/dist plugin runtime violations:');
failIf(localEsmImportViolations(), 'ESM runtime import violations:');

if (!process.exitCode) {
  console.log('Boundary smoke passed.');
}
