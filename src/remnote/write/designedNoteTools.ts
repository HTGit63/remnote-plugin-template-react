import { RemType } from '@remnote/plugin-sdk';
import type { PluginRem as Rem, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  CardWorkflowCardPlan,
  CardWorkflowResult,
  CreateCardSetFromNoteArgs,
  CreateCardSetFromNoteResult,
  CreateClozeCardsFromNoteArgs,
  CreateClozeCardsFromNoteResult,
  CreateDesignedNoteTreeArgs,
  CreateDesignedNoteTreeResult,
  CreateFlashcardsFromMarkdownArgs,
  CreateFlashcardsFromMarkdownResult,
  NoteDesignRules,
  NoteDesignTemplate,
  PracticeDirection,
  RepairCardSetArgs,
  RepairCardSetResult,
  RepairNoteDesignArgs,
  RepairNoteDesignResult,
  StyledRemTreeNode,
  StylingPlanOperation,
  UpdateNoteWithDesignArgs,
  UpdateNoteWithDesignResult,
  VerifyCardSetArgs,
  VerifyCardSetResult,
  VerifyNoteAgainstDesignArgs,
  VerifyNoteAgainstDesignResult,
} from '../../../shared/bridge/protocol';
import { getContentChildren, getRemPlainText } from '../serialize';
import {
  defaultNoteDesignRules,
  getNoteDesignTemplate,
  previewNoteDesignPlan,
} from '../templates/designTemplates';
import {
  getAppliedDesignVerificationManifest,
  saveAppliedDesignVerificationManifest,
} from '../templates/designVerificationManifest';
import { compileNoteDesignPlan } from '../templates/designPlanCompiler';
import { createBasicFlashcard, createClozeCard } from './cardWrites';
import { createOrReplaceNoteFromMarkdown } from './markdownImportExecutor';
import { applyStructuredNoteBatch } from './structuredBatch';
import { findRequiredRem, getRemPlainString, getRemRichText } from './remnoteSdkHelpers';
import { applyStylePlan } from './formattingWrites';
import { createPolishedNoteTree } from './treeWrites';
import { verifyNoteDesign } from './verification';
import { RemnoteWriteError, runSdkOperation } from './writeErrors';

const DEFAULT_CARD_LIMIT = 40;
const MAX_CARD_LIMIT = 100;
const DEFAULT_CARD_VERIFY_NODE_LIMIT = 250;
const MAX_CARD_VERIFY_NODE_LIMIT = 500;
const DEFAULT_CARD_VERIFY_TIMEOUT_MS = 1000;
const MAX_CARD_VERIFY_TIMEOUT_MS = 10000;
const DESIGN_COLOR_NUMBERS: Record<string, number> = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  purple: 5,
  blue: 6,
};

function clampCardLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CARD_LIMIT;
  }
  return Math.min(Math.max(Math.floor(value as number), 1), MAX_CARD_LIMIT);
}

function clampCardNodeLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CARD_VERIFY_NODE_LIMIT;
  }
  return Math.min(Math.max(Math.floor(value as number), 1), MAX_CARD_VERIFY_NODE_LIMIT);
}

function clampCardDepth(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(Math.max(Math.floor(value as number), 0), 4);
}

function clampCardVerifierTimeout(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CARD_VERIFY_TIMEOUT_MS;
  }
  return Math.min(Math.max(Math.floor(value as number), 100), MAX_CARD_VERIFY_TIMEOUT_MS);
}

async function withVerifierTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<{ ok: true; value: T } | { ok: false }> {
  return Promise.race([
    promise.then((value) => ({ ok: true as const, value })).catch(() => ({ ok: true as const, value: [] as unknown as T })),
    new Promise<{ ok: false }>((resolve) => {
      setTimeout(() => resolve({ ok: false }), timeoutMs);
    }),
  ]);
}

function contentToMarkdown(title: string, content: string | StyledRemTreeNode): string {
  if (typeof content !== 'string') {
    return `# ${title}`;
  }
  const trimmed = content.trim();
  const initialHeading = /^#\s+(.+?)(?:\n|$)/.exec(trimmed);
  if (initialHeading?.[1].replace(/\s+/g, ' ').trim().toLowerCase() === title.replace(/\s+/g, ' ').trim().toLowerCase()) {
    const body = trimmed.slice(initialHeading[0].length).trim();
    return [`# ${title.trim()}`, body].filter(Boolean).join('\n\n');
  }
  return [`# ${title.trim()}`, '', trimmed].filter(Boolean).join('\n');
}

function buildExpectedStyleMap(rootRemId: string, rules?: NoteDesignRules) {
  const rootExpected = {
    headingLevel: rules?.headingPattern.rootHeadingLevel,
    forbiddenChildTexts: ['Size', 'H1', 'H2', 'H3', 'normal'],
    noVisibleMathDelimiters: true,
  };
  return {
    [rootRemId]: rootExpected,
    ...(rules?.expectedStyleMap ?? {}),
  };
}

function richRecords(rem: Rem): Array<Record<string, unknown>> {
  return (getRemRichText(rem) ?? []).filter(
    (item): item is RichTextInterface[number] & Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item)
  ) as Array<Record<string, unknown>>;
}

function richRecordMatchesStyle(
  record: Record<string, unknown>,
  style: NonNullable<NonNullable<NoteDesignRules['roleRules']>[keyof NonNullable<NoteDesignRules['roleRules']>]>['fullTextStyle']
): boolean {
  if (!style) return true;
  if (style.bold !== undefined && (record.b === true) !== style.bold) return false;
  if (style.italic !== undefined && (record.italic === true || record.i === true) !== style.italic) return false;
  if (style.underline !== undefined && (record.u === true || record.underline === true) !== style.underline) return false;
  if (style.quote !== undefined && (record.q === true || record.quote === true) !== style.quote) return false;
  if (style.color && record.tc !== DESIGN_COLOR_NUMBERS[style.color.toLowerCase()]) return false;
  if (style.highlight && record.h !== DESIGN_COLOR_NUMBERS[style.highlight.toLowerCase()]) return false;
  return true;
}

