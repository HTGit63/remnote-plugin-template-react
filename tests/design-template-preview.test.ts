import { describe, expect, test } from 'vitest';
import {
  defaultNoteDesignRules,
  importNoteDesignTemplate,
  previewNoteDesignPlan,
  saveNoteDesignTemplate,
} from '../src/remnote/templates/designTemplates';
import {
  repairNoteDesign,
  updateNoteWithDesign,
} from '../src/remnote/write/designedNoteTools';
import { FakePlugin } from './helpers/fakeRemnote';

function installLocalStorage(fake: FakePlugin) {
  const values = new Map<string, unknown>();
  (fake as unknown as { storage: unknown }).storage = {
    getLocal: async <T>(key: string) => values.get(key) as T | undefined,
    setLocal: async (key: string, value: unknown) => values.set(key, structuredClone(value)),
  };
}

describe('design template preview defaults', () => {
  test('previews with the clean academic preset when no template is supplied', async () => {
    const fake = new FakePlugin();
    const result = await previewNoteDesignPlan(fake.asPlugin(), {
      title: 'Preview',
      content: '## Section\nFormula: E=mc^2',
      mode: 'create',
    });

    expect(result.status).toBe('previewed');
    expect(result.dryRun).toBe(true);
    expect(result.rules.stylePreset).toBe('clean_academic');
    expect(result.plannedChanges.join('\n')).toContain('Style preset: clean_academic');
  });

  test('accepts explicit named presets for dry-run design preview', async () => {
    const fake = new FakePlugin();
    const result = await previewNoteDesignPlan(fake.asPlugin(), {
      title: 'Physics preview',
      content: 'F = ma',
      stylePreset: 'formula_heavy',
    });

    expect(result.rules.stylePreset).toBe('formula_heavy');
    expect(result.rules.formulaPlacement.displayFormulasAsSeparateRems).toBe(true);
    expect(result.rules.bulletNesting.maxDepth).toBeGreaterThanOrEqual(5);
  });

  test('preview stays no-write even when parent and target IDs are supplied', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('design-preview-target', 'Original target text');
    const before = JSON.stringify({ text: target.text, children: target.children });

    const result = await previewNoteDesignPlan(fake.asPlugin(), {
      parentId: 'design-preview-parent',
      targetRemId: target._id,
      title: 'Safe preview',
      content: '## Planned only',
      mode: 'repair',
    });

    expect(result).toMatchObject({ status: 'previewed', dryRun: true });
    expect(fake.createRemCount).toBe(0);
    expect(JSON.stringify({ text: target.text, children: target.children })).toBe(before);
  });

  test('template import rejects malformed JSON and unsafe operation rules', async () => {
    const fake = new FakePlugin();
    const unsafeTemplate = {
      schemaVersion: 1,
      templateId: 'unsafe-template',
      name: 'Unsafe template',
      rules: {
        ...defaultNoteDesignRules(),
        injectedOperation: 'delete_rem_by_id',
      },
    };

    await expect(importNoteDesignTemplate(fake.asPlugin(), {
      templateJson: '{not-json',
    })).rejects.toMatchObject({ code: 'INVALID_ARGS' });
    await expect(importNoteDesignTemplate(fake.asPlugin(), {
      templateJson: JSON.stringify(unsafeTemplate),
      overwrite: true,
    })).rejects.toMatchObject({ code: 'INVALID_ARGS' });
  });

  test('template import rejects structurally incomplete rules before preview', async () => {
    const fake = new FakePlugin();
    const malformedTemplate = {
      schemaVersion: 1,
      templateId: 'malformed-template',
      name: 'Malformed template',
      rules: {},
    };

    await expect(importNoteDesignTemplate(fake.asPlugin(), {
      templateJson: JSON.stringify(malformedTemplate),
      overwrite: true,
    })).rejects.toMatchObject({ code: 'INVALID_ARGS' });
  });

  test('design update and repair reject style operations outside target tree', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('design-scope-target', 'Target text');
    const child = fake.addRem('design-scope-child', 'Child text');
    const outside = fake.addRem('design-scope-outside', 'Outside text');
    await child.setParent(target);

    await expect(updateNoteWithDesign(fake.asPlugin(), {
      targetRemId: target._id,
      mode: 'repair_structure',
      styleOperations: [{ remId: outside._id, type: 'bold_span', text: 'Outside' }],
      dryRun: false,
      approved: true,
      idempotencyKey: 'idem:outside-design-update',
    })).rejects.toMatchObject({ code: 'OUT_OF_SCOPE' });
    await expect(repairNoteDesign(fake.asPlugin(), {
      rootRemId: target._id,
      operations: [{ remId: outside._id, type: 'bold_span', text: 'Outside' }],
      dryRun: true,
      idempotencyKey: 'idem:outside-design-repair',
    })).rejects.toMatchObject({ code: 'OUT_OF_SCOPE' });

    expect(await fake.richText.toString(outside.text)).toBe('Outside text');

    const allowed = await updateNoteWithDesign(fake.asPlugin(), {
      targetRemId: target._id,
      mode: 'repair_structure',
      styleOperations: [{ remId: child._id, type: 'bold_span', text: 'Child' }],
      dryRun: false,
      approved: true,
      idempotencyKey: 'idem:inside-design-update',
    });
    expect(allowed.status).toBe('repaired');
    expect(child.text).toEqual(expect.arrayContaining([expect.objectContaining({ text: 'Child', b: true })]));
  });

  test('approved repair exposes exact updated IDs and post-operation verification', async () => {
    const fake = new FakePlugin();
    const target = fake.addRem('repair-envelope-target', 'Target');
    const child = fake.addRem('repair-envelope-child', 'Repair this text');
    await child.setParent(target);

    const result = await repairNoteDesign(fake.asPlugin(), {
      rootRemId: target._id,
      operations: [{ remId: child._id, type: 'bold_span', text: 'Repair' }],
      dryRun: false,
      approved: true,
      verifyAfterWrite: true,
      idempotencyKey: 'idem:repair-envelope',
    });

    expect(result.ok).toBe(true);
    expect(result.updatedRemIds).toEqual([child._id]);
    expect(result.verification).toEqual({
      attempted: true,
      passed: true,
      method: 'operation_result_readback',
      warnings: [],
    });
  });

  test('content updates compile and apply the selected reusable template', async () => {
    const fake = new FakePlugin();
    installLocalStorage(fake);
    const target = fake.addRem('designed-update-target', 'Designed target');
    const rules = defaultNoteDesignRules('clean_academic');
    rules.headingPattern.rootHeadingLevel = 'normal';
    rules.headingPattern.sectionHeadingLevel = 'normal';
    rules.roleRules = {
      keyIdea: { prefixStyle: { bold: true, highlight: 'yellow' } },
    };
    const saved = await saveNoteDesignTemplate(fake.asPlugin(), {
      templateId: 'designed-update-template',
      name: 'Designed update template',
      rules,
    });

    const result = await updateNoteWithDesign(fake.asPlugin(), {
      targetRemId: target._id,
      mode: 'replace_children',
      templateId: saved.template.templateId,
      content: '## Key Ideas\n\n- Key idea: Compiler rules must survive updates.',
      dryRun: false,
      approved: true,
      verifyAfterWrite: true,
      idempotencyKey: 'idem:designed-content-update',
    });

    let keyIdea = undefined;
    for (const rem of fake.rems.values()) {
      if ((await fake.richText.toString(rem.text)) === 'Key idea: Compiler rules must survive updates.') {
        keyIdea = rem;
        break;
      }
    }
    expect(result.status).toBe('replaced');
    expect(result.compiledManifest).toBeDefined();
    expect(keyIdea?.text).toEqual(expect.arrayContaining([
      expect.objectContaining({ text: 'Key idea:', b: true, h: 3 }),
    ]));
  });

  test('dry-run repair succeeds as a plan while preserving failing before-state evidence', async () => {
    const fake = new FakePlugin();
    installLocalStorage(fake);
    const target = fake.addRem('repair-dry-run-target', 'Target');
    const rules = defaultNoteDesignRules();
    rules.headingPattern.rootHeadingLevel = 'H1';
    const saved = await saveNoteDesignTemplate(fake.asPlugin(), {
      templateId: 'repair-dry-run-template',
      name: 'Repair dry-run template',
      rules,
    });

    const result = await repairNoteDesign(fake.asPlugin(), {
      rootRemId: target._id,
      templateId: saved.template.templateId,
      operations: [{ remId: target._id, type: 'heading', headingLevel: 'H1' }],
      dryRun: true,
      idempotencyKey: 'idem:repair-dry-run-envelope',
    });

    expect(result.status).toBe('dry_run');
    expect(result.ok).toBe(true);
    expect(result.verificationBefore.ok).toBe(false);
    expect(target.fontSize).toBeUndefined();
  });
});
