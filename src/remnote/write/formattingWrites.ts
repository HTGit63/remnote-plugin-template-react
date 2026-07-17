import { RemType, SetRemType } from '@remnote/plugin-sdk';
import type { PluginRem as Rem, RichTextFormatName, RichTextInterface, RNPlugin } from '@remnote/plugin-sdk';
import type {
  ApplyRemnoteCommandArgs,
  ApplyRemnoteCommandResult,
  ApplyStylePlanArgs,
  ApplyStylePlanResult,
  ApplyStructuredNoteBatchArgs,
  ApplyStructuredNoteBatchResult,
  AppendToRemArgs,
  AppendToRemResult,
  BridgeErrorCode,
  ClearRemFormattingArgs,
  CreateDocumentArgs,
  CreateDocumentResult,
  CreateFlashcardArgs,
  CreateFlashcardResult,
  CreateFolderArgs,
  CreateFolderResult,
  CreateListAnswerCardArgs,
  CreateMultipleChoiceCardArgs,
  CreateOrReplaceNoteFromMarkdownArgs,
  CreateOrReplaceNoteFromMarkdownResult,
  CreatePolishedNoteTreeArgs,
  CreatePolishedNoteTreeResult,
  CreateRemTreeArgs,
  CreateRemTreeNode,
  CreateRemTreeResult,
  CreateRemArgs,
  CreateRemResult,
  CreateClozeCardArgs,
  CreateStyledRemTreeArgs,
  CreateStyledRemTreeResult,
  DeletePreview,
  DeleteRemByIdArgs,
  DeleteRemByIdResult,
  DeleteRemByIdTarget,
  ExpectedStyleMapEntry,
  FormatRemResult,
  MoveRemArgs,
  MoveRemResult,
  PracticeDirection,
  ReplaceRemArgs,
  ReplaceRemResult,
  ReorderChildrenArgs,
  ReorderChildrenResult,
  RemColorName,
  RemnoteCommandName,
  RemHeadingLevel,
  RemStyleInput,
  RemTypeName,
  RichTextSpanInput,
  SetHideBulletArgs,
  SetRemHeadingLevelArgs,
  SetRemHighlightColorArgs,
  SetRemTextColorArgs,
  SetRemTypeArgs,
  SetTextSpanColorArgs,
  SetTextSpanHighlightArgs,
  StyledRemTreeNode,
  StyledRemTreeNodeType,
  UpdateRemArgs,
  UpdateRemRichArgs,
  UpdateRemResult,
  VerifyNoteDesignArgs,
  VerifyNoteDesignResult,
} from '../../../shared/bridge/protocol';
import {
  RichTextFormattingError,
  applyClozeToRange,
  applyFormatsToRichTextRange,
  applyTextColorToAllText,
  applyTextColorToRange,
  applyTextHighlightToRange,
  normalizeHighlightColorTarget,
  normalizeTextColorTarget,
  RICH_TEXT_FONT_COLOR_FIELD,
  RICH_TEXT_HIGHLIGHT_FIELD,
  replaceRichTextRangeWithMathNode,
  richTextContainsNonTextNodes,
  resolveRangeFromPlainText,
} from '../richTextFormatting';
import { RemnoteWriteError, mapFormattingError, runSdkOperation } from './writeErrors';
import { REMNOTE_COMMAND_RESULT_CACHE, STYLE_PLAN_RESULT_CACHE, getWriteIdempotencyKey } from './writeCaches';
import { STRUCTURED_BATCH_CACHE_LIMIT } from './writeTypes';
import { buildRichTextFromSpans, createRemWithRichText, findRequiredRem, getColorFormat, getFreshInsertIndex, getRemPlainString, getRemRichText, getRemTypeValue, headingLevelFromString, normalizeHeading, rangeInputFromArgs, remColorNameFromString, setTextColorInRange, setTextHighlightInRange } from './remnoteSdkHelpers';
import { existingRemHeadingStyleEnabled, nativeRemHighlightEnabled } from './runtimeFlags';
import {
  captureStyleMutationSnapshot,
  type StyleMutationSnapshot,
  verifyStyleOnlyMutation,
  withRichReplacementProof,
  withStyleMutationProof,
} from './styleMutationInvariant';