async function verifyRoleTreatment(
  rem: Rem,
  treatment: NonNullable<NonNullable<NoteDesignRules['roleRules']>[keyof NonNullable<NoteDesignRules['roleRules']>]>
): Promise<{ passed: boolean; actual: Record<string, unknown> }> {
  const actual: Record<string, unknown> = {};
  let passed = true;
  if (treatment.remStyle?.headingLevel) {
    actual.headingLevel = (await rem.getFontSize().catch(() => undefined)) ?? 'normal';
    passed = passed && actual.headingLevel === treatment.remStyle.headingLevel;
  }
  if (treatment.remStyle?.hideBullet !== undefined) {
    actual.hideBullet = !(await rem.isListItem().catch(() => true));
    passed = passed && actual.hideBullet === treatment.remStyle.hideBullet;
  }
  if (treatment.remStyle?.remType) {
    const remType = await safeRemType(rem);
    actual.remType = remType === RemType.CONCEPT || remType === ('concept' as unknown as RemType)
      ? 'concept'
      : remType === RemType.DESCRIPTOR || remType === ('descriptor' as unknown as RemType)
        ? 'descriptor'
        : 'normal';
    passed = passed && actual.remType === treatment.remStyle.remType;
  }
  const records = richRecords(rem).filter((record) => record.i !== 'x' && typeof record.text === 'string');
  if (treatment.fullTextStyle) {
    actual.fullTextStyleMatched = records.length > 0 && records.every((record) =>
      richRecordMatchesStyle(record, treatment.fullTextStyle)
    );
    passed = passed && actual.fullTextStyleMatched === true;
  }
  if (treatment.prefixStyle) {
    actual.prefixStyleMatched = Boolean(records[0] && richRecordMatchesStyle(records[0], treatment.prefixStyle));
    passed = passed && actual.prefixStyleMatched === true;
  }
  if (treatment.mathStyle) {
    const mathRecords = richRecords(rem).filter((record) => record.i === 'x');
    actual.mathStyleMatched = mathRecords.length > 0 && mathRecords.every((record) =>
      richRecordMatchesStyle(record, treatment.mathStyle)
    );
    passed = passed && actual.mathStyleMatched === true;
  }
  return { passed, actual };
}

async function collectDesignMaterializationEvidence(
  plugin: RNPlugin,
  compiled: ReturnType<typeof compileNoteDesignPlan>,
  rules: NoteDesignRules,
  polishedTreeResult: {
    rootRemId?: string;
    rootCreatedRemId?: string;
    idMap?: Record<string, string>;
  },
  dryRun: boolean
): Promise<CreateDesignedNoteTreeResult['materializationEvidence']> {
  const rootRemId = polishedTreeResult.rootRemId ?? polishedTreeResult.rootCreatedRemId;
  const idMap = polishedTreeResult.idMap ?? {};
  return Promise.all(compiled.manifest.ruleResults.map(async (rule) => {
    const targetRemIds = rule.matchedClientNodeIds
      .map((clientNodeId) => idMap[clientNodeId]
        ?? (clientNodeId === compiled.tree.clientNodeId ? rootRemId : undefined))
      .filter((remId): remId is string => Boolean(remId));
    if (dryRun) {
      return { ruleId: rule.ruleId, targetRemIds: [], status: 'planned' as const };
    }
    if (rule.status === 'unsupported') {
      return { ruleId: rule.ruleId, targetRemIds, status: 'unsupported' as const, actual: rule.reason };
    }
    if (rule.matchedNodeCount === 0) {
      return { ruleId: rule.ruleId, targetRemIds, status: 'not_applicable' as const };
    }
    if (targetRemIds.length !== rule.matchedNodeCount) {
      return {
        ruleId: rule.ruleId,
        targetRemIds,
        status: 'failed' as const,
        expected: { matchedNodeCount: rule.matchedNodeCount },
        actual: { mappedTargetCount: targetRemIds.length },
      };
    }
    const rems = (await Promise.all(targetRemIds.map((remId) => plugin.rem.findOne(remId))))
      .filter((rem): rem is Rem => Boolean(rem));
    if (rems.length !== targetRemIds.length) {
      return {
        ruleId: rule.ruleId,
        targetRemIds,
        status: 'failed' as const,
        expected: { existingRemCount: targetRemIds.length },
        actual: { existingRemCount: rems.length },
      };
    }
    if (rule.ruleId === 'heading.root' || rule.ruleId === 'heading.section') {
      const expectedHeading = rule.ruleId === 'heading.root'
        ? rules.headingPattern.rootHeadingLevel
        : rules.headingPattern.sectionHeadingLevel;
      const actual = await Promise.all(rems.map(async (rem) =>
        (await rem.getFontSize().catch(() => undefined)) ?? 'normal'
      ));
      return {
        ruleId: rule.ruleId,
        targetRemIds,
        status: actual.every((value) => value === (expectedHeading ?? 'normal')) ? 'verified' as const : 'failed' as const,
        expected: expectedHeading ?? 'normal',
        actual,
      };
    }
    if (rule.ruleId === 'spacing.sibling_spacer') {
      const actual = await Promise.all(rems.map((rem) => getRemPlainString(plugin, rem)));
      const passed = actual.every((text) => text === '\u200b' || text.trim().length === 0 || /^[-_*]{3,}$/.test(text.trim()));
      return {
        ruleId: rule.ruleId,
        targetRemIds,
        status: passed ? 'verified' as const : 'failed' as const,
        expected: 'safe spacer text',
        actual,
      };
    }
    const role = rule.role;
    const treatment = role ? rules.roleRules?.[role] : undefined;
    if (!treatment) {
      return { ruleId: rule.ruleId, targetRemIds, status: 'verified' as const };
    }
    const checks = await Promise.all(rems.map((rem) => verifyRoleTreatment(rem, treatment)));
    return {
      ruleId: rule.ruleId,
      targetRemIds,
      status: checks.every((check) => check.passed) ? 'verified' as const : 'failed' as const,
      expected: treatment,
      actual: checks.map((check) => check.actual),
    };
  }));
}

async function assertDesignOperationsInsideRoot(
  plugin: RNPlugin,
  rootRemId: string,
  operations: StylingPlanOperation[]
): Promise<void> {
  await findRequiredRem(plugin, rootRemId, 'Target');
  for (const operation of operations) {
    if (operation.remId === rootRemId) {
      continue;
    }
    const seen = new Set<string>();
    let current = await plugin.rem.findOne(operation.remId);
    if (!current) {
      throw new RemnoteWriteError('REM_NOT_FOUND', 'Style operation target Rem was not found.', {
        rootRemId,
        targetRemId: operation.remId,
      });
    }
    let inside = false;
    while (current && !seen.has(current._id)) {
      seen.add(current._id);
      if (current.parent === rootRemId) {
        inside = true;
        break;
      }
      current = current.parent ? await plugin.rem.findOne(current.parent) : undefined;
    }
    if (!inside) {
      throw new RemnoteWriteError('OUT_OF_SCOPE', 'Design style operation target is outside the declared note tree.', {
        rootRemId,
        targetRemId: operation.remId,
      });
    }
  }
}

