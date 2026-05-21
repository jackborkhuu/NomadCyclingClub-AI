import { app } from '@azure/functions';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }

    const hasPageId = Boolean(process.env.FB_PAGE_ID || process.env.FACEBOOK_PAGE_ID);
    const hasPageToken = Boolean(process.env.FB_PAGE_TOKEN || process.env.FACEBOOK_PAGE_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN);
    const graphVersion = process.env.FB_GRAPH_VERSION || process.env.GRAPH_VERSION || 'v23.0';

    const liveConfigured = hasPageId && hasPageToken;

    return {
      status: 200,
      jsonBody: {
        ok: true,
        mode: liveConfigured ? 'graph' : 'synced-json-fallback',
        checks: {
          hasPageId,
          hasPageToken,
          graphVersion
        },
        message: liveConfigured
          ? 'API environment looks configured. Serving live Graph data.'
          : 'Graph app settings are missing; API will serve synced JSON fallback data.'
      },
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders()
      }
    };
  }
});
