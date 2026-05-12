import { app } from '@azure/functions';

const STRAVA_OAUTH_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const DEFAULT_CLUB_ID = '303983';
const DAYS_WINDOW = 30;

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

function sanitizeValue(value) {
  if (!value) {
    return '';
  }

  const trimmed = String(value).trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function toDisplayName(athlete) {
  const first = athlete?.firstname || '';
  const last = athlete?.lastname || '';
  return `${first} ${last}`.trim() || 'Unknown rider';
}

function km(distanceMeters) {
  const value = Number(distanceMeters) || 0;
  return Number((value / 1000).toFixed(1));
}

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  const response = await fetch(STRAVA_OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.message || 'Could not refresh Strava token');
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token || refreshToken,
    expiresAt: payload.expires_at || null
  };
}

async function fetchClubActivities(accessToken, clubId) {
  const all = [];
  const now = Date.now();
  const oldestAllowed = now - DAYS_WINDOW * 24 * 60 * 60 * 1000;

  for (let page = 1; page <= 6; page += 1) {
    const url = new URL(`${STRAVA_API_BASE}/clubs/${clubId}/activities`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '30');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || 'Could not fetch club activities');
    }

    const activities = Array.isArray(payload) ? payload : [];
    if (activities.length === 0) {
      break;
    }

    all.push(...activities);

    const oldestInPage = activities
      .map((item) => new Date(item?.start_date || item?.start_date_local || 0).getTime())
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b)[0];

    if (oldestInPage && oldestInPage < oldestAllowed) {
      break;
    }
  }

  return all.filter((activity) => {
    const timestamp = new Date(activity?.start_date || activity?.start_date_local || 0).getTime();
    return Number.isFinite(timestamp) && timestamp >= oldestAllowed;
  });
}

function buildLeaderboard(activities) {
  const byAthlete = new Map();

  for (const activity of activities) {
    const athlete = activity?.athlete || {};
    const athleteId = athlete?.id;
    if (!athleteId) {
      continue;
    }

    const current = byAthlete.get(athleteId) || {
      athleteId,
      name: toDisplayName(athlete),
      profile: athlete?.profile_medium || athlete?.profile || null,
      distanceMeters: 0,
      rideCount: 0
    };

    current.distanceMeters += Number(activity?.distance) || 0;
    current.rideCount += 1;
    byAthlete.set(athleteId, current);
  }

  return [...byAthlete.values()]
    .sort((left, right) => right.distanceMeters - left.distanceMeters)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      athleteId: item.athleteId,
      name: item.name,
      profile: item.profile,
      rideCount: item.rideCount,
      distanceKm: km(item.distanceMeters)
    }));
}

app.http('strava-club', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'strava-club',
  handler: async (request) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }

    const clubId = sanitizeValue(process.env.STRAVA_CLUB_ID || DEFAULT_CLUB_ID);
    const clientId = sanitizeValue(process.env.STRAVA_CLIENT_ID);
    const clientSecret = sanitizeValue(process.env.STRAVA_CLIENT_SECRET);
    const refreshToken = sanitizeValue(process.env.STRAVA_REFRESH_TOKEN);

    if (!clientId || !clientSecret || !refreshToken) {
      return jsonResponse(
        {
          error: 'Missing STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, or STRAVA_REFRESH_TOKEN app settings.'
        },
        500
      );
    }

    try {
      const auth = await refreshAccessToken(clientId, clientSecret, refreshToken);
      const activities = await fetchClubActivities(auth.accessToken, clubId);
      const leaderboard = buildLeaderboard(activities);

      return jsonResponse({
        clubId,
        windowDays: DAYS_WINDOW,
        generatedAt: new Date().toISOString(),
        leaderboard,
        source: 'strava-api'
      });
    } catch (error) {
      return jsonResponse(
        {
          error: 'Unable to load Strava leaderboard.',
          details: error instanceof Error ? error.message : String(error)
        },
        502
      );
    }
  }
});
