import { app } from '@azure/functions';

const STRAVA_OAUTH_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const DEFAULT_CLUB_ID = '303983';
const DEFAULT_DAYS_WINDOW = 30;
const FALLBACK_DAYS_WINDOW = 365;

let cachedAccessToken = '';
let cachedAccessTokenExpiresAt = 0;
let cachedRefreshToken = '';

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

async function getValidAccessToken(clientId, clientSecret, envRefreshToken) {
  const now = Math.floor(Date.now() / 1000);
  const refreshToken = cachedRefreshToken || envRefreshToken;

  if (cachedAccessToken && cachedAccessTokenExpiresAt > now + 120) {
    return cachedAccessToken;
  }

  const auth = await refreshAccessToken(clientId, clientSecret, refreshToken);
  cachedAccessToken = auth.accessToken;
  cachedAccessTokenExpiresAt = Number(auth.expiresAt) || now + 300;
  cachedRefreshToken = auth.refreshToken || refreshToken;
  return cachedAccessToken;
}

async function fetchClubActivities(accessToken, clubId, daysWindow = DEFAULT_DAYS_WINDOW) {
  const all = [];
  const now = Date.now();
  const oldestAllowed = now - daysWindow * 24 * 60 * 60 * 1000;

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

async function fetchClubMembers(accessToken, clubId) {
  const members = [];

  for (let page = 1; page <= 3; page += 1) {
    const url = new URL(`${STRAVA_API_BASE}/clubs/${clubId}/members`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', '200');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || 'Could not fetch club members');
    }

    const pageMembers = Array.isArray(payload) ? payload : [];
    if (pageMembers.length === 0) {
      break;
    }

    members.push(...pageMembers);
    if (pageMembers.length < 200) {
      break;
    }
  }

  return members;
}

async function fetchAthleteStats(accessToken, athleteId) {
  const response = await fetch(`${STRAVA_API_BASE}/athletes/${athleteId}/stats`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `Could not fetch stats for athlete ${athleteId}`);
  }

  return payload;
}

async function buildLeaderboardFromMemberStats(accessToken, clubId) {
  const members = await fetchClubMembers(accessToken, clubId);
  const candidates = members
    .map((member) => ({
      athleteId: member?.id,
      name: toDisplayName(member),
      profile: member?.profile_medium || member?.profile || null
    }))
    .filter((member) => member.athleteId)
    .slice(0, 60);

  const rows = [];
  for (const member of candidates) {
    try {
      const stats = await fetchAthleteStats(accessToken, member.athleteId);
      const distanceMeters = Number(stats?.recent_ride_totals?.distance) || 0;
      const rideCount = Number(stats?.recent_ride_totals?.count) || 0;
      if (distanceMeters <= 0 && rideCount <= 0) {
        continue;
      }

      rows.push({
        athleteId: member.athleteId,
        name: member.name,
        profile: member.profile,
        distanceMeters,
        rideCount
      });
    } catch {
      // Some athlete profiles can block stats access; skip those entries.
    }
  }

  return rows
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
      const accessToken = await getValidAccessToken(clientId, clientSecret, refreshToken);
      const initialActivities = await fetchClubActivities(accessToken, clubId, DEFAULT_DAYS_WINDOW);
      let leaderboard = buildLeaderboard(initialActivities);
      let activitiesUsed = initialActivities;
      let windowDaysUsed = DEFAULT_DAYS_WINDOW;
      let mode = 'club-activities';

      if (leaderboard.length === 0) {
        const fallbackActivities = await fetchClubActivities(accessToken, clubId, FALLBACK_DAYS_WINDOW);
        const fallbackLeaderboard = buildLeaderboard(fallbackActivities);
        if (fallbackLeaderboard.length > 0) {
          leaderboard = fallbackLeaderboard;
          activitiesUsed = fallbackActivities;
          windowDaysUsed = FALLBACK_DAYS_WINDOW;
        }
      }

      if (leaderboard.length === 0) {
        const memberStatsLeaderboard = await buildLeaderboardFromMemberStats(accessToken, clubId);
        if (memberStatsLeaderboard.length > 0) {
          leaderboard = memberStatsLeaderboard;
          mode = 'member-stats';
        }
      }

      const note = leaderboard.length === 0
        ? 'Strava returned no visible club activities and no accessible member stats for ranking. This can happen with strict athlete privacy settings.'
        : null;

      return jsonResponse({
        clubId,
        windowDays: windowDaysUsed,
        generatedAt: new Date().toISOString(),
        activitiesCount: activitiesUsed.length,
        leaderboard,
        note,
        mode,
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
