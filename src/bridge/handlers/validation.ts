import type {
  ApplyRemnoteCommandArgs,
  ApplyStylePlanArgs,
  ApplyStructuredNoteBatchArgs,
  ApprovalResolution,
  CreateRemTreeArgs,
  CreatePolishedNoteTreeArgs,
  PendingApprovalRequest,
  PermissionMode,
  PermissionScope,
  RichTextSpanInput,
  SearchRemsArgs,
  SetTextSpanColorArgs,
  StyledRemTreeNode,
  VerifyNoteDesignArgs,
} from '../../../shared/bridge/protocol';

export const MAX_REQUEST_ID_CHARS = 128;
export const MAX_REM_ID_CHARS = 256;
export const MAX_MARKDOWN_CHARS = 20000;
export const MAX_LONG_MARKDOWN_CHARS = 120000;
export const MAX_SEARCH_QUERY_CHARS = 500;
export const MAX_MEDIA_URL_CHARS = 2048;
export const MAX_MEDIA_LABEL_CHARS = 500;
export const MAX_MEDIA_DIMENSION = 4096;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getStringField(args: unknown, field: string): string | undefined {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args[field];
  return typeof value === 'string' ? value : undefined;
}

export function requiredRemId(args: unknown, field = 'remId'): string {
  const remId = getStringField(args, field)?.trim();

  if (!remId) {
    throw new Error(`Missing ${field}.`);
  }

  if (remId.length > MAX_REM_ID_CHARS) {
    throw new Error(`${field} is too long.`);
  }

  return remId;
}

export function requiredRemIdFromFields(args: unknown, fields: string[]): string {
  for (const field of fields) {
    const remId = getStringField(args, field)?.trim();
    if (remId) {
      if (remId.length > MAX_REM_ID_CHARS) {
        throw new Error(`${field} is too long.`);
      }

      return remId;
    }
  }

  throw new Error(`Missing ${fields.join(' or ')}.`);
}

export function requiredMarkdown(args: unknown): string {
  const markdown = getStringField(args, 'markdown')?.trim();

  if (!markdown) {
    throw new Error('Missing markdown.');
  }

  if (markdown.length > MAX_MARKDOWN_CHARS) {
    throw new Error(`Markdown exceeds ${MAX_MARKDOWN_CHARS} characters.`);
  }

  return markdown;
}

export function requiredMarkdownText(args: unknown): string {
  const markdown = getStringField(args, 'markdownText')?.trim();

  if (!markdown) {
    throw new Error('Missing markdownText.');
  }

  if (markdown.length > MAX_LONG_MARKDOWN_CHARS) {
    throw new Error(`markdownText exceeds ${MAX_LONG_MARKDOWN_CHARS} characters.`);
  }

  return markdown;
}

export function requiredTextField(args: unknown, field: string): string {
  const value = getStringField(args, field)?.trim();

  if (!value) {
    throw new Error(`Missing ${field}.`);
  }

  if (value.length > MAX_MARKDOWN_CHARS) {
    throw new Error(`${field} exceeds ${MAX_MARKDOWN_CHARS} characters.`);
  }

  return value;
}

