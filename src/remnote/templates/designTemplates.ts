import type { PluginRem as Rem, RNPlugin, RichTextInterface } from '@remnote/plugin-sdk';
import type {
  AnalyzeNoteDesignArgs,
  AnalyzeNoteDesignResult,
  ExportNoteDesignTemplateArgs,
  ExportNoteDesignTemplateResult,
  ImportNoteDesignTemplateArgs,
  ImportNoteDesignTemplateResult,
  ListNoteDesignTemplatesArgs,
  ListNoteDesignTemplatesResult,
  NoteDesignRules,
  NoteStylePreset,
  NoteDesignTemplate,
  NoteDesignTemplateSummary,
  PreviewNoteDesignPlanArgs,
  PreviewNoteDesignPlanResult,
  RemColorName,
  RemHeadingLevel,
  SaveNoteDesignTemplateArgs,
  SaveNoteDesignTemplateResult,
} from '../../../shared/bridge/protocol';
import { RemnoteWriteError, runSdkOperation } from '../write/writeErrors';
import { findRequiredRem, getRemPlainString, getRemRichText } from '../write/remnoteSdkHelpers';

const DESIGN_TEMPLATE_STORAGE_KEY = 'bridge-note-design-templates-v1';
const TEMPLATE_SCHEMA_VERSION = 1;
const DEFAULT_MAX_DEPTH = 4;
const DEFAULT_MAX_NODES = 200;
const DEFAULT_STYLE_PRESET: NoteStylePreset = 'clean_academic';

const COLOR_BY_NUMBER: Record<number, RemColorName> = {
  1: 'red',
  2: 'orange',
  3: 'yellow',
  4: 'green',
  5: 'purple',
  6: 'blue',
};

const UNSAFE_RULE_WORDS = [
  'delete',
  'delete_rem_by_id',
  'replace_rem',
  'remove',
  'destroy',
  'script',
  'eval',
  'shell',
  'network',
  'fetch',
];

interface TemplateStore {
  schemaVersion: 1;
  templates: NoteDesignTemplate[];
}

interface DesignRecord {
  rem: Rem;
  plainText: string;
  depth: number;
  childCount: number;
  headingLevel: RemHeadingLevel;
  wholeRemHighlight?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function stableHash(value: unknown): string {
  const input = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function normalizeNoteDesignTemplate(template: NoteDesignTemplate): Record<string, unknown> {
  return {
    schemaVersion: template.schemaVersion,
    templateId: template.templateId,
    name: template.name,
    description: template.description,
    sourceRemId: template.sourceRemId,
    conflictBehavior: template.conflictBehavior,
    rules: template.rules,
  };
}

export function hashNoteDesignTemplate(template: NoteDesignTemplate): string {
  return stableHash(normalizeNoteDesignTemplate(template));
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(value as number), min), max);
}

function safeTemplateId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return `design-${slug || 'template'}`;
}

function incrementCount(record: Record<string, number>, key: string | undefined): void {
  if (!key) {
    return;
  }
  record[key] = (record[key] ?? 0) + 1;
}

export function defaultNoteDesignRules(stylePreset: NoteStylePreset = DEFAULT_STYLE_PRESET): NoteDesignRules {
  const formulaHeavy = stylePreset === 'formula_heavy';
  const colorful = stylePreset === 'colorful_study';
  const examReady = stylePreset === 'exam_ready';
  return {
    headingPattern: {
      rootHeadingLevel: 'H1',
      sectionHeadingLevel: 'H3',
      headingCounts: {},
      directChildHeadingCounts: {},
    },
    colorPattern: {
      textColors: {},
      highlightColors: colorful || examReady || formulaHeavy ? { Yellow: 1 } : {},
      wholeRemHighlights: {},
    },
    spacingPattern: {
      spacerCount: 0,
      spacerTexts: [],
      blankRemCount: 0,
      siblingSpacerLikely: false,
    },
    mathPattern: {
      inlineMathCount: 0,
      blockMathCount: 0,
      visibleDelimiterCount: 0,
      malformedMathLikely: false,
    },
    bulletNesting: {
      maxDepth: formulaHeavy ? 5 : 4,
      maxChildrenPerRem: formulaHeavy ? 20 : 14,
      averageChildrenPerNonLeaf: 0,
    },
    formulaPlacement: {
      displayFormulasAsSeparateRems: formulaHeavy,
      inlineFormulasInsideText: true,
      rawDisplayDelimitersVisible: false,
    },
    tableStyle: {
      tableLikeRemCount: 0,
      markdownTableCount: 0,
      tableHeadings: [],
    },
    cardStyle: {
      cardLikeRemCount: examReady ? 1 : 0,
      clozeLikeRemCount: 0,
      doubleColonMarkerCount: 0,
    },
    workedExampleStyle: {
      workedExampleCount: 0,
      labels: examReady ? ['Exam Tip', 'Common Mistake'] : [],
    },
    stylePreset,
  };
}

