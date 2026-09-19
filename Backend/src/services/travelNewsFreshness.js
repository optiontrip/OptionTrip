const DEFAULT_WP_API = 'https://blog.optiontrip.com/wp-json/wp/v2';
const DEFAULT_STALE_HOURS = 36;
const CACHE_MS = 5 * 60 * 1000;

let cached = null;
let cachedAt = 0;

const wpBase = () => String(process.env.WORDPRESS_API_BASE || DEFAULT_WP_API).replace(/\/$/, '');

const staleAfterHours = () => {
  const configured = Number(process.env.NEWS_STALE_AFTER_HOURS || DEFAULT_STALE_HOURS);
  if (!Number.isFinite(configured)) return DEFAULT_STALE_HOURS;
  return Math.max(6, Math.min(configured, 168));
};

const fetchJson = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'OptionTripNewsHealth/1.0 (+https://optiontrip.com)' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

export const getTravelNewsFreshness = async ({ force = false, now = Date.now() } = {}) => {
  if (!force && cached && now - cachedAt < CACHE_MS) return cached;

  const thresholdHours = staleAfterHours();
  try {
    const categoryParams = new URLSearchParams({
      slug: 'news',
      per_page: '1',
      _fields: 'id,slug',
    });
    const categories = await fetchJson(`${wpBase()}/categories?${categoryParams.toString()}`);
    const categoryId = Number(Array.isArray(categories) ? categories[0]?.id : null);

    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      cached = {
        status: 'unknown',
        stale: null,
        staleAfterHours: thresholdHours,
        latestPublishedAt: null,
        ageHours: null,
        reason: 'news-category-not-found',
      };
      cachedAt = now;
      return cached;
    }

    const postParams = new URLSearchParams({
      categories: String(categoryId),
      status: 'publish',
      per_page: '1',
      order: 'desc',
      orderby: 'date',
      _fields: 'id,date,link,slug',
    });
    const posts = await fetchJson(`${wpBase()}/posts?${postParams.toString()}`);
    const latest = Array.isArray(posts) ? posts[0] : null;

    if (!latest?.date) {
      cached = {
        status: 'stale',
        stale: true,
        staleAfterHours: thresholdHours,
        latestPublishedAt: null,
        ageHours: null,
        latestPostId: null,
        latestPostLink: null,
        reason: 'no-published-news-posts',
      };
      cachedAt = now;
      return cached;
    }

    const publishedAt = new Date(latest.date).getTime();
    const ageHours = Number.isFinite(publishedAt)
      ? Math.max(0, (now - publishedAt) / (60 * 60 * 1000))
      : null;
    const stale = ageHours === null ? null : ageHours > thresholdHours;

    cached = {
      status: stale === null ? 'unknown' : (stale ? 'stale' : 'fresh'),
      stale,
      staleAfterHours: thresholdHours,
      latestPublishedAt: latest.date,
      latestPostId: latest.id || null,
      latestPostLink: latest.link || null,
      latestPostSlug: latest.slug || null,
      ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
      reason: null,
    };
    cachedAt = now;
    return cached;
  } catch (error) {
    cached = {
      status: 'unknown',
      stale: null,
      staleAfterHours: thresholdHours,
      latestPublishedAt: null,
      ageHours: null,
      reason: error?.name === 'AbortError' ? 'wordpress-timeout' : (error?.message || 'wordpress-unreachable'),
    };
    cachedAt = now;
    return cached;
  }
};

export const clearTravelNewsFreshnessCache = () => {
  cached = null;
  cachedAt = 0;
};
