import { app } from '@azure/functions';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;
let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

function jsonResponse(body, status = 200) {
  return {
    status,
    jsonBody: body,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders()
    }
  };
}

async function getUsableAccessToken() {
  const staticToken = (process.env.STRAVA_ACCESS_TOKEN || '').trim();
  if (staticToken) {
    return staticToken;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessTokenExpiresAt - 60 > nowSec) {
    return cachedAccessToken;
  }

  const clientId = (process.env.STRAVA_CLIENT_ID || '').trim();
  const clientSecret = (process.env.STRAVA_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.STRAVA_REFRESH_TOKEN || '').trim();

  if (!clientId || !clientSecret || !refreshToken) {
    return '';
  }

  const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!tokenResponse.ok) {
    return '';
  }

  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  const nextToken = typeof tokenPayload?.access_token === 'string' ? tokenPayload.access_token.trim() : '';
  const expiresAt = Number(tokenPayload?.expires_at);

  if (!nextToken) {
    return '';
  }

  cachedAccessToken = nextToken;
  cachedAccessTokenExpiresAt = Number.isFinite(expiresAt) ? expiresAt : (nowSec + 1800);
  return cachedAccessToken;
}

function normalizeActivity(activity) {
  if (!activity || typeof activity !== 'object') {
    return null;
  }

  const distanceKm = (activity.distance || 0) / 1000;
  const movingMinutes = Math.round((activity.moving_time || 0) / 60);
  const elevationM = activity.total_elevation_gain || 0;
  const athleteName = activity.athlete?.firstname && activity.athlete?.lastname
    ? `${activity.athlete.firstname} ${activity.athlete.lastname}`
    : activity.athlete?.firstname || 'Athlete';

  const athleteId = activity.athlete?.id;
  const athleteProfileUrl = athleteId ? `https://www.strava.com/athletes/${athleteId}` : null;

  const activityUrl = activity.id ? `https://www.strava.com/activities/${activity.id}` : null;
  const activityTimestamp = activity.start_date || activity.start_date_local || '1970-01-01T00:00:00.000Z';

  const summary = `${distanceKm.toFixed(1)} km • ${movingMinutes} min`;
  const elevationStr = elevationM > 0 ? ` • ${elevationM.toFixed(0)}m elevation` : '';
  const message = `${activity.name}${elevationStr}`;

  return {
    id: activity.id ? `strava-${activity.id}` : null,
    type: activity.type || 'Activity',
    name: activity.name || 'Unnamed Activity',
    message,
    summary,
    createdTime: activityTimestamp,
    created_time: activityTimestamp,
    permalinkUrl: activityUrl,
    permalink_url: activityUrl,
    source: 'strava',
    athlete: {
      name: athleteName,
      id: athleteId,
      profileUrl: athleteProfileUrl
    },
    stats: {
      distance: distanceKm,
      distanceM: activity.distance || 0,
      movingTime: activity.moving_time || 0,
      movingMinutes,
      elevationGain: elevationM,
      avgSpeed: activity.average_speed || 0,
      avgSpeedKph: (activity.average_speed || 0) * 3.6
    }
  };
}

app.http('strava-feed', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'strava-feed',
  handler: async (request) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }

    const clubId = process.env.STRAVA_CLUB_ID || '303983';

    const limitParam = Number(request.query.get('limit'));
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, limitParam))
      : DEFAULT_LIMIT;

    const accessToken = await getUsableAccessToken();
    if (!accessToken) {
      return jsonResponse({
        error: 'Strava access token not configured.',
        posts: [],
        nextCursor: null,
        source: 'strava'
      }, 503);
    }

    try {
      const url = new URL(`https://www.strava.com/api/v3/clubs/${clubId}/activities`);
      url.searchParams.set('per_page', String(limit));

      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'NomadCyclingClubApi/1.0'
        }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return jsonResponse({
          error: 'Strava API request failed.',
          details: payload?.message || response.statusText,
          status: response.status,
          posts: [],
          nextCursor: null,
          source: 'strava'
        }, response.status >= 500 ? 502 : 400);
      }

      const rawActivities = await response.json();
      const activities = Array.isArray(rawActivities) ? rawActivities : [];

      const posts = activities
        .map((activity) => normalizeActivity(activity))
        .filter((activity) => activity !== null)
        .sort((left, right) => {
          const leftTime = new Date(left.createdTime || '').getTime();
          const rightTime = new Date(right.createdTime || '').getTime();
          return rightTime - leftTime;
        });

      return jsonResponse({
        posts,
        nextCursor: null,
        source: 'strava'
      });
    } catch (error) {
      return jsonResponse({
        error: 'Unexpected error calling Strava API.',
        details: error instanceof Error ? error.message : String(error),
        posts: [],
        nextCursor: null,
        source: 'strava'
      }, 500);
    }
  }
});
