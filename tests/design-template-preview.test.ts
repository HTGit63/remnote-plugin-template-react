import { describe, expect, test } from 'vitest';
import { previewNoteDesignPlan } from '../src/remnote/templates/designTemplates';
import { FakePlugin } from './helpers/fakeRemnote';

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
});