export function requiredMediaUrl(args: unknown): string {
  const value = getStringField(args, 'url')?.trim();
  if (!value) {
    throw new Error('Missing url.');
  }
  if (value.length > MAX_MEDIA_URL_CHARS) {
    throw new Error(`url exceeds ${MAX_MEDIA_URL_CHARS} characters.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('url is malformed.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Media URL must use http or https.');
  }
  return parsed.toString();
}

export function optionalMediaLabel(args: unknown): string | undefined {
  if (!isPlainObject(args) || args.label === undefined) {
    return undefined;
  }
  if (typeof args.label !== 'string') {
    throw new Error('label must be a string.');
  }
  const label = args.label.trim();
  if (!label) {
    throw new Error('label must not be empty.');
  }
  if (label.length > MAX_MEDIA_LABEL_CHARS) {
    throw new Error(`label exceeds ${MAX_MEDIA_LABEL_CHARS} characters.`);
  }
  return label;
}

export function optionalMediaDimension(
  args: unknown,
  field: 'width' | 'height'
): number | undefined {
  if (!isPlainObject(args) || args[field] === undefined) {
    return undefined;
  }
  const value = args[field];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_MEDIA_DIMENSION) {
    throw new Error(`${field} must be an integer between 1 and ${MAX_MEDIA_DIMENSION}.`);
  }
  return value;
}

export function optionalParentId(args: unknown): string | null {
  if (!isPlainObject(args)) {
    return null;
  }

  const value = args.parentId;
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('parentId must be a string or null.');
  }

  const parentId = value.trim();
  if (parentId.length > MAX_REM_ID_CHARS) {
    throw new Error('parentId is too long.');
  }

  return parentId || null;
}

export function requiredParentId(args: unknown, field = 'parentId'): string {
  return requiredRemId(args, field);
}

export function optionalRemId(args: unknown, field: string): string | null {
  if (!isPlainObject(args)) {
    return null;
  }

  const value = args[field];
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string or null.`);
  }

  const remId = value.trim();
  if (remId.length > MAX_REM_ID_CHARS) {
    throw new Error(`${field} is too long.`);
  }

  return remId || null;
}

export function getTreeDepth(args: unknown): number | undefined {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args.depth;
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('depth must be a finite number.');
  }

  return value;
}

