export type AuditWriteOperation = 'create_rem' | 'create_rem_tree';

export interface SafeDisposableAuditPayloadInput {
  operation: string;
  parentRemId?: unknown;
  parentId?: unknown;
  markdown?: unknown;
  tree?: unknown;
}

export interface AuditPayloadClassification {
  safe: boolean;
  title?: string;
  compactReport: boolean;
  reason?: string;
  errorCode?: 'COMPACT_REPORT_TOO_LARGE' | 'UNSAFE_AUDIT_PAYLOAD';
  bodyCharCount: number;
  totalCharCount: number;
}

export const COMPACT_REPORT_MAX_CHARS = 4000;
const TITLE_MAX_CHARS = 180;
const TREE_MAX_NODES = 20;
const TREE_MAX_TOTAL_CHARS = 6000;

const EXACT_SAFE_TITLES = new Set([
  'Stage 00 — Preflight and Focus',
  'Stage 01 — Tool Profile and Default Audit',
  'Stage 02 — Read Search Scope',
  'Stage 03 — Safe Write and Idempotency',
  'Stage 04 — Preview Planning and Small Bulk',
  'Stage 05 — Full Chapter One File Import',
  'Stage 06 — Resume Duplicate and Scope Protection',
  'Stage 07 — Formula Fidelity',
  'Stage 08 — Styling Mutation Invariants',
  'Stage 09 — Card Lifecycle',
  'Stage 10 — Latency Stability Soak',
  'Stage 11 — Final Combined Verification',
  'Stage 12 — Compact Report Container',
  'Compact Report — Unified Staged Live-Proof',
]);

const UNSAFE_TEXT_PATTERNS = [
  /\b(delete|destroy|wipe|purge|erase|remove)\b/i,
  /\bmove\s+(entire|whole|all)\b/i,
  /\breplace\s+(plugin test|old notes?|all notes?|workspace)\b/i,
  /\b(raw\s+sdk|sdk\s+command|debug\s+command|developer\s+command)\b/i,
  /\b(shell|exec|execute|eval|curl|fetch)\b/i,
  /\bhttps?:\/\/\S+/i,
  /\bfile:\/\/\S+/i,
  /\b(entire workspace|whole workspace|all notes|all rems|full kb|full knowledge base|broad workspace)\b/i,
  /\b(targetRemId|oldRemId|old note target|old notes?)\b/i,
];

const COMPACT_REPORT_LINE_PATTERN =
  /\b(verdict|stage|summary|gate|proof|readback|parent|created|blocked|partial|pass|fail|ready|rerun|run_id|error|latency|tool|profile|plugin|bridge|scope|idempotency|compact report)\b/i;

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stripMarkdownPrefix(line: string): string {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/^>\s*/, '')
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .trim();
}

function splitMarkdownTitleAndBody(markdown: string): { title: string; body: string } {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const titleIndex = lines.findIndex((line) => stripMarkdownPrefix(line).length > 0);
  if (titleIndex < 0) {
    return { title: '', body: '' };
  }
  const title = stripMarkdownPrefix(lines[titleIndex]);
  const body = lines.slice(titleIndex + 1).join('\n').trim();
  return { title, body };
}

function flattenTreeTitles(tree: unknown): { titles: string[]; valid: boolean } {
  if (!tree || typeof tree !== 'object' || Array.isArray(tree)) {
    return { titles: [], valid: false };
  }
  const node = tree as { title?: unknown; children?: unknown };
  const title = asNonEmptyString(node.title);
  if (!title) {
    return { titles: [], valid: false };
  }
  const children = Array.isArray(node.children) ? node.children : [];
  const childResults = children.map(flattenTreeTitles);
  if (childResults.some((result) => !result.valid)) {
    return { titles: [], valid: false };
  }
  return {
    titles: [title, ...childResults.flatMap((result) => result.titles)],
    valid: true,
  };
}

function isAllowedTitle(title: string): boolean {
  if (EXACT_SAFE_TITLES.has(title)) {
    return true;
  }
  if (/^RemNote MCP Unified Staged Live-Proof — .{1,120}$/u.test(title)) {
    return true;
  }
  return /^Compact Report — .{1,120}$/u.test(title);
}

