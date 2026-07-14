import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import {
  defaultNoteDesignRules,
  listNoteDesignTemplates,
  saveNoteDesignTemplate,
} from '../src/remnote/templates/designTemplates';
import { FakePlugin } from './helpers/fakeRemnote';

const ROOT = new URL('..', import.meta.url);
const DESIGN_TEMPLATE_STORAGE_KEY = 'bridge-note-design-templates-v1';

function installLocalStorage(fake: FakePlugin, initial: Record<string, unknown> = {}) {
  const values = new Map(Object.entries(initial));
  (fake as unknown as { storage: unknown }).storage = {
    getLocal: async <T>(key: string) => structuredClone(values.get(key)) as T | undefined,
    setLocal: async (key: string, value: unknown) => {
      values.set(key, structuredClone(value));
    },
  };
  return values;
}

async function source(path: string): Promise<string> {
  return readFile(new URL(path, ROOT), 'utf8');
}

describe('Phase 7 architecture and compatibility gates', () => {
  test('deep remediation seams do not depend on orchestration internals', async () => {
    const [bulkState, designCompiler, verifier] = await Promise.all([
      source('shared/bridge/bulk-import.ts'),
      source('src/remnote/templates/designPlanCompiler.ts'),
      source('src/remnote/write/verification.ts'),
    ]);

    expect(bulkState).not.toMatch(/from ['"].*server\//);
    expect(bulkState).not.toMatch(/from ['"].*src\/remnote\/write/);
    expect(designCompiler).not.toMatch(/from ['"].*designedNoteTools/);
    expect(designCompiler).not.toMatch(/plugin\.storage|setLocal|getLocal/);
    expect(verifier).not.toMatch(/from ['"]\.\/(?:basicWrites|treeWrites|deleteWrites|markdownImportExecutor)/);
    expect(verifier).not.toMatch(/\.setText\(|\.setParent\(|\.remove\(/);
  });

  test('card and design verifier bodies contain no hidden mutation calls', async () => {
    const designedTools = await source('src/remnote/write/designedNoteTools.ts');
    const designVerifier = designedTools.slice(
      designedTools.indexOf('export async function verifyNoteAgainstDesign'),
      designedTools.indexOf('async function directChildHeadingOperations')
    );
    const cardVerifier = designedTools.slice(
      designedTools.indexOf('export async function verifyCardSet'),
      designedTools.indexOf('export async function repairCardSet')
    );

    for (const body of [designVerifier, cardVerifier]) {
      expect(body).not.toMatch(/\.setText\(|\.setParent\(|\.remove\(|saveAppliedDesignVerificationManifest|applyStylePlan|createPolishedNoteTree/);
    }
  });

  test('unsupported persisted template schema loads conservatively without overwrite', async () => {
    const fake = new FakePlugin();
    const legacyStore = {
      schemaVersion: 0,
      templates: [{ templateId: 'legacy-unsafe', name: 'Legacy', rules: {} }],
    };
    const values = installLocalStorage(fake, { [DESIGN_TEMPLATE_STORAGE_KEY]: legacyStore });

    const result = await listNoteDesignTemplates(fake.asPlugin(), { includeRules: true });

    expect(result).toMatchObject({ status: 'listed', count: 0, templates: [] });
    expect(values.get(DESIGN_TEMPLATE_STORAGE_KEY)).toEqual(legacyStore);
  });

  test('template compare-and-set mismatch uses the conflict taxonomy', async () => {
    const fake = new FakePlugin();
    installLocalStorage(fake);
    const rules = defaultNoteDesignRules();
    await saveNoteDesignTemplate(fake.asPlugin(), {
      name: 'Versioned',
      templateId: 'versioned',
      rules,
    });

    await expect(saveNoteDesignTemplate(fake.asPlugin(), {
      name: 'Versioned',
      templateId: 'versioned',
      rules,
      overwrite: true,
      expectedVersion: 0,
    })).rejects.toMatchObject({
      code: 'STALE_STATE_CONFLICT',
      details: { templateId: 'versioned', expectedVersion: 0, actualVersion: 1 },
    });
  });
});