async function resolveTemplate(plugin: RNPlugin, templateId?: string): Promise<NoteDesignTemplate | undefined> {
  const resolvedTemplateId = templateId
    ?? await plugin.storage?.getLocal<string>('bridge-selected-template-id').catch(() => undefined);
  if (!resolvedTemplateId) {
    return undefined;
  }
  const template = await getNoteDesignTemplate(plugin, resolvedTemplateId);
  if (!template) {
    throw new RemnoteWriteError('INVALID_ARGS', `Design template "${resolvedTemplateId}" was not found.`);
  }
  return template;
}

function requireApproval(tool: string, dryRun: boolean, approved: boolean | undefined): void {
  if (!dryRun && approved !== true) {
    throw new RemnoteWriteError(
      'APPROVAL_REJECTED',
      `${tool} requires dryRun=true or approved=true before mutating an existing note.`
    );
  }
}

function richTextHasClozeMetadata(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(richTextHasClozeMetadata);
  }
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.cId === 'string' ||
    record.hiddenCloze === true ||
    record.revealedCloze === true
  ) {
    return true;
  }
  return Object.values(record).some(richTextHasClozeMetadata);
}

async function safeIsCardItem(rem: Rem): Promise<boolean> {
  try {
    return await rem.isCardItem();
  } catch {
    return false;
  }
}

async function safePracticeEnabled(rem: Rem): Promise<boolean> {
  try {
    return await rem.getEnablePractice();
  } catch {
    return false;
  }
}

async function safeRemType(rem: Rem): Promise<RemType | undefined> {
  try {
    return await rem.getType();
  } catch {
    return rem.type;
  }
}

async function getCardItemChildren(plugin: RNPlugin, rem: Rem): Promise<Rem[]> {
  const children = await runSdkOperation('rem.getChildrenRem', () => getContentChildren(plugin, rem)).catch(() => []);
  const cardItems: Rem[] = [];
  for (const child of children) {
    if (await safeIsCardItem(child)) {
      cardItems.push(child);
    }
  }
  return cardItems;
}

function cardTypeFromBackText(
  backText: string,
  remType: RemType | undefined,
  cardItemCount: number
): CardWorkflowCardPlan['cardType'] {
  if (remType === RemType.CONCEPT) {
    return 'concept';
  }
  if (remType === RemType.DESCRIPTOR) {
    return 'descriptor';
  }
  if (cardItemCount > 0) {
    return /^Answer:/m.test(backText) && /^Choice:/m.test(backText)
      ? 'multiple_choice'
      : 'list_answer';
  }
  return 'basic';
}

function exactRemTypeName(remType: RemType | undefined): 'concept' | 'descriptor' | 'normal' {
  if (remType === RemType.CONCEPT || remType === ('concept' as unknown as RemType)) return 'concept';
  if (remType === RemType.DESCRIPTOR || remType === ('descriptor' as unknown as RemType)) return 'descriptor';
  return 'normal';
}

async function verifyAppliedDesignRules(
  plugin: RNPlugin,
  manifest: Awaited<ReturnType<typeof getAppliedDesignVerificationManifest>>
): Promise<VerifyNoteAgainstDesignResult['mismatches']> {
  if (!manifest) return [];
  const mismatches: VerifyNoteAgainstDesignResult['mismatches'] = [];
  for (const evidence of manifest.materializationEvidence) {
    if (evidence.status === 'unsupported' || evidence.status === 'not_applicable' || evidence.status === 'planned') {
      continue;
    }
    const actual: unknown[] = [];
    let passed = evidence.targetRemIds.length > 0;
    for (const remId of evidence.targetRemIds) {
      const rem = await plugin.rem.findOne(remId);
      if (!rem) {
        passed = false;
        actual.push({ remId, missing: true });
        continue;
      }
      if (evidence.ruleId === 'heading.root' || evidence.ruleId === 'heading.section') {
        const value = (await rem.getFontSize().catch(() => undefined)) ?? 'normal';
        actual.push(value);
        passed = passed && value === evidence.expected;
        continue;
      }
      if (evidence.ruleId === 'spacing.sibling_spacer') {
        const value = await getRemPlainString(plugin, rem);
        actual.push(value);
        passed = passed && (value === '\u200b' || value.trim().length === 0 || /^[-_*]{3,}$/.test(value.trim()));
        continue;
      }
      if (evidence.ruleId.startsWith('role.')) {
        const check = await verifyRoleTreatment(
          rem,
          evidence.expected as NonNullable<NonNullable<NoteDesignRules['roleRules']>[keyof NonNullable<NoteDesignRules['roleRules']>]>
        );
        actual.push(check.actual);
        passed = passed && check.passed;
      }
    }
    if (!passed) {
      mismatches.push({
        remId: evidence.targetRemIds[0] ?? manifest.rootRemId,
        type: 'designRule',
        property: evidence.ruleId,
        evidenceMethod: 'live_property_readback',
        expected: evidence.expected,
        actual,
        message: `Applied design rule ${evidence.ruleId} failed exact target readback.`,
        fixSuggestion: 'Use repair_note_design with exact target IDs after reviewing this finding.',
        safeNextStep: 'Preview repair_note_design against exact target Rem IDs, then approve only the failed rule repair.',
      });
    }
  }
  return mismatches;
}

export async function createDesignedNoteTree(
  plugin: RNPlugin,
  args: CreateDesignedNoteTreeArgs
): Promise<CreateDesignedNoteTreeResult> {
  const startedAt = Date.now();
  const template = await resolveTemplate(plugin, args.templateId);
  const writingMode = args.writingMode ?? (typeof args.content === 'string' ? 'markdown' : 'styled_tree');
  const dryRun = Boolean(args.dryRun);
  const compiled = compileNoteDesignPlan({
    title: args.title,
    content: args.content,
    rules: template?.rules ?? defaultNoteDesignRules(),
    templateId: template?.templateId,
    templateVersion: template?.version,
    writingMode,
  });
  const polishedTreeResult = await createPolishedNoteTree(plugin, {
    parentId: args.parentId,
    tree: compiled.tree,
    dryRun,
    verifyAfterWrite: args.verifyAfterWrite ?? true,
    idempotencyKey: args.idempotencyKey,
    maxDepth: args.maxDepth,
    maxNodeCount: args.maxNodeCount,
  });
  const materializationEvidence = await collectDesignMaterializationEvidence(
    plugin,
    compiled,
    template?.rules ?? defaultNoteDesignRules(),
    polishedTreeResult,
    dryRun
  );
  const rootRemId = dryRun ? undefined : polishedTreeResult.rootRemId ?? polishedTreeResult.rootCreatedRemId;
  if (rootRemId) {
    await saveAppliedDesignVerificationManifest(plugin, {
      schemaVersion: 1,
      rootRemId,
      templateId: template?.templateId,
      templateVersion: template?.version,
      rules: template?.rules ?? defaultNoteDesignRules(),
      compiledManifest: compiled.manifest,
      materializationEvidence,
      recordedAt: new Date().toISOString(),
    });
  }
  const durationMs = Date.now() - startedAt;
  const overBudget = typeof args.performanceTargetMs === 'number' && durationMs > args.performanceTargetMs;
  const failedRules = materializationEvidence.filter((evidence) => evidence.status === 'failed');
  return {
    status: dryRun
      ? 'dry_run'
      : failedRules.length
        ? 'success_with_design_warning'
        : overBudget
          ? 'success_with_performance_warning'
          : 'created',
    ok: true,
    dryRun,
    parentId: args.parentId,
    rootRemId,
    createdRemIds: dryRun ? [] : polishedTreeResult.createdRemIds,
    createdNodeCount: dryRun ? 0 : polishedTreeResult.createdNodeCount,
    templateId: template?.templateId,
    templateVersion: template?.version,
    writingMode,
    compiledManifest: compiled.manifest,
    materializationEvidence,
    warnings: failedRules.length
      ? failedRules.map((evidence) => `Design rule ${evidence.ruleId} failed live readback.`)
      : undefined,
    verification: polishedTreeResult.verification,
    performance: polishedTreeResult.performance,
    durationMs,
    polishedTreeResult,
  };
}