function richTextRecords(richText: RichTextInterface | undefined): Array<Record<string, unknown>> {
  const records: Array<Record<string, unknown>> = [];
  for (const item of richText ?? []) {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      records.push(item as unknown as Record<string, unknown>);
    }
  }
  return records;
}

function collectRichTextColorStats(
  richText: RichTextInterface | undefined,
  textColors: Record<string, number>,
  highlightColors: Record<string, number>
): void {
  for (const item of richTextRecords(richText)) {
    const textColor = typeof item.tc === 'number' ? COLOR_BY_NUMBER[item.tc] : undefined;
    const highlightColor = typeof item.h === 'number' ? COLOR_BY_NUMBER[item.h] : undefined;
    incrementCount(textColors, textColor);
    incrementCount(highlightColors, highlightColor);
  }
}

function countMath(richText: RichTextInterface | undefined): { inline: number; block: number } {
  let inline = 0;
  let block = 0;
  for (const item of richTextRecords(richText)) {
    const isMath = item.i === 'x' || item.type === 'inlineMath' || item.type === 'mathBlock' || item.latex !== undefined;
    if (!isMath) {
      continue;
    }
    if (item.block === true || item.type === 'mathBlock') {
      block += 1;
    } else {
      inline += 1;
    }
  }
  return { inline, block };
}

function normalizeHeadingLevel(value: unknown): RemHeadingLevel {
  return value === 'H1' || value === 'H2' || value === 'H3' ? value : 'normal';
}

async function collectDesignRecords(
  plugin: RNPlugin,
  root: Rem,
  maxDepth: number,
  maxNodes: number
): Promise<DesignRecord[]> {
  const records: DesignRecord[] = [];
  const seen = new Set<string>();

  async function visit(rem: Rem, depth: number): Promise<void> {
    if (records.length >= maxNodes || seen.has(rem._id)) {
      return;
    }
    seen.add(rem._id);
    const children = depth < maxDepth
      ? await runSdkOperation('rem.getChildrenRem', () => rem.getChildrenRem()).catch(() => [])
      : [];
    records.push({
      rem,
      plainText: await getRemPlainString(plugin, rem).catch(() => ''),
      depth,
      childCount: children.length,
      headingLevel: normalizeHeadingLevel(await rem.getFontSize().catch(() => undefined)),
      wholeRemHighlight: String(await rem.getHighlightColor().catch(() => '') || '').toLowerCase() || undefined,
    });

    for (const child of children) {
      await visit(child, depth + 1);
    }
  }

  await visit(root, 0);
  return records;
}

