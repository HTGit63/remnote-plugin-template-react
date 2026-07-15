import type { RNPlugin } from '@remnote/plugin-sdk';
import { NUCLEAR_PHYSICS_STYLE_PRESET } from '../../../shared/bridge/style-presets';
import {
  defaultNoteDesignRules,
  saveNoteDesignTemplate,
} from '../../remnote/templates/designTemplates';

export const FEATURED_DESIGN_TEMPLATE = {
  templateId: 'builtin-structured-science',
  name: 'Structured Science',
  description: 'Clear H1/H3 hierarchy, quiet spacing, and formula-first treatment for technical notes.',
} as const;

export async function ensureFeaturedDesignTemplate(plugin: RNPlugin) {
  return saveNoteDesignTemplate(plugin, {
    templateId: FEATURED_DESIGN_TEMPLATE.templateId,
    name: FEATURED_DESIGN_TEMPLATE.name,
    description: FEATURED_DESIGN_TEMPLATE.description,
    rules: defaultNoteDesignRules(NUCLEAR_PHYSICS_STYLE_PRESET),
    overwrite: false,
  });
}
