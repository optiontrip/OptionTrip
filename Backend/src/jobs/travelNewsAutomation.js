import OpenAI from 'openai';

const DEFAULT_LIMIT = 5;
const DEFAULT_WP_API = 'https://blog.optiontrip.com/wp-json/wp/v2';
const GDELT_ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';

const travelQuery = [
  'travel', 'tourism', 'airline', 'airport', 'flight', 'hotel', 'rail', 'train',
  'bus', 'cruise', 'visa', 'border', 'destination', 'resort', 'tourist'
].join(' OR ');

const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const slugify = (value = '') => normalizeText(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const wpAuthHeader = () => {
  const user = process.env.WORDPRESS_USERNAME;
  const pass = process.env.WORDPRESS_APP_PASSWORD;
  if (!user || !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
};

const wpBase = () => process.env.WORDPRESS_API_BASE || DEFAULT_WP_API;

const fetchJson = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const extractMetaDescription = (html = '') => {
  const patterns = [
    /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return normalizeText(match[1]).slice(0, 700);
  }
  return '';
};

const enrichArticle = async (article) => {
  if (!article?.url) return article;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(article.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'OptionTripNewsBot/1.0 (+https://optiontrip.com)' },
    });
    if (!response.ok) return article;
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return article;
    const html = (await response.text()).slice(0, 250000);
    return { ...article, description: extractMetaDescription(html) };
  } catch {
    return article;
  } finally {
    clearTimeout(timer);
  }
};