async function nativeHighlightMetadataChildIds(
  plugin: RNPlugin,
  before: StyleMutationSnapshot,
  after: StyleMutationSnapshot,
  expectedColor: string
): Promise<string[]> {
  const createdChildIds = after.childIds.filter((id) => !before.childIds.includes(id));
  const expected = expectedColor.trim().toLowerCase();
  const metadataIds: string[] = [];

  for (const childId of createdChildIds) {
    const child = await plugin.rem.findOne(childId);
    if (!child) {
      continue;
    }
    const [front, back] = await Promise.all([
      plugin.richText.toString(child.text ?? []),
      plugin.richText.toString(child.backText ?? []),
    ]);
    if (front.trim().toLowerCase() === 'color' && back.trim().toLowerCase() === expected) {
      metadataIds.push(childId);
    }
  }

  return metadataIds;
}

async function withNativeHighlightMutationProof(
  plugin: RNPlugin,
  rem: Rem,
  result: FormatRemResult,
  before: StyleMutationSnapshot,
  after: StyleMutationSnapshot,
  expectedColor: string
): Promise<FormatRemResult> {
  const readback = await runSdkOperation('rem.getHighlightColor', () => rem.getHighlightColor());
  if (readback?.trim().toLowerCase() !== expectedColor.trim().toLowerCase()) {
    throw new RemnoteWriteError(
      'PARTIAL_FAILURE',
      'Whole-Rem highlight did not round-trip through direct SDK property readback.',
      {
        remId: rem._id,
        expectedHighlightColor: expectedColor,
        actualHighlightColor: readback,
        failedStage: 'native_highlight_property_readback',
        rollbackStatus: 'not_attempted',
      }
    );
  }

  const metadataChildIds = await nativeHighlightMetadataChildIds(
    plugin,
    before,
    after,
    expectedColor
  );
  const metadataSet = new Set(metadataChildIds);
  const normalizedAfter: StyleMutationSnapshot = {
    ...after,
    childIds: after.childIds.filter((id) => !metadataSet.has(id)),
    childOrder: after.childOrder.filter((id) => !metadataSet.has(id)),
  };
  const proof = verifyStyleOnlyMutation(rem._id, result.status, before, normalizedAfter);

  return {
    ...result,
    verification: {
      ...(result.verification ?? {}),
      ...proof,
      nativeHighlightReadback: readback,
      sdkMetadataChildIds: metadataChildIds,
      sdkMetadataChildCount: metadataChildIds.length,
      afterChildIdsIncludingSdkMetadata: [...after.childIds],
      noChildrenCreated: metadataChildIds.length === 0,
      noUnexpectedChildrenCreated: true,
    },
  };
}

function assertExistingRemHeadingStyleEnabled(operation: string): void {
  if (existingRemHeadingStyleEnabled()) {
    return;
  }

  throw new RemnoteWriteError(
    'SDK_UNSUPPORTED',
    'Direct heading/font-size mutation for existing Rems is disabled because the live RemNote SDK can materialize font size as a visible child Rem. Use Markdown note creation for headings, or opt in with REMNOTE_BRIDGE_ENABLE_EXISTING_REM_HEADING_STYLE=1 only after live validation.',
    {
      operation,
      failedStage: 'heading_style_preflight',
      rollbackStatus: 'not_started',
    }
  );
}

async function headingReadback(rem: Rem, expectedHeadingLevel: RemHeadingLevel) {
  const actualHeadingLevel = (await rem.getFontSize().catch(() => undefined)) ?? 'normal';
  if (actualHeadingLevel !== expectedHeadingLevel) {
    throw new RemnoteWriteError('PARTIAL_FAILURE', 'Heading mutation did not round-trip through direct SDK property readback.', {
      remId: rem._id,
      expectedHeadingLevel,
      actualHeadingLevel,
      failedStage: 'heading_property_readback',
      rollbackStatus: 'not_attempted',
    });
  }
  return {
    expectedHeadingLevel,
    actualHeadingLevel,
    headingRoundTripPassed: true,
    evidenceMethod: 'live_property_readback',
  };
}

