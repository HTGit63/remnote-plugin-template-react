export const HOSTED_BRIDGE_SERVER_URL =
  'wss://remnote-plugin-template-react.onrender.com/remnote';
export const LOCAL_BRIDGE_SERVER_URL = 'ws://localhost:47391/remnote-bridge';
export const DEFAULT_BRIDGE_SERVER_URL = HOSTED_BRIDGE_SERVER_URL;

export function companionHttpUrl(serverUrl: string, pathname: string): string {
  const url = new URL(serverUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  if (url.port === '47391') {
    url.port = '47392';
  }
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function companionHttpBaseUrl(serverUrl: string): string {
  return companionHttpUrl(serverUrl, '/').replace(/\/+$/, '');
}
