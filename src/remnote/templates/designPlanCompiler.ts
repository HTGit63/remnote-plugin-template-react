import type {
  CompiledNoteDesignManifest,
  CompiledNoteDesignRuleResult,
  DesignedNoteWritingMode,
  NoteDesignRoleRules,
  NoteDesignRoleTreatment,
  NoteDesignRules,
  RichTextSpanInput,
  RichTextSpanStyle,
  StyledRemTreeNode,
} from '../../../shared/bridge/protocol';
import { parseMarkdownImportPlan } from '../../../shared/bridge/markdown-importer';
import { RemnoteWriteError } from '../write/writeErrors';

type DesignRole = keyof NoteDesignRoleRules;

export interface CompileNoteDesignPlanInput {
  title: string;
  content: string | StyledRemTreeNode;
  rules: NoteDesignRules;
  templateId?: string;
  templateVersion?: number;
  writingMode: DesignedNoteWritingMode;
}

export interface CompiledNoteDesignPlan {
  tree: StyledRemTreeNode;
  manifest: CompiledNoteDesignManifest;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function nodeText(node: StyledRemTreeNode): string {
  if (node.text !== undefined) return node.text;
  if (node.title !== undefined) return node.title;
  if (node.latex !== undefined) return node.latex;
  if (node.front !== undefined) return node.front;
  return '';
}

function normalized(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function stripInitialRootHeading(content: string): string {
  const trimmed = content.trim();
  const match = /^#\s+.+?(?:\n|$)/.exec(trimmed);
  if (!match) {
    return trimmed;
  }
  return trimmed.slice(match[0].length).trim();
}

function normalizeStyledRoot(title: string, input: StyledRemTreeNode): StyledRemTreeNode {
  const tree = clone(input);
  const currentTitle = nodeText(tree).trim();
  if (currentTitle && normalized(currentTitle) !== normalized(title)) {
    throw new RemnoteWriteError(
      'INVALID_ARGS',
      'Styled design content root must match the explicit title so creation cannot add a second title wrapper.',
      { title, contentRootTitle: currentTitle }
    );
  }
  tree.text = title.trim();
  tree.title = undefined;

  const promotedChildren: StyledRemTreeNode[] = [];
  for (const child of tree.children ?? []) {
    if (normalized(nodeText(child)) === normalized(title)) {
      promotedChildren.push(...(child.children ?? []));
    } else {
      promotedChildren.push(child);
    }
  }
  tree.children = promotedChildren;
  return tree;
}

function contentTree(title: string, content: string | StyledRemTreeNode, rules: NoteDesignRules): StyledRemTreeNode {
  if (typeof content !== 'string') {
    return normalizeStyledRoot(title, content);
  }
  const body = stripInitialRootHeading(content);
  if (!body) {
    return {
      clientNodeId: 'design-root',
      type: 'rem',
      text: title.trim(),
      children: [],
    };
  }
  const plan = parseMarkdownImportPlan(body, {
    headingMapping: {
      rootHeading: 'explicit_title',
      explicitTitle: title.trim(),
      rootHeadingLevel: rules.headingPattern.rootHeadingLevel ?? 'normal',
      sectionHeadingLevel: rules.headingPattern.sectionHeadingLevel ?? 'normal',
      subsectionHeadingLevel: rules.headingPattern.sectionHeadingLevel ?? 'normal',
    },
    remnoteLayout: {
      insertSpacerBetweenSections: false,
      spacerText: '',
      preserveBlankLines: true,
      paragraphMode: 'child_rem_per_paragraph',
      bulletMode: 'plain_child_rems',
    },
    mathOptions: {
      inlineMathDelimiters: 'both',
      blockMathDelimiters: 'both',
      formulaMode: rules.formulaPlacement.displayFormulasAsSeparateRems
        ? 'force_block_for_display_math'
        : 'preserve',
      rejectMalformedMath: true,
    },
    flashcardOptions: {
      enabled: false,
      marker: 'both',
      defaultDirection: 'both',
    },
  });
  return normalizeStyledRoot(title, plan.tree);
}

function isSpacer(node: StyledRemTreeNode): boolean {
  const text = nodeText(node);
  return text.trim().length === 0 || text === '\u200b' || /^[-_*]{3,}$/.test(text.trim());
}

function withDeterministicSpacers(tree: StyledRemTreeNode, rules: NoteDesignRules): StyledRemTreeNode {
  if (!rules.spacingPattern.siblingSpacerLikely) {
    return tree;
  }
  const spacerText = rules.spacingPattern.spacerTexts.find((text) =>
    text === '' || text === '\u200b' || /^[-_*]{3,}$/.test(text.trim())
  ) ?? '\u200b';
  const sections = (tree.children ?? []).filter((child) => !isSpacer(child));
  tree.children = sections.flatMap((child, index) => index === 0
    ? [child]
    : [{ clientNodeId: `design-spacer-${index}`, type: 'rem' as const, text: spacerText || ' ' }, child]);
  return tree;
}

function assignClientNodeIds(node: StyledRemTreeNode, path = 'root'): void {
  node.clientNodeId = node.clientNodeId?.trim() || `design-${path}`;
  (node.children ?? []).forEach((child, index) => assignClientNodeIds(child, `${path}-${index + 1}`));
}

function spanLength(span: RichTextSpanInput): number {
  return (span.text ?? span.latex ?? '').length;
}

function mergeTextStyle(
  original: RichTextSpanStyle | undefined,
  treatment: RichTextSpanStyle
): RichTextSpanStyle {
  return { ...(original ?? {}), ...treatment };
}

function asTextSpans(node: StyledRemTreeNode): RichTextSpanInput[] {
  return node.richText?.length
    ? clone(node.richText)
    : [{ type: 'text', text: nodeText(node) }];
}

function applyFullTextStyle(node: StyledRemTreeNode, style: RichTextSpanStyle): boolean {
  const spans = asTextSpans(node);
  let applied = false;
  node.richText = spans.map((span) => {
    const type = span.type ?? (span.latex ? 'inlineMath' : 'text');
    if (type !== 'text') {
      return span;
    }
    applied = true;
    return { ...span, styles: mergeTextStyle(span.styles, style) };
  });
  return applied;
}

function applyMathStyle(node: StyledRemTreeNode, style: RichTextSpanStyle): boolean {
  const spans = asTextSpans(node);
  let applied = false;
  node.richText = spans.map((span) => {
    const type = span.type ?? (span.latex ? 'inlineMath' : 'text');
    if (type !== 'inlineMath' && type !== 'mathBlock') return span;
    applied = true;
    return { ...span, styles: mergeTextStyle(span.styles, style) };
  });
  return applied;
}

function applyPrefixStyle(
  node: StyledRemTreeNode,
  prefixLength: number,
  style: RichTextSpanStyle
): boolean {
  const spans = asTextSpans(node);
  const output: RichTextSpanInput[] = [];
  let cursor = 0;
  let applied = false;
  for (const span of spans) {
    const length = spanLength(span);
    const type = span.type ?? (span.latex ? 'inlineMath' : 'text');
    if (type !== 'text' || cursor >= prefixLength || cursor + length <= 0) {
      output.push(span);
      cursor += length;
      continue;
    }
    const targetLength = Math.min(length, prefixLength - cursor);
    const text = span.text ?? '';
    if (targetLength > 0) {
      output.push({
        ...span,
        text: text.slice(0, targetLength),
        styles: mergeTextStyle(span.styles, style),
      });
      applied = true;
    }
    if (targetLength < text.length) {
      output.push({ ...span, text: text.slice(targetLength) });
    }
    cursor += length;
  }
  node.richText = output;
  return applied;
}

function mergeRemTreatment(node: StyledRemTreeNode, treatment: NoteDesignRoleTreatment): boolean {
  let applied = false;
  if (treatment.remStyle) {
    node.style = { ...(node.style ?? {}), ...treatment.remStyle };
    applied = true;
  }
  if (treatment.fullTextStyle) {
    applied = applyFullTextStyle(node, treatment.fullTextStyle) || applied;
  }
  if (treatment.mathStyle) {
    applied = applyMathStyle(node, treatment.mathStyle) || applied;
  }
  return applied;
}

function prefixLengthForRole(role: DesignRole, text: string): number {
  if (role === 'keyIdea') {
    return /^key\s+idea\s*:/i.exec(text)?.[0].length ?? 0;
  }
  if (role === 'warning') {
    return /^warning\s*:/i.exec(text)?.[0].length ?? 0;
  }
  return 0;
}

function formulaLike(node: StyledRemTreeNode): boolean {
  if (node.type === 'mathBlock' || node.type === 'inlineMath') return true;
  if (node.richText?.some((span) => span.type === 'mathBlock' || span.type === 'inlineMath')) return true;
  const text = nodeText(node).trim();
  return text.length <= 240 && /[=≈⇌→]/.test(text) && !/[.!?]\s/.test(text);
}

function explicitFormulaNode(node: StyledRemTreeNode): boolean {
  return node.type === 'mathBlock' || node.type === 'inlineMath' ||
    Boolean(node.richText?.some((span) => span.type === 'mathBlock' || span.type === 'inlineMath'));
}

function rolesForNode(
  node: StyledRemTreeNode,
  depth: number,
  ancestors: StyledRemTreeNode[]
): DesignRole[] {
  const text = nodeText(node).trim();
  const lower = normalized(text);
  const roles: DesignRole[] = [];
  const ancestorTexts = ancestors.map((ancestor) => normalized(nodeText(ancestor)));
  const insideAnswer = ancestorTexts.some((value) => /^answer(?:\s+treatment)?$/.test(value));
  const insideSummary = ancestorTexts.some((value) => /^(?:\d+(?:\.\d+)*[.)]?\s+)?summary$/.test(value));
  if (depth === 0) roles.push('root');
  if (depth === 1 && !isSpacer(node)) roles.push('section');
  if (/^key\s+idea\s*:/i.test(text)) roles.push('keyIdea');
  if (/^warning(?:\s+treatment)?(?:\s*:|$)/i.test(text)) roles.push('warning');
  const insideDedicatedFormulaSection = ancestorTexts.some((value) =>
    /^(?:(?:\d+(?:\.\d+)*[.)]?)\s+)?(?:key|main)\s+formula$/.test(value) ||
    /^formula treatment$/.test(value)
  );
  if (
    !insideAnswer &&
    (explicitFormulaNode(node) || (insideDedicatedFormulaSection && !(node.children?.length) && formulaLike(node)))
  ) {
    roles.push('formula');
  }