function buildRules(records: DesignRecord[]): NoteDesignRules {
  const headingCounts: Partial<Record<RemHeadingLevel, number>> = {};
  const directChildHeadingCounts: Partial<Record<RemHeadingLevel, number>> = {};
  const textColors: Record<string, number> = {};
  const highlightColors: Record<string, number> = {};
  const wholeRemHighlights: Record<string, number> = {};
  const spacerTexts = new Set<string>();
  const tableHeadings = new Set<string>();
  const workedLabels = new Set<string>();
  let blankRemCount = 0;
  let spacerCount = 0;
  let inlineMathCount = 0;
  let blockMathCount = 0;
  let visibleDelimiterCount = 0;
  let tableLikeRemCount = 0;
  let markdownTableCount = 0;
  let cardLikeRemCount = 0;
  let clozeLikeRemCount = 0;
  let doubleColonMarkerCount = 0;
  let workedExampleCount = 0;
  let nonLeafCount = 0;
  let childTotalForNonLeaf = 0;
  let maxChildrenPerRem = 0;

  for (const record of records) {
    headingCounts[record.headingLevel] = (headingCounts[record.headingLevel] ?? 0) + 1;
    if (record.depth === 1) {
      directChildHeadingCounts[record.headingLevel] = (directChildHeadingCounts[record.headingLevel] ?? 0) + 1;
    }
    if (record.wholeRemHighlight && record.wholeRemHighlight !== 'default') {
      incrementCount(wholeRemHighlights, record.wholeRemHighlight);
    }
    collectRichTextColorStats(getRemRichText(record.rem), textColors, highlightColors);
    const math = countMath(getRemRichText(record.rem));
    inlineMathCount += math.inline;
    blockMathCount += math.block;
    if (/\$\$|\\\[|\\\]/.test(record.plainText)) {
      visibleDelimiterCount += 1;
    }

    const trimmed = record.plainText.trim();
    if (!trimmed) {
      blankRemCount += 1;
      spacerCount += 1;
      spacerTexts.add('');
    }
    if (/^[-_*]{3,}$/.test(trimmed)) {
      spacerCount += 1;
      spacerTexts.add(trimmed);
    }
    if (/^\|.+\|$/.test(trimmed)) {
      markdownTableCount += 1;
      tableLikeRemCount += 1;
      tableHeadings.add(trimmed.slice(0, 120));
    }
    if (/table/i.test(trimmed)) {
      tableLikeRemCount += 1;
    }
    if (/::/.test(trimmed)) {
      doubleColonMarkerCount += 1;
      cardLikeRemCount += 1;
    }
    if (/\{\{.+?\}\}/.test(trimmed)) {
      clozeLikeRemCount += 1;
      cardLikeRemCount += 1;
    }
    const worked = /\b(worked example|example|solution)\b/i.exec(trimmed);
    if (worked) {
      workedExampleCount += 1;
      workedLabels.add(worked[0]);
    }
    if (record.childCount > 0) {
      nonLeafCount += 1;
      childTotalForNonLeaf += record.childCount;
      maxChildrenPerRem = Math.max(maxChildrenPerRem, record.childCount);
    }
  }

  const rootHeadingLevel = records[0]?.headingLevel && records[0].headingLevel !== 'normal'
    ? records[0].headingLevel
    : undefined;
  const childHeadingEntries = Object.entries(directChildHeadingCounts).sort((a, b) => b[1] - a[1]);
  const sectionHeadingLevel = childHeadingEntries[0]?.[0] as RemHeadingLevel | undefined;

  return {
    headingPattern: {
      rootHeadingLevel,
      sectionHeadingLevel,
      headingCounts,
      directChildHeadingCounts,
    },
    colorPattern: {
      textColors,
      highlightColors,
      wholeRemHighlights,
    },
    spacingPattern: {
      spacerCount,
      spacerTexts: [...spacerTexts].slice(0, 10),
      blankRemCount,
      siblingSpacerLikely: spacerCount > 0,
    },
    mathPattern: {
      inlineMathCount,
      blockMathCount,
      visibleDelimiterCount,
      malformedMathLikely: visibleDelimiterCount > 0 && blockMathCount === 0,
    },
    bulletNesting: {
      maxDepth: records.reduce((max, record) => Math.max(max, record.depth), 0),
      maxChildrenPerRem,
      averageChildrenPerNonLeaf: nonLeafCount ? Number((childTotalForNonLeaf / nonLeafCount).toFixed(2)) : 0,
    },
    formulaPlacement: {
      displayFormulasAsSeparateRems: blockMathCount > 0,
      inlineFormulasInsideText: inlineMathCount > 0,
      rawDisplayDelimitersVisible: visibleDelimiterCount > 0,
    },
    tableStyle: {
      tableLikeRemCount,
      markdownTableCount,
      tableHeadings: [...tableHeadings].slice(0, 10),
    },
    cardStyle: {
      cardLikeRemCount,
      clozeLikeRemCount,
      doubleColonMarkerCount,
    },
    workedExampleStyle: {
      workedExampleCount,
      labels: [...workedLabels].slice(0, 10),
    },
  };
}

function templateSummary(template: NoteDesignTemplate): NoteDesignTemplateSummary {
  return {
    templateId: template.templateId,
    name: template.name,
    description: template.description,
    sourceRemId: template.sourceRemId,
    updatedAt: template.updatedAt,
    version: template.version,
  };
}

