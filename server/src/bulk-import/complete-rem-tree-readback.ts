import type { SerializedRem } from '../../../shared/bridge/protocol.js';
import type { CallPluginFunction } from '../tools/tool-context.js';

const DEFAULT_MAX_DEPTH = 12;
const DEFAULT_MAX_NODES = 500;
const MAX_CHILDREN_PER_PAGE = 100;
const MAX_CHILD_PAGES = 20;

type CompleteReadbackResult =
  | {
      ok: true;
      tree: SerializedRem;
      hydratedNodeCount: number;
      pluginCallCount: number;
    }
  | {
      ok: false;
      error: string;
      pluginCallCount: number;
    };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function serializedRem(value: unknown): SerializedRem | null {
  const candidate = record(value);
  if (
    !candidate ||
    typeof candidate.remId !== 'string' ||
    typeof candidate.plainText !== 'string'
  ) {
    return null;
  }
  const children = Array.isArray(candidate.children)
    ? candidate.children.map(serializedRem).filter((child): child is SerializedRem => child !== null)
    : undefined;
  return {
    ...candidate,
    frontText: typeof candidate.frontText === 'string' ? candidate.frontText : candidate.plainText,
    backText: typeof candidate.backText === 'string' ? candidate.backText : '',
    breadcrumbs: Array.isArray(candidate.breadcrumbs)
      ? candidate.breadcrumbs.filter((item): item is string => typeof item === 'string')
      : [],
    hasChildren: typeof candidate.hasChildren === 'boolean'
      ? candidate.hasChildren
      : Boolean(children?.length),
    ...(children ? { children } : {}),
  } as SerializedRem;
}

function bridgeError(response: Awaited<ReturnType<CallPluginFunction>>): string {
  return response.ok
    ? 'Plugin returned an invalid readback payload.'
    : `${response.error.code}: ${response.error.message}`;
}

export async function readCompleteRemTree(
  callPlugin: CallPluginFunction,
  remId: string,
  options: { maxDepth?: number; maxNodes?: number } = {}
): Promise<CompleteReadbackResult> {
  const maxDepth = Math.min(Math.max(Math.floor(options.maxDepth ?? DEFAULT_MAX_DEPTH), 1), DEFAULT_MAX_DEPTH);
  const maxNodes = Math.min(Math.max(Math.floor(options.maxNodes ?? DEFAULT_MAX_NODES), 1), 2000);
  const seen = new Set<string>();
  let pluginCallCount = 0;

  const getTree = async (targetRemId: string, remainingDepth: number): Promise<SerializedRem> => {
    pluginCallCount += 1;
    const response = await callPlugin('get_rem_tree', {
      remId: targetRemId,
      depth: Math.min(Math.max(remainingDepth, 1), DEFAULT_MAX_DEPTH),
    });
    const tree = response.ok ? serializedRem(response.result) : null;
    if (!tree) {
      throw new Error(`Unable to read Rem tree ${targetRemId}: ${bridgeError(response)}`);
    }
    return tree;
  };

  const getAllChildren = async (parentRemId: string): Promise<Array<Record<string, unknown>>> => {
    const children: Array<Record<string, unknown>> = [];
    const childIds = new Set<string>();
    let startIndex = 0;

    for (let page = 0; page < MAX_CHILD_PAGES; page += 1) {
      pluginCallCount += 1;
      const response = await callPlugin('get_children', {
        parentRemId,
        maxChildren: MAX_CHILDREN_PER_PAGE,
        startIndex,
      });
      const result = response.ok ? record(response.result) : null;
      const pageChildren = Array.isArray(result?.children)
        ? result.children.map(record).filter((child): child is Record<string, unknown> => child !== null)
        : null;
      if (!result || !pageChildren) {
        throw new Error(`Unable to read children for ${parentRemId}: ${bridgeError(response)}`);
      }

      for (const child of pageChildren) {
        if (typeof child.remId !== 'string' || childIds.has(child.remId)) continue;
        childIds.add(child.remId);
        children.push(child);
      }

      const continuation = record(result.continuation);
      const continuationArgs = record(continuation?.args);
      const nextStartIndex = continuation?.tool === 'get_children' &&
        typeof continuationArgs?.startIndex === 'number'
        ? Math.floor(continuationArgs.startIndex)
        : undefined;
      if (nextStartIndex === undefined) {
        return children;
      }
      if (nextStartIndex <= startIndex) {
        throw new Error(`Child pagination for ${parentRemId} did not advance.`);
      }
      startIndex = nextStartIndex;
    }

    throw new Error(`Child pagination for ${parentRemId} exceeded ${MAX_CHILD_PAGES} pages.`);
  };

  const hydrate = async (node: SerializedRem, depth: number): Promise<void> => {
    if (seen.has(node.remId)) {
      throw new Error(`Cycle or duplicate Rem ID found during readback: ${node.remId}.`);
    }
    seen.add(node.remId);
    if (seen.size > maxNodes) {
      throw new Error(`Complete readback exceeded maxNodes ${maxNodes}.`);
    }
    if (node.readCoverage?.truncationReasons.includes('text_limit')) {
      throw new Error(`Complete readback cannot verify ${node.remId}: text_limit truncated plain text.`);
    }

    if (!node.hasChildren) {
      return;
    }
    if (depth >= maxDepth) {
      throw new Error(`Complete readback exceeded maxDepth ${maxDepth} at ${node.remId}.`);
    }

    if (!node.truncated) {
      for (const child of node.children ?? []) {
        await hydrate(child, depth + 1);
      }
      return;
    }

    const existing = node.children ?? [];
    const continuationParent = node.readCoverage?.continuation?.args.parentRemId;
    const truncationReasons = node.readCoverage?.truncationReasons ?? [];
    const requiresDirectChildRead = existing.length === 0 ||
      continuationParent === node.remId ||
      truncationReasons.includes('node_limit') ||
      truncationReasons.includes('child_limit');
    const summaries = requiresDirectChildRead ? await getAllChildren(node.remId) : [];
    const existingChildren = new Map(existing.map((child) => [child.remId, child]));
    const completeChildren: SerializedRem[] = [];
    const childRemIds = requiresDirectChildRead
      ? summaries.map((summary) => typeof summary.remId === 'string' ? summary.remId : undefined)
          .filter((childRemId): childRemId is string => Boolean(childRemId))
      : existing.map((child) => child.remId);
    for (const childRemId of childRemIds) {
      const child = existingChildren.get(childRemId) ?? await getTree(childRemId, maxDepth - depth - 1);
      await hydrate(child, depth + 1);
      completeChildren.push(child);
    }
    node.children = completeChildren;
    delete node.truncated;
    delete node.readCoverage;
  };

  try {
    const tree = await getTree(remId, maxDepth);
    await hydrate(tree, 0);
    return {
      ok: true,
      tree,
      hydratedNodeCount: seen.size,
      pluginCallCount,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      pluginCallCount,
    };
  }
}
