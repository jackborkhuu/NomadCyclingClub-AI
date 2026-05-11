import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const pageId = process.env.FB_PAGE_ID;
const pageToken = process.env.FB_PAGE_TOKEN;
const graphVersion = process.env.FB_GRAPH_VERSION || 'v23.0';

if (!pageId || !pageToken) {
  throw new Error('Missing required env vars: FB_PAGE_ID and FB_PAGE_TOKEN');
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
  const media = uniqueMedia(attachmentData.flatMap((entry) => normalizeMediaNode(entry)));

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
    media
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
    'attachments{media_type,media,url,target,title,description,subattachments}'
  ].join(',');

  const params = new URLSearchParams({
    fields,
    limit: '25',
    access_token: pageToken
  });

  const endpoint = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(pageId)}/posts?${params.toString()}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph API request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const rawPosts = Array.isArray(payload?.data) ? payload.data : [];

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
