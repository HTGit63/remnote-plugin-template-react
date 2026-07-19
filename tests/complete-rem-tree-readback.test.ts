import { describe, expect, test, vi } from 'vitest';
import { readCompleteRemTree } from '../server/src/bulk-import/complete-rem-tree-readback';
import type { CallPluginFunction } from '../server/src/tools/tool-context';

function treeNode(
  remId: string,
  plainText: string,
  options: { hasChildren?: boolean; children?: unknown[]; truncated?: boolean } = {}
) {
  return {
    remId,
    frontText: plainText,
    backText: '',
    plainText,
    breadcrumbs: [plainText],
    hasChildren: options.hasChildren ?? false,
    ...(options.children ? { children: options.children } : {}),
    ...(options.truncated
      ? {
          truncated: true,
          readCoverage: {
            appliedLimits: { depth: 3, maxChildrenPerNode: 25, maxNodes: 50, maxChars: 6000 },
            truncationReasons: ['depth_limit'],
          },
        }
      : {}),
  };
}

function success(result: unknown) {
  return {
    ok: true as const,
    result,
    lifecycle: [],
    operationId: 'test-operation',
  };
}

describe('complete Rem tree readback', () => {
  test('hydrates descendants omitted by a stale depth-three plugin runtime', async () => {
    const header = treeNode('header', 'Header', { hasChildren: true, truncated: true });
    const table = treeNode('table', 'Table 1', { hasChildren: true, children: [header], truncated: true });
    const root = treeNode('root', '1.3 Standing Waves and Resonance', {
      hasChildren: true,
      children: [table],
      truncated: true,
    });
    const cell = treeNode('cell', 'Fundamental wavelength');

    const callPlugin = vi.fn(async (tool: string, args: Record<string, unknown>) => {
      if (tool === 'get_rem_tree' && args.remId === 'root') return success(root);
      if (tool === 'get_rem_tree' && args.remId === 'cell') return success(cell);
      if (tool === 'get_children' && args.parentRemId === 'root') {
        return success({ children: [{ remId: 'table', hasChildren: true }] });
      }
      if (tool === 'get_children' && args.parentRemId === 'table') {
        return success({ children: [{ remId: 'header', hasChildren: true }] });
      }
      if (tool === 'get_children' && args.parentRemId === 'header') {
        return success({ children: [{ remId: 'cell', hasChildren: false }] });
      }
      throw new Error(`Unexpected call: ${tool} ${JSON.stringify(args)}`);
    }) as unknown as CallPluginFunction;

    const result = await readCompleteRemTree(callPlugin, 'root');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tree.children?.[0]?.children?.[0]?.children?.[0]?.plainText).toBe(
      'Fundamental wavelength'
    );
    expect(result.tree.truncated).toBeUndefined();
    expect(result.hydratedNodeCount).toBe(4);
  });

  test('fails closed when plain text itself was truncated', async () => {
    const root = treeNode('root', 'truncated text');
    root.truncated = true;
    root.readCoverage = {
      appliedLimits: { depth: 12, maxChildrenPerNode: 25, maxNodes: 50, maxChars: 6000 },
      truncationReasons: ['text_limit'],
      continuation: { tool: 'get_rem_rich', args: { remId: 'root' } },
    };
    const callPlugin = vi.fn(async () => success(root)) as unknown as CallPluginFunction;

    const result = await readCompleteRemTree(callPlugin, 'root');

    expect(result).toMatchObject({ ok: false });
    if (result.ok) return;
    expect(result.error).toContain('text_limit');
  });
});
