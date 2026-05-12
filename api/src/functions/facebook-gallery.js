import { app } from '@azure/functions';

const DEFAULT_GRAPH_VERSION = 'v23.0';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 40;

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

    return payload.posts.map((post) => ({
      id: post.id || null,
      message: post.message || post.story || '',
      story: post.story || '',
      created_time: post.createdTime || post.created_time || null,
      permalink_url: post.permalinkUrl || post.permalink_url || null,
      full_picture: post.full_picture || null,
      attachments: {
        data: Array.isArray(post.media)
          ? post.media.map((media) => ({
              type: media.type || 'photo',
              title: media.title || '',
              url: media.targetUrl || media.target_url || null,
              target: { id: media.targetId || null },
              media: {
                image: { src: media.imageUrl || media.image_url || null },
                source: media.videoUrl || media.video_url || null
              }
            }))
          : []
      }
    }));
  } catch {
    return [];
  }
}

function normalizeMediaItem(post) {
  const attachments = post.attachments?.data || [];
  const results = [];

  const walk = (node, sourceMessage) => {
    if (!node) {
      return;
    }

    const subattachments = node.subattachments?.data || [];
    if (subattachments.length > 0) {
      subattachments.forEach((child) => walk(child, sourceMessage));
      return;
    }

    const type = String(node.type || '').toLowerCase();
    const media = node.media || {};
    const target = node.target || {};

    const imageUrl =
      media.image?.src ||
      media.source ||
      node.url ||
      null;

    const videoUrl =
      media.source ||
      node.media?.source ||
      null;

    const isVideo = type.includes('video') || type === 'reel';

    if (isVideo && !videoUrl) {
      return;
    }

    if (!isVideo && !imageUrl) {
      return;
    }

    const postId = post.id || '';
    const postPermalink = post.permalink_url || '';
    const normalizedPostUrl = postPermalink || (postId ? `https://www.facebook.com/${postId.replace('_', '/posts/')}` : 'https://www.facebook.com/nomadcyclingclub');

    results.push({
      mediaKey: target.id || `${postId}-${results.length}`,
      postId,
      postUrl: normalizedPostUrl,
      createdTime: post.created_time || null,
      message: sourceMessage || post.message || post.story || '',
      story: post.story || '',
      title: node.title || '',
      type: isVideo ? 'video' : 'image',
      isReel: type === 'reel' || type.includes('reel'),
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null
    });
  };

  attachments.forEach((attachment) => walk(attachment, post.message || post.story || ''));

  if (results.length === 0 && post.full_picture) {
    const postId = post.id || '';
    const postPermalink = post.permalink_url || '';
    const normalizedPostUrl = postPermalink || (postId ? `https://www.facebook.com/${postId.replace('_', '/posts/')}` : 'https://www.facebook.com/nomadcyclingclub');

    results.push({
      mediaKey: `${postId}-full-picture`,
      postId,
      postUrl: normalizedPostUrl,
      createdTime: post.created_time || null,
      message: post.message || post.story || '',
      story: post.story || '',
      title: '',
      type: 'image',
      isReel: false,
      imageUrl: post.full_picture,
      videoUrl: null
    });
  }

  return results;
}

app.http('facebook-gallery', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'facebook-gallery',
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
        return jsonResponse({
          error: 'Missing FB_PAGE_ID or FB_PAGE_TOKEN environment variables.'
        }, 500);
      }

      const offset = Number.isFinite(Number(after)) ? Math.max(0, Number(after)) : 0;
      const pagePosts = syncedPosts.slice(offset, offset + limit);
      const items = pagePosts.flatMap(normalizeMediaItem);
      const nextCursor = offset + limit < syncedPosts.length ? String(offset + limit) : null;
      return jsonResponse({ items, nextCursor, source: 'synced-json' });
    }

    const url = new URL(`https://graph.facebook.com/${graphVersion}/${pageId}/posts`);

    url.searchParams.set('fields', 'id,message,story,created_time,permalink_url,full_picture,attachments{type,title,url,target,media,subattachments}');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('access_token', pageToken);
    if (after) {
      url.searchParams.set('after', after);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'NomadCyclingClubApi/1.0'
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        return jsonResponse({
          error: 'Facebook Graph API request failed.',
          details: payload?.error?.message || response.statusText,
          status: response.status
        }, 502);
      }

      const posts = Array.isArray(payload?.data) ? payload.data : [];
      const items = posts.flatMap(normalizeMediaItem);
      const nextCursor = payload?.paging?.cursors?.after || null;

      return jsonResponse({
        items,
        nextCursor,
        source: 'graph'
      });
    } catch (error) {
      return jsonResponse({
        error: 'Unexpected error calling Facebook Graph API.',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }
});
