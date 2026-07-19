'use strict';

function staticResponseHeaders(contentType) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'baggage, sentry-trace',
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    'Content-Type': contentType,
  };
}

module.exports = { staticResponseHeaders };