export async function updateNoteWithDesign(
  plugin: RNPlugin,
  args: UpdateNoteWithDesignArgs
): Promise<UpdateNoteWithDesignResult> {
  const template = await resolveTemplate(plugin, args.templateId);
  const dryRun = args.dryRun ?? true;
  requireApproval('update_note_with_design', dryRun, args.approved);
  const content = args.markdownText ?? (typeof args.content === 'string' ? args.content : undefined);
  const structuredContent = args.content && typeof args.content !== 'string' ? args.content : undefined;
  const plan = [
    `Mode: ${args.mode}.`,
    `Target: ${args.targetRemId}.`,
    template ? `Template: ${template.name}.` : 'Template: none.',
  ];

  if (args.styleOperations?.length) {
    await assertDesignOperationsInsideRoot(plugin, args.targetRemId, args.styleOperations);
  }

  const target = await findRequiredRem(plugin, args.targetRemId, 'Target');
  const targetTitle = (await getRemPlainString(plugin, target)).trim() || 'Designed note';
  const compiled = content || structuredContent
    ? compileNoteDesignPlan({
        title: targetTitle,
        content: content ?? structuredContent ?? '',
        rules: template?.rules ?? defaultNoteDesignRules(),
        templateId: template?.templateId,
        templateVersion: template?.version,
        writingMode: structuredContent ? 'styled_tree' : 'markdown',
      })
    : undefined;

  if (dryRun) {
    return {
      status: 'dry_run',
      ok: true,
      dryRun,
      approved: Boolean(args.approved),
      targetRemId: args.targetRemId,
      mode: args.mode,
      templateId: template?.templateId,
      plan,
      templateVersion: template?.version,
      compiledManifest: compiled?.manifest,
    };
  }

  if (args.styleOperations?.length) {
    const result = await applyStylePlan(plugin, {
      operations: args.styleOperations,
      continueOnError: true,
      verifyAfterWrite: args.verifyAfterWrite,
      dryRun: false,
      idempotencyKey: args.idempotencyKey,
    });
    return {
      status: 'repaired',
      ok: result.status === 'applied' || result.status === 'partial',
      dryRun,
      approved: true,
      targetRemId: args.targetRemId,
      mode: args.mode,
      templateId: template?.templateId,
      plan,
      result,
    };
  }

  if (!compiled) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'Real update_note_with_design requires content, markdownText, or styleOperations.'
    );
  }

  const operation = args.mode === 'append_sections' ? 'append_children' : 'replace_children';
  const result = await applyStructuredNoteBatch(plugin, {
    target: { mode: 'rem_id', remId: args.targetRemId },
    operation,
    note: { children: compiled.tree.children ?? [] },
    dryRun: false,
    verifyAfterWrite: args.verifyAfterWrite ?? true,
    rollbackOnFailure: true,
    idempotencyKey: args.idempotencyKey,
  });
  const evidenceResult = {
    ...result,
    rootRemId: args.targetRemId,
  };
  const materializationEvidence = await collectDesignMaterializationEvidence(
    plugin,
    compiled,
    template?.rules ?? defaultNoteDesignRules(),
    evidenceResult,
    false
  );
  await saveAppliedDesignVerificationManifest(plugin, {
    schemaVersion: 1,
    rootRemId: args.targetRemId,
    templateId: template?.templateId,
    templateVersion: template?.version,
    rules: template?.rules ?? defaultNoteDesignRules(),
    compiledManifest: compiled.manifest,
    materializationEvidence,
    recordedAt: new Date().toISOString(),
  });
  const failedRules = materializationEvidence.filter((evidence) => evidence.status === 'failed');
  return {
    status: failedRules.length
      ? 'success_with_design_warning'
      : operation === 'append_children'
        ? 'appended'
        : 'replaced',
    ok: result.status === 'applied' || result.status === 'already_applied' || result.status === 'success_with_performance_warning',
    dryRun,
    approved: true,
    targetRemId: args.targetRemId,
    mode: args.mode,
    templateId: template?.templateId,
    templateVersion: template?.version,
    plan,
    result,
    compiledManifest: compiled.manifest,
    materializationEvidence,
    warnings: failedRules.length
      ? failedRules.map((evidence) => `Design rule ${evidence.ruleId} failed live readback.`)
      : undefined,
  };
}

export async function verifyNoteAgainstDesign(
  plugin: RNPlugin,
  args: VerifyNoteAgainstDesignArgs
): Promise<VerifyNoteAgainstDesignResult> {
  const appliedManifest = await getAppliedDesignVerificationManifest(plugin, args.rootRemId);
  const template = await resolveTemplate(plugin, args.templateId);
  const rules = args.rules ?? appliedManifest?.rules ?? template?.rules;
  const expectedStyleMap = {
    ...buildExpectedStyleMap(args.rootRemId, rules),
    ...(args.expectedStyleMap ?? {}),
  };
  const baseVerification = await verifyNoteDesign(plugin, {
    rootRemId: args.rootRemId,
    expectedStyleMap,
    ...(!appliedManifest && rules?.stylePreset ? { stylePreset: rules.stylePreset } : {}),
  });
  const appliedMismatches = await verifyAppliedDesignRules(plugin, appliedManifest);
  const mismatches = [...baseVerification.mismatches, ...appliedMismatches];
  const designIssues = [
    ...(baseVerification.issues ?? []),
    ...mismatches.map((mismatch) => mismatch.message),
  ];
  const evidenceMode = appliedManifest
    ? 'exact_manifest'
    : args.expectedStyleMap
      ? 'exact_manifest'
      : 'live_property_readback';
  const checkedRemIds = Array.from(new Set([
    ...baseVerification.checkedRemIds,
    ...(appliedManifest?.materializationEvidence.flatMap((evidence) => evidence.targetRemIds) ?? []),
  ]));
  const ok = baseVerification.ok && appliedMismatches.length === 0 && designIssues.length === 0;
  return {
    status: 'verified',
    rootRemId: args.rootRemId,
    templateId: template?.templateId,
    ok,
    evidenceMode,
    appliedTemplateVersion: appliedManifest?.templateVersion,
    checkedRemIds,
    designIssues,
    mismatches,
    unsupportedChecks: baseVerification.unsupportedChecks,
    repairSuggestions: baseVerification.repairSuggestions,
    baseVerification,
    verification: {
      attempted: true,
      passed: ok,
      method: evidenceMode,
      warnings: baseVerification.unsupportedChecks.map((check) =>
        `${check.type} on Rem ${check.remId}: ${check.reason}`
      ),
    },
  };
}