export function optionalBoundedNumber(args: unknown, field: string): number | undefined {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args[field];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number.`);
  }

  return value;
}

export function requiredSearchQuery(args: unknown): string {
  const query = getStringField(args, 'query')?.trim();

  if (!query) {
    throw new Error('Missing query.');
  }

  if (query.length > MAX_SEARCH_QUERY_CHARS) {
    throw new Error(`query exceeds ${MAX_SEARCH_QUERY_CHARS} characters.`);
  }

  return query;
}

export function optionalAppendPosition(args: unknown): 'start' | 'end' {
  if (!isPlainObject(args)) {
    return 'end';
  }

  const value = args.position;
  if (value === undefined || value === null || value === '') {
    return 'end';
  }

  if (value !== 'start' && value !== 'end') {
    throw new Error('position must be "start" or "end".');
  }

  return value;
}

export function requiredIndex(args: unknown): number {
  if (!isPlainObject(args)) {
    throw new Error('Missing index.');
  }

  const value = args.index;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error('index must be a non-negative integer.');
  }

  return value;
}

export function requiredOrderedChildRemIds(args: unknown): string[] {
  if (!isPlainObject(args)) {
    throw new Error('Missing orderedChildRemIds.');
  }

  const rawIds = Array.isArray(args.orderedChildRemIds)
    ? args.orderedChildRemIds
    : Array.isArray(args.orderedChildIds)
      ? args.orderedChildIds
      : undefined;

  if (!rawIds) {
    throw new Error('Missing orderedChildRemIds or orderedChildIds.');
  }

  if (rawIds.length > 500) {
    throw new Error('orderedChildRemIds exceeds 500 IDs.');
  }

  return rawIds.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`orderedChildRemIds[${index}] must be a string.`);
    }

    const remId = item.trim();
    if (!remId || remId.length > MAX_REM_ID_CHARS) {
      throw new Error(`orderedChildRemIds[${index}] is invalid.`);
    }

    return remId;
  });
}

export function optionalRecursive(args: unknown): boolean {
  if (!isPlainObject(args)) {
    return false;
  }

  const value = args.recursive;
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value !== 'boolean') {
    throw new Error('recursive must be a boolean.');
  }

  return value;
}

export function requiredConfirmText(args: unknown): string {
  return requiredTextField(args, 'confirmText');
}

export function requiredTree(args: unknown): CreateRemTreeArgs['tree'] {
  if (!isPlainObject(args) || !isPlainObject(args.tree)) {
    throw new Error('Missing tree.');
  }

  return args.tree as unknown as CreateRemTreeArgs['tree'];
}

export function requiredStyledTree(args: unknown): StyledRemTreeNode {
  if (!isPlainObject(args) || !isPlainObject(args.tree)) {
    throw new Error('Missing tree.');
  }

  return args.tree as StyledRemTreeNode;
}

export function optionalStructuredBatchRoot(args: unknown): StyledRemTreeNode | undefined {
  if (!isPlainObject(args)) {
    return undefined;
  }

  if (isPlainObject(args.root)) {
    return args.root as StyledRemTreeNode;
  }

  const note = isPlainObject(args.note) ? args.note : undefined;
  return note && isPlainObject(note.root) ? (note.root as StyledRemTreeNode) : undefined;
}

export function optionalStructuredBatchTarget(args: unknown): ApplyStructuredNoteBatchArgs['target'] | undefined {
  if (!isPlainObject(args) || !isPlainObject(args.target)) {
    return undefined;
  }

  const target = args.target as Record<string, unknown>;
  const mode = target.mode;
  if (
    mode !== 'focused_rem' &&
    mode !== 'rem_id' &&
    mode !== 'parent_child' &&
    mode !== 'approved_root'
  ) {
    throw new Error('target.mode must be focused_rem, rem_id, parent_child, or approved_root.');
  }

  return {
    mode,
    remId: typeof target.remId === 'string' ? target.remId.trim() || null : null,
    parentId: typeof target.parentId === 'string' ? target.parentId.trim() || null : null,
    createIfMissing: typeof target.createIfMissing === 'boolean' ? target.createIfMissing : false,
  };
}

export function optionalStructuredBatchOperation(args: unknown): ApplyStructuredNoteBatchArgs['operation'] {
  const value = getStringField(args, 'operation');
  switch (value) {
    case undefined:
    case '':
      return undefined;
    case 'replace_children':
    case 'append_children':
    case 'update_root_and_replace_children':
    case 'create_child_tree':
      return value;
    default:
      throw new Error('operation must be replace_children, append_children, update_root_and_replace_children, or create_child_tree.');
  }
}

export function optionalStructuredBatchNote(args: unknown): ApplyStructuredNoteBatchArgs['note'] | undefined {
  if (!isPlainObject(args) || !isPlainObject(args.note)) {
    return undefined;
  }

  const note = args.note as Record<string, unknown>;
  if (!isPlainObject(note.root) && !Array.isArray(note.children)) {
    throw new Error('note requires root or children.');
  }

  return {
    ...(isPlainObject(note.root) ? { root: note.root as StyledRemTreeNode } : {}),
    ...(Array.isArray(note.children) ? { children: note.children as StyledRemTreeNode[] } : {}),
  };
}

export function requiredCommandTarget(args: unknown): ApplyRemnoteCommandArgs['target'] {
  if (!isPlainObject(args) || !isPlainObject(args.target)) {
    throw new Error('Missing target.');
  }

  const target = args.target as Record<string, unknown>;
  const mode = target.mode;
  if (mode !== 'focused_rem' && mode !== 'selected_rem' && mode !== 'rem_id') {
    throw new Error('target.mode must be focused_rem, selected_rem, or rem_id.');
  }

  return {
    mode,
    remId: typeof target.remId === 'string' ? target.remId.trim() || null : null,
  };
}

export function requiredRemnoteCommand(args: unknown): ApplyRemnoteCommandArgs['command'] {
  const command = getStringField(args, 'command');
  switch (command) {
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
    case 'normal_text':
    case 'highlight_yellow':
    case 'highlight_blue':
    case 'highlight_green':
    case 'highlight_red':
    case 'hide_bullet':
    case 'show_bullet':
    case 'make_concept':
    case 'make_descriptor':
    case 'make_normal':
    case 'insert_inline_math':
    case 'insert_math_block':
      return command;
    default:
      throw new Error('command must be a supported RemNote command.');
  }
}

export function optionalCommandArgs(args: unknown): ApplyRemnoteCommandArgs['args'] | undefined {
  if (!isPlainObject(args) || !isPlainObject(args.args)) {
    return undefined;
  }

  const commandArgs = args.args as Record<string, unknown>;
  return {
    latex: typeof commandArgs.latex === 'string' ? commandArgs.latex : undefined,
    text: typeof commandArgs.text === 'string' ? commandArgs.text : undefined,
  };
}

export function optionalBoolean(args: unknown, field: string, fallback = false): boolean {
  if (!isPlainObject(args)) {
    return fallback;
  }

  const value = args[field];
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be a boolean.`);
  }

  return value;
}