  const insideWorkedExample = ancestorTexts.some((value) => /worked\s+example/.test(value));
  if (insideWorkedExample && /^(problem|given|formula|substitution|answer)$/.test(lower)) {
    roles.push('workedExample');
  }
  if (insideAnswer || /^answer(?:\s+treatment)?\s*:/.test(lower)) roles.push('answer');
  if (insideSummary) roles.push('summary');

  const reviewIndex = ancestorTexts.findIndex((value) => /review\s+cards?|flashcards?/.test(value));
  if (reviewIndex >= 0) {
    const reviewDepth = reviewIndex;
    const relativeDepth = ancestors.length - reviewDepth;
    if (relativeDepth === 1) roles.push('concept');
    if (relativeDepth === 2) roles.push('descriptor');
  }
  return [...new Set(roles)];
}

function unsupportedObservationResults(rules: NoteDesignRules): CompiledNoteDesignRuleResult[] {
  const results: CompiledNoteDesignRuleResult[] = [];
  if (
    Object.keys(rules.colorPattern.textColors ?? {}).length ||
    Object.keys(rules.colorPattern.highlightColors ?? {}).length ||
    Object.keys(rules.colorPattern.wholeRemHighlights ?? {}).length
  ) {
    results.push({
      ruleId: 'observation.color_counts',
      status: 'unsupported',
      matchedNodeCount: 0,
      matchedClientNodeIds: [],
      reason: 'Aggregate color counts do not identify reusable target roles.',
    });
  }
  if (rules.tableStyle.tableLikeRemCount > 0 || rules.tableStyle.markdownTableCount > 0) {
    results.push({
      ruleId: 'observation.table_counts',
      status: 'unsupported',
      matchedNodeCount: 0,
      matchedClientNodeIds: [],
      reason: 'Aggregate table observations do not encode a safe target transformation.',
    });
  }
  return results;
}