async function directChildHeadingOperations(
  plugin: RNPlugin,
  rootRemId: string,
  rules?: NoteDesignRules
): Promise<StylingPlanOperation[]> {
  const operations: StylingPlanOperation[] = [];
  if (!rules?.headingPattern.rootHeadingLevel && !rules?.headingPattern.sectionHeadingLevel) {
    return operations;
  }
  if (rules.headingPattern.rootHeadingLevel) {
    operations.push({ remId: rootRemId, type: 'heading', headingLevel: rules.headingPattern.rootHeadingLevel });
  }
  if (rules.headingPattern.sectionHeadingLevel) {
    const root = await findRequiredRem(plugin, rootRemId, 'Target');
    const children = await runSdkOperation('rem.getChildrenRem', () => root.getChildrenRem()).catch(() => []);
    for (const child of children) {
      const text = (await getRemPlainString(plugin, child).catch(() => '')).trim();
      if (text) {
        operations.push({
          remId: child._id,
          type: 'heading',
          headingLevel: rules.headingPattern.sectionHeadingLevel,
        });
      }
    }
  }
  return operations;
}

export async function repairNoteDesign(
  plugin: RNPlugin,
  args: RepairNoteDesignArgs
): Promise<RepairNoteDesignResult> {
  const template = await resolveTemplate(plugin, args.templateId);
  const dryRun = args.dryRun ?? true;
  const verificationBefore = await verifyNoteAgainstDesign(plugin, {
    rootRemId: args.rootRemId,
    templateId: template?.templateId,
  });
  const operations = args.operations?.length
    ? args.operations
    : await directChildHeadingOperations(plugin, args.rootRemId, template?.rules);
  await assertDesignOperationsInsideRoot(plugin, args.rootRemId, operations);
  const plan = operations.length
    ? operations.map((operation) => `${operation.type} ${operation.remId}`)
    : ['No safe automatic repair operations were inferred.'];

  if (dryRun) {
    return {
      status: 'dry_run',
      ok: true,
      dryRun,
      approved: Boolean(args.approved),
      rootRemId: args.rootRemId,
      templateId: template?.templateId,
      plan,
      verificationBefore,
    };
  }
  requireApproval('repair_note_design', dryRun, args.approved);
  if (!operations.length) {
    throw new RemnoteWriteError('INVALID_ARGS', 'No safe repair operations available.');
  }
  const result = await applyStylePlan(plugin, {
    operations,
    continueOnError: true,
    verifyAfterWrite: args.verifyAfterWrite ?? true,
    dryRun: false,
    idempotencyKey: args.idempotencyKey,
  });
  const updatedRemIds = Array.from(new Set(
    result.operations
      .filter((operation) => operation.status === 'applied')
      .map((operation) => operation.remId)
  ));
  const failedOperations = result.operations.filter((operation) => operation.status !== 'applied');
  return {
    status: 'repaired',
    ok: result.status === 'applied' && failedOperations.length === 0,
    dryRun,
    approved: true,
    rootRemId: args.rootRemId,
    templateId: template?.templateId,
    plan,
    verificationBefore,
    result,
    updatedRemIds,
    verification: {
      attempted: args.verifyAfterWrite ?? true,
      passed: result.status === 'applied' && failedOperations.length === 0,
      method: 'operation_result_readback',
      warnings: failedOperations.map((operation) =>
        `${operation.type} on Rem ${operation.remId} ended ${operation.status}.`
      ),
    },
  };
}

async function collectCardSourceRecords(
  plugin: RNPlugin,
  root: Rem,
  maxCards: number
): Promise<CardWorkflowCardPlan[]> {
  const cards: CardWorkflowCardPlan[] = [];
  const children = await runSdkOperation('rem.getChildrenRem', () => root.getChildrenRem()).catch(() => []);
  for (const child of children) {
    if (cards.length >= maxCards) {
      break;
    }
    const text = await getRemPlainString(plugin, child).catch(() => '');
    const plain = text.trim();
    const directDoubleColon = /^(.+?)::\s*(.+)$/.exec(plain);
    if (directDoubleColon) {
      cards.push({
        front: directDoubleColon[1].trim(),
        back: directDoubleColon[2].trim(),
        sourceRemId: child._id,
        cardType: 'basic',
      });
      continue;
    }
    const grandchildren = await runSdkOperation('rem.getChildrenRem', () => child.getChildrenRem()).catch(() => []);
    if (plain && grandchildren.length) {
      const backParts = [];
      for (const grandchild of grandchildren.slice(0, 8)) {
        const backText = await getRemPlainString(plugin, grandchild).catch(() => '');
        if (backText.trim()) {
          backParts.push(backText.trim());
        }
      }
      if (backParts.length) {
        cards.push({
          front: plain,
          back: backParts.join('\n'),
          sourceRemId: child._id,
          cardType: 'basic',
        });
      }
    }
  }
  return cards;
}