export function optionalIdempotencyKey(args: unknown): string | undefined {
  const key = getStringField(args, 'idempotencyKey')?.trim();
  if (!key) {
    return undefined;
  }

  if (key.length > MAX_REQUEST_ID_CHARS) {
    throw new Error('idempotencyKey is too long.');
  }

  return key;
}

export function requiredRichText(args: unknown): RichTextSpanInput[] {
  if (!isPlainObject(args) || !Array.isArray(args.richText)) {
    throw new Error('Missing richText.');
  }

  if (args.richText.length > 200) {
    throw new Error('richText exceeds 200 spans.');
  }

  return args.richText as RichTextSpanInput[];
}

export function requiredColor(args: unknown, field = 'color') {
  const value = getStringField(args, field);
  switch (value) {
    case 'red':
    case 'orange':
    case 'yellow':
    case 'green':
    case 'blue':
    case 'purple':
    case 'pink':
    case 'gray':
    case 'brown':
    case 'default':
      return value;
    case 'Red':
    case 'Orange':
    case 'Yellow':
    case 'Green':
    case 'Blue':
    case 'Purple':
    case 'Gray':
    case 'Brown':
    case 'Pink':
      return value;
    default:
      throw new Error(`${field} must be a supported RemNote color.`);
  }
}

export function requiredHeadingLevel(args: unknown) {
  const value = getStringField(args, 'level');
  switch (value) {
    case 'H1':
    case 'H2':
    case 'H3':
    case 'normal':
      return value;
    default:
      throw new Error('level must be H1, H2, H3, or normal.');
  }
}

export function requiredRemType(args: unknown) {
  const value = getStringField(args, 'type');
  switch (value) {
    case 'normal':
    case 'concept':
    case 'descriptor':
      return value;
    default:
      throw new Error('type must be normal, concept, or descriptor.');
  }
}

export function optionalPracticeDirection(args: unknown) {
  const value = getStringField(args, 'direction');
  switch (value) {
    case undefined:
    case '':
      return undefined;
    case 'forward':
    case 'backward':
    case 'none':
    case 'both':
      return value;
    default:
      throw new Error('direction must be forward, backward, none, or both.');
  }
}

export function requiredBoolean(args: unknown, field: string): boolean {
  if (!isPlainObject(args) || typeof args[field] !== 'boolean') {
    throw new Error(`${field} must be a boolean.`);
  }

  return args[field] as boolean;
}

export function requiredRange(args: unknown): { start: number; end: number } {
  if (!isPlainObject(args) || !isPlainObject(args.range)) {
    throw new Error('Missing range.');
  }

  const { start, end } = args.range as Record<string, unknown>;
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new Error('range.start and range.end must be integers.');
  }

  return { start: start as number, end: end as number };
}

export function optionalRangeInput(args: unknown): Pick<SetTextSpanColorArgs, 'range' | 'start' | 'end' | 'text' | 'occurrence'> {
  if (!isPlainObject(args)) {
    return {};
  }

  const range = isPlainObject(args.range) ? requiredRange(args) : undefined;
  const start = typeof args.start === 'number' && Number.isInteger(args.start) ? args.start : undefined;
  const end = typeof args.end === 'number' && Number.isInteger(args.end) ? args.end : undefined;
  const text = typeof args.text === 'string' && args.text.trim() ? args.text.trim() : undefined;
  const occurrence =
    typeof args.occurrence === 'number' && Number.isInteger(args.occurrence)
      ? args.occurrence
      : undefined;
  if (!range && (start === undefined || end === undefined) && !text) {
    throw new Error('Provide range, start/end, or text for span formatting.');
  }

  return {
    ...(range ? { range } : {}),
    ...(start !== undefined ? { start } : {}),
    ...(end !== undefined ? { end } : {}),
    ...(text ? { text } : {}),
    ...(occurrence !== undefined ? { occurrence } : {}),
  };
}

