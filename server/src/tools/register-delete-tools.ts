import { z } from 'zod';
import {
  BRIDGE_TOOL_OUTPUT_SCHEMA,
  REM_ID_SCHEMA,
} from './schemas.js';
import { annotationsFor, bridgeToolResult, type ToolRegistrationContext } from './tool-context.js';

export function registerDeleteTools({ registerTool, callPlugin }: ToolRegistrationContext): void {
  registerTool(
    'delete_rem_by_id',
    {
      title: 'Delete Rem by ID safely',
      description:
        'DANGER-tier destructive tool. Defaults to dryRun=true. Real delete requires dryRun=false, confirmTitle, user approval, and matching expectedParentId or expectedAncestorId guard.',
      inputSchema: z.object({
        remId: REM_ID_SCHEMA.describe('The exact Rem ID to inspect/delete.'),
        expectedParentId: REM_ID_SCHEMA.optional().describe('Guard: must match actual parent for real delete.'),
        expectedAncestorId: REM_ID_SCHEMA.optional().describe('Guard: must appear in breadcrumbs for real delete.'),
        confirmTitle: z.string().trim().max(1000).optional().describe('Required for real delete: must match target plain text exactly.'),
        dryRun: z.boolean().default(true).describe('Default true. Set false only after reviewing the dry-run target.'),
        idempotencyKey: z.string().trim().min(1).max(128).optional().describe('Returns the same delete result on retry in this plugin session.'),
      }),
      outputSchema: BRIDGE_TOOL_OUTPUT_SCHEMA,
      annotations: annotationsFor('delete_rem_by_id'),
    },
    async ({ remId, expectedParentId, expectedAncestorId, confirmTitle, dryRun, idempotencyKey }) =>
      bridgeToolResult(
        () => callPlugin('delete_rem_by_id', { remId, expectedParentId, expectedAncestorId, confirmTitle, dryRun, idempotencyKey }),
        dryRun === false ? 'Delete Rem by ID request processed.' : 'Delete Rem by ID dry run processed.'
      )
  );
}
