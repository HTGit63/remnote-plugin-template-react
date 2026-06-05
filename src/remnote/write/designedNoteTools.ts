import type { PluginRem as Rem, RNPlugin } from '@remnote/plugin-sdk';
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
import { getRemPlainText } from '../serialize';
import {
  getNoteDesignTemplate,
  previewNoteDesignPlan,
} from '../templates/designTemplates';
import { createBasicFlashcard, createClozeCard } from './cardWrites';
import { createOrReplaceNoteFromMarkdown } from './markdownImportExecutor';
import { findRequiredRem, getRemPlainString } from './remnoteSdkHelpers';
import { applyStylePlan } from './formattingWrites';
import { createPolishedNoteTree } from './treeWrites';
import { verifyNoteDesign } from './verification';
import { RemnoteWriteError, runSdkOperation } from './writeErrors';

const DEFAULT_CARD_LIMIT = 40;
const MAX_CARD_LIMIT = 100;

function clampCardLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_CARD_LIMIT;
  }
  return Math.min(Math.max(Math.floor(value as number), 1), MAX_CARD_LIMIT);
}

function contentToMarkdown(title: string, content: string | StyledRemTreeNode): string {
  if (typeof content !== 'string') {
    return `# ${title}`;
  }
  const trimmed = content.trim();
  if (/^#\s+/m.test(trimmed)) {
    return trimmed;
  }
  return [`# ${title.trim()}`, '', trimmed].filter(Boolean).join('\n');
}

function contentToStyledTree(title: string, content: string | StyledRemTreeNode): StyledRemTreeNode {
  if (typeof content !== 'string') {
    return {
      ...content,
      text: content.text ?? content.title ?? title,
    };
  }
  return {
    text: title,
    style: { headingLevel: 'H1' },
    children: content
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((text) => ({ text })),
  };
}

