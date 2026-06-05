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

  return [
    '# Tool Reference',
    '',
    `Generated from registry. Server ${SERVER_VERSION}. Registry ${TOOL_REGISTRY_VERSION}. Schema ${TOOL_SCHEMA_VERSION}.`,
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
