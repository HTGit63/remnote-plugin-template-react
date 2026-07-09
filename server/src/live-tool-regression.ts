import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

type JsonRecord = Record<string, unknown>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const reportDir = resolve(repoRoot, 'server/reports');
const smokeJsonPath = resolve(reportDir, 'live-tool-smoke.json');
const smokeMarkdownPath = resolve(reportDir, 'live-tool-smoke.md');
const regressionJsonPath = resolve(reportDir, 'live-tool-regression.json');
const regressionMarkdownPath = resolve(reportDir, 'live-tool-regression.md');

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readSmokeReport(): JsonRecord {
  if (!existsSync(smokeJsonPath)) {
    return {
      ok: false,
      error: 'LIVE_TOOL_SMOKE_REPORT_MISSING',
      message: 'live-tool-smoke did not produce server/reports/live-tool-smoke.json.',
    };
  }
  return JSON.parse(readFileSync(smokeJsonPath, 'utf8')) as JsonRecord;
}

function acceptanceGate(report: JsonRecord) {
  const results = Array.isArray(report.results) ? report.results.filter(isRecord) : [];
  const reportMissing = report.error === 'LIVE_TOOL_SMOKE_REPORT_MISSING';
  const failed = results.filter((result) => result.status === 'failed');
  const passed = results.filter((result) => result.status === 'passed');
  const passedByCategory = new Map<string, number>();
  for (const result of passed) {
    const category = typeof result.category === 'string' ? result.category : 'unknown';
    passedByCategory.set(category, (passedByCategory.get(category) ?? 0) + 1);
  }
  const gatewayFailures = failed.filter((result) => result.reachedPlugin === false);
  const structuredFailures = failed.filter((result) =>
    typeof result.category === 'string' && ['complex_note', 'markdown_note', 'bulk_import'].includes(result.category)
  );
  const bulkImportResults = results.filter((result) => result.category === 'bulk_import');
  const bulkImportSkipped = bulkImportResults.filter((result) => result.status === 'skipped');
  const bulkImportFailed = failed.filter((result) => result.category === 'bulk_import');
  const tinyBulkBlocked = bulkImportResults.length === 0 || bulkImportSkipped.length > 0;
  return {
    ok: !reportMissing && failed.length === 0 && !tinyBulkBlocked,
    reportMissing,
    failedToolCount: failed.length,
    gatewayFailureCount: gatewayFailures.length,
    structuredFailureCount: structuredFailures.length,
    bulkImportFailureCount: bulkImportFailed.length,
    tinyBulkBlocked,
    tinyBulkStatuses: bulkImportResults.map((result) => ({
      tool: result.tool,
      status: result.status,
      verificationStatus: result.verificationStatus,
      message: result.message,
    })),
    blockReason: tinyBulkBlocked
      ? 'Stage 6 tiny bulk live retest requires REMNOTE_LIVE_TOOL_PARENT_ID or REMNOTE_LIVE_TEST_PARENT_ID and a connected plugin.'
      : undefined,
    passedSystemReadCount: passedByCategory.get('system/read') ?? 0,
    passedSimpleWriteCount: passedByCategory.get('simple_write') ?? 0,
    dangerousRealDeleteRan: results.some((result) =>
      result.tool === 'delete_rem_by_id' && result.remnoteChanged === true
    ),
  };
}

mkdirSync(reportDir, { recursive: true });
for (const stalePath of [smokeJsonPath, smokeMarkdownPath]) {
  if (existsSync(stalePath)) {
    unlinkSync(stalePath);
  }
}

const run = spawnSync(
  'npm',
  ['run', 'live-tool-smoke'],
  {
    cwd: resolve(repoRoot, 'server'),
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

const smoke = readSmokeReport();
const gate = acceptanceGate(smoke);
const regressionReport = {
  suite: 'live-tool-regression',
  generatedAt: new Date().toISOString(),
  ok: run.status === 0 && gate.ok,
  smokeExitCode: run.status,
  acceptanceGate: gate,
  smokeReport: smoke,
  stdoutTail: run.stdout.slice(-4000),
  stderrTail: run.stderr.slice(-4000),
};

writeFileSync(regressionJsonPath, `${JSON.stringify(regressionReport, null, 2)}\n`);

const smokeMarkdown = existsSync(smokeMarkdownPath) ? readFileSync(smokeMarkdownPath, 'utf8') : '';
writeFileSync(
  regressionMarkdownPath,
  [
    '# RemnoteMCP Live Tool Regression',
    '',
    `Generated: ${regressionReport.generatedAt}`,
    `Overall: ${regressionReport.ok ? 'pass' : 'fail'}`,
    `Smoke exit code: ${regressionReport.smokeExitCode ?? 'unknown'}`,
    '',
    '## Acceptance Gate',
    '',
    `- Failed tools: ${gate.failedToolCount}`,
    `- Gateway failures: ${gate.gatewayFailureCount}`,
    `- Structured/markdown failures: ${gate.structuredFailureCount}`,
    `- Bulk import failures: ${gate.bulkImportFailureCount}`,
    `- Tiny bulk blocked: ${gate.tinyBulkBlocked ? 'yes' : 'no'}`,
    gate.blockReason ? `- Block reason: ${gate.blockReason}` : '',
    `- System/read passed: ${gate.passedSystemReadCount}`,
    `- Simple write passed: ${gate.passedSimpleWriteCount}`,
    `- Dangerous real delete ran: ${gate.dangerousRealDeleteRan ? 'yes' : 'no'}`,
    '',
    '## Underlying Smoke Report',
    '',
    smokeMarkdown || 'No smoke markdown report produced.',
  ].join('\n')
);

console.log(JSON.stringify(regressionReport, null, 2));
if (!regressionReport.ok) {
  process.exitCode = 1;
}
