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

    return {
      status: hasPageId && hasPageToken ? 200 : 500,
      jsonBody: {
        ok: hasPageId && hasPageToken,
        checks: {
          hasPageId,
          hasPageToken,
          graphVersion
        },
        message: hasPageId && hasPageToken
          ? 'API environment looks configured.'
          : 'Missing required app settings. Configure FB_PAGE_ID and FB_PAGE_TOKEN in Azure Static Web Apps application settings.'
      },
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders()
      }
    };
  }
});
