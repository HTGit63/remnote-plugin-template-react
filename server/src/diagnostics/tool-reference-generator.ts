import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_TOOL_PROFILE,
  TOOL_METADATA,
  TOOL_SCHEMA_VERSION,
  getToolTierSummary,
} from '../tool-policy.js';
import {
  SERVER_VERSION,
  TOOL_REGISTRY_VERSION,
  getHiddenMcpTools,
  getPublicMcpToolNames,
  getToolRegistrySummary,
} from '../tool-registry.js';
import { listToolPerformanceBudgets } from '../performance/tool-budgets.js';

function repoRoot(): string {
  return path.basename(process.cwd()) === 'server' ? path.resolve(process.cwd(), '..') : process.cwd();
}

function cell(value: unknown): string {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');
}

function table(headers: string[], rows: unknown[][]): string {
  return [
    `| ${headers.map(cell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
}

export function generateToolReferenceMarkdown(): string {
  const publicDefaultTools = new Set(getPublicMcpToolNames(false, DEFAULT_TOOL_PROFILE));
  const publicDangerTools = new Set(getPublicMcpToolNames(true, 'danger'));
  const summary = getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE);
  const rows = TOOL_METADATA.map((tool) => [
    tool.name,
    tool.category,
    tool.operationTier,
    tool.scopeRequirement,
    tool.toolAccessTier,
    tool.riskLevel,
    tool.sdkCapability,
    tool.isPublic,
    publicDefaultTools.has(tool.name),
    publicDangerTools.has(tool.name),
    tool.supportsDryRun,
    tool.performanceBudgetMs,
    tool.agentWarning ?? tool.hiddenReason ?? '',
  ]);
  const matrixRows = summary.toolCorrectnessMatrix.map((tool) => [
    tool.toolName,
    tool.profileExposure,
    tool.schemaStatus,
    tool.localTestStatus,
    tool.serverLocalStatus,
    tool.liveStatus,
    tool.idempotencyStatus,
    tool.scopeStatus,
    tool.errorQualityStatus,
    tool.chatGptStatus,
    tool.codexStatus,
    tool.knownFailures.join('; ') || 'none',
    tool.nextTest,
  ]);

  return [
    '# Tool Reference',
    '',
    `Generated from registry. Server ${SERVER_VERSION}. Registry ${TOOL_REGISTRY_VERSION}. Schema ${TOOL_SCHEMA_VERSION}.`,
    '',
    `Declared tools: ${summary.declaredToolCount}. All public tools: ${summary.allPublicToolCount}. Default public tools: ${summary.publicToolCount}. Runtime-unverified default tools: ${summary.runtimeUnverifiedToolCount}. Hidden/gated/unsupported tools: ${summary.hiddenTools.length}.`,
    '',
    table(
      [
        'Tool',
        'Category',
        'Operation Tier',
        'Scope',
        'Access Tier',
        'Risk',
        'SDK Capability',
        'Public',
        'Default Tier',
        'Danger Tier',
        'Dry Run',
        'Budget ms',
        'Warning',
      ],
      rows
    ),
    '',
    '## Tool Correctness Matrix',
    '',
    'This matrix is registry/runtime-history truth. `live_not_run` is not a failure; it means no recent connected RemNote plugin success is recorded in this process.',
    '',
    table(
      [
        'Tool',
        'Profile Exposure',
        'Schema Status',
        'Local Test Status',
        'Server-Local Status',
        'Live Status',
        'Idempotency Status',
        'Scope Status',
        'Error Quality',
        'ChatGPT Status',
        'Codex Status',
        'Known Failures',
        'Next Test',
      ],
      matrixRows
    ),
    '',
  ].join('\n');
}

export function generateToolTierSummaryMarkdown(): string {
  const summary = getToolTierSummary(DEFAULT_TOOL_PROFILE, false);
  const hidden = getHiddenMcpTools(false);
  const tierRows = Object.entries(summary.tiers).map(([tier, tools]) => [tier, (tools as string[]).join(', ')]);

  return [
    '# Tool Tier Summary',
    '',
    `Generated from registry. Default tier: ${DEFAULT_TOOL_PROFILE}.`,
    '',
    table(['Tier', 'Tools'], tierRows),
    '',
    '## Hidden Or Gated',
    '',
    table(['Tool', 'Reason'], hidden.map((tool) => [tool.name, tool.reason])),
    '',
  ].join('\n');
}

export function generateDeveloperDiagnosticsReferenceMarkdown(): string {
  const registry = getToolRegistrySummary(false, 'danger');
  const budgetRows = listToolPerformanceBudgets().map((budget) => [
    budget.toolName,
    budget.category,
    budget.budgetMs,
  ]);
  const stateRows = registry.toolStates.map((tool) => [
    tool.name,
    tool.category,
    tool.declared,
    tool.registered,
    tool.listed,
    tool.callable,
    tool.liveVerified,
    tool.sdkUnsupported,
    tool.hidden,
    tool.performanceBudgetMs,
  ]);
  const matrixRows = registry.toolCorrectnessMatrix.map((tool) => [
    tool.toolName,
    tool.profileExposure,
    tool.schemaStatus,
    tool.serverLocalStatus,
    tool.liveStatus,
    tool.chatGptStatus,
    tool.codexStatus,
    tool.nextTest,
  ]);

  return [
    '# Developer Diagnostics Reference',
    '',
    `Generated from registry. Registry ${registry.toolRegistryVersion}. Schema ${registry.toolSchemaVersion}.`,
    '',
    '## Runtime Fields',
    '',
    table(
      ['Tool', 'Category', 'Declared', 'Registered', 'Listed', 'Callable', 'Live Verified', 'SDK Unsupported', 'Hidden', 'Budget ms'],
      stateRows
    ),
    '',
    '## Tool Correctness Matrix',
    '',
    table(
      ['Tool', 'Profile Exposure', 'Schema Status', 'Server-Local Status', 'Live Status', 'ChatGPT Status', 'Codex Status', 'Next Test'],
      matrixRows
    ),
    '',
    '## Performance Budgets',
    '',
    table(['Tool', 'Category', 'Budget ms'], budgetRows),
    '',
  ].join('\n');
}

export async function writeGeneratedToolDocs(root = repoRoot()) {
  const docsDir = path.join(root, 'docs');
  await mkdir(docsDir, { recursive: true });
  await writeFile(path.join(root, 'TOOL_REFERENCE.md'), generateToolReferenceMarkdown());
  await writeFile(path.join(docsDir, 'tool-tier-summary.md'), generateToolTierSummaryMarkdown());
  await writeFile(path.join(docsDir, 'developer-diagnostics-reference.md'), generateDeveloperDiagnosticsReferenceMarkdown());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await writeGeneratedToolDocs();
}
