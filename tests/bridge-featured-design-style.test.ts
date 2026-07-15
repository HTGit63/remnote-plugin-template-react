import { describe, expect, test } from 'vitest';
import { getNoteDesignTemplate } from '../src/remnote/templates/designTemplates';
import {
  ensureFeaturedDesignTemplate,
  FEATURED_DESIGN_TEMPLATE,
} from '../src/widgets/bridge-panel/design-styles';
import { FakePlugin } from './helpers/fakeRemnote';

function installLocalStorage(fake: FakePlugin) {
  const values = new Map<string, unknown>();
  (fake as unknown as { storage: unknown }).storage = {
    getLocal: async <T>(key: string) => values.get(key) as T | undefined,
    setLocal: async (key: string, value: unknown) => values.set(key, structuredClone(value)),
  };
}

describe('featured design style', () => {
  test('installs the science preset once with reusable formula-friendly rules', async () => {
    const fake = new FakePlugin();
    installLocalStorage(fake);

    await ensureFeaturedDesignTemplate(fake.asPlugin());
    await ensureFeaturedDesignTemplate(fake.asPlugin());
    const saved = await getNoteDesignTemplate(fake.asPlugin(), FEATURED_DESIGN_TEMPLATE.templateId);

    expect(saved).toMatchObject({
      templateId: FEATURED_DESIGN_TEMPLATE.templateId,
      name: FEATURED_DESIGN_TEMPLATE.name,
      description: FEATURED_DESIGN_TEMPLATE.description,
      version: 1,
      rules: { stylePreset: 'nuclear_physics_h1_h3_spacer_math' },
    });
  });
});