async function readTemplateStore(plugin: RNPlugin): Promise<TemplateStore> {
  const stored = await plugin.storage.getLocal<TemplateStore>(DESIGN_TEMPLATE_STORAGE_KEY).catch(() => undefined);
  if (!stored || stored.schemaVersion !== TEMPLATE_SCHEMA_VERSION || !Array.isArray(stored.templates)) {
    return { schemaVersion: TEMPLATE_SCHEMA_VERSION, templates: [] };
  }
  return stored;
}

async function writeTemplateStore(plugin: RNPlugin, store: TemplateStore): Promise<void> {
  await plugin.storage.setLocal(DESIGN_TEMPLATE_STORAGE_KEY, store);
}

function assertSafeRules(value: unknown, path = 'template'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeRules(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== 'object' || value === null) {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (UNSAFE_RULE_WORDS.some((word) => normalized.includes(word))) {
        throw new RemnoteWriteError('INVALID_ARGS', `Template contains unsafe operation rule at ${path}.`, {
          path,
          value,
        });
      }
    }
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase();
    if ((normalizedKey === 'destructive' || normalizedKey === 'requiresdelete') && child === true) {
      throw new RemnoteWriteError('INVALID_ARGS', `Template contains unsafe destructive flag at ${path}.${key}.`);
    }
    if (UNSAFE_RULE_WORDS.some((word) => normalizedKey.includes(word))) {
      throw new RemnoteWriteError('INVALID_ARGS', `Template contains unsafe operation rule at ${path}.${key}.`);
    }
    assertSafeRules(child, `${path}.${key}`);
  }
}

function validateTemplateShape(template: Partial<NoteDesignTemplate>): NoteDesignTemplate {
  if (template.schemaVersion !== TEMPLATE_SCHEMA_VERSION) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Design template schemaVersion must be 1.');
  }
  if (!template.templateId || !template.name || !template.rules) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Design template requires templateId, name, and rules.');
  }
  assertSafeRules(template.rules);
  return {
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    templateId: String(template.templateId).trim().slice(0, 128),
    name: String(template.name).trim().slice(0, 120),
    description: template.description ? String(template.description).slice(0, 1000) : undefined,
    sourceRemId: template.sourceRemId ? String(template.sourceRemId).slice(0, 256) : undefined,
    createdAt: template.createdAt ?? nowIso(),
    updatedAt: template.updatedAt ?? nowIso(),
    version: Number.isInteger(template.version) ? template.version as number : 1,
    conflictBehavior: template.conflictBehavior ?? 'versioned_reject',
    rules: template.rules,
    localOnly: true,
  };
}

function parseTemplateJson(templateJson: string): NoteDesignTemplate {
  let parsed: unknown;
  try {
    parsed = JSON.parse(templateJson);
  } catch {
    throw new RemnoteWriteError('INVALID_ARGS', 'templateJson is not valid JSON.');
  }
  const template = typeof parsed === 'object' && parsed !== null && 'template' in parsed
    ? (parsed as { template?: unknown }).template
    : parsed;
  return validateTemplateShape(template as Partial<NoteDesignTemplate>);
}

async function resolveSampleRem(plugin: RNPlugin, args: AnalyzeNoteDesignArgs): Promise<Rem> {
  const requestedId = args.rootRemId ?? args.sampleRemId;
  if (requestedId) {
    return findRequiredRem(plugin, requestedId, 'Target');
  }
  const focused = await plugin.focus.getFocusedRem().catch(() => undefined);
  if (!focused) {
    throw new RemnoteWriteError('NO_FOCUSED_REM', 'Provide rootRemId/sampleRemId or focus a sample Rem.');
  }
  return focused;
}