export function compileNoteDesignPlan(input: CompileNoteDesignPlanInput): CompiledNoteDesignPlan {
  const tree = withDeterministicSpacers(
    contentTree(input.title, input.content, input.rules),
    input.rules
  );
  assignClientNodeIds(tree);
  const roleCounts = new Map<DesignRole, number>();
  const roleAppliedCounts = new Map<DesignRole, number>();
  const roleClientNodeIds = new Map<DesignRole, string[]>();

  function visit(node: StyledRemTreeNode, depth: number, ancestors: StyledRemTreeNode[]): void {
    if (depth === 0 && input.rules.headingPattern.rootHeadingLevel) {
      node.style = { ...(node.style ?? {}), headingLevel: input.rules.headingPattern.rootHeadingLevel };
    }
    if (depth === 1 && !isSpacer(node) && input.rules.headingPattern.sectionHeadingLevel) {
      node.style = { ...(node.style ?? {}), headingLevel: input.rules.headingPattern.sectionHeadingLevel };
    }

    const roles = rolesForNode(node, depth, ancestors);
    for (const role of roles) {
      const treatment = input.rules.roleRules?.[role];
      if (!treatment) continue;
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      roleClientNodeIds.set(role, [...(roleClientNodeIds.get(role) ?? []), node.clientNodeId as string]);
      let applied = mergeRemTreatment(node, treatment);
      const prefixLength = prefixLengthForRole(role, nodeText(node));
      if (treatment.prefixStyle && prefixLength > 0) {
        applied = applyPrefixStyle(node, prefixLength, treatment.prefixStyle) || applied;
      }
      if (applied) roleAppliedCounts.set(role, (roleAppliedCounts.get(role) ?? 0) + 1);
    }
    for (const child of node.children ?? []) {
      visit(child, depth + 1, [...ancestors, node]);
    }
  }
  visit(tree, 0, []);

  const roleResults: CompiledNoteDesignRuleResult[] = Object.entries(input.rules.roleRules ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([role]) => {
      const typedRole = role as DesignRole;
      const matchedNodeCount = roleCounts.get(typedRole) ?? 0;
      const appliedCount = roleAppliedCounts.get(typedRole) ?? 0;
      return {
        ruleId: `role.${role}`,
        role: typedRole,
        status: matchedNodeCount > 0 && appliedCount === 0 ? 'unsupported' : 'supported',
        matchedNodeCount,
        matchedClientNodeIds: roleClientNodeIds.get(typedRole) ?? [],
        ...(matchedNodeCount > 0 && appliedCount === 0
          ? { reason: 'Matched nodes expose no safely styleable text or property for this treatment.' }
          : {}),
      };
    });
  const headingResults: CompiledNoteDesignRuleResult[] = [
    {
      ruleId: 'heading.root',
      role: 'root',
      status: 'supported',
      matchedNodeCount: 1,
      matchedClientNodeIds: [tree.clientNodeId as string],
    },
    {
      ruleId: 'heading.section',
      role: 'section',
      status: 'supported',
      matchedNodeCount: (tree.children ?? []).filter((child) => !isSpacer(child)).length,
      matchedClientNodeIds: (tree.children ?? [])
        .filter((child) => !isSpacer(child))
        .map((child) => child.clientNodeId as string),
    },
  ];
  const spacingResult: CompiledNoteDesignRuleResult[] = input.rules.spacingPattern.siblingSpacerLikely
    ? [{
        ruleId: 'spacing.sibling_spacer',
        status: 'supported',
        matchedNodeCount: (tree.children ?? []).filter(isSpacer).length,
        matchedClientNodeIds: (tree.children ?? []).filter(isSpacer).map((child) => child.clientNodeId as string),
      }]
    : [];
  const ruleResults = [
    ...headingResults,
    ...spacingResult,
    ...roleResults,
    ...unsupportedObservationResults(input.rules),
  ];
  const manifestSeed = {
    schemaVersion: 1,
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    rules: input.rules,
    ruleResults,
  };
  const manifest: CompiledNoteDesignManifest = {
    schemaVersion: 1,
    templateId: input.templateId,
    templateVersion: input.templateVersion,
    manifestHash: stableHash(manifestSeed),
    ruleResults,
    supportedRuleIds: ruleResults.filter((rule) => rule.status === 'supported').map((rule) => rule.ruleId),
    unsupportedRuleIds: ruleResults.filter((rule) => rule.status === 'unsupported').map((rule) => rule.ruleId),
  };
  return { tree, manifest };
}
