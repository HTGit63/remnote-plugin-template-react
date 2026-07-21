import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { TOOL_PERMISSIONS, validateMcpToolPermission } from './tool-permissions.js';
import { getAllPublicMcpToolNames } from './tool-registry.js';
import { clampToolProfile } from './tool-policy.js';
import type { AuthenticatedPrincipal } from './auth/types.js';

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

function mcpBody(tool: string, args: Record<string, unknown>) {
  return {
    method: 'tools/call',
    params: { name: tool, arguments: args },
  };
}

function scopePrincipal(
  authMode: 'local_bridge_token' | 'hosted_oauth',
  overrides: Partial<AuthenticatedPrincipal> = {}
): AuthenticatedPrincipal {
  return {
    subject: `boundary:${authMode}`,
    userId: 'boundary-user',
    authMode,
    scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write'],
    accessScope: 'current-rem-tree',
    trustedWriteMode: 'trusted-inside-scope',
    toolTier: 'danger',
    ...overrides,
  };
}

function failStage3(message: string): void {
  console.error(`Stage 3 permission boundary violation: ${message}`);
  process.exitCode = 1;
}

function stage3PermissionBoundaryViolations(): string[] {
  const violations: string[] = [];
  if (clampToolProfile('danger', 'mass_note_writer') !== 'mass_note_writer') {
    violations.push('request-selected danger tier exceeded approved mass_note_writer ceiling');
  }
  if (clampToolProfile('basic', 'developer') !== 'basic') {
    violations.push('safe request-selected lower tool tier was not preserved');
  }
  for (const toolName of getAllPublicMcpToolNames(true)) {
    if (!TOOL_PERMISSIONS[toolName]) {
      violations.push(`public tool ${toolName} has no explicit server permission policy`);
    }
  }
  for (const authMode of ['local_bridge_token', 'hosted_oauth'] as const) {
    const blocked = validateMcpToolPermission(
      mcpBody('get_rem', { remId: 'outside-current-tree' }),
      scopePrincipal(authMode, { accessScope: 'focused-rem-only' })
    );
    if (blocked.ok || blocked.code !== 'OUT_OF_SCOPE') {
      violations.push(`${authMode} did not block out-of-scope get_rem before plugin routing`);
    }
  }

  const missingTrustedWrite = validateMcpToolPermission(
    mcpBody('create_or_replace_note_from_markdown', {
      parentRemId: 'approved-root',
      markdownText: '# Boundary trusted write check',
      mode: 'create_child',
      safetyOptions: { dryRun: false },
    }),
    scopePrincipal('hosted_oauth', { scopeGrants: ['bridge:read', 'bridge:write'] })
  );
  if (missingTrustedWrite.ok || missingTrustedWrite.code !== 'TRUSTED_WRITE_REQUIRED') {
    violations.push('non-dry-run write without bridge:trusted_write was not blocked');
  }

  const underGuardedDelete = validateMcpToolPermission(
    mcpBody('delete_rem_by_id', {
      remId: 'delete-target',
      expectedParentId: 'delete-parent',
      confirmTitle: 'Delete target',
      dryRun: false,
      idempotencyKey: 'boundary-delete',
    }),
    scopePrincipal('hosted_oauth', {
      scopeGrants: ['bridge:read', 'bridge:write', 'bridge:trusted_write', 'bridge:delete'],
    })
  );
  if (underGuardedDelete.ok || underGuardedDelete.code !== 'INVALID_ARGS') {
    violations.push('real delete without prior dry-run, ancestor, and title guard set was not blocked');
  }

  for (const bulkTool of ['run_note_import_job_step', 'resume_note_import_job']) {
    const untrustedBulkWrite = validateMcpToolPermission(
      mcpBody(bulkTool, { jobId: 'other-session-job' }),
      scopePrincipal('hosted_oauth', {
        scopeGrants: ['bridge:read', 'bridge:write'],
        trustedWriteMode: 'ask-every-write',
      })
    );
    if (untrustedBulkWrite.ok || untrustedBulkWrite.code !== 'TRUSTED_WRITE_REQUIRED') {
      violations.push(`${bulkTool} did not require explicit trusted-write authority`);
    }
  }

  const connectorCompatWrite = validateMcpToolPermission(
    mcpBody('create_or_replace_note_from_markdown', {
      parentRemId: 'compat-root',
      markdownText: '# Must remain blocked',
      mode: 'create_child',
      safetyOptions: { dryRun: false },
    }),
    {
      subject: 'connector-compat',
      userId: '__connector_compat__',
      authMode: 'connector_compat_noauth',
      scopeGrants: ['bridge:read'],
      accessScope: 'current-rem-tree',
      trustedWriteMode: 'ask-every-write',
      toolTier: 'developer',
    }
  );
  if (connectorCompatWrite.ok || connectorCompatWrite.code !== 'INSUFFICIENT_SCOPE') {
    violations.push('connector compatibility no-auth principal could write');
  }

  const missingPolicy = validateMcpToolPermission(
    mcpBody('future_unclassified_write_tool', {}),
    scopePrincipal('hosted_oauth')
  );
  if (missingPolicy.ok || missingPolicy.code !== 'PERMISSION_POLICY_MISSING') {
    violations.push('unclassified tool call did not fail closed at server permission seam');
  }

  return violations;
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
for (const violation of stage3PermissionBoundaryViolations()) {
  failStage3(violation);
}

if (!process.exitCode) {
  console.log('Boundary smoke passed.');
}