export async function setRemHeadingLevel(
  plugin: RNPlugin,
  args: SetRemHeadingLevelArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  assertExistingRemHeadingStyleEnabled('set_rem_heading_level');
  const before = await captureStyleMutationSnapshot(plugin, rem);
  await runSdkOperation('rem.setFontSize', () => rem.setFontSize(normalizeHeading(args.level)));
  const after = await captureStyleMutationSnapshot(plugin, rem);
  const result: FormatRemResult = withStyleMutationProof({
    remId: rem._id,
    status: 'heading_set',
    ok: true,
    verification: {},
  }, before, after) as FormatRemResult;
  const readback = await headingReadback(rem, args.level);
  return { ...result, verification: { ...(result.verification ?? {}), ...readback } };
}

export async function setRemTextColor(
  plugin: RNPlugin,
  args: SetRemTextColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  try {
    const before = await captureStyleMutationSnapshot(plugin, rem);
    const formatted = await applyTextColorToAllText(plugin, getRemRichText(rem), args.color);
    await runSdkOperation('rem.setText', () => rem.setText(formatted.richText));
    const after = await captureStyleMutationSnapshot(plugin, rem);
    const plain = await getRemPlainString(plugin, rem);
    return withStyleMutationProof(
      {
        remId: rem._id,
        status: 'text_color_set',
        ok: true,
        requestedColor: formatted.requestedColor,
        normalizedColor: formatted.normalizedColor,
        methodUsed: formatted.methodUsed,
        verification: {
          plainText: plain,
          textLength: plain.length,
        },
      },
      before,
      after
    );
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function setTextSpanColor(
  plugin: RNPlugin,
  args: SetTextSpanColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  try {
    const before = await captureStyleMutationSnapshot(plugin, rem);
    const range = await resolveRangeFromPlainText(
      plugin,
      getRemRichText(rem),
      rangeInputFromArgs(args).start,
      rangeInputFromArgs(args).end,
      rangeInputFromArgs(args).text,
      rangeInputFromArgs(args).occurrence ?? 1
    );
    const result = await setTextColorInRange(plugin, rem, range, args.color, 'span_color_set');
    const after = await captureStyleMutationSnapshot(plugin, rem);
    return withStyleMutationProof(result, before, after);
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function setTextSpanHighlight(
  plugin: RNPlugin,
  args: SetTextSpanHighlightArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const rangeArgs = rangeInputFromArgs(args);
  try {
    const before = await captureStyleMutationSnapshot(plugin, rem);
    const range = await resolveRangeFromPlainText(
      plugin,
      getRemRichText(rem),
      rangeArgs.start,
      rangeArgs.end,
      rangeArgs.text,
      rangeArgs.occurrence ?? 1
    );
    const result = await setTextHighlightInRange(plugin, rem, range, args.color);
    const after = await captureStyleMutationSnapshot(plugin, rem);
    return withStyleMutationProof(result, before, after);
  } catch (error: unknown) {
    throw mapFormattingError(error);
  }
}

export async function setRemHighlightColor(
  plugin: RNPlugin,
  args: SetRemHighlightColorArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const before = await captureStyleMutationSnapshot(plugin, rem);
  const color = remColorNameFromString(args.color);
  if (color === 'default') {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      'The current RemNote SDK path does not expose clearing whole-Rem highlight color.'
    );
  }

  if (nativeRemHighlightEnabled()) {
    const format = getColorFormat(color);
    if (!format) {
      throw new RemnoteWriteError(
        'SDK_UNSUPPORTED',
        `Highlight ${color} is not supported by this SDK.`
      );
    }
    await runSdkOperation('rem.setHighlightColor', () =>
      rem.setHighlightColor(format as never)
    );
    const after = await captureStyleMutationSnapshot(plugin, rem);
    return withNativeHighlightMutationProof(
      plugin,
      rem,
      { remId: rem._id, status: 'highlight_set', ok: true },
      before,
      after,
      format
    );
  }

  if (richTextContainsNonTextNodes(getRemRichText(rem))) {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      'Whole-Rem highlight fallback cannot safely style math or other non-text rich nodes.',
      {
        remId: rem._id,
        requestedColor: color,
        fallback: 'Enable verified native whole-Rem highlight support or style adjacent text spans only.',
        mutationStarted: false,
      }
    );
  }

  const plain = await getRemPlainString(plugin, rem);
  if (!plain) {
    throw new RemnoteWriteError('SDK_UNSUPPORTED', 'NO_TEXT_TO_HIGHLIGHT: Rem has no text to highlight safely.', {
      remId: rem._id,
      requestedColor: color,
    });
  }
  const result = await setTextHighlightInRange(
    plugin,
    rem,
    { start: 0, end: plain.length, resolvedPlainText: plain },
    color
  );
  const after = await captureStyleMutationSnapshot(plugin, rem);
  return withStyleMutationProof({ ...result, status: 'highlight_set' }, before, after);
}

export async function setRemType(
  plugin: RNPlugin,
  args: SetRemTypeArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  if (args.type === 'normal') {
    throw new RemnoteWriteError(
      'SDK_UNSUPPORTED',
      'The current RemNote SDK path does not expose a reliable reset to normal Rem type.'
    );
  }

  const before = await captureStyleMutationSnapshot(plugin, rem);
  await runSdkOperation('rem.setType', () => rem.setType(getRemTypeValue(args.type)));
  const after = await captureStyleMutationSnapshot(plugin, rem);
  return withStyleMutationProof({ remId: rem._id, status: 'rem_type_set', ok: true }, before, after);
}

export async function setHideBullet(
  plugin: RNPlugin,
  args: SetHideBulletArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const before = await captureStyleMutationSnapshot(plugin, rem);
  await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(!args.hideBullet));
  const after = await captureStyleMutationSnapshot(plugin, rem);
  return withStyleMutationProof({ remId: rem._id, status: 'hide_bullet_set', ok: true }, before, after);
}

export async function clearRemFormatting(
  plugin: RNPlugin,
  args: ClearRemFormattingArgs
): Promise<FormatRemResult> {
  const rem = await findRequiredRem(plugin, args.remId, 'Target');
  const before = await captureStyleMutationSnapshot(plugin, rem);
  const plain = await getRemPlainString(plugin, rem);
  const richText = await buildRichTextFromSpans(plugin, [{ text: plain || ' ' }]);
  const warnings: string[] = [];
  const cleared: NonNullable<FormatRemResult['cleared']> = {};
  const unsupported: NonNullable<FormatRemResult['unsupported']> = {};
  let headingVerification: Record<string, unknown> = {};

  await runSdkOperation('rem.setText', () => rem.setText(richText));
  cleared.textFormatting = true;

  if (existingRemHeadingStyleEnabled()) {
    await runSdkOperation('rem.setFontSize', () => rem.setFontSize(undefined));
    headingVerification = await headingReadback(rem, 'normal');
    cleared.heading = true;
  } else {
    cleared.heading = false;
    unsupported.headingReset = true;
    warnings.push('Heading reset was not attempted because existing-Rem font-size mutation has not been live-validated.');
  }

  await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(true));
  cleared.hideBullet = true;

  cleared.wholeRemHighlight = false;
  unsupported.wholeRemHighlightReset = true;
  warnings.push('Whole-Rem highlight clearing is not exposed by the current RemNote SDK path.');

  if (rem.type === RemType.CONCEPT || rem.type === RemType.DESCRIPTOR) {
    cleared.remType = false;
    unsupported.remTypeReset = true;
    unsupported.reason = 'The current RemNote SDK path does not expose a reliable concept/descriptor reset to normal type.';
    warnings.push(unsupported.reason);
  } else {
    cleared.remType = true;
  }

  const after = await captureStyleMutationSnapshot(plugin, rem);
  const result: FormatRemResult = withStyleMutationProof({
    remId: rem._id,
    status: warnings.length === 0 ? 'formatting_cleared' : 'formatting_partially_cleared',
    ok: warnings.length === 0,
    cleared,
    unsupported,
    warnings,
  }, before, after);
  result.verification = { ...(result.verification ?? {}), ...headingVerification };
  return result;
}