function extractCardsFromMarkdown(
  markdownText: string,
  maxCards: number,
  marker: NonNullable<CreateFlashcardsFromMarkdownArgs['marker']>
): CardWorkflowCardPlan[] {
  const cards: CardWorkflowCardPlan[] = [];
  for (const sourceLine of markdownText.split(/\r?\n/)) {
    if (cards.length >= maxCards) {
      break;
    }
    const line = sourceLine
      .trim()
      .replace(/^(?:[-*+]|\d+[.)])\s+/, '')
      .trim();
    if (!line) {
      continue;
    }

    const clozeMatches = Array.from(line.matchAll(/\{\{(.+?)\}\}/g));
    if (clozeMatches.length > 0) {
      if (marker === 'cloze' || marker === 'both') {
        const plainText = line.replace(/\{\{(.+?)\}\}/g, (_full, inner: string) =>
          (inner.split('::')[0] ?? '').trim()
        );
        for (const match of clozeMatches) {
          if (cards.length >= maxCards) {
            break;
          }
          const clozeText = (match[1]?.split('::')[0] ?? '').trim();
          if (!clozeText) {
            continue;
          }
          cards.push({
            front: plainText,
            text: plainText,
            clozeText,
            cardType: 'cloze',
          });
        }
      }
      continue;
    }

    if (marker === 'double_colon' || marker === 'both') {
      const match = /^(.+?)::\s*(.+)$/.exec(line);
      if (!match) {
        continue;
      }
      cards.push({
        front: match[1].trim(),
        back: match[2].trim(),
        cardType: 'basic',
      });
    }
  }
  return cards;
}

function extractClozeCardsFromText(text: string, maxCards: number): CardWorkflowCardPlan[] {
  return extractCardsFromMarkdown(text, maxCards, 'cloze');
}

async function createCards(
  plugin: RNPlugin,
  parentId: string,
  cards: CardWorkflowCardPlan[],
  direction: PracticeDirection,
  idempotencyKey?: string
): Promise<string[]> {
  const createdRemIds: string[] = [];
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    if (card.cardType === 'cloze') {
      const result = await createClozeCard(plugin, {
        parentId,
        text: card.text ?? card.front,
        clozeText: card.clozeText,
        direction,
        idempotencyKey: idempotencyKey ? `${idempotencyKey}-cloze-${index}` : undefined,
        verifyAfterWrite: true,
      });
      createdRemIds.push(result.createdRemId);
      continue;
    }
    const result = await createBasicFlashcard(plugin, {
      parentId,
      front: card.front,
      back: card.back ?? '',
      direction,
      idempotencyKey: idempotencyKey ? `${idempotencyKey}-basic-${index}` : undefined,
      verifyAfterWrite: true,
    });
    createdRemIds.push(result.createdRemId);
  }
  return createdRemIds;
}

function cardWorkflowResult(input: {
  status: CardWorkflowResult['status'];
  ok: boolean;
  dryRun?: boolean;
  rootRemId?: string;
  parentId?: string;
  cards: CardWorkflowCardPlan[];
  verificationMode?: CardWorkflowResult['verificationMode'];
  advisoryFindings?: CardWorkflowResult['advisoryFindings'];
  createdRemIds?: string[];
  issues?: string[];
  warnings?: string[];
  repairPlan?: string[];
  missingCards?: CardWorkflowResult['missingCards'];
  duplicateCards?: CardWorkflowResult['duplicateCards'];
  malformedCards?: CardWorkflowResult['malformedCards'];
  truncated?: boolean;
  inspectedNodeCount?: number;
  durationMs?: number;
  limits?: CardWorkflowResult['limits'];
}): CardWorkflowResult {
  const verification = input.status === 'verified' || input.status === 'partial'
    ? {
        attempted: true as const,
        passed: input.ok,
        method: input.verificationMode ?? ('live_property_readback' as const),
        warnings: input.warnings ?? [],
      }
    : undefined;
  return {
    status: input.status,
    ok: input.ok,
    dryRun: input.dryRun,
    rootRemId: input.rootRemId,
    parentId: input.parentId,
    cardCount: input.cards.length,
    cards: input.cards,
    verificationMode: input.verificationMode ?? verification?.method,
    verification,
    advisoryFindings: input.advisoryFindings,
    createdRemIds: input.createdRemIds,
    issues: input.issues,
    warnings: input.warnings,
    repairPlan: input.repairPlan,
    missingCards: input.missingCards,
    duplicateCards: input.duplicateCards,
    malformedCards: input.malformedCards,
    truncated: input.truncated,
    inspectedNodeCount: input.inspectedNodeCount,
    durationMs: input.durationMs,
    limits: input.limits,
  };
}

export async function createCardSetFromNote(
  plugin: RNPlugin,
  args: CreateCardSetFromNoteArgs
): Promise<CreateCardSetFromNoteResult> {
  const root = await findRequiredRem(plugin, args.rootRemId, 'Target');
  const parentId = args.parentId ?? args.rootRemId;
  const cards = await collectCardSourceRecords(plugin, root, clampCardLimit(args.maxCards));
  const dryRun = Boolean(args.dryRun);
  if (dryRun) {
    return cardWorkflowResult({ status: 'dry_run', ok: true, dryRun, rootRemId: args.rootRemId, parentId, cards });
  }
  const createdRemIds = await createCards(plugin, parentId, cards, args.direction ?? 'both', args.idempotencyKey);
  return cardWorkflowResult({
    status: 'created',
    ok: true,
    dryRun,
    rootRemId: args.rootRemId,
    parentId,
    cards,
    createdRemIds,
  });
}

export async function createFlashcardsFromMarkdown(
  plugin: RNPlugin,
  args: CreateFlashcardsFromMarkdownArgs
): Promise<CreateFlashcardsFromMarkdownResult> {
  const maxCards = clampCardLimit(args.maxCards);
  const marker = args.marker ?? 'both';
  const cards = extractCardsFromMarkdown(args.markdownText, maxCards, marker);
  const dryRun = Boolean(args.dryRun);
  if (dryRun) {
    return cardWorkflowResult({ status: 'dry_run', ok: true, dryRun, parentId: args.parentId, cards });
  }
  const createdRemIds = await createCards(plugin, args.parentId, cards, args.direction ?? 'both', args.idempotencyKey);
  return cardWorkflowResult({ status: 'created', ok: true, dryRun, parentId: args.parentId, cards, createdRemIds });
}

export async function createClozeCardsFromNote(
  plugin: RNPlugin,
  args: CreateClozeCardsFromNoteArgs
): Promise<CreateClozeCardsFromNoteResult> {
  const root = await findRequiredRem(plugin, args.rootRemId, 'Target');
  const parentId = args.parentId ?? args.rootRemId;
  const text = await getRemPlainString(plugin, root);
  const cards = extractClozeCardsFromText(text, clampCardLimit(args.maxCards));
  const dryRun = Boolean(args.dryRun);
  if (dryRun) {
    return cardWorkflowResult({ status: 'dry_run', ok: true, dryRun, rootRemId: args.rootRemId, parentId, cards });
  }
  const createdRemIds = await createCards(plugin, parentId, cards, args.direction ?? 'both', args.idempotencyKey);
  return cardWorkflowResult({
    status: 'created',
    ok: true,
    dryRun,
    rootRemId: args.rootRemId,
    parentId,
    cards,
    createdRemIds,
  });
}