export const ingestTravelNews = async () => {
  const params = new URLSearchParams({
    query: `(${travelQuery}) sourcelang:english`,
    mode: 'ArtList',
    maxrecords: '60',
    format: 'json',
    sort: 'HybridRel',
  });
  const payload = await fetchJson(`${GDELT_ENDPOINT}?${params.toString()}`);
  const raw = Array.isArray(payload?.articles) ? payload.articles : [];

  const seen = new Set();
  const candidates = raw.filter(item => {
    const title = normalizeText(item?.title);
    const url = normalizeText(item?.url);
    if (!title || !url) return false;
    const key = `${title.toLowerCase()}|${item?.domain || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 30).map((item, index) => ({
    id: index + 1,
    title: normalizeText(item.title),
    url: item.url,
    domain: normalizeText(item.domain),
    seenDate: item.seendate || '',
    sourceCountry: item.sourcecountry || '',
    language: item.language || '',
  }));

  return Promise.all(candidates.map(enrichArticle));
};

export const selectTopTravelStories = async (candidates, limit = DEFAULT_LIMIT) => {
  const client = getOpenAI();
  if (!client || !candidates.length) return [];

  const model = process.env.OPENAI_NEWS_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const completion = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1200,
    messages: [
      {
        role: 'system',
        content: `You are the senior travel-news editor for OptionTrip.com. Select up to ${limit} distinct stories with the strongest current traveler impact. Group duplicate coverage of the same event. Prefer changes that affect routes, airports, rail/bus, visas/borders, strikes/disruptions, hotels, tourism openings/closures, cruises, major attractions, destination access or material travel safety. Quality beats quota. Reject celebrity travel, generic lifestyle listicles, rumors and weakly sourced claims. Return only JSON: {"stories":[{"headline":"","score":0,"reason":"","article_ids":[1,2],"vertical":"flights|stays|ground|visa|activities|cruise|safety|general"}]}. Use article_ids from the supplied data. Prefer multiple independent domains for consequential claims.`
      },
      {
        role: 'user',
        content: JSON.stringify(candidates.map(({ id, title, domain, seenDate, sourceCountry, description }) => ({
          id, title, domain, seenDate, sourceCountry, description,
        })))
      }
    ]
  });

  const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
  const stories = Array.isArray(parsed.stories) ? parsed.stories : [];
  return stories.slice(0, limit).map(story => ({
    ...story,
    articles: (Array.isArray(story.article_ids) ? story.article_ids : [])
      .map(id => candidates.find(item => item.id === id))
      .filter(Boolean),
  })).filter(story => story.articles.length > 0);
};

const ctaForVertical = (vertical) => {
  const map = {
    flights: { label: 'Search flights on OptionTrip', url: 'https://optiontrip.com/flights' },
    stays: { label: 'Search stays on OptionTrip', url: 'https://optiontrip.com/hotels' },
    ground: { label: 'Plan this trip with Vi', url: 'https://optiontrip.com/' },
    visa: { label: 'Plan this trip with Vi', url: 'https://optiontrip.com/' },
    activities: { label: 'Plan activities with OptionTrip', url: 'https://optiontrip.com/' },
    cruise: { label: 'Plan your trip with OptionTrip', url: 'https://optiontrip.com/' },
    safety: { label: 'Plan your trip with Vi', url: 'https://optiontrip.com/' },
    general: { label: 'Plan your trip with OptionTrip', url: 'https://optiontrip.com/' },
  };
  return map[vertical] || map.general;
};

export const draftOptionTripArticle = async (story) => {
  const client = getOpenAI();
  if (!client) throw new Error('OPENAI_API_KEY is not configured');
  const model = process.env.OPENAI_NEWS_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const materials = story.articles.map(({ title, domain, url, seenDate, description }) => ({
    title, domain, url, seenDate, description,
  }));

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 1800,
    messages: [
      {
        role: 'system',
        content: `Write an original, concise English travel news article for OptionTrip.com using only the supplied source material. Do not invent numbers, quotes, dates or operational details. If a detail is unclear, omit it or say it has not been confirmed. Explain what changed, why travelers should care, who may be affected, and what travelers should check next. Do not copy source wording. Return only JSON: {"title":"","excerpt":"","content_html":"","seo_title":"","meta_description":"","image_prompt":"","tags":[""],"confidence":0}. content_html should contain 4-8 short paragraphs with useful subheadings when appropriate, but no external links and no source list. image_prompt must describe an original editorial travel image, realistic, clean, no logos except a small readable OptionTrip.com wordmark near the lower center, no copyrighted characters.`
      },
      { role: 'user', content: JSON.stringify({ selected_story: story.headline, vertical: story.vertical, materials }) }
    ]
  });
  return JSON.parse(completion.choices[0]?.message?.content || '{}');
};

const generateAiImage = async (prompt) => {
  const client = getOpenAI();
  if (!client || !prompt) return null;
  try {
    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      prompt,
      size: '1536x1024',
    });
    const item = result.data?.[0];
    if (item?.b64_json) return { buffer: Buffer.from(item.b64_json, 'base64'), mime: 'image/png' };
    if (item?.url) {
      const response = await fetch(item.url);
      if (response.ok) return { buffer: Buffer.from(await response.arrayBuffer()), mime: response.headers.get('content-type') || 'image/png' };
    }
  } catch (err) {
    console.error('Travel news image generation failed:', err.message);
  }
  return null;
};

const uploadWordPressMedia = async (image, title) => {
  const auth = wpAuthHeader();
  if (!auth || !image?.buffer) return null;
  const fileName = `${slugify(title) || `optiontrip-news-${Date.now()}`}.png`;
  const response = await fetch(`${wpBase()}/media`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': image.mime || 'image/png',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
    body: image.buffer,
  });
  if (!response.ok) throw new Error(`WordPress media upload failed: ${response.status}`);
  return await response.json();
};

const wordpressPostExists = async (slug) => {
  const response = await fetch(`${wpBase()}/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug&per_page=1`);
  if (!response.ok) return false;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
};

const publishWordPressPost = async ({ draft, story, media }) => {
  const auth = wpAuthHeader();
  if (!auth) throw new Error('WordPress credentials are not configured');
  const slug = slugify(draft.title);
  if (!slug || await wordpressPostExists(slug)) return { skipped: true, reason: 'duplicate', slug };

  const cta = ctaForVertical(story.vertical);
  const sourceNames = [...new Set(story.articles.map(item => item.domain).filter(Boolean))];
  const sourceNote = sourceNames.length
    ? `<p><small>Reporting reviewed from: ${sourceNames.map(escapeHtml).join(', ')}.</small></p>`
    : '';
  const content = `${draft.content_html || ''}\n<hr/>\n<p><strong>What to do next:</strong> <a href="${cta.url}">${escapeHtml(cta.label)}</a>.</p>\n<p><a href="https://optiontrip.com/">OptionTrip</a> is your personal travel partner for planning, comparing and organizing your journey.</p>\n${sourceNote}`;

  const body = {
    title: draft.title,
    slug,
    status: 'publish',
    excerpt: draft.excerpt || draft.meta_description || '',
    content,
  };
  if (media?.id) body.featured_media = media.id;

  const response = await fetch(`${wpBase()}/posts`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`WordPress publish failed: ${response.status} ${await response.text()}`);
  return await response.json();
};

export const runTravelNewsAutomation = async () => {
  if (process.env.NEWS_AUTOPUBLISH_ENABLED !== 'true') {
    console.log('📰 Travel news automation is disabled');
    return { enabled: false, published: [] };
  }
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required for news automation');
  if (!wpAuthHeader()) throw new Error('WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD are required for news automation');

  const limit = Math.max(1, Math.min(5, Number(process.env.NEWS_DAILY_LIMIT || DEFAULT_LIMIT)));
  const candidates = await ingestTravelNews();
  const stories = await selectTopTravelStories(candidates, limit);
  const published = [];

  for (const story of stories) {
    try {
      const draft = await draftOptionTripArticle(story);
      if (!draft?.title || Number(draft.confidence || 0) < 0.65) {
        published.push({ skipped: true, reason: 'low-confidence', headline: story.headline });
        continue;
      }
      const image = await generateAiImage(draft.image_prompt);
      const media = image ? await uploadWordPressMedia(image, draft.title) : null;
      const post = await publishWordPressPost({ draft, story, media });
      published.push({ id: post?.id, link: post?.link, slug: post?.slug, skipped: post?.skipped || false });
    } catch (err) {
      console.error(`Travel news publish failed for "${story.headline}":`, err.message);
      published.push({ skipped: true, reason: err.message, headline: story.headline });
    }
  }

  console.log(`📰 Travel news automation finished: ${published.filter(item => !item.skipped).length} published`);
  return { enabled: true, candidates: candidates.length, selected: stories.length, published };
};