function hasUnsafeText(text: string): boolean {
  return UNSAFE_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

function compactBodyIsStageSummary(body: string): boolean {
  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    return true;
  }
  if (lines.length > 80) {
    return false;
  }
  return lines.every((line) => line.length <= 300 && COMPACT_REPORT_LINE_PATTERN.test(line));
}

function classifyTitleBody(
  operation: AuditWriteOperation,
  parentRemId: string | undefined,
  title: string,
  body: string,
  totalCharCount: number,
  nodeCount: number
): AuditPayloadClassification {
  const compactReport = title.startsWith('Compact Report —');
  const bodyCharCount = body.length;
  const text = [title, body].filter(Boolean).join('\n');

  if (!parentRemId) {
    return { safe: false, title, compactReport, reason: 'parentRemId_required', bodyCharCount, totalCharCount };
  }
  if (title.length === 0 || title.length > TITLE_MAX_CHARS || !isAllowedTitle(title)) {
    return { safe: false, title, compactReport, reason: 'title_not_allowed', bodyCharCount, totalCharCount };
  }
  if (operation !== 'create_rem' && operation !== 'create_rem_tree') {
    return { safe: false, title, compactReport, reason: 'operation_not_allowed', bodyCharCount, totalCharCount };
  }
  if (hasUnsafeText(text)) {
    return { safe: false, title, compactReport, reason: 'unsafe_instruction', bodyCharCount, totalCharCount };
  }
  if (compactReport && totalCharCount > COMPACT_REPORT_MAX_CHARS) {
    return {
      safe: false,
      title,
      compactReport,
      reason: 'compact_report_too_large',
      errorCode: 'COMPACT_REPORT_TOO_LARGE',
      bodyCharCount,
      totalCharCount,
    };
  }
  if (compactReport && !compactBodyIsStageSummary(body)) {
    return { safe: false, title, compactReport, reason: 'compact_report_not_stage_summary', bodyCharCount, totalCharCount };
  }
  if (!compactReport && body.trim().length > 0) {
    return { safe: false, title, compactReport, reason: 'non_compact_body_not_allowed', bodyCharCount, totalCharCount };
  }
  if (nodeCount > TREE_MAX_NODES || totalCharCount > TREE_MAX_TOTAL_CHARS) {
    return { safe: false, title, compactReport, reason: 'payload_too_large', bodyCharCount, totalCharCount };
  }

  return { safe: true, title, compactReport, bodyCharCount, totalCharCount };
}

export function classifyDisposableAuditPayload(
  input: SafeDisposableAuditPayloadInput
): AuditPayloadClassification {
  const operation = input.operation as AuditWriteOperation;
  const parentRemId = asNonEmptyString(input.parentRemId) ?? asNonEmptyString(input.parentId);

  if (operation === 'create_rem') {
    const markdown = asNonEmptyString(input.markdown);
    if (!markdown) {
      return { safe: false, compactReport: false, reason: 'markdown_required', bodyCharCount: 0, totalCharCount: 0 };
    }
    const { title, body } = splitMarkdownTitleAndBody(markdown);
    return classifyTitleBody(operation, parentRemId, title, body, markdown.length, 1);
  }

  if (operation === 'create_rem_tree') {
    const flattened = flattenTreeTitles(input.tree);
    if (!flattened.valid || flattened.titles.length === 0) {
      return { safe: false, compactReport: false, reason: 'tree_title_required', bodyCharCount: 0, totalCharCount: 0 };
    }
    const [title, ...bodyTitles] = flattened.titles;
    const body = bodyTitles.join('\n');
    const totalCharCount = flattened.titles.reduce((sum, value) => sum + value.length, 0);
    return classifyTitleBody(operation, parentRemId, title, body, totalCharCount, flattened.titles.length);
  }

  return { safe: false, compactReport: false, reason: 'operation_not_allowed', bodyCharCount: 0, totalCharCount: 0 };
}

export function isSafeDisposableAuditPayload(input: SafeDisposableAuditPayloadInput): boolean {
  return classifyDisposableAuditPayload(input).safe;
}