async function resolveCommandTarget(plugin: RNPlugin, args: ApplyRemnoteCommandArgs): Promise<Rem> {
  if (args.target.mode === 'focused_rem') {
    const focused = await plugin.focus.getFocusedRem();
    if (!focused) {
      throw new RemnoteWriteError('NO_FOCUSED_REM', 'No Rem is currently focused in RemNote.');
    }
    return focused;
  }

  if (args.target.mode === 'selected_rem') {
    const selection = await plugin.editor.getSelection();
    const selectedRemIds =
      selection?.type === 'Rem'
        ? selection.remIds
        : selection?.type === 'Text'
          ? [selection.remId]
          : [];
    if (selectedRemIds.length !== 1) {
      throw new RemnoteWriteError(
        'INVALID_ARGS',
        'selected_rem command target requires exactly one selected Rem.',
        { selectedRemCount: selectedRemIds.length }
      );
    }
    return findRequiredRem(plugin, selectedRemIds[0], 'Target');
  }

  const remId = args.target.remId?.trim();
  if (!remId) {
    throw new RemnoteWriteError('INVALID_ARGS', 'rem_id command target requires remId.');
  }
  return findRequiredRem(plugin, remId, 'Target');
}

function rememberRemnoteCommandResult(idempotencyKey: string, result: ApplyRemnoteCommandResult) {
  REMNOTE_COMMAND_RESULT_CACHE.delete(idempotencyKey);
  REMNOTE_COMMAND_RESULT_CACHE.set(idempotencyKey, result);

  while (REMNOTE_COMMAND_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = REMNOTE_COMMAND_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    REMNOTE_COMMAND_RESULT_CACHE.delete(oldestKey);
  }
}

