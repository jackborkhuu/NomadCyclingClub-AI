import { app } from '@azure/functions';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

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

  const summary = `${distanceKm.toFixed(1)} km • ${movingMinutes} min`;
  const elevationStr = elevationM > 0 ? ` • ${elevationM.toFixed(0)}m elevation` : '';
  const message = `${activity.name}${elevationStr}`;

  return {
    id: activity.id ? `strava-${activity.id}` : null,
    type: activity.type || 'Activity',
    name: activity.name || 'Unnamed Activity',
    message,
    summary,
    createdTime: activity.start_date || new Date().toISOString(),
    created_time: activity.start_date || new Date().toISOString(),
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
    const accessToken = (process.env.STRAVA_ACCESS_TOKEN || '').trim();

    const limitParam = Number(request.query.get('limit'));
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, limitParam))
      : DEFAULT_LIMIT;

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
