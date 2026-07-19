import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

type AppendedAsset = {
  dataset: Record<string, string>;
  href?: string;
  rel?: string;
  src?: string;
  type?: string;
};

const require = createRequire(import.meta.url);

function widgetLoaderScript(): string {
  const config = require('../webpack.config.js') as {
    plugins: Array<{
      constructor: { name: string };
      userOptions?: { templateContent?: string };
    }>;
  };
  const htmlPlugin = config.plugins.find(
    (plugin) => plugin.constructor.name === 'HtmlWebpackPlugin'
  );
  const template = htmlPlugin?.userOptions?.templateContent;
  if (!template) {
    throw new Error('Webpack widget loader template not found.');
  }
  const match = template.match(/<script type="text\/javascript">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error('Webpack widget loader script not found.');
  }
  return match[1];
}

function executeWidgetLoader(search: string): {
  links: AppendedAsset[];
  scripts: AppendedAsset[];
} {
  const links: AppendedAsset[] = [];
  const scripts: AppendedAsset[] = [];
  const body = {
    innerHTML: '',
    appendChild(asset: AppendedAsset) {
      scripts.push(asset);
    },
  };
  const head = {
    appendChild(asset: AppendedAsset) {
      links.push(asset);
    },
  };
  const document = {
    body,
    head,
    createElement: () => ({ dataset: {} }),
  };

  runInNewContext(widgetLoaderScript(), {
    URLSearchParams,
    Object,
    document,
    window: { location: { search } },
  });

  return { links, scripts };
}

describe('widget loader security', () => {
  test('preserves the trusted index widget required for plugin activation', () => {
    const result = executeWidgetLoader(
      '?widgetName=index&pluginId=remnote-chatgpt-bridge'
    );

    expect(result.links[0]?.href).toBe('index-sandbox.css');
    expect(result.scripts[0]?.src).toBe('index-sandbox.js');
  });

  test('rejects an untrusted widgetName before constructing script and stylesheet URLs', () => {
    const result = executeWidgetLoader(
      '?widgetName=https%3A%2F%2Fevil.example%2Fpayload'
    );

    expect(result.links[0]?.href).toBe('bridge-status-sandbox.css');
    expect(result.scripts[0]?.src).toBe('bridge-status-sandbox.js');
  });
});
