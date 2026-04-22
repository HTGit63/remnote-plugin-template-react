import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';

async function onActivate(plugin: ReactRNPlugin) {
  const openConnector = async () => {
    await plugin.window.openWidgetInRightSidebar('connector');
  };

  // Register OpenAI API Key setting
  await plugin.settings.registerStringSetting({
    id: 'openai-api-key',
    title: 'OpenAI API Key',
    defaultValue: '',
  });

  await plugin.settings.registerStringSetting({
    id: 'openai-model',
    title: 'OpenAI Model',
    defaultValue: 'gpt-5-mini',
  });

  // Register the connector sidebar widget
  await plugin.app.registerWidget('connector', WidgetLocation.RightSidebar, {
    dimensions: { height: 'auto', width: '100%' },
    widgetTabTitle: 'OpenAI',
    dontOpenByDefaultInTabLocation: false,
  });

  await plugin.app.registerCommand({
    id: 'remnote-openai-connector.open-sidebar',
    name: 'Open RemNote OpenAI Connector',
    description: 'Open the OpenAI connector in the right sidebar.',
    keywords: 'openai ai chatgpt connector sidebar remnote',
    action: openConnector,
  });

  try {
    await openConnector();
  } catch (error) {
    console.error('Failed to auto-open connector widget:', error);
  }
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
