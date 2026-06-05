import type { BridgeToolProfile, PermissionMode, PermissionScope } from '../../bridge/protocol';

export const permissionScopeOptions: Array<{ value: PermissionScope; description: string }> = [
  {
    value: 'focused_rem_only',
    description: 'ChatGPT can only work with the Rem you are currently focused on.',
  },
  {
    value: 'focused_rem_and_descendants',
    description: 'ChatGPT can work inside the focused Rem and its children. Best for creating one note.',
  },
  {
    value: 'selected_rem_only',
    description: 'ChatGPT can work only with selected Rems.',
  },
  {
    value: 'selected_rem_and_descendants',
    description: 'ChatGPT can work inside selected Rems and their children.',
  },
  {
    value: 'approved_document_or_folder',
    description: 'ChatGPT can work inside one approved document or folder.',
  },
  {
    value: 'workspace_allowed',
    description: 'ChatGPT can search and create more broadly. Use carefully.',
  },
];

export const permissionModeOptions: Array<{ value: PermissionMode; label: string }> = [
  { value: 'read_only', label: 'Read only' },
  { value: 'read_create', label: 'Read + create' },
  { value: 'read_create_modify', label: 'Read + create + modify' },
  { value: 'full_control_delete_approval', label: 'Full control + delete approval' },
  { value: 'danger_zone', label: 'Danger zone' },
];

export const toolTierOptions: Array<{
  value: BridgeToolProfile;
  label: string;
  risk: string;
  description: string;
}> = [
  {
    value: 'basic',
    label: 'Basic',
    risk: 'Lowest risk',
    description: 'Status and read tools.',
  },
  {
    value: 'note_writer',
    label: 'Note Writer',
    risk: 'Writes inside scope',
    description: 'Designed-note, Markdown, tree, and flashcard creation.',
  },
  {
    value: 'power_user',
    label: 'Power User',
    risk: 'Existing-note changes',
    description: 'Move, reorder, update, and style tools.',
  },
  {
    value: 'developer',
    label: 'Developer',
    risk: 'Debug only',
    description: 'Bridge diagnostics, health checks, raw rich-text inspection.',
  },
  {
    value: 'danger',
    label: 'Danger',
    risk: 'Destructive',
    description: 'Danger-tier tools such as guarded delete when server enables them.',
  },
];
