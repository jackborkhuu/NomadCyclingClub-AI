import { app } from '@azure/functions';

const DEFAULT_GRAPH_VERSION = 'v23.0';
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

function sanitizeToken(token) {
  if (!token) {
    return '';
  }

  const trimmed = String(token).trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

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

async function fetchSyncedPostsFromStaticData(request) {
  try {
    const origin = new URL(request.url).origin;
    const response = await fetch(`${origin}/data/facebook-feed.json`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.posts)) {
      return [];
    }

    return payload.posts;
  } catch {
    return [];
  }
}

function uniqueMedia(mediaList) {
  const seen = new Set();
  return mediaList.filter((item) => {
    const key = [item.type, item.imageUrl, item.videoUrl, item.targetUrl].join('|');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeMediaNode(node) {
  if (!node || typeof node !== 'object') {
    return [];
  }

  const type = String(node.media_type || node.type || 'unknown').toLowerCase();
  const imageUrl =
    node?.media?.image?.src ||
    node?.media?.image?.uri ||
    node?.full_picture ||
    null;
  const videoUrl =
    node?.media?.source ||
    node?.media?.video?.source ||
    null;
  const targetUrl = node?.target?.url || node?.url || null;

  const normalized = [];
  if (imageUrl || videoUrl) {
    normalized.push({
      type,
      imageUrl,
      videoUrl,
      targetUrl,
      title: node?.title || null,
      description: node?.description || null
    });
  }

  const subData = Array.isArray(node?.subattachments?.data) ? node.subattachments.data : [];
  for (const child of subData) {
    normalized.push(...normalizeMediaNode(child));
  }

  return normalized;
}

function normalizePost(post) {
  const attachmentData = Array.isArray(post?.attachments?.data) ? post.attachments.data : [];
  let media = uniqueMedia(attachmentData.flatMap((entry) => normalizeMediaNode(entry)));

  const videoImageUrls = new Set();
  media.forEach((item) => {
    if (item.type === 'video' && item.imageUrl) {
      videoImageUrls.add(item.imageUrl);
    }
  });

  media = media.filter((item) => !(item.type === 'photo' && videoImageUrls.has(item.imageUrl)));

  const photoImageUrls = new Set();
  media.forEach((item) => {
    if (item.type === 'photo' && item.imageUrl) {
      photoImageUrls.add(item.imageUrl);
    }
  });

  media = media.filter((item) => !(item.type === 'album' && photoImageUrls.has(item.imageUrl)));

  if (post?.full_picture && !media.some((item) => item.imageUrl === post.full_picture)) {
    media.unshift({
      type: 'photo',
      imageUrl: post.full_picture,
      videoUrl: null,
      targetUrl: post?.permalink_url || null,
      title: null,
      description: null
    });
  }

  return {
    id: post?.id || null,
    message: post?.message || post?.story || null,
    story: post?.story || null,
    permalinkUrl: post?.permalink_url || null,
    createdTime: post?.created_time || null,
    media,
    comments: Array.isArray(post?.comments?.data)
      ? post.comments.data.slice(0, 5).map((comment) => ({
          id: comment.id || null,
          message: comment.message || null,
          from: comment.from?.name || 'Anonymous',
          createdTime: comment.created_time || null
        }))
      : [],
    commentCount: post?.comments?.summary?.total_count || 0
  };
}

app.http('facebook-feed', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'facebook-feed',
  handler: async (request) => {
    if (request.method === 'OPTIONS') {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }

    const pageId = process.env.FB_PAGE_ID || process.env.FACEBOOK_PAGE_ID || '';
    const pageToken = sanitizeToken(
      process.env.FB_PAGE_TOKEN || process.env.FACEBOOK_PAGE_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || ''
    );
    const graphVersion = process.env.FB_GRAPH_VERSION || process.env.GRAPH_VERSION || DEFAULT_GRAPH_VERSION;

    const limitParam = Number(request.query.get('limit'));
    const after = request.query.get('after');
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, limitParam))
      : DEFAULT_LIMIT;

    if (!pageId || !pageToken) {
      const syncedPosts = await fetchSyncedPostsFromStaticData(request);
      if (syncedPosts.length === 0) {
        return jsonResponse({ error: 'Missing page ID/token app settings.' }, 500);
      }

      const offset = Number.isFinite(Number(after)) ? Math.max(0, Number(after)) : 0;
      const posts = syncedPosts.slice(offset, offset + limit);
      const nextCursor = offset + limit < syncedPosts.length ? String(offset + limit) : null;
      return jsonResponse({ posts, nextCursor, source: 'synced-json' });
    }

    const url = new URL(`https://graph.facebook.com/${graphVersion}/${pageId}/posts`);
    url.searchParams.set(
      'fields',
      'id,message,story,created_time,permalink_url,full_picture,attachments{media_type,media,url,target,title,description,subattachments},comments.limit(5).summary(true){id,message,created_time,from{name},total_count}'
    );
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('access_token', pageToken);
    if (after) {
      url.searchParams.set('after', after);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'NomadCyclingClubApi/1.0'
        }
      });
      const payload = await response.json();

      if (!response.ok) {
        // Graph API failed (e.g. expired token) — fall back to synced JSON
        const syncedPosts = await fetchSyncedPostsFromStaticData(request);
        if (syncedPosts.length > 0) {
          const offset = Number.isFinite(Number(after)) ? Math.max(0, Number(after)) : 0;
          const posts = syncedPosts.slice(offset, offset + limit);
          const nextCursor = offset + limit < syncedPosts.length ? String(offset + limit) : null;
          return jsonResponse({ posts, nextCursor, source: 'synced-json-fallback' });
        }
        return jsonResponse({
          error: 'Facebook Graph API request failed.',
          details: payload?.error?.message || response.statusText,
          status: response.status
        }, 502);
      }

      const rawPosts = Array.isArray(payload?.data) ? payload.data : [];
      const posts = rawPosts
        .map((post) => normalizePost(post))
        .sort((left, right) => String(right.createdTime || '').localeCompare(String(left.createdTime || '')));

      return jsonResponse({
        posts,
        nextCursor: payload?.paging?.cursors?.after || null,
        source: 'graph'
      });
    } catch (error) {
      // Network/unexpected error — fall back to synced JSON
      const syncedPosts = await fetchSyncedPostsFromStaticData(request);
      if (syncedPosts.length > 0) {
        const offset = Number.isFinite(Number(after)) ? Math.max(0, Number(after)) : 0;
        const posts = syncedPosts.slice(offset, offset + limit);
        const nextCursor = offset + limit < syncedPosts.length ? String(offset + limit) : null;
        return jsonResponse({ posts, nextCursor, source: 'synced-json-fallback' });
      }
      return jsonResponse({
        error: 'Unexpected error calling Facebook Graph API.',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }
});
