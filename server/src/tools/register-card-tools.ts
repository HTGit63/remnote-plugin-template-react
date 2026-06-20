import { z } from 'zod';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
  CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA,
  IDEMPOTENCY_KEY_SCHEMA,
  REM_ID_SCHEMA,
} from './schemas.js';
import { annotationsFor, bridgeToolResult, type ToolRegistrationContext } from './tool-context.js';

export function registerCardTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  const FLASHCARD_INPUT_SCHEMA = z.object({
    parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
    front: z.string().trim().min(1).max(5000).describe('Card front text.'),
    back: z.string().trim().min(1).max(5000).describe('Card back text.'),
    direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
    idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate card creation when the same key is reused.'),
    verifyAfterWrite: z.boolean().default(true).optional().describe('Read the created card after writing and report verification evidence.'),
  });

  registerTool(
    'create_basic_flashcard',
    {
      title: 'Create basic flashcard',
      description: 'Use this when the user wants an explicit RemNote flashcard with front/back text.',
      inputSchema: FLASHCARD_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_basic_flashcard'),
    },
    async ({ parentId, front, back, direction, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('create_basic_flashcard', { parentId, front, back, direction, idempotencyKey, verifyAfterWrite }),
        'Created basic flashcard.'
      )
  );

  registerTool(
    'create_concept_card',
    {
      title: 'Create concept card',
      description: 'Use this when the user wants an explicit RemNote concept card.',
      inputSchema: FLASHCARD_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_concept_card'),
    },
    async ({ parentId, front, back, direction, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('create_concept_card', { parentId, front, back, direction, idempotencyKey, verifyAfterWrite }),
        'Created concept card.'
      )
  );

  registerTool(
    'create_descriptor_card',
    {
      title: 'Create descriptor card',
      description: 'Use this when the user wants an explicit RemNote descriptor card.',
      inputSchema: FLASHCARD_INPUT_SCHEMA,
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_descriptor_card'),
    },
    async ({ parentId, front, back, direction, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('create_descriptor_card', { parentId, front, back, direction, idempotencyKey, verifyAfterWrite }),
        'Created descriptor card.'
      )
  );

  registerTool(
    'create_cloze_card',
    {
      title: 'Create cloze card',
      description: 'Use this when the user wants a cloze card without fragile raw syntax parsing.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
        text: z.string().trim().min(1).max(5000).describe('Full cloze text.'),
        clozeText: z.string().trim().max(1000).optional().describe('Optional exact text range to cloze.'),
        direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate cloze card creation when the same key is reused.'),
        verifyAfterWrite: z.boolean().default(true).optional().describe('Read the created card after writing and report verification evidence.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_cloze_card'),
    },
    async ({ parentId, text, clozeText, direction, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('create_cloze_card', { parentId, text, clozeText, direction, idempotencyKey, verifyAfterWrite }),
        'Created cloze card.'
      )
  );

  registerTool(
    'create_multiple_choice_card',
    {
      title: 'Create multiple choice card',
      description:
        'Use this when the user wants a multiple-choice RemNote card represented with explicit answer and choice items.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
        question: z.string().trim().min(1).max(5000).describe('Question prompt.'),
        choices: z.array(z.string().trim().min(1).max(1000)).min(2).max(20).describe('Available choices.'),
        correctChoice: z.string().trim().min(1).max(1000).describe('Correct choice text.'),
        direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate multiple-choice card creation when the same key is reused.'),
        verifyAfterWrite: z.boolean().default(true).optional().describe('Read the created card after writing and report verification evidence.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_multiple_choice_card'),
    },
    async ({ parentId, question, choices, correctChoice, direction, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('create_multiple_choice_card', { parentId, question, choices, correctChoice, direction, idempotencyKey, verifyAfterWrite }),
        'Created multiple-choice card.'
      )
  );

  registerTool(
    'create_list_answer_card',
    {
      title: 'Create list answer card',
      description: 'Use this when the user wants a RemNote list-answer card with explicit ordered items.',
      inputSchema: z.object({
        parentId: REM_ID_SCHEMA.describe('The parent Rem ID for the card Rem.'),
        prompt: z.string().trim().min(1).max(5000).describe('Card prompt.'),
        items: z.array(z.string().trim().min(1).max(1000)).min(1).max(50).describe('Expected list items.'),
        direction: CONNECTOR_SAFE_PRACTICE_DIRECTION_SCHEMA.describe('Practice direction.'),
        idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate list-answer card creation when the same key is reused.'),
        verifyAfterWrite: z.boolean().default(true).optional().describe('Read the created card after writing and report verification evidence.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('create_list_answer_card'),
    },
    async ({ parentId, prompt, items, direction, idempotencyKey, verifyAfterWrite }) =>
      bridgeToolResult(
        () => callPlugin('create_list_answer_card', { parentId, prompt, items, direction, idempotencyKey, verifyAfterWrite }),
        'Created list-answer card.'
      )
  );

}