function resultForCommand(
  rem: Rem,
  command: RemnoteCommandName,
  idempotencyKey?: string,
  status: ApplyRemnoteCommandResult['status'] = 'command_applied'
): ApplyRemnoteCommandResult {
  return {
    remId: rem._id,
    command,
    status,
    ...(idempotencyKey ? { idempotencyKey } : {}),
  };
}

function isStyleOnlyCommand(command: RemnoteCommandName): boolean {
  return command !== 'insert_inline_math' && command !== 'insert_math_block';
}

async function appendMathToRem(
  plugin: RNPlugin,
  rem: Rem,
  latex: string,
  block: boolean,
  prefixText?: string
) {
  const currentRichText = JSON.parse(JSON.stringify(getRemRichText(rem))) as RichTextInterface;
  const currentText = await getRemPlainString(plugin, rem);
  const appendSpans: RichTextSpanInput[] = [];
  if (currentText) {
    appendSpans.push({ text: ' ' });
  }
  if (prefixText?.trim()) {
    appendSpans.push({ text: `${prefixText.trim()} ` });
  }
  appendSpans.push({ type: block ? 'mathBlock' : 'inlineMath', latex });
  const appended = await buildRichTextFromSpans(plugin, appendSpans);
  await runSdkOperation('rem.setText', () => rem.setText([...currentRichText, ...appended] as RichTextInterface));
}

async function createMathBlockChildRem(
  plugin: RNPlugin,
  parent: Rem,
  latex: string,
  prefixText?: string
): Promise<Rem> {
  const spans: RichTextSpanInput[] = [];
  if (prefixText?.trim()) {
    spans.push({ text: `${prefixText.trim()} ` });
  }
  spans.push({ type: 'mathBlock', latex });
  const richText = await buildRichTextFromSpans(plugin, spans);
  const insertIndex = await getFreshInsertIndex(plugin, parent, 'end');
  return createRemWithRichText(plugin, richText, parent, insertIndex);
}

