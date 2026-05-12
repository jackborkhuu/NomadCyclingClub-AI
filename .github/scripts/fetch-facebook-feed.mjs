import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const pageId = process.env.FB_PAGE_ID;
const rawPageToken = process.env.FB_PAGE_TOKEN;
const graphVersion = process.env.FB_GRAPH_VERSION || 'v23.0';
const requestPageLimit = Math.max(10, Math.min(50, Number(process.env.FB_GRAPH_PAGE_LIMIT || '25')));

function sanitizeToken(token) {
  if (!token) {
    return token;
  }

  const trimmed = token.trim();
  // Common copy/paste mistake: secret value is wrapped in quotes.
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

const pageToken = sanitizeToken(rawPageToken);

if (!pageId || !pageToken) {
  throw new Error('Missing required env vars: FB_PAGE_ID and FB_PAGE_TOKEN');
}

if (/\s/.test(pageToken)) {
  throw new Error('FB_PAGE_TOKEN contains whitespace. Paste only the raw page access token value into the GitHub secret.');
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

  // Remove poster images (photo type) if video with same imageUrl exists
  // This prevents duplicate thumbnails from showing alongside videos/reels
  const videoImageUrls = new Set();
  media.forEach((item) => {
    if (item.type === 'video' && item.imageUrl) {
      videoImageUrls.add(item.imageUrl);
    }
  });
  media = media.filter((item) => {
    if (item.type === 'photo' && videoImageUrls.has(item.imageUrl)) {
      return false;
    }
    return true;
  });

  // Remove album type if individual photo types with same imageUrl exist
  // This prevents album metadata from showing as separate media item
  const photoImageUrls = new Set();
  media.forEach((item) => {
    if (item.type === 'photo' && item.imageUrl) {
      photoImageUrls.add(item.imageUrl);
    }
  });
  media = media.filter((item) => {
    if (item.type === 'album' && photoImageUrls.has(item.imageUrl)) {
      return false;
    }
    return true;
  });

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
    comments: Array.isArray(post?.comments?.data) ? post.comments.data.slice(0, 5).map(comment => ({
      id: comment.id || null,
      message: comment.message || null,
      from: comment.from?.name || 'Anonymous',
      fromName: comment.from?.name || 'Anonymous',
      fromId: comment.from?.id || null,
      profileUrl: comment.from?.id ? `https://www.facebook.com/${comment.from.id}` : null,
      createdTime: comment.created_time || null
    })) : [],
    commentCount: post?.comments?.summary?.total_count || 0
  };
}

async function fetchPosts() {
  const fields = [
    'id',
    'message',
    'story',
    'created_time',
    'permalink_url',
    'full_picture',
    'attachments{media_type,media,url,target,title,description,subattachments}',
    'comments.limit(5).summary(true){id,message,created_time,from{id,name},total_count}'
  ].join(',');

  const params = new URLSearchParams({
    fields,
    limit: String(requestPageLimit),
    access_token: pageToken
  });

  const maxPosts = 300;
  const rawPosts = [];
  const seenIds = new Set();
  let nextUrl = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/posts?${params.toString()}`;

  while (nextUrl && rawPosts.length < maxPosts) {
    const response = await fetch(nextUrl, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      const body = await response.text();
      let help = '';
      if (/Cannot parse access token/i.test(body)) {
        help = ' FB_PAGE_TOKEN appears malformed. Re-copy the page access_token from /me/accounts and replace the GitHub secret value with no quotes and no extra spaces.';
      } else if (/User Access Token Is Not Supported/i.test(body) || /A Page access token is required/i.test(body)) {
        help = ' FB_PAGE_TOKEN is a user token. Use the page access_token for your page from /me/accounts.';
      }
      throw new Error(`Graph API request failed (${response.status}): ${body}${help}`);
    }

    const payload = await response.json();
    const pagePosts = Array.isArray(payload?.data) ? payload.data : [];
    for (const post of pagePosts) {
      const id = post?.id || `${post?.created_time || ''}-${rawPosts.length}`;
      if (seenIds.has(id)) {
        continue;
      }
      seenIds.add(id);
      rawPosts.push(post);
      if (rawPosts.length >= maxPosts) {
        break;
      }
    }

    nextUrl = payload?.paging?.next || null;
  }

  const posts = rawPosts
    .map((post) => normalizePost(post))
    .sort((left, right) => String(right.createdTime || '').localeCompare(String(left.createdTime || '')));

  return {
    generatedAt: new Date().toISOString(),
    source: 'facebook-graph-api',
    pageId,
    posts
  };
}

async function main() {
  const outputPath = resolve('data/facebook-feed.json');
  await mkdir(dirname(outputPath), { recursive: true });

  const feed = await fetchPosts();
  await writeFile(outputPath, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${feed.posts.length} posts to data/facebook-feed.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