export async function verifyCardSet(
  plugin: RNPlugin,
  args: VerifyCardSetArgs
): Promise<VerifyCardSetResult> {
  const root = await findRequiredRem(plugin, args.rootRemId, 'Target');
  const maxCards = clampCardLimit(args.maxCards);
  const maxNodes = clampCardNodeLimit(args.maxNodes);
  const maxDepth = clampCardDepth(args.maxDepth);
  const timeoutMs = clampCardVerifierTimeout(args.timeoutMs);
  const startedAt = Date.now();
  const cards: CardWorkflowCardPlan[] = [];
  const issues: string[] = [];
  const warnings: string[] = [];
  const malformedCards: NonNullable<CardWorkflowResult['malformedCards']> = [];
  const advisoryFindings: NonNullable<CardWorkflowResult['advisoryFindings']> = [];
  const expectedCards = args.expectedCards ?? [];
  const initialChildrenRead = await withVerifierTimeout(
    runSdkOperation('rem.getChildrenRem', () => getContentChildren(plugin, root)).catch(() => []),
    timeoutMs
  );
  if (!initialChildrenRead.ok) {
    warnings.push(`verify_card_set timed out while reading target root children after ${timeoutMs}ms.`);
    return cardWorkflowResult({
      status: 'partial',
      ok: false,
      rootRemId: args.rootRemId,
      parentId: args.rootRemId,
      cards,
      warnings,
      truncated: true,
      inspectedNodeCount: 0,
      durationMs: Date.now() - startedAt,
      limits: { maxCards, maxNodes, maxDepth, timeoutMs },
    });
  }

  if (initialChildrenRead.value.length === 0) {
    warnings.push('No cards found under target root.');
    const repairPlan = expectedCards.map((card) =>
      `Create missing ${card.cardType ?? 'matching'} card: ${card.front}`
    );
    return cardWorkflowResult({
      status: 'verified',
      ok: expectedCards.length === 0,
      rootRemId: args.rootRemId,
      parentId: args.rootRemId,
      cards,
      missingCards: expectedCards.length ? [...expectedCards] : undefined,
      repairPlan: repairPlan.length ? repairPlan : undefined,
      warnings,
      truncated: false,
      inspectedNodeCount: 0,
      durationMs: Date.now() - startedAt,
      limits: { maxCards, maxNodes, maxDepth, timeoutMs },
    });
  }

  const queue: Array<{ rem: Rem; depth: number }> = initialChildrenRead.value.map((rem) => ({ rem, depth: 1 }));
  const seen = new Set<string>();
  let inspectedNodeCount = 0;
  let truncated = false;

  while (queue.length) {
    if (Date.now() - startedAt > timeoutMs) {
      truncated = true;
      warnings.push('verify_card_set stopped at timeoutMs.');
      break;
    }
    if (inspectedNodeCount >= maxNodes) {
      truncated = true;
      warnings.push(`verify_card_set stopped at maxNodes=${maxNodes}.`);
      break;
    }
    if (cards.length >= maxCards) {
      truncated = true;
      warnings.push(`verify_card_set stopped at maxCards=${maxCards}.`);
      break;
    }
    const { rem: child, depth } = queue.shift() as { rem: Rem; depth: number };
    if (seen.has(child._id)) {
      continue;
    }
    seen.add(child._id);
    inspectedNodeCount += 1;

    if (depth > 0 && (await safeIsCardItem(child))) {
      continue;
    }

    if (depth > 0) {
      const text = await getRemPlainText(plugin, child).catch(() => ({ frontText: '', backText: '', plainText: '' }));
      const practiceEnabled = await safePracticeEnabled(child);
      const cardItemChildren = await getCardItemChildren(plugin, child);
      const remType = await safeRemType(child);
      const descriptorChildren: Rem[] = [];
      if (exactRemTypeName(remType) === 'concept') {
        const directChildren = await runSdkOperation('rem.getChildrenRem', () => getContentChildren(plugin, child)).catch(() => []);
        for (const directChild of directChildren) {
          if (exactRemTypeName(await safeRemType(directChild)) === 'descriptor') {
            descriptorChildren.push(directChild);
          }
        }
      }
      if (text.backText) {
        cards.push({
          front: text.frontText || child._id,
          back: text.backText,
          sourceRemId: child._id,
          evidenceMethod: 'live_property_readback',
          cardType: cardTypeFromBackText(text.backText, remType, cardItemChildren.length),
        });
      } else if (descriptorChildren.length > 0) {
        const descriptorTexts: string[] = [];
        for (const descriptor of descriptorChildren) {
          const descriptorText = await getRemPlainText(plugin, descriptor)
            .catch(() => ({ frontText: '', backText: '', plainText: '' }));
          const value = (descriptorText.frontText || descriptorText.plainText).trim();
          if (value) {
            descriptorTexts.push(value);
          }
          seen.add(descriptor._id);
        }
        if (descriptorTexts.length > 0) {
          cards.push({
            front: text.frontText || child._id,
            back: descriptorTexts.join('\n'),
            sourceRemId: child._id,
            evidenceMethod: 'live_property_readback',
            cardType: 'concept',
          });
        } else {
          const reason = 'Concept has descriptor children, but their text could not be read.';
          issues.push(`Rem ${child._id} has descriptor children with no readable text.`);
          malformedCards.push({
            remId: child._id,
            ...(text.frontText ? { front: text.frontText } : {}),
            reason,
          });
        }
      } else if (practiceEnabled && cardItemChildren.length > 0) {
        const itemTexts: string[] = [];
        for (const cardItem of cardItemChildren) {
          const itemText = await getRemPlainText(plugin, cardItem).catch(() => ({ frontText: '', backText: '', plainText: '' }));
          const value = (itemText.frontText || itemText.plainText).trim();
          if (value) {
            itemTexts.push(value);
          }
        }
        const back = itemTexts.join('\n');
        cards.push({
          front: text.frontText || child._id,
          back,
          sourceRemId: child._id,
          evidenceMethod: 'live_property_readback',
          cardType: cardTypeFromBackText(back, remType, cardItemChildren.length),
        });
      } else if (richTextHasClozeMetadata(child.text as RichTextInterface | undefined)) {
        cards.push({
          front: text.frontText,
          text: text.frontText,
          sourceRemId: child._id,
          evidenceMethod: 'live_property_readback',
          cardType: 'cloze',
        });
      } else if (exactRemTypeName(remType) !== 'normal') {
        const reason = 'Practice enabled but no back text or cloze metadata.';
        issues.push(`Rem ${child._id} has practice enabled but no back text or cloze metadata.`);
        malformedCards.push({
          remId: child._id,
          ...(text.frontText ? { front: text.frontText } : {}),
          reason,
        });
      } else {
        if (/\{\{.+?\}\}/.test(text.frontText)) {
          advisoryFindings.push({
            remId: child._id,
            evidenceMethod: 'generic_heuristic',
            property: 'literalClozeSyntax',
            actual: text.frontText,
            message: 'Literal cloze syntax found, but no functional cloze metadata is present.',
          });
        }
        if (practiceEnabled) {
          advisoryFindings.push({
            remId: child._id,
            evidenceMethod: 'live_property_readback',
            property: 'practiceEnabled',
            actual: true,
            message: 'Practice is enabled, but no exact card payload metadata is present; Rem excluded from card defects.',
          });
        }
      }
    }

    if (depth < maxDepth) {
      const childRead = await withVerifierTimeout(
        runSdkOperation('rem.getChildrenRem', () => getContentChildren(plugin, child)).catch(() => []),
        Math.max(100, timeoutMs - (Date.now() - startedAt))
      );
      if (!childRead.ok) {
        truncated = true;
        warnings.push(`verify_card_set timed out while reading children for Rem ${child._id}.`);
        break;
      }
      for (const grandchild of childRead.value) {
        if (!seen.has(grandchild._id)) {
          queue.push({ rem: grandchild, depth: depth + 1 });
        }
      }
    }
  }

  if (cards.length === 0) {
    warnings.push('No cards found under target root.');
  }
  const normalizeCardText = (value: string | undefined) => value?.replace(/\s+/g, ' ').trim().toLowerCase() ?? '';
  const semanticGroups = new Map<string, CardWorkflowCardPlan[]>();
  for (const card of cards) {
    const key = [card.cardType, normalizeCardText(card.front), normalizeCardText(card.back)].join('|');
    const group = semanticGroups.get(key) ?? [];
    group.push(card);
    semanticGroups.set(key, group);
  }
  const duplicateCards: NonNullable<CardWorkflowResult['duplicateCards']> = [];
  for (const group of semanticGroups.values()) {
    if (group.length < 2) {
      continue;
    }
    const first = group[0];
    const sourceRemIds = group
      .map((card) => card.sourceRemId)
      .filter((remId): remId is string => Boolean(remId));
    duplicateCards.push({
      front: first.front,
      ...(first.back ? { back: first.back } : {}),
      cardType: first.cardType,
      sourceRemIds,
    });
    issues.push(`Duplicate ${first.cardType} card "${first.front}" found at Rem IDs ${sourceRemIds.join(', ')}.`);
  }
  const expectedBackMatches = (actual: CardWorkflowCardPlan, expectedBack: string | undefined): boolean => {
    if (expectedBack === undefined) return true;
    if (normalizeCardText(actual.back) === normalizeCardText(expectedBack)) return true;
    if (actual.cardType === 'multiple_choice') {
      const answer = actual.back?.split(/\r?\n/)
        .map((line) => /^Answer:\s*(.*)$/i.exec(line.trim())?.[1])
        .find((value): value is string => value !== undefined);
      return normalizeCardText(answer) === normalizeCardText(expectedBack);
    }
    return false;
  };
  const missingCards = expectedCards.filter((expected) =>
    !cards.some((actual) =>
      normalizeCardText(actual.front) === normalizeCardText(expected.front) &&
      expectedBackMatches(actual, expected.back) &&
      (expected.cardType === undefined || actual.cardType === expected.cardType)
    )
  );
  for (const missing of missingCards) {
    issues.push(`Missing expected ${missing.cardType ?? 'matching'} card "${missing.front}".`);
  }
  const repairPlan = [
    ...malformedCards.map((card) => `Repair malformed card Rem ${card.remId}: ${card.reason}`),
    ...duplicateCards.map((card) =>
      `Review duplicate ${card.cardType} card "${card.front}" at Rem IDs ${card.sourceRemIds.join(', ')}; remove only after dry-run approval.`
    ),
    ...missingCards.map((card) => `Create missing ${card.cardType ?? 'matching'} card: ${card.front}`),
  ];
  return cardWorkflowResult({
    status: truncated ? 'partial' : 'verified',
    ok: !truncated && issues.length === 0 && duplicateCards.length === 0 && missingCards.length === 0,
    rootRemId: args.rootRemId,
    parentId: args.rootRemId,
    cards,
    verificationMode: 'live_property_readback',
    advisoryFindings: advisoryFindings.length ? advisoryFindings : undefined,
    issues,
    warnings,
    malformedCards: malformedCards.length ? malformedCards : undefined,
    duplicateCards: duplicateCards.length ? duplicateCards : undefined,
    missingCards: missingCards.length ? missingCards : undefined,
    repairPlan: repairPlan.length ? repairPlan : undefined,
    truncated,
    inspectedNodeCount,
    durationMs: Date.now() - startedAt,
    limits: { maxCards, maxNodes, maxDepth, timeoutMs },
  });
}