export function requiredStyleOperations(args: unknown): ApplyStylePlanArgs['operations'] {
  if (!isPlainObject(args) || !Array.isArray(args.operations) || !args.operations.length) {
    throw new Error('Missing operations.');
  }

  return normalizeStyleOperations(args.operations);
}

export function normalizeStyleOperations(operations: unknown[]): ApplyStylePlanArgs['operations'] {
  return operations.map((operation) => {
    if (!isPlainObject(operation)) {
      throw new Error('Style operation must be an object.');
    }
    const type = getStringField(operation, 'type');
    const explicitValue =
      getStringField(operation, 'value') ??
      getStringField(operation, 'headingLevel') ??
      getStringField(operation, 'highlightColor') ??
      getStringField(operation, 'color') ??
      getStringField(operation, 'latex');
    if (!explicitValue && type !== 'bold_span' && type !== 'italic_span') {
      throw new Error(`Style operation ${type ?? 'unknown'} needs headingLevel, color, highlightColor, latex, or value.`);
    }

    return {
      ...operation,
      value: explicitValue ?? type ?? 'apply',
    } as ApplyStylePlanArgs['operations'][number];
  });
}

export function optionalStylingPlan(args: unknown): CreatePolishedNoteTreeArgs['stylingPlan'] | undefined {
  if (!isPlainObject(args) || !isPlainObject(args.stylingPlan)) {
    return undefined;
  }

  const operations = Array.isArray(args.stylingPlan.operations)
    ? normalizeStyleOperations(args.stylingPlan.operations)
    : undefined;
  return operations
    ? {
        operations,
        dryRun: optionalBoolean(args.stylingPlan, 'dryRun'),
        idempotencyKey: optionalIdempotencyKey(args.stylingPlan),
      }
    : undefined;
}

export function requiredExpectedStyleMap(args: unknown): VerifyNoteDesignArgs['expectedStyleMap'] {
  if (!isPlainObject(args)) {
    throw new Error('Missing expectedStyleMap.');
  }
  if (Array.isArray(args.expectations)) {
    return Object.fromEntries(
      args.expectations.map((entry) => {
        if (!isPlainObject(entry) || typeof entry.remId !== 'string') {
          throw new Error('expectations entries must include remId.');
        }
        const { remId: _remId, ...expected } = entry;
        return [entry.remId, expected];
      })
    ) as VerifyNoteDesignArgs['expectedStyleMap'];
  }
  if (Array.isArray(args.expectedStyles)) {
    return Object.fromEntries(
      args.expectedStyles.map((entry) => {
        if (!isPlainObject(entry) || typeof entry.remId !== 'string' || !isPlainObject(entry.expected)) {
          throw new Error('expectedStyles entries must include remId and expected.');
        }
        return [entry.remId, entry.expected];
      })
    ) as VerifyNoteDesignArgs['expectedStyleMap'];
  }
  if (!isPlainObject(args.expectedStyleMap)) {
    throw new Error('Missing expectedStyleMap.');
  }

  return args.expectedStyleMap as VerifyNoteDesignArgs['expectedStyleMap'];
}

export function requiredStringArray(args: unknown, field: string, maxItems = 50): string[] {
  if (!isPlainObject(args) || !Array.isArray(args[field])) {
    throw new Error(`Missing ${field}.`);
  }

  const items = args[field] as unknown[];
  if (!items.length || items.length > maxItems) {
    throw new Error(`${field} must contain 1-${maxItems} items.`);
  }

  return items.map((item, index) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new Error(`${field}[${index}] must be a non-empty string.`);
    }

    return item.trim();
  });
}

export function optionalScope(args: unknown): SearchRemsArgs['scope'] {
  if (!isPlainObject(args)) {
    return undefined;
  }

  const value = args.scope;
  switch (value) {
    case 'current_permission_scope':
    case 'focused_rem_only':
    case 'focused_rem_and_descendants':
    case 'selected_rem_only':
    case 'selected_rem_and_descendants':
    case 'approved_document_or_folder':
    case 'workspace_allowed':
      return value;
    default:
      return undefined;
  }
}
