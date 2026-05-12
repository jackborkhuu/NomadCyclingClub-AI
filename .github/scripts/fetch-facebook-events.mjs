import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const pageId = process.env.FB_PAGE_ID;
const rawPageToken = process.env.FB_PAGE_TOKEN;
const graphVersion = process.env.FB_GRAPH_VERSION || 'v23.0';

function sanitizeToken(token) {
  if (!token) return token;
  const trimmed = token.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const pageToken = sanitizeToken(rawPageToken);

if (!pageId || !pageToken) {
  throw new Error('Missing required env vars: FB_PAGE_ID and FB_PAGE_TOKEN');
}

function normalizeEvent(event) {
  return {
    id: event.id || null,
    name: event.name || null,
    description: event.description || null,
    startTime: event.start_time || null,
    endTime: event.end_time || null,
    isCanceled: event.is_canceled || false,
    place: event.place
      ? {
          name: event.place.name || null,
          city: event.place.location?.city || null,
          state: event.place.location?.state || null,
          country: event.place.location?.country || null,
        }
      : null,
    coverUrl: event.cover?.source || null,
    eventUrl: `https://www.facebook.com/events/${event.id}`,
  };
}

async function fetchEvents() {
  const fields = [
    'id',
    'name',
    'description',
    'start_time',
    'end_time',
    'is_canceled',
    'place',
    'cover',
  ].join(',');

  const params = new URLSearchParams({
    fields,
    limit: '50',
    access_token: pageToken,
  });

  const endpoint = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/events?${params.toString()}`;
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph API events request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const rawEvents = Array.isArray(payload?.data) ? payload.data : [];

  const now = new Date().toISOString();
  const events = rawEvents
    .map(normalizeEvent)
    .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));

  const upcoming = events.filter((e) => (e.startTime || '') >= now);
  const past = events.filter((e) => (e.startTime || '') < now).reverse();

  return {
    generatedAt: new Date().toISOString(),
    source: 'facebook-graph-api',
    pageId,
    upcoming,
    past,
  };
}

async function main() {
  const outputPath = resolve('data/facebook-events.json');
  await mkdir(dirname(outputPath), { recursive: true });

  const data = await fetchEvents();
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  console.log(
    `Wrote ${data.upcoming.length} upcoming and ${data.past.length} past events to data/facebook-events.json`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