export async function repairCardSet(
  plugin: RNPlugin,
  args: RepairCardSetArgs
): Promise<RepairCardSetResult> {
  const dryRun = args.dryRun ?? true;
  const verification = await verifyCardSet(plugin, { rootRemId: args.rootRemId });
  const repairCards = (args.cards ?? []).map((card) => ({
    front: card.front,
    back: card.back,
    cardType: 'basic' as const,
  }));
  const repairPlan = repairCards.length
    ? repairCards.map((card) => `Create missing card: ${card.front}`)
    : verification.issues?.map((issue) => `Manual review: ${issue}`) ?? [];
  if (dryRun) {
    return cardWorkflowResult({
      status: 'dry_run',
      ok: verification.ok,
      dryRun,
      rootRemId: args.rootRemId,
      parentId: args.rootRemId,
      cards: repairCards,
      issues: verification.issues,
      repairPlan,
    });
  }
  requireApproval('repair_card_set', dryRun, args.approved);
  if (!repairCards.length) {
    throw new RemnoteWriteError('INVALID_ARGS', 'Real repair_card_set requires cards to create.');
  }
  const createdRemIds = await createCards(plugin, args.rootRemId, repairCards, args.direction ?? 'both', args.idempotencyKey);
  return cardWorkflowResult({
    status: 'repaired',
    ok: true,
    dryRun,
    rootRemId: args.rootRemId,
    parentId: args.rootRemId,
    cards: repairCards,
    createdRemIds,
    repairPlan,
  });
}

export async function previewDesignedNotePlan(
  plugin: RNPlugin,
  args: { templateId?: string; parentId?: string; targetRemId?: string; title?: string; content?: string }
) {
  return previewNoteDesignPlan(plugin, {
    templateId: args.templateId,
    parentId: args.parentId,
    targetRemId: args.targetRemId,
    title: args.title,
    content: args.content,
  });
}
