import axios from 'axios';

const WP_BASE = 'https://blog.optiontrip.com/wp-json/wp/v2';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FIELDS = 'id,slug,title,excerpt,content,link,date,modified,featured_media,_links';
const NAV_FIELDS = 'id,slug,title,date,featured_media,_links';

const wpApi = axios.create({
  baseURL: WP_BASE,
  timeout: 10000,
  headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
});

export const fetchPosts = (perPage = 6, page = 1) =>
  wpApi.get('/posts', {
    params: {
      _embed: true,
      per_page: perPage,
      page,
      status: 'publish',
      orderby: 'date',
      order: 'desc',
      _fields: FIELDS,
      cacheBust: Date.now(),
    },
  });

export const fetchPostBySlug = (slug) =>
  wpApi.get('/posts', { params: { slug, _embed: true, _fields: FIELDS } });
export const fetchPrevPost = (isoDate) =>
  wpApi.get('/posts', { params: { before: isoDate, per_page: 1, order: 'desc', _embed: true, _fields: NAV_FIELDS } });
export const fetchNextPost = (isoDate) =>
  wpApi.get('/posts', { params: { after: isoDate, per_page: 1, order: 'asc', _embed: true, _fields: NAV_FIELDS } });
export const fetchComments = (postId) =>
  wpApi.get('/comments', { params: { post: postId, per_page: 50, status: 'approve', _fields: 'id,author_name,date,content,author_avatar_urls' } });
export const submitComment = (postId, { name, email, content }) =>
  wpApi.post('/comments', { post: postId, author_name: name, author_email: email, content });

export const getFeaturedImage = (post, size = 'medium_large') => {
  try {
    const media = post?._embedded?.['wp:featuredmedia']?.[0];
    if (!media) return null;
    const sizes = media?.media_details?.sizes || {};
    return sizes[size]?.source_url || sizes.large?.source_url || sizes.medium_large?.source_url || sizes.medium?.source_url || sizes.full?.source_url || media?.source_url || null;
  } catch { return null; }
};

export const fetchSmartHeroImage = async (post) => {
  try {
    const title = (post?.title?.rendered || '').replace(/<[^>]+>/g, '');
    const content = post?.content?.rendered || '';
    const postId = post?.id || 0;
    const res = await fetch(`${API_BASE}/api/blog/hero-image`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, postId }) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.imageUrl || null;
  } catch { return null; }
};

let overridesCache = null;
let overridesPromise = null;
export const fetchImageOverrides = () => {
  if (overridesCache) return Promise.resolve(overridesCache);
  if (!overridesPromise) {
    overridesPromise = fetch(`${API_BASE}/api/blog/image-overrides`)
      .then((res) => (res.ok ? res.json() : { data: {} }))
      .then((d) => { overridesCache = d.data || {}; return overridesCache; })
      .catch(() => ({}));
  }
  return overridesPromise;
};
export const invalidateImageOverridesCache = () => { overridesCache = null; overridesPromise = null; };
export const getAIFallbackImage = (title = 'travel', seed = 1) => {
  const prompt = encodeURIComponent(`beautiful travel photography ${title} stunning landscape destination cinematic`);
  return `https://image.pollinations.ai/prompt/${prompt}?width=1200&height=630&nologo=true&seed=${seed}`;
};
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
export const stripHtml = (html = '', maxLength = 160) => {
  const text = html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};
export default wpApi;