export async function applyRemnoteCommand(
  plugin: RNPlugin,
  args: ApplyRemnoteCommandArgs
): Promise<ApplyRemnoteCommandResult> {
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'remnote-command');
  if (!args.dryRun) {
    const cached = REMNOTE_COMMAND_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
      };
    }
  }

  const rem = await resolveCommandTarget(plugin, args);
  const command = args.command;
  const before = isStyleOnlyCommand(command)
    ? await captureStyleMutationSnapshot(plugin, rem)
    : undefined;

  if (args.dryRun) {
    return {
      remId: rem._id,
      command,
      status: 'dry_run',
      dryRun: true,
      idempotencyKey,
    };
  }

  switch (command) {
    case 'heading_1':
      assertExistingRemHeadingStyleEnabled(command);
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize('H1'));
      break;
    case 'heading_2':
      assertExistingRemHeadingStyleEnabled(command);
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize('H2'));
      break;
    case 'heading_3':
      assertExistingRemHeadingStyleEnabled(command);
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize('H3'));
      break;
    case 'normal_text':
      assertExistingRemHeadingStyleEnabled(command);
      await runSdkOperation('rem.setFontSize', () => rem.setFontSize(undefined));
      break;
    case 'highlight_yellow':
    case 'highlight_blue':
    case 'highlight_green':
    case 'highlight_red': {
      const colorName = command.replace('highlight_', '') as RemColorName;
      await setRemHighlightColor(plugin, { remId: rem._id, color: colorName });
      break;
    }
    case 'hide_bullet':
      await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(false));
      break;
    case 'show_bullet':
      await runSdkOperation('rem.setIsListItem', () => rem.setIsListItem(true));
      break;
    case 'make_concept':
      await runSdkOperation('rem.setType', () => rem.setType(SetRemType.CONCEPT));
      break;
    case 'make_descriptor':
      await runSdkOperation('rem.setType', () => rem.setType(SetRemType.DESCRIPTOR));
      break;
    case 'make_normal':
      throw new RemnoteWriteError(
        'SDK_UNSUPPORTED',
        'The installed RemNote SDK does not expose a reliable reset to normal Rem type.'
      );
    case 'insert_inline_math': {
      const latex = args.args?.latex?.trim();
      if (!latex) {
        throw new RemnoteWriteError('INVALID_ARGS', `${command} requires args.latex.`);
      }
      await appendMathToRem(plugin, rem, latex, false, args.args?.text);
      break;
    }
    case 'insert_math_block': {
      const latex = args.args?.latex?.trim();
      if (!latex) {
        throw new RemnoteWriteError('INVALID_ARGS', `${command} requires args.latex.`);
      }
      const created = await createMathBlockChildRem(plugin, rem, latex, args.args?.text);
      const result = resultForCommand(rem, command, idempotencyKey);
      result.createdRemId = created._id;
      rememberRemnoteCommandResult(idempotencyKey, result);
      return result;
    }
    default:
      throw new RemnoteWriteError('INVALID_ARGS', `Unsupported RemNote command "${command}".`);
  }

  const result = resultForCommand(rem, command, idempotencyKey);
  if (before) {
    const after = await captureStyleMutationSnapshot(plugin, rem);
    result.verification = verifyStyleOnlyMutation(rem._id, result.status, before, after);
    const expectedHeading = command === 'heading_1'
      ? 'H1'
      : command === 'heading_2'
        ? 'H2'
        : command === 'heading_3'
          ? 'H3'
          : command === 'normal_text'
            ? 'normal'
            : undefined;
    if (expectedHeading) {
      result.verification = {
        ...result.verification,
        ...await headingReadback(rem, expectedHeading),
      };
    }
  }
  rememberRemnoteCommandResult(idempotencyKey, result);
  return result;
}


export function rememberStylePlanResult(idempotencyKey: string, result: ApplyStylePlanResult) {
  STYLE_PLAN_RESULT_CACHE.delete(idempotencyKey);
  STYLE_PLAN_RESULT_CACHE.set(idempotencyKey, result);

  while (STYLE_PLAN_RESULT_CACHE.size > STRUCTURED_BATCH_CACHE_LIMIT) {
    const oldestKey = STYLE_PLAN_RESULT_CACHE.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    STYLE_PLAN_RESULT_CACHE.delete(oldestKey);
  }
}


