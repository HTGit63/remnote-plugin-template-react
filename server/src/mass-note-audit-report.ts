import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  getPublicMcpToolNames,
  getToolRegistrySummary,
} from './tool-registry.js';
import {
  DEFAULT_TOOL_PROFILE,
  MASS_NOTE_WRITER_TIER_TOOLS,
} from './tool-policy.js';
import {
  assertAuditStatusHonesty,
  liveRequiredStatus,
  registryPresenceStatus,
  sourceReadinessStatus,
  staticStatusError,
  staticStatusFix,
  staticStatusRoot,
  type VerificationLayer,
  type VerificationStatus,
} from './verification-status.js';

type EvidenceMode = 'local_execution' | 'static_source_check' | 'live_required';

interface AuditRow {
  suite: string;
  testName: string;
  toolName: string;
  status: VerificationStatus;
  verificationLayer: VerificationLayer;
  evidenceMode: EvidenceMode;
  liveProof: boolean;
  durationMs: number;
  phaseDurations: Record<string, number>;
  createdRemIds: string[];
  updatedRemIds: string[];
  deletedRemIds: string[];
  verification: Record<string, unknown>;
  errorCode: string | null;
  rootCauseClass: string | null;
  fixRecommendation: string | null;
}

type AuditRowInput = Omit<
  AuditRow,
  'durationMs' | 'phaseDurations' | 'createdRemIds' | 'updatedRemIds' | 'deletedRemIds' | 'evidenceMode' | 'liveProof' | 'verificationLayer'
> &
  Partial<Pick<AuditRow, 'durationMs' | 'phaseDurations' | 'createdRemIds' | 'updatedRemIds' | 'deletedRemIds' | 'evidenceMode' | 'liveProof' | 'verificationLayer'>>;

function gitValue(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return 'unknown';
  }
}

function row(input: AuditRowInput): AuditRow {
  const output = {
    verificationLayer: input.verificationLayer ?? 'static_source',
    evidenceMode: input.evidenceMode ?? 'static_source_check',
    liveProof: input.liveProof ?? false,
    durationMs: input.durationMs ?? 0,
    phaseDurations: input.phaseDurations ?? {},
    createdRemIds: input.createdRemIds ?? [],
    updatedRemIds: input.updatedRemIds ?? [],
    deletedRemIds: input.deletedRemIds ?? [],
    ...input,
  };
  assertAuditStatusHonesty(output);
  return output;
}

