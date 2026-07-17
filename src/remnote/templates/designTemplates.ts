import { RemType } from '@remnote/plugin-sdk';
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
  NoteDesignRoleRules,
  NoteDesignRoleTreatment,
  NoteStylePreset,
  NoteDesignTemplate,
  NoteDesignTemplateSummary,
  PreviewNoteDesignPlanArgs,
  PreviewNoteDesignPlanResult,
  RemColorName,
  RemHeadingLevel,
  RemTypeName,
  RichTextSpanStyle,
  SaveNoteDesignTemplateArgs,
  SaveNoteDesignTemplateResult,
} from '../../../shared/bridge/protocol';
import { RemnoteWriteError, runSdkOperation } from '../write/writeErrors';
import { findRequiredRem, getRemPlainString, getRemRichText } from '../write/remnoteSdkHelpers';
import { getContentChildren } from '../serialize';
import { compileNoteDesignPlan } from './designPlanCompiler';

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

function containsUnsafeRuleWord(value: string): boolean {
  const separated = value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  return UNSAFE_RULE_WORDS.some((word) =>
    new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`).test(separated)
  );
}

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
  parentId?: string;
  remType: RemTypeName;
  hideBullet: boolean;
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

function richStyleFromRecord(item: Record<string, unknown>): RichTextSpanStyle | undefined {
  const style: RichTextSpanStyle = {};
  if (item.b === true) style.bold = true;
  if (item.i === true || item.italic === true) style.italic = true;
  if (item.u === true || item.underline === true) style.underline = true;
  if (item.q === true || item.quote === true) style.quote = true;
  if (typeof item.tc === 'number' && COLOR_BY_NUMBER[item.tc]) style.color = COLOR_BY_NUMBER[item.tc];
  if (typeof item.h === 'number' && COLOR_BY_NUMBER[item.h]) style.highlight = COLOR_BY_NUMBER[item.h];
  return Object.keys(style).length ? style : undefined;
}

function fullTextStyle(record: DesignRecord): RichTextSpanStyle | undefined {
  const textItems = richTextRecords(getRemRichText(record.rem)).filter((item) =>
    typeof item.text === 'string' && item.text.length > 0 && item.i !== 'x'
  );
  if (!textItems.length) return undefined;
  const styles = textItems.map(richStyleFromRecord);
  const first = styles[0];
  if (!first) return undefined;
  return styles.every((style) => stableStringify(style) === stableStringify(first)) ? first : undefined;
}

function prefixStyle(record: DesignRecord): RichTextSpanStyle | undefined {
  const firstText = richTextRecords(getRemRichText(record.rem)).find((item) =>
    typeof item.text === 'string' && item.text.length > 0 && item.i !== 'x'
  );
  return firstText ? richStyleFromRecord(firstText) : undefined;
}

function recordTreatment(
  record: DesignRecord,
  textStyleMode: 'full' | 'prefix' | 'none' = 'full'
): NoteDesignRoleTreatment | undefined {
  const remStyle: NonNullable<NoteDesignRoleTreatment['remStyle']> = {};
  if (record.headingLevel !== 'normal') remStyle.headingLevel = record.headingLevel;
  remStyle.hideBullet = record.hideBullet;
  if (record.remType !== 'normal') remStyle.remType = record.remType;
  const style = textStyleMode === 'full'
    ? fullTextStyle(record)
    : textStyleMode === 'prefix'
      ? prefixStyle(record)
      : undefined;
  const treatment: NoteDesignRoleTreatment = {
    ...(Object.keys(remStyle).length ? { remStyle } : {}),
    ...(textStyleMode === 'full' && style ? { fullTextStyle: style } : {}),
    ...(textStyleMode === 'prefix' && style ? { prefixStyle: style } : {}),
  };
  return Object.keys(treatment).length ? treatment : undefined;
}

function mathStyle(record: DesignRecord): RichTextSpanStyle | undefined {
  const mathItems = richTextRecords(getRemRichText(record.rem)).filter((item) => item.i === 'x');
  if (!mathItems.length) return undefined;
  const styles = mathItems.map(richStyleFromRecord);
  const first = styles[0];
  if (!first) return undefined;
  return styles.every((style) => stableStringify(style) === stableStringify(first)) ? first : undefined;
}

function formulaRecord(record: DesignRecord): boolean {
  const math = countMath(getRemRichText(record.rem));
  if (math.inline + math.block > 0) return true;
  const text = record.plainText.trim();
  return text.length <= 240 && /[=≈⇌→]/.test(text) && !/[.!?]\s/.test(text);
}

function buildRoleRules(records: DesignRecord[]): NoteDesignRoleRules | undefined {
  const byId = new Map(records.map((record) => [record.rem._id, record]));
  const first = (predicate: (record: DesignRecord) => boolean) => records.find(predicate);
  const treatment = (
    predicate: (record: DesignRecord) => boolean,
    mode: 'full' | 'prefix' | 'none' = 'full'
  ) => {
    const record = first(predicate);
    return record ? recordTreatment(record, mode) : undefined;
  };
  const answerRecord = first((record) => {
    const parent = record.parentId ? byId.get(record.parentId) : undefined;
    return /^answer(?:\s+treatment)?$/i.test(parent?.plainText.trim() ?? '');
  }) ?? first((record) => /^answer(?:\s+treatment)?(?:\s*:|$)/i.test(record.plainText.trim()));
  const summaryRecord = first((record) => {
    const parent = record.parentId ? byId.get(record.parentId) : undefined;
    return /^(?:\d+(?:\.\d+)*[.)]?\s+)?summary$/i.test(parent?.plainText.trim() ?? '');
  });
  const warningRecord = first((record) => /^warning\s+treatment$/i.test(record.plainText.trim()))
    ?? first((record) => /^warning\s*:/i.test(record.plainText.trim()));
  const formula = first(formulaRecord);
  const formulaMathStyle = formula ? mathStyle(formula) : undefined;
  const formulaTreatment = formula ? {
    ...(recordTreatment(formula) ?? {}),
    ...(formulaMathStyle ? { mathStyle: formulaMathStyle } : {}),
  } : undefined;
  const rules: NoteDesignRoleRules = {
    root: records[0] ? recordTreatment(records[0], 'full') : undefined,
    section: treatment((record) => record.depth === 1 && record.plainText !== '\u200b' && record.plainText.trim().length > 0),
    keyIdea: treatment((record) => /^key\s+idea\s*:/i.test(record.plainText.trim()), 'prefix'),
    formula: formulaTreatment && Object.keys(formulaTreatment).length ? formulaTreatment : undefined,
    workedExample: treatment((record) => /^(problem|given|formula|substitution|answer)$/i.test(record.plainText.trim())),
    answer: answerRecord ? recordTreatment(answerRecord) : undefined,
    warning: warningRecord
      ? recordTreatment(warningRecord, /^warning\s+treatment$/i.test(warningRecord.plainText.trim()) ? 'full' : 'prefix')
      : undefined,
    summary: summaryRecord ? recordTreatment(summaryRecord) : undefined,
    concept: treatment((record) => record.remType === 'concept', 'none'),
    descriptor: treatment((record) => record.remType === 'descriptor', 'none'),
  };
  const compact = Object.fromEntries(
    Object.entries(rules).filter(([, value]) => value !== undefined)
  ) as NoteDesignRoleRules;
  return Object.keys(compact).length ? compact : undefined;
}

function normalizeHeadingLevel(value: unknown): RemHeadingLevel {
  return value === 'H1' || value === 'H2' || value === 'H3' ? value : 'normal';
}

function normalizeRemType(value: unknown): RemTypeName {
  if (value === RemType.CONCEPT || value === 'concept') return 'concept';
  if (value === RemType.DESCRIPTOR || value === 'descriptor') return 'descriptor';
  return 'normal';
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
      ? await runSdkOperation('rem.getChildrenRem', () => getContentChildren(plugin, rem)).catch(() => [])
      : [];
    records.push({
      rem,
      plainText: await getRemPlainString(plugin, rem).catch(() => ''),
      depth,
      childCount: children.length,
      headingLevel: normalizeHeadingLevel(await rem.getFontSize().catch(() => undefined)),
      wholeRemHighlight: String(await rem.getHighlightColor().catch(() => '') || '').toLowerCase() || undefined,
      parentId: typeof rem.parent === 'string' ? rem.parent : undefined,
      remType: normalizeRemType(await rem.getType().catch(() => undefined)),
      hideBullet: !(await rem.isListItem().catch(() => true)),
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
  let separateFormulaLikeRemCount = 0;
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
    if (formulaRecord(record) && record.depth > 0) {
      separateFormulaLikeRemCount += 1;
    }
    if (/\$\$|\\\[|\\\]/.test(record.plainText)) {
      visibleDelimiterCount += 1;
    }

    const trimmed = record.plainText.trim();
    if (!trimmed || record.plainText === '\u200b') {
      blankRemCount += 1;
      spacerCount += 1;
      spacerTexts.add(record.plainText === '\u200b' ? '\u200b' : '');
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
    if (record.remType === 'concept') {
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
      displayFormulasAsSeparateRems: blockMathCount > 0 || separateFormulaLikeRemCount > 0,
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
    roleRules: buildRoleRules(records),
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
      if (containsUnsafeRuleWord(normalized)) {
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
    if (containsUnsafeRuleWord(key)) {
      throw new RemnoteWriteError('INVALID_ARGS', `Template contains unsafe operation rule at ${path}.${key}.`);
    }
    assertSafeRules(child, `${path}.${key}`);
  }
}

function designRuleRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new RemnoteWriteError('INVALID_ARGS', `Design template requires an object at ${path}.`, { path });
  }
  return value as Record<string, unknown>;
}

function requireFiniteRuleNumber(
  record: Record<string, unknown>,
  key: string,
  path: string,
  max = 10000
): void {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new RemnoteWriteError('INVALID_ARGS', `Design template requires ${path}.${key} between 0 and ${max}.`, {
      path: `${path}.${key}`,
      value,
    });
  }
}

function requireRuleBoolean(record: Record<string, unknown>, key: string, path: string): void {
  if (typeof record[key] !== 'boolean') {
    throw new RemnoteWriteError('INVALID_ARGS', `Design template requires boolean ${path}.${key}.`, {
      path: `${path}.${key}`,
      value: record[key],
    });
  }
}

function requireRuleStringArray(record: Record<string, unknown>, key: string, path: string): void {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new RemnoteWriteError('INVALID_ARGS', `Design template requires string array ${path}.${key}.`, {
      path: `${path}.${key}`,
    });
  }
}

function assertRoleRules(value: unknown): void {
  if (value === undefined) return;
  const roles = designRuleRecord(value, 'template.rules.roleRules');
  const allowedRoles = new Set([
    'root', 'section', 'keyIdea', 'formula', 'workedExample', 'answer', 'warning', 'summary', 'concept', 'descriptor',
  ]);
  for (const [role, rawTreatment] of Object.entries(roles)) {
    if (!allowedRoles.has(role)) {
      throw new RemnoteWriteError('INVALID_ARGS', `Unknown reusable design role ${role}.`, { role });
    }
    const treatment = designRuleRecord(rawTreatment, `template.rules.roleRules.${role}`);
    for (const key of Object.keys(treatment)) {
      if (!['remStyle', 'fullTextStyle', 'prefixStyle', 'mathStyle'].includes(key)) {
        throw new RemnoteWriteError('INVALID_ARGS', `Unknown treatment field ${key} for design role ${role}.`, {
          role,
          field: key,
        });
      }
    }
    for (const styleKey of ['fullTextStyle', 'prefixStyle', 'mathStyle'] as const) {
      if (treatment[styleKey] === undefined) continue;
      const style = designRuleRecord(treatment[styleKey], `template.rules.roleRules.${role}.${styleKey}`);
      for (const [key, styleValue] of Object.entries(style)) {
        if (!['color', 'highlight', 'bold', 'italic', 'underline', 'quote'].includes(key)) {
          throw new RemnoteWriteError('INVALID_ARGS', `Unknown text style ${key} for design role ${role}.`, {
            role,
            field: key,
          });
        }
        if (['bold', 'italic', 'underline', 'quote'].includes(key) && typeof styleValue !== 'boolean') {
          throw new RemnoteWriteError('INVALID_ARGS', `Design role ${role}.${styleKey}.${key} must be boolean.`);
        }
        if (['color', 'highlight'].includes(key) && typeof styleValue !== 'string') {
          throw new RemnoteWriteError('INVALID_ARGS', `Design role ${role}.${styleKey}.${key} must be a color string.`);
        }
      }
    }
    if (treatment.remStyle !== undefined) {
      const remStyle = designRuleRecord(treatment.remStyle, `template.rules.roleRules.${role}.remStyle`);
      const allowedRemStyleFields = new Set([
        'headingLevel', 'textColor', 'highlightColor', 'hideBullet', 'remType', 'color', 'highlight', 'type',
      ]);
      for (const [key, styleValue] of Object.entries(remStyle)) {
        if (!allowedRemStyleFields.has(key)) {
          throw new RemnoteWriteError('INVALID_ARGS', `Unknown Rem style ${key} for design role ${role}.`, {
            role,
            field: key,
          });
        }
        if (key === 'hideBullet' && typeof styleValue !== 'boolean') {
          throw new RemnoteWriteError('INVALID_ARGS', `Design role ${role}.remStyle.hideBullet must be boolean.`);
        }
        if (key !== 'hideBullet' && typeof styleValue !== 'string') {
          throw new RemnoteWriteError('INVALID_ARGS', `Design role ${role}.remStyle.${key} must be a string.`);
        }
      }
    }
  }
}

function assertCompleteDesignRules(value: unknown): asserts value is NoteDesignRules {
  const rules = designRuleRecord(value, 'template.rules');
  designRuleRecord(rules.headingPattern, 'template.rules.headingPattern');
  designRuleRecord(rules.colorPattern, 'template.rules.colorPattern');

  const spacing = designRuleRecord(rules.spacingPattern, 'template.rules.spacingPattern');
  requireFiniteRuleNumber(spacing, 'spacerCount', 'template.rules.spacingPattern');
  requireRuleStringArray(spacing, 'spacerTexts', 'template.rules.spacingPattern');
  requireFiniteRuleNumber(spacing, 'blankRemCount', 'template.rules.spacingPattern');
  requireRuleBoolean(spacing, 'siblingSpacerLikely', 'template.rules.spacingPattern');

  const math = designRuleRecord(rules.mathPattern, 'template.rules.mathPattern');
  requireFiniteRuleNumber(math, 'inlineMathCount', 'template.rules.mathPattern');
  requireFiniteRuleNumber(math, 'blockMathCount', 'template.rules.mathPattern');
  requireFiniteRuleNumber(math, 'visibleDelimiterCount', 'template.rules.mathPattern');
  requireRuleBoolean(math, 'malformedMathLikely', 'template.rules.mathPattern');

  const nesting = designRuleRecord(rules.bulletNesting, 'template.rules.bulletNesting');
  requireFiniteRuleNumber(nesting, 'maxDepth', 'template.rules.bulletNesting', 100);
  requireFiniteRuleNumber(nesting, 'maxChildrenPerRem', 'template.rules.bulletNesting');
  requireFiniteRuleNumber(nesting, 'averageChildrenPerNonLeaf', 'template.rules.bulletNesting');

  const formulas = designRuleRecord(rules.formulaPlacement, 'template.rules.formulaPlacement');
  requireRuleBoolean(formulas, 'displayFormulasAsSeparateRems', 'template.rules.formulaPlacement');
  requireRuleBoolean(formulas, 'inlineFormulasInsideText', 'template.rules.formulaPlacement');
  requireRuleBoolean(formulas, 'rawDisplayDelimitersVisible', 'template.rules.formulaPlacement');

  const tables = designRuleRecord(rules.tableStyle, 'template.rules.tableStyle');
  requireFiniteRuleNumber(tables, 'tableLikeRemCount', 'template.rules.tableStyle');
  requireFiniteRuleNumber(tables, 'markdownTableCount', 'template.rules.tableStyle');
  requireRuleStringArray(tables, 'tableHeadings', 'template.rules.tableStyle');

  const cards = designRuleRecord(rules.cardStyle, 'template.rules.cardStyle');
  requireFiniteRuleNumber(cards, 'cardLikeRemCount', 'template.rules.cardStyle');
  requireFiniteRuleNumber(cards, 'clozeLikeRemCount', 'template.rules.cardStyle');
  requireFiniteRuleNumber(cards, 'doubleColonMarkerCount', 'template.rules.cardStyle');

  const examples = designRuleRecord(rules.workedExampleStyle, 'template.rules.workedExampleStyle');
  requireFiniteRuleNumber(examples, 'workedExampleCount', 'template.rules.workedExampleStyle');
  requireRuleStringArray(examples, 'labels', 'template.rules.workedExampleStyle');
  assertRoleRules(rules.roleRules);
}

function sanitizeReusableRules(input: NoteDesignRules): { rules: NoteDesignRules; warnings: string[] } {
  const rules = JSON.parse(JSON.stringify(input)) as NoteDesignRules;
  const warnings: string[] = [];
  if (rules.expectedStyleMap && Object.keys(rules.expectedStyleMap).length) {
    delete rules.expectedStyleMap;
    warnings.push('Source-ID expectedStyleMap was excluded from reusable template rules.');
  }
  if (rules.tableStyle.tableHeadings.length) {
    rules.tableStyle.tableHeadings = [];
    warnings.push('Source table headings were excluded; reusable table structure counts were retained.');
  }
  const reusableLabels = /^(worked\s+example|example|solution|problem|given|formula|substitution|answer|exam\s+tip|common\s+mistake)$/i;
  const filteredLabels = rules.workedExampleStyle.labels.filter((label) => reusableLabels.test(label.trim()));
  if (filteredLabels.length !== rules.workedExampleStyle.labels.length) {
    warnings.push('Content-specific worked-example labels were excluded from reusable template rules.');
  }
  rules.workedExampleStyle.labels = filteredLabels;
  rules.spacingPattern.spacerTexts = rules.spacingPattern.spacerTexts.filter((text) =>
    text === '' || text === '\u200b' || /^[-_*]{3,}$/.test(text.trim())
  );
  return { rules, warnings };
}

function validateTemplateShape(template: Partial<NoteDesignTemplate>): NoteDesignTemplate {
  if (template.schemaVersion !== TEMPLATE_SCHEMA_VERSION) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Design template schemaVersion must be 1.');
  }
  if (!template.templateId || !template.name || !template.rules) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Design template requires templateId, name, and rules.');
  }
  assertCompleteDesignRules(template.rules);
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

async function resolveSampleRem(
  plugin: RNPlugin,
  args: AnalyzeNoteDesignArgs
): Promise<{
  rem: Rem;
  requestedSourceRemId: string;
  sourceField: 'rootRemId' | 'sampleRemId' | 'rootRemId+sampleRemId';
}> {
  if (args.rootRemId && args.sampleRemId && args.rootRemId !== args.sampleRemId) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'rootRemId and sampleRemId identify different design sources. Provide exactly one source identity.',
      { rootRemId: args.rootRemId, sampleRemId: args.sampleRemId }
    );
  }
  const requestedSourceRemId = args.rootRemId ?? args.sampleRemId;
  if (!requestedSourceRemId) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'analyze_note_design requires rootRemId or sampleRemId; focused-Rem fallback is intentionally disabled.'
    );
  }
  return {
    rem: await findRequiredRem(plugin, requestedSourceRemId, 'Target'),
    requestedSourceRemId,
    sourceField: args.rootRemId && args.sampleRemId
      ? 'rootRemId+sampleRemId'
      : args.rootRemId
        ? 'rootRemId'
        : 'sampleRemId',
  };
}

export async function analyzeNoteDesign(
  plugin: RNPlugin,
  args: AnalyzeNoteDesignArgs
): Promise<AnalyzeNoteDesignResult> {
  const resolved = await resolveSampleRem(plugin, args);
  const root = resolved.rem;
  const maxDepth = clampInt(args.maxDepth, DEFAULT_MAX_DEPTH, 0, 8);
  const maxNodes = clampInt(args.maxNodes, DEFAULT_MAX_NODES, 1, 500);
  const records = await collectDesignRecords(plugin, root, maxDepth, maxNodes);
  const sanitized = sanitizeReusableRules(buildRules(records));
  const rules = sanitized.rules;
  const warnings = [
    ...(records.length >= maxNodes ? ['Analysis stopped at maxNodes; template may be partial.'] : []),
    ...sanitized.warnings,
  ];
  return {
    status: 'analyzed',
    reusable: true,
    sourceRemId: root._id,
    sourceIdentity: {
      requestedSourceRemId: resolved.requestedSourceRemId,
      resolvedSourceRemId: root._id,
      sourceField: resolved.sourceField,
    },
    analyzedNodeCount: records.length,
    maxDepth,
    rules,
    summary: [
      `heading root=${rules.headingPattern.rootHeadingLevel ?? 'normal'} sections=${rules.headingPattern.sectionHeadingLevel ?? 'mixed'}`,
      `nesting maxDepth=${rules.bulletNesting.maxDepth} maxChildren=${rules.bulletNesting.maxChildrenPerRem}`,
      `math inline=${rules.mathPattern.inlineMathCount} block=${rules.mathPattern.blockMathCount} visibleDelimiters=${rules.mathPattern.visibleDelimiterCount}`,
      `cards=${rules.cardStyle.cardLikeRemCount} tables=${rules.tableStyle.tableLikeRemCount} workedExamples=${rules.workedExampleStyle.workedExampleCount}`,
    ],
    warnings: warnings.length ? warnings : undefined,
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
  if (args.sourceRemId && args.rootRemId && args.sourceRemId !== args.rootRemId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'sourceRemId and rootRemId identify different template sources.', {
      sourceRemId: args.sourceRemId,
      rootRemId: args.rootRemId,
    });
  }
  const sourceRemId = args.sourceRemId ?? args.rootRemId;
  if (!args.rules && !sourceRemId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Saving analyzed rules requires an explicit sourceRemId/rootRemId.');
  }
  const analyzedRules = args.rules ?? (await analyzeNoteDesign(plugin, { rootRemId: sourceRemId })).rules;
  assertCompleteDesignRules(analyzedRules);
  const sanitized = sanitizeReusableRules(analyzedRules);
  const rules = sanitized.rules;
  assertSafeRules(rules);
  const store = await readTemplateStore(plugin);
  const templateId = (args.templateId?.trim() || safeTemplateId(name)).slice(0, 128);
  const existingIndex = store.templates.findIndex((template) => template.templateId === templateId);
  if (existingIndex >= 0 && !args.overwrite) {
    return {
      status: 'already_exists',
      template: store.templates[existingIndex],
      templateCount: store.templates.length,
      warnings: sanitized.warnings.length ? sanitized.warnings : undefined,
    };
  }
  const existing = existingIndex >= 0 ? store.templates[existingIndex] : undefined;
  if (args.expectedVersion !== undefined && args.expectedVersion !== (existing?.version ?? 0)) {
    throw new RemnoteWriteError('STALE_STATE_CONFLICT', 'Design template version conflict.', {
      templateId,
      expectedVersion: args.expectedVersion,
      actualVersion: existing?.version ?? 0,
    });
  }
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
    warnings: sanitized.warnings.length ? sanitized.warnings : undefined,
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

export async function deleteNoteDesignTemplate(
  plugin: RNPlugin,
  templateId: string
): Promise<{ status: 'deleted' | 'not_found'; templateId: string; templateCount: number }> {
  const normalizedId = templateId.trim();
  if (!normalizedId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Template ID is required.');
  }
  const store = await readTemplateStore(plugin);
  const nextTemplates = store.templates.filter((template) => template.templateId !== normalizedId);
  if (nextTemplates.length === store.templates.length) {
    return { status: 'not_found', templateId: normalizedId, templateCount: store.templates.length };
  }
  await writeTemplateStore(plugin, { ...store, templates: nextTemplates });
  return { status: 'deleted', templateId: normalizedId, templateCount: nextTemplates.length };
}

async function resolveRulesForPreview(
  plugin: RNPlugin,
  args: PreviewNoteDesignPlanArgs
): Promise<{ rules: NoteDesignRules; templateId?: string; templateVersion?: number }> {
  if (args.rules) {
    assertCompleteDesignRules(args.rules);
    assertSafeRules(args.rules);
    return { rules: args.rules };
  }
  if (args.templateJson) {
    const template = parseTemplateJson(args.templateJson);
    return { rules: template.rules, templateId: template.templateId, templateVersion: template.version };
  }
  if (args.templateId) {
    const template = await getNoteDesignTemplate(plugin, args.templateId);
    if (!template) {
      throw new RemnoteWriteError('INVALID_ARGS', `Design template "${args.templateId}" was not found.`);
    }
    return { rules: template.rules, templateId: template.templateId, templateVersion: template.version };
  }
  const selectedTemplateId = await plugin.storage?.getLocal<string>('bridge-selected-template-id').catch(() => undefined);
  if (selectedTemplateId) {
    const template = await getNoteDesignTemplate(plugin, selectedTemplateId);
    if (!template) {
      throw new RemnoteWriteError('INVALID_ARGS', `Selected design template "${selectedTemplateId}" was not found.`);
    }
    return { rules: template.rules, templateId: template.templateId, templateVersion: template.version };
  }
  return { rules: defaultNoteDesignRules(args.stylePreset ?? DEFAULT_STYLE_PRESET) };
}

export async function previewNoteDesignPlan(
  plugin: RNPlugin,
  args: PreviewNoteDesignPlanArgs
): Promise<PreviewNoteDesignPlanResult> {
  const { rules, templateId, templateVersion } = await resolveRulesForPreview(plugin, args);
  const mode = args.mode ?? (args.targetRemId ? 'repair' : 'create');
  const previewTitle = args.title?.trim() || 'Design preview';
  const compiled = compileNoteDesignPlan({
    title: previewTitle,
    content: args.content ?? { text: previewTitle, children: [] },
    rules,
    templateId,
    templateVersion,
    writingMode: 'markdown',
  });
  const plannedChanges = [
    `Mode: ${mode}.`,
    `Style preset: ${rules.stylePreset ?? DEFAULT_STYLE_PRESET}.`,
    `Heading pattern: root ${rules.headingPattern.rootHeadingLevel ?? 'normal'}, sections ${rules.headingPattern.sectionHeadingLevel ?? 'mixed'}.`,
    `Nesting: max depth ${rules.bulletNesting.maxDepth}, max children ${rules.bulletNesting.maxChildrenPerRem}.`,
    `Math: inline ${rules.mathPattern.inlineMathCount}, block ${rules.mathPattern.blockMathCount}, visible delimiters ${rules.mathPattern.visibleDelimiterCount}.`,
    `Cards/tables/examples: ${rules.cardStyle.cardLikeRemCount}/${rules.tableStyle.tableLikeRemCount}/${rules.workedExampleStyle.workedExampleCount}.`,
    `Compiled manifest: ${compiled.manifest.manifestHash}.`,
  ];
  if (args.title) {
    plannedChanges.push(`Target title: ${args.title}.`);
  }
  if (args.content) {
    plannedChanges.push(`Content preview length: ${args.content.length} chars.`);
  }

  const warnings = [
    ...(rules.mathPattern.malformedMathLikely
      ? ['Template sample contains visible display-math delimiters; verify formulas before writing.']
      : []),
    ...compiled.manifest.unsupportedRuleIds.map((ruleId) => `Unsupported design rule: ${ruleId}.`),
    ...(!args.content ? ['No target content was supplied; role match counts are preview placeholders.'] : []),
  ];
  return {
    status: 'previewed',
    dryRun: true,
    templateId,
    targetRemId: args.targetRemId,
    parentId: args.parentId,
    title: args.title,
    mode,
    plannedChanges,
    warnings,
    rules,
    compiledManifest: compiled.manifest,
    compiledTree: compiled.tree,
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
  const parsed = parseTemplateJson(args.templateJson);
  const sanitized = sanitizeReusableRules(parsed.rules);
  const imported: NoteDesignTemplate = { ...parsed, rules: sanitized.rules };
  const importedTemplateHash = hashNoteDesignTemplate(imported);
  const store = await readTemplateStore(plugin);
  const existingIndex = store.templates.findIndex((template) => template.templateId === imported.templateId);
  const existing = existingIndex >= 0 ? store.templates[existingIndex] : undefined;
  if (args.expectedVersion !== undefined && args.expectedVersion !== (existing?.version ?? 0)) {
    throw new RemnoteWriteError('STALE_STATE_CONFLICT', 'Design template import version conflict.', {
      templateId: imported.templateId,
      expectedVersion: args.expectedVersion,
      actualVersion: existing?.version ?? 0,
    });
  }
  if (existingIndex >= 0 && !args.overwrite) {
    const existingNormalized = normalizeNoteDesignTemplate(store.templates[existingIndex]);
    const existingHash = stableHash(existingNormalized);
    return {
      status: 'already_exists',
      template: store.templates[existingIndex],
      templateCount: store.templates.length,
      warnings: [
        'Template already exists. Pass overwrite=true to replace it.',
        ...sanitized.warnings,
      ],
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
    warnings: sanitized.warnings.length ? sanitized.warnings : undefined,
  };
}