export async function analyzeNoteDesign(
  plugin: RNPlugin,
  args: AnalyzeNoteDesignArgs
): Promise<AnalyzeNoteDesignResult> {
  const root = await resolveSampleRem(plugin, args);
  const maxDepth = clampInt(args.maxDepth, DEFAULT_MAX_DEPTH, 0, 8);
  const maxNodes = clampInt(args.maxNodes, DEFAULT_MAX_NODES, 1, 500);
  const records = await collectDesignRecords(plugin, root, maxDepth, maxNodes);
  const rules = buildRules(records);
  return {
    status: 'analyzed',
    reusable: true,
    sourceRemId: root._id,
    analyzedNodeCount: records.length,
    maxDepth,
    rules,
    summary: [
      `heading root=${rules.headingPattern.rootHeadingLevel ?? 'normal'} sections=${rules.headingPattern.sectionHeadingLevel ?? 'mixed'}`,
      `nesting maxDepth=${rules.bulletNesting.maxDepth} maxChildren=${rules.bulletNesting.maxChildrenPerRem}`,
      `math inline=${rules.mathPattern.inlineMathCount} block=${rules.mathPattern.blockMathCount} visibleDelimiters=${rules.mathPattern.visibleDelimiterCount}`,
      `cards=${rules.cardStyle.cardLikeRemCount} tables=${rules.tableStyle.tableLikeRemCount} workedExamples=${rules.workedExampleStyle.workedExampleCount}`,
    ],
    warnings: records.length >= maxNodes ? ['Analysis stopped at maxNodes; template may be partial.'] : undefined,
  };
}

export async function saveNoteDesignTemplate(
  plugin: RNPlugin,
  args: SaveNoteDesignTemplateArgs
): Promise<SaveNoteDesignTemplateResult> {
  const name = args.name.trim();
  if (!name) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Template name is required.');
  }
  const sourceRemId = args.sourceRemId ?? args.rootRemId;
  const rules = args.rules ?? (await analyzeNoteDesign(plugin, { rootRemId: sourceRemId })).rules;
  assertSafeRules(rules);
  const store = await readTemplateStore(plugin);
  const templateId = (args.templateId?.trim() || safeTemplateId(name)).slice(0, 128);
  const existingIndex = store.templates.findIndex((template) => template.templateId === templateId);
  if (existingIndex >= 0 && !args.overwrite) {
    return {
      status: 'already_exists',
      template: store.templates[existingIndex],
      templateCount: store.templates.length,
    };
  }
  const existing = existingIndex >= 0 ? store.templates[existingIndex] : undefined;
  const template: NoteDesignTemplate = validateTemplateShape({
    schemaVersion: TEMPLATE_SCHEMA_VERSION,
    templateId,
    name,
    description: args.description,
    sourceRemId,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    version: (existing?.version ?? 0) + 1,
    conflictBehavior: 'versioned_reject',
    rules,
    localOnly: true,
  });
  if (existingIndex >= 0) {
    store.templates[existingIndex] = template;
  } else {
    store.templates.push(template);
  }
  await writeTemplateStore(plugin, store);
  return {
    status: 'saved',
    template,
    templateCount: store.templates.length,
  };
}

export async function listNoteDesignTemplates(
  plugin: RNPlugin,
  args: ListNoteDesignTemplatesArgs
): Promise<ListNoteDesignTemplatesResult> {
  const store = await readTemplateStore(plugin);
  return {
    status: 'listed',
    count: store.templates.length,
    templates: args.includeRules ? store.templates : store.templates.map(templateSummary),
  };
}

export async function getNoteDesignTemplate(
  plugin: RNPlugin,
  templateId: string
): Promise<NoteDesignTemplate | undefined> {
  const store = await readTemplateStore(plugin);
  return store.templates.find((template) => template.templateId === templateId);
}

async function resolveRulesForPreview(
  plugin: RNPlugin,
  args: PreviewNoteDesignPlanArgs
): Promise<{ rules: NoteDesignRules; templateId?: string }> {
  if (args.rules) {
    assertSafeRules(args.rules);
    return { rules: args.rules };
  }
  if (args.templateJson) {
    const template = parseTemplateJson(args.templateJson);
    return { rules: template.rules, templateId: template.templateId };
  }
  if (args.templateId) {
    const template = await getNoteDesignTemplate(plugin, args.templateId);
    if (!template) {
      throw new RemnoteWriteError('INVALID_ARGS', `Design template "${args.templateId}" was not found.`);
    }
    return { rules: template.rules, templateId: template.templateId };
  }
  return { rules: defaultNoteDesignRules(args.stylePreset ?? DEFAULT_STYLE_PRESET) };
}