function readRepoFile(repoRoot: string, relativePath: string): string {
  const path = join(repoRoot, relativePath);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const startedAt = Date.now();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const repoRoot = process.cwd().endsWith('/server') ? join(process.cwd(), '..') : process.cwd();
const profileTools = getPublicMcpToolNames(false, 'mass_note_writer');
const summary = getToolRegistrySummary(false, 'mass_note_writer');
const formattingSource = readRepoFile(repoRoot, 'src/remnote/write/formattingWrites.ts');
const invariantSource = readRepoFile(repoRoot, 'src/remnote/write/styleMutationInvariant.ts');
const cardSource = readRepoFile(repoRoot, 'src/remnote/write/designedNoteTools.ts');
const markdownSource = readRepoFile(repoRoot, 'src/remnote/write/markdownImportExecutor.ts');
const templateSource = readRepoFile(repoRoot, 'src/remnote/templates/designTemplates.ts');
const regressionSource = readRepoFile(repoRoot, 'src/remnote/write/style-correctness-regression.ts');

const forbiddenDefaultTools = [
  'delete_rem_by_id',
  'replace_rem',
  'preview_markdown_note_tree',
  'create_note_from_markdown_tree',
  'append_markdown_as_rem_tree',
  'apply_structured_note_batch',
  'create_polished_note_tree',
  'create_designed_note_tree',
  'verify_card_set',
  'repair_card_set',
  'debug_get_raw_rich_text',
  'set_rem_heading_level',
];

const requiredMetadata = [
  'gitSha',
  'branchName',
  'packageVersion',
  'serverVersion',
  'toolRegistryVersion',
  'toolSchemaVersion',
  'mcpDiscoveryVersion',
  'pluginProtocolVersion',
  'buildTime',
  'deploymentEnvironment',
  'activeToolProfile',
  'permissionMode',
  'permissionScope',
  'declaredToolCount',
  'listedToolCount',
  'hiddenToolCount',
];
const missingMetadata = requiredMetadata.filter((field) => !(field in summary));
const exactProfile = JSON.stringify(profileTools) === JSON.stringify([...MASS_NOTE_WRITER_TIER_TOOLS]);
const forbiddenVisible = forbiddenDefaultTools.filter((tool) => profileTools.includes(tool));
const styleInvariantReady =
  invariantSource.includes('beforePlainText') &&
  invariantSource.includes('afterPlainText') &&
  invariantSource.includes('beforeChildOrder') &&
  invariantSource.includes('onlyExpectedStyleChanged') &&
  formattingSource.includes('captureStyleMutationSnapshot');
const cardVerifierReady =
  cardSource.includes('maxNodes') &&
  cardSource.includes('maxDepth') &&
  cardSource.includes('initialChildrenRead.value.length === 0') &&
  cardSource.includes('No cards found under target root') &&
  cardSource.includes("status: truncated ? 'partial' : 'verified'");
const notePlanReady =
  markdownSource.includes('createNotePlanSummary') &&
  regressionSource.includes('notePlanShapeEqual');
const chunkManifestReady =
  markdownSource.includes('plannedNodeCount') &&
  markdownSource.includes('estimatedWriteRisk') &&
  markdownSource.includes('recommendedChunkSize') &&
  markdownSource.includes('chunkCount');
const designHashReady =
  templateSource.includes('normalizeNoteDesignTemplate') &&
  templateSource.includes('normalizedTemplateHash') &&
  regressionSource.includes('S12 design template');

const rows: AuditRow[] = [
  row({
    suite: 'S00',
    testName: 'local source metadata fields',
    toolName: 'get_bridge_status',
    status: registryPresenceStatus(missingMetadata.length === 0),
    verificationLayer: 'static_source',
    evidenceMode: 'local_execution',
    verification: {
      missingMetadata,
      gitSha: gitValue('git rev-parse HEAD'),
      branchName: gitValue('git branch --show-current'),
      registryGitSha: summary.gitSha,
      registryBranchName: summary.branchName,
    },
    errorCode: missingMetadata.length ? 'LOCAL_METADATA_INCOMPLETE' : null,
    rootCauseClass: missingMetadata.length ? 'registry_metadata_incomplete' : null,
    fixRecommendation: missingMetadata.length ? 'Add missing fields to status/diagnostic registry summary.' : null,
  }),
  row({
    suite: 'S00',
    testName: 'deployed source alignment',
    toolName: 'get_bridge_diagnostics',
    status: liveRequiredStatus(undefined),
    verificationLayer: 'live_remnote_plugin',
    evidenceMode: 'live_required',
    verification: { requires: ['running deployed/local MCP endpoint', 'connected RemNote plugin', 'matching gitSha'] },
    errorCode: 'LIVE_ENVIRONMENT_REQUIRED',
    rootCauseClass: 'live_environment_required',
    fixRecommendation: 'Run live read_only after MCP server and RemNote plugin are connected; compare deployed git/version values to this branch.',
  }),
  row({
    suite: 'S01',
    testName: 'mass_note_writer profile listing and gating',
    toolName: 'tools/list',
    status: registryPresenceStatus(DEFAULT_TOOL_PROFILE === 'mass_note_writer' && exactProfile && forbiddenVisible.length === 0),
    verificationLayer: 'static_source',
    evidenceMode: 'local_execution',
    verification: {
      defaultToolProfile: DEFAULT_TOOL_PROFILE,
      listedTools: profileTools,
      expectedTools: [...MASS_NOTE_WRITER_TIER_TOOLS],
      forbiddenVisible,
    },
    errorCode: forbiddenVisible.length ? 'PROFILE_EXPOSURE_TOO_BROAD' : null,
    rootCauseClass: forbiddenVisible.length ? 'profile_gating' : null,
    fixRecommendation: forbiddenVisible.length ? 'Keep only read tools plus create_or_replace_note_from_markdown in mass_note_writer.' : null,
  }),
  row({
    suite: 'S02',
    testName: 'platform block classification',
    toolName: '*',
    status: 'NOT_RUN',
    verificationLayer: 'live_remnote_plugin',
    evidenceMode: 'live_required',
    verification: { localReportClassifiesPlatformBlocks: true, requires: ['ChatGPT platform tool-call path'] },
    errorCode: 'PLATFORM_PATH_REQUIRED',
    rootCauseClass: 'platform_environment_required',
    fixRecommendation: 'Run read_only and safe_sandbox from the real client path and record PLATFORM_BLOCKED separately from bridge failures.',
  }),
  row({
    suite: 'S03',
    testName: 'read-only tools and standard envelope',
    toolName: '*read_tools',
    status: 'READY_FOR_RUNTIME_TEST',
    verificationLayer: 'static_source',
    verification: {
      envelopeFields: ['status', 'toolName', 'operationId', 'createdRemIds', 'updatedRemIds', 'deletedRemIds', 'verification', 'phaseDurations', 'warnings'],
      readToolsProtected: ['get_bridge_status', 'get_plugin_status', 'get_rem', 'get_children', 'get_rem_tree', 'search_rems'],
    },
    errorCode: 'STATIC_READINESS_ONLY',
    rootCauseClass: 'static_readiness_only',
    fixRecommendation: 'Run read tools through a local MCP smoke or live read_only path before treating this row as PASS.',
  }),
  row({
    suite: 'S04',
    testName: 'stable markdown writer dry-run/readback contract',
    toolName: 'create_or_replace_note_from_markdown',
    status: sourceReadinessStatus(chunkManifestReady),
    verificationLayer: 'static_source',
    verification: { primaryWriter: true, manifestFieldsPresent: chunkManifestReady },
    errorCode: staticStatusError(chunkManifestReady, 'MARKDOWN_MANIFEST_MISSING'),
    rootCauseClass: staticStatusRoot(chunkManifestReady, 'writer_diagnostics_incomplete'),
    fixRecommendation: staticStatusFix(chunkManifestReady, 'Expose dry-run mass-note manifest fields on markdown writer result.'),
  }),
  row({
    suite: 'S05',
    testName: 'idempotency replay contract',
    toolName: 'create_or_replace_note_from_markdown',
    status: sourceReadinessStatus(markdownSource.includes("status: 'already_applied'")),
    verificationLayer: 'static_source',
    verification: { alreadyAppliedStatus: markdownSource.includes("status: 'already_applied'") },
    errorCode: staticStatusError(markdownSource.includes("status: 'already_applied'"), 'IDEMPOTENCY_REPLAY_MISSING'),
    rootCauseClass: staticStatusRoot(markdownSource.includes("status: 'already_applied'"), 'idempotency'),
    fixRecommendation: staticStatusFix(markdownSource.includes("status: 'already_applied'"), 'Return already_applied without duplicate writes on replay.'),
  }),
  row({
    suite: 'S06',
    testName: 'guarded cleanup contract',
    toolName: 'delete_rem_by_id',
    status: 'READY_FOR_RUNTIME_TEST',
    verificationLayer: 'static_source',
    verification: {
      broadDeleteHiddenFromDefault: !profileTools.includes('delete_rem_by_id'),
      requiredRealDeleteGuards: ['confirmTitle', 'expectedParentId or expectedAncestorId', 'requirePriorDryRun', 'idempotencyKey'],
    },
    errorCode: 'STATIC_READINESS_ONLY',
    rootCauseClass: 'static_readiness_only',
    fixRecommendation: 'Run guarded cleanup dry-run plus current-session delete proof before treating this row as PASS.',
  }),
  row({
    suite: 'S07',
    testName: 'phase timing/performance diagnostics',
    toolName: '*',
    status: liveRequiredStatus(undefined),
    verificationLayer: 'live_remnote_plugin',
    evidenceMode: 'live_required',
    verification: { localTimingFieldsPresent: true, warmLatencyRequiresLivePlugin: true },
    errorCode: 'LIVE_TIMING_REQUIRED',
    rootCauseClass: 'live_environment_required',
    fixRecommendation: 'Run five live warm calls plus idle retry to classify server/plugin/SDK latency.',
  }),
  row({
    suite: 'S08',
    testName: 'style invariants with two children',
    toolName: '*style_tools',
    status: sourceReadinessStatus(styleInvariantReady),
    verificationLayer: 'static_source',
    verification: {
      invariantFields: ['beforeChildIds', 'afterChildIds', 'beforeChildOrder', 'afterChildOrder', 'beforePlainText', 'afterPlainText', 'onlyExpectedStyleChanged'],
      regressionHarness: regressionSource.includes('runTwoChildStyleCase'),
    },
    errorCode: staticStatusError(styleInvariantReady, 'STYLE_INVARIANT_INCOMPLETE'),
    rootCauseClass: staticStatusRoot(styleInvariantReady, 'style_mutation_pollution'),
    fixRecommendation: staticStatusFix(styleInvariantReady, 'Route every style-only path through styleMutationInvariant and add two-child tests.'),
  }),
  row({
    suite: 'S09',
    testName: 'bounded card verifier',
    toolName: 'verify_card_set',
    status: sourceReadinessStatus(cardVerifierReady),
    verificationLayer: 'static_source',
    verification: {
      emptyNoCardPassesWithWarning: cardSource.includes('No cards found under target root'),
      emptyRootFastPath: cardSource.includes('initialChildrenRead.value.length === 0'),
      capReturnsPartial: cardSource.includes("status: truncated ? 'partial' : 'verified'"),
      regressionHarness: regressionSource.includes('Traversal cap should return PARTIAL'),
    },
    errorCode: staticStatusError(cardVerifierReady, 'CARD_VERIFIER_UNBOUNDED'),
    rootCauseClass: staticStatusRoot(cardVerifierReady, 'verifier_traversal'),
    fixRecommendation: staticStatusFix(cardVerifierReady, 'Add maxNodes/maxDepth traversal and no-card fast path.'),
  }),
  row({
    suite: 'S10',
    testName: 'NotePlan wrapper equivalence',
    toolName: 'create_or_replace_note_from_markdown/apply_structured_note_batch',
    status: sourceReadinessStatus(notePlanReady),
    verificationLayer: 'static_source',
    verification: { notePlanSummary: markdownSource.includes('notePlan'), equivalenceHarness: regressionSource.includes('notePlanShapeEqual') },
    errorCode: staticStatusError(notePlanReady, 'NOTEPLAN_EQUIVALENCE_MISSING'),
    rootCauseClass: staticStatusRoot(notePlanReady, 'writer_path_divergence'),
    fixRecommendation: staticStatusFix(notePlanReady, 'Normalize Markdown and structured inputs to NotePlan and assert shape hash equality.'),
  }),
  row({
    suite: 'S11',
    testName: 'chunked import dry-run manifest',
    toolName: 'create_or_replace_note_from_markdown',
    status: sourceReadinessStatus(chunkManifestReady),
    verificationLayer: 'static_source',
    verification: {
      requiredFields: ['plannedNodeCount', 'maxDepth', 'mathCount', 'tableCount', 'flashcardMarkers', 'estimatedWriteRisk', 'recommendedChunkSize', 'chunkCount', 'warnings'],
      dryRunCases: [25, 50, 100, 250, 500],
    },
    errorCode: staticStatusError(chunkManifestReady, 'CHUNK_MANIFEST_MISSING'),
    rootCauseClass: staticStatusRoot(chunkManifestReady, 'mass_note_chunking'),
    fixRecommendation: staticStatusFix(chunkManifestReady, 'Expose mass-note chunk manifest on preview/dry-run/write results.'),
  }),
  row({
    suite: 'S11',
    testName: '25/50/100 real live writes and guarded cleanup',
    toolName: 'create_or_replace_note_from_markdown',
    status: liveRequiredStatus(undefined),
    verificationLayer: 'live_remnote_plugin',
    evidenceMode: 'live_required',
    verification: { requires: ['REMNOTE_LIVE_TEST_PARENT_ID', 'connected plugin', 'guarded cleanup proof'], cases: [25, 50, 100] },
    errorCode: 'LIVE_WRITE_REQUIRED',
    rootCauseClass: 'live_environment_required',
    fixRecommendation: 'Run full_sandbox only after read_only/safe_sandbox pass; verify and cleanup only current-session Rems.',
  }),
  row({
    suite: 'S12',
    testName: 'design template normalized round-trip hash',
    toolName: 'export_note_design_template/import_note_design_template',
    status: sourceReadinessStatus(designHashReady),
    verificationLayer: 'static_source',
    verification: { normalizedHash: templateSource.includes('normalizedTemplateHash'), row: 'S12', regressionHarness: regressionSource.includes('S12 design template') },
    errorCode: staticStatusError(designHashReady, 'DESIGN_TEMPLATE_HASH_MISSING'),
    rootCauseClass: staticStatusRoot(designHashReady, 'design_template_round_trip'),
    fixRecommendation: staticStatusFix(designHashReady, 'Normalize design templates and compare stable hash after import.'),
  }),
  row({
    suite: 'S13',
    testName: 'card creation lifecycle live proof',
    toolName: 'create_basic_flashcard/create_cloze_card/create_flashcards_from_markdown',
    status: liveRequiredStatus(undefined),
    verificationLayer: 'live_remnote_plugin',
    evidenceMode: 'live_required',
    verification: { localVerifierReady: cardVerifierReady, requires: ['create', 'verify', 'idempotent replay', 'guarded cleanup'] },
    errorCode: 'LIVE_CARD_WRITE_REQUIRED',
    rootCauseClass: 'live_environment_required',
    fixRecommendation: 'Run full_sandbox card lifecycle after verifier passes and cleanup is proven.',
  }),
];

const report = {
  reportKind: 'mass_note_readiness_audit',
  generatedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  branchName: gitValue('git branch --show-current'),
  gitSha: gitValue('git rev-parse HEAD'),
  defaultToolProfile: DEFAULT_TOOL_PROFILE,
  liveProof: false,
  note: 'This report mixes local registry execution and static source readiness checks. It is not live RemNote proof.',
  summary: {
    pass: rows.filter((item) => item.status === 'PASS').length,
    fail: rows.filter((item) => item.status === 'FAIL').length,
    sourcePresent: rows.filter((item) => item.status === 'SOURCE_PRESENT').length,
    registryPresent: rows.filter((item) => item.status === 'REGISTRY_PRESENT').length,
    readyForRuntimeTest: rows.filter((item) => item.status === 'READY_FOR_RUNTIME_TEST').length,
    readyForLiveTest: rows.filter((item) => item.status === 'READY_FOR_LIVE_TEST').length,
    liveTestNotRun: rows.filter((item) => item.status === 'LIVE_TEST_NOT_RUN').length,
  },
  rows,
};

const reportsDir = join(repoRoot, 'reports');
mkdirSync(reportsDir, { recursive: true });
const jsonPath = join(reportsDir, `remnote-mcp-readiness-audit-${timestamp}.json`);
const mdPath = join(reportsDir, `remnote-mcp-readiness-audit-${timestamp}.md`);
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  mdPath,
  [
    '# RemnoteMCP Mass Note Readiness Audit',
    '',
    `Generated: ${report.generatedAt}`,
    `Branch: ${report.branchName}`,
    `Git SHA: ${report.gitSha}`,
    `Default profile: ${report.defaultToolProfile}`,
    `Live proof: ${report.liveProof ? 'yes' : 'no'}`,
    '',
    '> This report is not live RemNote proof. Static/source rows use SOURCE_PRESENT, REGISTRY_PRESENT, or READY_FOR_RUNTIME_TEST, never runtime PASS.',
    '',
    '| Suite | Test Name | Tool Name | Status | Verification Layer | Evidence Mode | Live Proof | Duration Ms | Error Code | Root Cause Class | Fix Recommendation |',
    '| --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- |',
    ...rows.map((item) =>
      `| ${item.suite} | ${item.testName} | ${item.toolName} | ${item.status} | ${item.verificationLayer} | ${item.evidenceMode} | ${item.liveProof ? 'yes' : 'no'} | ${item.durationMs} | ${item.errorCode ?? ''} | ${item.rootCauseClass ?? ''} | ${item.fixRecommendation ?? ''} |`
    ),
    '',
  ].join('\n')
);

console.log(JSON.stringify({ jsonPath, mdPath, summary: report.summary }, null, 2));