async function applyOneStyleOperation(
  plugin: RNPlugin,
  operation: ApplyStylePlanArgs['operations'][number]
): Promise<unknown> {
  preflightStyleOperation(operation);
  const operationValue =
    operation.value ??
    operation.headingLevel ??
    operation.highlightColor ??
    operation.color;
  switch (operation.type) {
    case 'heading':
      if (operation.value && operation.headingLevel && headingLevelFromString(operation.value) !== operation.headingLevel) {
        throw new RemnoteWriteError('INVALID_ARGS', 'heading operation value conflicts with headingLevel.', {
          value: operation.value,
          headingLevel: operation.headingLevel,
        });
      }
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'heading operation requires headingLevel.');
      }
      return setRemHeadingLevel(plugin, {
        remId: operation.remId,
        level: headingLevelFromString(operationValue),
      });
    case 'whole_rem_highlight':
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'whole_rem_highlight operation requires highlightColor.');
      }
      return setRemHighlightColor(plugin, {
        remId: operation.remId,
        color: remColorNameFromString(operationValue),
      });
    case 'text_color_span':
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'text_color_span operation requires color.');
      }
      return setTextSpanColor(plugin, {
        remId: operation.remId,
        color: operationValue,
        start: operation.start,
        end: operation.end,
        text: operation.text,
        occurrence: operation.occurrence,
      });
    case 'text_highlight_span':
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'text_highlight_span operation requires highlightColor.');
      }
      return setTextSpanHighlight(plugin, {
        remId: operation.remId,
        color: operationValue,
        start: operation.start,
        end: operation.end,
        text: operation.text,
        occurrence: operation.occurrence,
      });
    case 'bold_span':
    case 'italic_span': {
      const rem = await findRequiredRem(plugin, operation.remId, 'Target');
      const before = await captureStyleMutationSnapshot(plugin, rem);
      const range = await resolveRangeFromPlainText(
        plugin,
        getRemRichText(rem),
        operation.start,
        operation.end,
        operation.text,
        operation.occurrence ?? 1
      );
      const richText = await applyFormatsToRichTextRange(
        plugin,
        getRemRichText(rem),
        range.sdkStart,
        range.sdkEnd,
        [operation.type === 'bold_span' ? 'bold' : 'italic']
      );
      await runSdkOperation('rem.setText', () => rem.setText(richText));
      const after = await captureStyleMutationSnapshot(plugin, rem);
      return withStyleMutationProof({
        remId: rem._id,
        status: 'updated_rich',
        ok: true,
        resolvedPlainText: range.resolvedPlainText,
        start: range.start,
        end: range.end,
        methodUsed: 'rich_text_rebuild',
      } as FormatRemResult, before, after);
    }
    case 'math_conversion': {
      const latex = operation.latex?.trim();
      if (!latex) {
        throw new RemnoteWriteError('INVALID_ARGS', 'math_conversion requires latex.');
      }
      const rem = await findRequiredRem(plugin, operation.remId, 'Target');
      const before = await captureStyleMutationSnapshot(plugin, rem);
      const current = getRemRichText(rem);
      const range = await resolveRangeFromPlainText(
        plugin,
        current,
        operation.start,
        operation.end,
        operation.text,
        operation.occurrence ?? 1
      );
      const converted = await replaceRichTextRangeWithMathNode(
        plugin,
        current,
        range.sdkStart,
        range.sdkEnd,
        latex,
        false
      );
      const expectedPlainText = `${before.plainText.slice(0, range.start)}${latex}${before.plainText.slice(range.end)}`;
      await runSdkOperation('rem.setText', () => rem.setText(converted));
      const refreshed = await findRequiredRem(plugin, rem._id, 'Target');
      const after = await captureStyleMutationSnapshot(plugin, refreshed);
      const richTextMatchesRequested = JSON.stringify(getRemRichText(refreshed)) === JSON.stringify(converted);
      return withRichReplacementProof({
        remId: rem._id,
        status: 'updated_rich',
        ok: true,
        resolvedPlainText: range.resolvedPlainText,
        start: range.start,
        end: range.end,
        methodUsed: 'rich_text_rebuild',
      } as FormatRemResult, before, after, expectedPlainText, richTextMatchesRequested);
    }
    default:
      throw new RemnoteWriteError('INVALID_ARGS', `Unsupported style operation "${operation.type}".`);
  }
}