export async function previewNoteDesignPlan(
  plugin: RNPlugin,
  args: PreviewNoteDesignPlanArgs
): Promise<PreviewNoteDesignPlanResult> {
  const { rules, templateId } = await resolveRulesForPreview(plugin, args);
  const mode = args.mode ?? (args.targetRemId ? 'repair' : 'create');
  const plannedChanges = [
    `Mode: ${mode}.`,
    `Style preset: ${rules.stylePreset ?? DEFAULT_STYLE_PRESET}.`,
    `Heading pattern: root ${rules.headingPattern.rootHeadingLevel ?? 'normal'}, sections ${rules.headingPattern.sectionHeadingLevel ?? 'mixed'}.`,
    `Nesting: max depth ${rules.bulletNesting.maxDepth}, max children ${rules.bulletNesting.maxChildrenPerRem}.`,
    `Math: inline ${rules.mathPattern.inlineMathCount}, block ${rules.mathPattern.blockMathCount}, visible delimiters ${rules.mathPattern.visibleDelimiterCount}.`,
    `Cards/tables/examples: ${rules.cardStyle.cardLikeRemCount}/${rules.tableStyle.tableLikeRemCount}/${rules.workedExampleStyle.workedExampleCount}.`,
  ];
  if (args.title) {
    plannedChanges.push(`Target title: ${args.title}.`);
  }
  if (args.content) {
    plannedChanges.push(`Content preview length: ${args.content.length} chars.`);
  }

  return {
    status: 'previewed',
    dryRun: true,
    templateId,
    targetRemId: args.targetRemId,
    parentId: args.parentId,
    title: args.title,
    mode,
    plannedChanges,
    warnings: rules.mathPattern.malformedMathLikely
      ? ['Template sample contains visible display-math delimiters; verify formulas before writing.']
      : [],
    rules,
  };
}

export async function exportNoteDesignTemplate(
  plugin: RNPlugin,
  args: ExportNoteDesignTemplateArgs
): Promise<ExportNoteDesignTemplateResult> {
  const template = await getNoteDesignTemplate(plugin, args.templateId);
  if (!template) {
    throw new RemnoteWriteError('INVALID_ARGS', `Design template "${args.templateId}" was not found.`);
  }
  const normalizedTemplate = normalizeNoteDesignTemplate(template);
  const normalizedTemplateHash = stableHash(normalizedTemplate);
  const templateJson = JSON.stringify(
    {
      exportedAt: nowIso(),
      normalizedTemplateHash,
      template,
    },
    null,
    2
  );
  return {
    status: 'exported',
    templateId: template.templateId,
    templateJson,
    template,
    normalizedTemplate,
    normalizedTemplateHash,
  };
}

export async function importNoteDesignTemplate(
  plugin: RNPlugin,
  args: ImportNoteDesignTemplateArgs
): Promise<ImportNoteDesignTemplateResult> {
  const imported = parseTemplateJson(args.templateJson);
  const importedTemplateHash = hashNoteDesignTemplate(imported);
  const store = await readTemplateStore(plugin);
  const existingIndex = store.templates.findIndex((template) => template.templateId === imported.templateId);
  if (existingIndex >= 0 && !args.overwrite) {
    const existingNormalized = normalizeNoteDesignTemplate(store.templates[existingIndex]);
    const existingHash = stableHash(existingNormalized);
    return {
      status: 'already_exists',
      template: store.templates[existingIndex],
      templateCount: store.templates.length,
      warnings: ['Template already exists. Pass overwrite=true to replace it.'],
      normalizedTemplate: existingNormalized,
      normalizedTemplateHash: existingHash,
      importedTemplateHash,
      roundTripEqual: existingHash === importedTemplateHash,
    };
  }
  const template = {
    ...imported,
    localOnly: true as const,
    updatedAt: nowIso(),
    version: existingIndex >= 0 ? store.templates[existingIndex].version + 1 : imported.version,
  };
  if (existingIndex >= 0) {
    store.templates[existingIndex] = template;
  } else {
    store.templates.push(template);
  }
  await writeTemplateStore(plugin, store);
  const normalizedTemplate = normalizeNoteDesignTemplate(template);
  const normalizedTemplateHash = stableHash(normalizedTemplate);
  return {
    status: 'imported',
    template,
    templateCount: store.templates.length,
    normalizedTemplate,
    normalizedTemplateHash,
    importedTemplateHash,
    roundTripEqual: normalizedTemplateHash === importedTemplateHash,
  };
}