function templateHeadingRules(template?: NoteDesignTemplate): Pick<NoteDesignRules, 'headingPattern'> | undefined {
  return template?.rules ? { headingPattern: template.rules.headingPattern } : undefined;
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

async function resolveTemplate(plugin: RNPlugin, templateId?: string): Promise<NoteDesignTemplate | undefined> {
  if (!templateId) {
    return undefined;
  }
  const template = await getNoteDesignTemplate(plugin, templateId);
  if (!template) {
    throw new RemnoteWriteError('INVALID_ARGS', `Design template "${templateId}" was not found.`);
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

export async function createDesignedNoteTree(
  plugin: RNPlugin,
  args: CreateDesignedNoteTreeArgs
): Promise<CreateDesignedNoteTreeResult> {
  const startedAt = Date.now();
  const template = await resolveTemplate(plugin, args.templateId);
  const writingMode = args.writingMode ?? (typeof args.content === 'string' ? 'markdown' : 'styled_tree');
  const dryRun = Boolean(args.dryRun);

  if (writingMode === 'styled_tree') {
    const polishedTreeResult = await createPolishedNoteTree(plugin, {
      parentId: args.parentId,
      tree: contentToStyledTree(args.title, args.content),
      dryRun,
      verifyAfterWrite: args.verifyAfterWrite,
      idempotencyKey: args.idempotencyKey,
      maxDepth: args.maxDepth,
      maxNodeCount: args.maxNodeCount,
      ...(template?.rules.stylePreset ? { stylePreset: template.rules.stylePreset } : {}),
    });
    const durationMs = Date.now() - startedAt;
    const overBudget = typeof args.performanceTargetMs === 'number' && durationMs > args.performanceTargetMs;
    return {
      status: dryRun ? 'dry_run' : overBudget ? 'success_with_performance_warning' : 'created',
      ok: true,
      dryRun,
      parentId: args.parentId,
      rootRemId: dryRun ? undefined : polishedTreeResult.rootRemId ?? polishedTreeResult.rootCreatedRemId,
      createdRemIds: dryRun ? [] : polishedTreeResult.createdRemIds,
      createdNodeCount: dryRun ? 0 : polishedTreeResult.createdNodeCount,
      templateId: template?.templateId,
      writingMode,
      verification: polishedTreeResult.verification,
      performance: polishedTreeResult.performance,
      polishedTreeResult,
    };
  }

  const markdownResult = await createOrReplaceNoteFromMarkdown(plugin, {
    parentRemId: args.parentId,
    markdownText: contentToMarkdown(args.title, args.content),
    mode: 'create_child',
    duplicatePolicy: 'create_new',
    headingMapping: {
      rootHeading: 'explicit_title',
      explicitTitle: args.title,
      rootHeadingLevel: templateHeadingRules(template)?.headingPattern.rootHeadingLevel ?? 'H1',
      sectionHeadingLevel: templateHeadingRules(template)?.headingPattern.sectionHeadingLevel ?? 'H3',
    },
    safetyOptions: {
      dryRun,
      verifyAfterWrite: args.verifyAfterWrite ?? true,
      rollbackOnFailure: true,
      idempotencyKey: args.idempotencyKey,
    },
    limits: {
      maxDepth: args.maxDepth,
      maxNodes: args.maxNodeCount,
    },
  });
  const durationMs = Date.now() - startedAt;
  const overBudget = typeof args.performanceTargetMs === 'number' && durationMs > args.performanceTargetMs;
  return {
    status: dryRun ? 'dry_run' : overBudget ? 'success_with_performance_warning' : 'created',
    ok: markdownResult.ok,
    dryRun,
    parentId: args.parentId,
    rootRemId: markdownResult.rootRemId,
    createdRemIds: markdownResult.createdRemIds,
    createdNodeCount: markdownResult.createdRemIds.length,
    templateId: template?.templateId,
    writingMode,
    verification: markdownResult.verification,
    performance: markdownResult.performance,
    markdownResult,
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
  const plan = [
    `Mode: ${args.mode}.`,
    `Target: ${args.targetRemId}.`,
    template ? `Template: ${template.name}.` : 'Template: none.',
  ];

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

  if (!content) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'Real update_note_with_design requires content, markdownText, or styleOperations.'
    );
  }

  const mode = args.mode === 'append_sections' ? 'append_to_target' : 'replace_target_children';
  const result = await createOrReplaceNoteFromMarkdown(plugin, {
    targetRemId: args.targetRemId,
    markdownText: content,
    mode,
    duplicatePolicy: 'create_new',
    safetyOptions: {
      dryRun: false,
      verifyAfterWrite: args.verifyAfterWrite ?? true,
      rollbackOnFailure: true,
      idempotencyKey: args.idempotencyKey,
    },
  });
  return {
    status: mode === 'append_to_target' ? 'appended' : 'replaced',
    ok: result.ok,
    dryRun,
    approved: true,
    targetRemId: args.targetRemId,
    mode: args.mode,
    templateId: template?.templateId,
    plan,
    result,
  };
}

export async function verifyNoteAgainstDesign(
  plugin: RNPlugin,
  args: VerifyNoteAgainstDesignArgs
): Promise<VerifyNoteAgainstDesignResult> {
  const template = await resolveTemplate(plugin, args.templateId);
  const rules = args.rules ?? template?.rules;
  const expectedStyleMap = {
    ...buildExpectedStyleMap(args.rootRemId, rules),
    ...(args.expectedStyleMap ?? {}),
  };
  const baseVerification = await verifyNoteDesign(plugin, {
    rootRemId: args.rootRemId,
    expectedStyleMap,
    ...(rules?.stylePreset ? { stylePreset: rules.stylePreset } : {}),
  });
  const designIssues = [
    ...(baseVerification.issues ?? []),
    ...baseVerification.mismatches.map((mismatch) => mismatch.message),
  ];
  return {
    status: 'verified',
    rootRemId: args.rootRemId,
    templateId: template?.templateId,
    ok: baseVerification.ok && designIssues.length === 0,
    checkedRemIds: baseVerification.checkedRemIds,
    designIssues,
    mismatches: baseVerification.mismatches,
    unsupportedChecks: baseVerification.unsupportedChecks,
    repairSuggestions: baseVerification.repairSuggestions,
    baseVerification,
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
  const plan = operations.length
    ? operations.map((operation) => `${operation.type} ${operation.remId}`)
    : ['No safe automatic repair operations were inferred.'];

  if (dryRun) {
    return {
      status: 'dry_run',
      ok: verificationBefore.ok,
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
  return {
    status: 'repaired',
    ok: result.status === 'applied' || result.status === 'partial',
    dryRun,
    approved: true,
    rootRemId: args.rootRemId,
    templateId: template?.templateId,
    plan,
    verificationBefore,
    result,
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

function extractBasicCardsFromMarkdown(markdownText: string, maxCards: number): CardWorkflowCardPlan[] {
  const cards: CardWorkflowCardPlan[] = [];
  for (const line of markdownText.split(/\r?\n/)) {
    if (cards.length >= maxCards) {
      break;
    }
    const match = /^[-*\s]*(.+?)::\s*(.+)$/.exec(line.trim());
    if (match) {
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
  const cards: CardWorkflowCardPlan[] = [];
  const pattern = /\{\{(.+?)\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) && cards.length < maxCards) {
    cards.push({
      front: text.replace(/\{\{(.+?)\}\}/, '$1'),
      text,
      clozeText: match[1],
      cardType: 'cloze',
    });
  }
  return cards;
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
  createdRemIds?: string[];
  issues?: string[];
  repairPlan?: string[];
}): CardWorkflowResult {
  return {
    status: input.status,
    ok: input.ok,
    dryRun: input.dryRun,
    rootRemId: input.rootRemId,
    parentId: input.parentId,
    cardCount: input.cards.length,
    cards: input.cards,
    createdRemIds: input.createdRemIds,
    issues: input.issues,
    repairPlan: input.repairPlan,
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
  const cards = [
    ...(marker === 'double_colon' || marker === 'both'
      ? extractBasicCardsFromMarkdown(args.markdownText, maxCards)
      : []),
    ...(marker === 'cloze' || marker === 'both'
      ? extractClozeCardsFromText(args.markdownText, maxCards)
      : []),
  ].slice(0, maxCards);
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
  const children = await runSdkOperation('rem.getChildrenRem', () => root.getChildrenRem()).catch(() => []);
  const cards: CardWorkflowCardPlan[] = [];
  const issues: string[] = [];
  for (const child of children.slice(0, maxCards)) {
    const text = await getRemPlainText(plugin, child).catch(() => ({ frontText: '', backText: '', plainText: '' }));
    if (text.backText) {
      cards.push({
        front: text.frontText || child._id,
        back: text.backText,
        sourceRemId: child._id,
        cardType: 'basic',
      });
    } else if (/\{\{.+?\}\}/.test(text.frontText)) {
      cards.push({
        front: text.frontText,
        text: text.frontText,
        sourceRemId: child._id,
        cardType: 'cloze',
      });
    } else if (text.frontText) {
      issues.push(`Rem ${child._id} has front text but no back/cloze marker.`);
    }
  }
  return cardWorkflowResult({
    status: 'verified',
    ok: issues.length === 0,
    rootRemId: args.rootRemId,
    parentId: args.rootRemId,
    cards,
    issues,
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
