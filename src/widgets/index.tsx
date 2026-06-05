import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';

const BRIDGE_TAB_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23252337'/%3E%3Cpath d='M8 4v5M16 4v5M7 9h10v3a5 5 0 0 1-4 4.9V20h-2v-3.1A5 5 0 0 1 7 12V9Z' fill='none' stroke='%23f4f3ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M9 4v5M15 4v5' stroke='%238b7cf6' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

async function onActivate(plugin: ReactRNPlugin) {
  const openBridgeStatus = async () => {
    await plugin.window.openWidgetInRightSidebar('bridge-status');
  };

  await plugin.settings.registerStringSetting({
    id: 'bridge-server-url',
    title: 'Bridge Server URL',
    description: 'Bridge WebSocket endpoint. Use localhost for local mode or the hosted WSS URL after pairing.',
    defaultValue: 'ws://localhost:47391/remnote-bridge',
  });

  await plugin.settings.registerStringSetting({
    id: 'bridge-token',
    title: 'Local Bridge Token',
    description: 'Local developer mode only. Hosted Render/ChatGPT pairing does not use this token.',
    defaultValue: '',
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-permission-mode',
    title: 'Bridge Operation Tier',
    description: 'Controls whether incoming bridge requests can read, create, modify, or use delete approval.',
    defaultValue: 'read_create_modify',
    options: [
      { key: 'read_only', label: 'Read Only', value: 'read_only' },
      { key: 'read_create', label: 'Read + Create', value: 'read_create' },
      { key: 'read_create_modify', label: 'Read + Create + Modify', value: 'read_create_modify' },
      { key: 'full_control_delete_approval', label: 'Full Control With Delete Approval', value: 'full_control_delete_approval' },
      { key: 'danger_zone', label: 'Danger Zone', value: 'danger_zone' },
    ],
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-permission-scope',
    title: 'Bridge Permission Scope',
    description: 'Limits which Rems ChatGPT can read or change through the local bridge.',
    defaultValue: 'focused_rem_and_descendants',
    options: [
      { key: 'focused_rem_only', label: 'Focused Rem Only', value: 'focused_rem_only' },
      {
        key: 'focused_rem_and_descendants',
        label: 'Focused Rem + Descendants',
        value: 'focused_rem_and_descendants',
      },
      { key: 'selected_rem_only', label: 'Selected Rem Only', value: 'selected_rem_only' },
      {
        key: 'selected_rem_and_descendants',
        label: 'Selected Rem + Descendants',
        value: 'selected_rem_and_descendants',
      },
      { key: 'approved_document_or_folder', label: 'Approved Document or Folder', value: 'approved_document_or_folder' },
      { key: 'workspace_allowed', label: 'Workspace Allowed', value: 'workspace_allowed' },
    ],
  });

  await plugin.settings.registerDropdownSetting({
    id: 'bridge-tool-access-tier',
    title: 'Bridge Tool Access Tier',
    description: 'Controls which ChatGPT tools are visible without changing the server URL or token.',
    defaultValue: 'note_writer',
    options: [
      { key: 'basic', label: 'Basic', value: 'basic' },
      { key: 'note_writer', label: 'Note Writer', value: 'note_writer' },
      { key: 'power_user', label: 'Power User', value: 'power_user' },
      { key: 'developer', label: 'Developer', value: 'developer' },
      { key: 'danger', label: 'Danger', value: 'danger' },
    ],
  });

  await plugin.settings.registerStringSetting({
    id: 'bridge-approved-root-rem-id',
    title: 'Approved Root Rem ID',
    description: 'Required for Approved Document or Folder scope. Use a sandbox document/folder Rem ID.',
    defaultValue: '',
  });

  await plugin.app.registerWidget('bridge-status', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabTitle: 'Bridge',
    widgetTabIcon: BRIDGE_TAB_ICON,
    dontOpenByDefaultInTabLocation: false,
  });

  await plugin.app.registerCommand({
    id: 'remnote-chatgpt-bridge.open-status',
    name: 'Open RemNote ChatGPT Bridge',
    description: 'Open the RemNote bridge status widget in the right sidebar.',
    keywords: 'chatgpt bridge sidebar remnote',
    action: openBridgeStatus,
  });

  try {
    await openBridgeStatus();
  } catch (error) {
    console.error('Failed to auto-open bridge status widget:', error);
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
