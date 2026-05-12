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

function parseActivityId(activity, details) {
  const rawId = activity?.id ?? activity?.activity_id ?? details?.id;
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return rawId;
  }
  if (typeof rawId === 'string' && rawId.trim()) {
    return rawId.trim();
  }
  return null;
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

async function fetchActivityDetails(accessToken, activityId) {
  try {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'NomadCyclingClubApi/1.0'
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

async function fetchActivityPhotos(accessToken, activityId, maxPhotos = 4) {
  try {
    const url = new URL(`https://www.strava.com/api/v3/activities/${activityId}/photos`);
    url.searchParams.set('size', '600');
    url.searchParams.set('photo_sources', 'true');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'NomadCyclingClubApi/1.0'
      }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json().catch(() => []);
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .map((photo) => {
        const urls = photo?.urls || {};
        const imageUrl = urls['600'] || urls['500'] || urls['400'] || urls['100'] || '';
        if (!imageUrl) {
          return null;
        }

        return {
          type: 'photo',
          imageUrl,
          source: 'strava'
        };
      })
      .filter((item) => item !== null)
      .slice(0, maxPhotos);
  } catch {
    return [];
  }
}

function normalizeActivity(activity, details = null, photos = []) {
  if (!activity || typeof activity !== 'object') {
    return null;
  }

  const activityId = parseActivityId(activity, details);
  const source = details && typeof details === 'object' ? details : activity;

  const distanceKm = (Number(source.distance) || 0) / 1000;
  const movingMinutes = Math.round((Number(source.moving_time) || 0) / 60);
  const elevationM = Number(source.total_elevation_gain) || 0;
  const athleteName = source.athlete?.firstname && source.athlete?.lastname
    ? `${source.athlete.firstname} ${source.athlete.lastname}`
    : source.athlete?.firstname || activity.athlete?.firstname || 'Athlete';

  const athleteId = source.athlete?.id || activity.athlete?.id;
  const athleteProfileUrl = athleteId ? `https://www.strava.com/athletes/${athleteId}` : null;

  const activityUrl = activityId ? `https://www.strava.com/activities/${activityId}` : null;
  const activityTimestamp = source.start_date || source.start_date_local || activity.start_date || activity.start_date_local || '1970-01-01T00:00:00.000Z';

  const map = source.map && typeof source.map === 'object' ? source.map : null;
  const mapSummaryPolyline = typeof map?.summary_polyline === 'string' ? map.summary_polyline : '';
  const totalPhotoCount = Number(source.total_photo_count) || Number(source.photo_count) || 0;

  const summary = `${distanceKm.toFixed(1)} km • ${movingMinutes} min`;
  const elevationStr = elevationM > 0 ? ` • ${elevationM.toFixed(0)}m elevation` : '';
  const message = `${source.name || activity.name || 'Activity'}${elevationStr}`;

  return {
    id: activityId ? `strava-${activityId}` : null,
    type: source.type || activity.type || 'Activity',
    name: source.name || activity.name || 'Unnamed Activity',
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
    map: {
      summaryPolyline: mapSummaryPolyline,
      hasMap: Boolean(mapSummaryPolyline),
      startLatLng: Array.isArray(source.start_latlng) ? source.start_latlng : null,
      endLatLng: Array.isArray(source.end_latlng) ? source.end_latlng : null
    },
    media: Array.isArray(photos) ? photos : [],
    stats: {
      distance: distanceKm,
      distanceM: Number(source.distance) || 0,
      movingTime: Number(source.moving_time) || 0,
      movingMinutes,
      elevationGain: elevationM,
      avgSpeed: Number(source.average_speed) || 0,
      avgSpeedKph: (Number(source.average_speed) || 0) * 3.6,
      photoCount: totalPhotoCount
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

      const enrichedActivities = await Promise.all(activities.map(async (activity) => {
        const activityId = parseActivityId(activity, null);
        if (!activityId) {
          return { activity, details: null, photos: [] };
        }

        const [details, photos] = await Promise.all([
          fetchActivityDetails(accessToken, activityId),
          fetchActivityPhotos(accessToken, activityId, 4)
        ]);

        return { activity, details, photos };
      }));

      const posts = enrichedActivities
        .map(({ activity, details, photos }) => normalizeActivity(activity, details, photos))
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
