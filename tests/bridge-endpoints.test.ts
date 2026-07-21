import { describe, expect, test } from 'vitest';
import {
  DEFAULT_BRIDGE_SERVER_URL,
  HOSTED_BRIDGE_SERVER_URL,
  LOCAL_BRIDGE_SERVER_URL,
  companionHttpUrl,
} from '../src/bridge/endpoints';

describe('bridge endpoint defaults', () => {
  test('uses the hosted Render bridge for new plugin installations', () => {
    expect(DEFAULT_BRIDGE_SERVER_URL).toBe(HOSTED_BRIDGE_SERVER_URL);
    expect(DEFAULT_BRIDGE_SERVER_URL).toBe(
      'wss://remnote-plugin-template-react.onrender.com/remnote'
    );
  });

  test('derives the hosted ChatGPT MCP endpoint from the hosted bridge URL', () => {
    expect(companionHttpUrl(DEFAULT_BRIDGE_SERVER_URL, '/mcp')).toBe(
      'https://remnote-plugin-template-react.onrender.com/mcp'
    );
  });

  test('preserves explicit local development routing', () => {
    expect(companionHttpUrl(LOCAL_BRIDGE_SERVER_URL, '/mcp')).toBe(
      'http://localhost:47392/mcp'
    );
  });

  test('preserves self-hosted origins while replacing only the path', () => {
    expect(companionHttpUrl('wss://bridge.example.com/custom/socket?token=ignored', '/health')).toBe(
      'https://bridge.example.com/health'
    );
  });
});