function preflightStyleOperation(
  operation: ApplyStylePlanArgs['operations'][number]
): void {
  const operationValue =
    operation.value ??
    operation.headingLevel ??
    operation.highlightColor ??
    operation.color;

  switch (operation.type) {
    case 'heading':
      if (operation.value && operation.headingLevel && headingLevelFromString(operation.value) !== operation.headingLevel) {
        throw new RemnoteWriteError('INVALID_ARGS', 'heading operation value conflicts with headingLevel.', {
          value: operation.value,
          headingLevel: operation.headingLevel,
        });
      }
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'heading operation requires headingLevel.');
      }
      headingLevelFromString(operationValue);
      assertExistingRemHeadingStyleEnabled('apply_style_plan');
      return;
    case 'whole_rem_highlight':
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'whole_rem_highlight operation requires highlightColor.');
      }
      remColorNameFromString(operationValue);
      return;
    case 'text_color_span':
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'text_color_span operation requires color.');
      }
      return;
    case 'text_highlight_span':
      if (!operationValue) {
        throw new RemnoteWriteError('INVALID_ARGS', 'text_highlight_span operation requires highlightColor.');
      }
      return;
    case 'bold_span':
    case 'italic_span':
      return;
    case 'math_conversion':
      if (!operation.latex?.trim()) {
        throw new RemnoteWriteError('INVALID_ARGS', 'math_conversion requires latex.');
      }
      return;
    default:
      throw new RemnoteWriteError('INVALID_ARGS', `Unsupported style operation "${operation.type}".`);
  }
}

export async function applyStylePlan(
  plugin: RNPlugin,
  args: ApplyStylePlanArgs
): Promise<ApplyStylePlanResult> {
  const continueOnError = args.continueOnError ?? true;
  const idempotencyKey = getWriteIdempotencyKey(args.idempotencyKey, 'structured-batch');
  if (!args.dryRun) {
    const cached = STYLE_PLAN_RESULT_CACHE.get(idempotencyKey);
    if (cached) {
      return {
        ...cached,
        status: 'already_applied',
      };
    }
  }

  if (args.dryRun) {
    const operations: ApplyStylePlanResult['operations'] = [];
    for (let index = 0; index < args.operations.length; index += 1) {
      const operation = args.operations[index];
      try {
        preflightStyleOperation(operation);
        operations.push({
          index,
          remId: operation.remId,
          type: operation.type,
          status: 'applied',
          result: {
            dryRun: true,
            value: operation.value,
          },
        });
      } catch (error: unknown) {
        const mapped = mapFormattingError(error);
        operations.push({
          index,
          remId: operation.remId,
          type: operation.type,
          status: mapped.code === 'SDK_UNSUPPORTED' ? 'unsupported' : 'failed',
          error: {
            code: mapped.code,
            message: mapped.message,
            details: mapped.details,
          },
        });
        if (!continueOnError) {
          break;
        }
      }
    }
    return {
      status: 'dry_run',
      updatedRemIds: [],
      operations,
      continueOnError,
      verifyAfterWrite: args.verifyAfterWrite ?? false,
      dryRun: true,
      idempotencyKey,
    };
  }

  const operations: ApplyStylePlanResult['operations'] = [];

  for (let index = 0; index < args.operations.length; index += 1) {
    const operation = args.operations[index];
    try {
      const result = await applyOneStyleOperation(plugin, operation);
      operations.push({
        index,
        remId: operation.remId,
        type: operation.type,
        status: 'applied',
        result,
      });
    } catch (error: unknown) {
      const mapped = mapFormattingError(error);
      operations.push({
        index,
        remId: operation.remId,
        type: operation.type,
        status: mapped.code === 'SDK_UNSUPPORTED' ? 'unsupported' : 'failed',
        error: {
          code: mapped.code,
          message: mapped.message,
          details: mapped.details,
        },
      });
      if (!continueOnError) {
        break;
      }
    }
  }

  const failed = operations.some((operation) => operation.status === 'failed');
  const unsupported = operations.some((operation) => operation.status === 'unsupported');
  const result: ApplyStylePlanResult = {
    status: failed ? 'failed' : unsupported ? 'partial' : 'applied',
    updatedRemIds: Array.from(new Set(
      operations
        .filter((operation) => operation.status === 'applied')
        .map((operation) => operation.remId)
    )),
    operations,
    continueOnError,
    verifyAfterWrite: args.verifyAfterWrite ?? false,
    idempotencyKey,
  };
  if (result.status === 'applied') {
    rememberStylePlanResult(idempotencyKey, result);
  }
  return result;
}
