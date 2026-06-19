import type { StyledRemTreeNode } from '../../../shared/bridge/protocol';

export type NotePlanSource = 'markdown' | 'structured' | 'polished' | 'designed';

export interface NotePlanNode {
  text: string;
  type: string;
  children: NotePlanNode[];
}

export interface NotePlanSummary {
  source: NotePlanSource;
  plannedNodeCount: number;
  maxDepth: number;
  mathCount: number;
  tableCount: number;
  flashcardMarkers: number;
  outline: string[];
  stableShapeHash: string;
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function nodeText(node: StyledRemTreeNode): string {
  return normalizeText(node.text ?? node.title ?? node.front ?? node.answer ?? node.latex);
}

function toPlanNode(node: StyledRemTreeNode): NotePlanNode {
  return {
    text: nodeText(node),
    type: node.type ?? 'rem',
    children: (node.children ?? []).map(toPlanNode),
  };
}

function countNodes(node: NotePlanNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

function maxDepth(node: NotePlanNode, depth = 1): number {
  return Math.max(depth, ...node.children.map((child) => maxDepth(child, depth + 1)));
}

function collectOutline(node: NotePlanNode, depth = 0, outline: string[] = []): string[] {
  outline.push(`${'  '.repeat(depth)}- ${node.text || node.type}`);
  for (const child of node.children) {
    collectOutline(child, depth + 1, outline);
  }
  return outline;
}

function countMathNodes(node: StyledRemTreeNode): number {
  const own =
    node.type === 'mathBlock' ||
    node.type === 'inlineMath' ||
    Boolean(node.latex) ||
    Boolean(node.richText?.some((span) => span.type === 'mathBlock' || span.type === 'inlineMath' || span.latex));
  return (own ? 1 : 0) + (node.children ?? []).reduce((sum, child) => sum + countMathNodes(child), 0);
}

function countTableNodes(node: StyledRemTreeNode): number {
  const text = nodeText(node);
  const own = /^\|.+\|$/.test(text) || /table/i.test(text);
  return (own ? 1 : 0) + (node.children ?? []).reduce((sum, child) => sum + countTableNodes(child), 0);
}

function countFlashcardMarkers(node: StyledRemTreeNode): number {
  const type = node.type ?? 'rem';
  const own =
    type.endsWith('Card') ||
    /::/.test(nodeText(node)) ||
    /\{\{.+?\}\}/.test(nodeText(node))
      ? 1
      : 0;
  return own + (node.children ?? []).reduce((sum, child) => sum + countFlashcardMarkers(child), 0);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
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

export function createNotePlanSummary(
  tree: StyledRemTreeNode,
  source: NotePlanSource,
  overrides: Partial<Pick<NotePlanSummary, 'mathCount' | 'tableCount' | 'flashcardMarkers'>> = {}
): NotePlanSummary {
  const root = toPlanNode(tree);
  return {
    source,
    plannedNodeCount: countNodes(root),
    maxDepth: maxDepth(root),
    mathCount: overrides.mathCount ?? countMathNodes(tree),
    tableCount: overrides.tableCount ?? countTableNodes(tree),
    flashcardMarkers: overrides.flashcardMarkers ?? countFlashcardMarkers(tree),
    outline: collectOutline(root),
    stableShapeHash: stableHash(root),
  };
}

export function notePlanShapeEqual(left: NotePlanSummary, right: NotePlanSummary): boolean {
  return left.plannedNodeCount === right.plannedNodeCount && left.stableShapeHash === right.stableShapeHash;
}
