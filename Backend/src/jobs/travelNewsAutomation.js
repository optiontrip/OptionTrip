import OpenAI from 'openai';
import sharp from 'sharp';

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


const optimizeNewsImageForWordPress = async (
  input,
  { emergency = false } = {}
) => {
  const source = Buffer.isBuffer(input)
    ? input
    : Buffer.from(input);

  const maxWidth = emergency ? 1280 : 1600;
  const maxHeight = emergency ? 720 : 900;
  const quality = emergency ? 68 : 80;

  const optimized = await sharp(source)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality,
      mozjpeg: true
    })
    .toBuffer();

  console.log(
    `🖼️ News image optimized: ${source.length} -> ${optimized.length} bytes ` +
    `(${maxWidth}x${maxHeight} max, quality=${quality})`
  );

  return optimized;
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

const decodeXml = (value = '') => String(value)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const stripTags = (value = '') =>
  normalizeText(decodeXml(value).replace(/<[^>]*>/g, ' '));

const fetchText = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'user-agent': 'OptionTripNewsBot/2.0 (+https://optiontrip.com)',
        ...(options.headers || {}),
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
};

const parseGoogleNewsRss = (xml = '') => {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  return items.map(match => {
    const block = match[1];
    const get = tag => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return m ? decodeXml(m[1]).trim() : '';
    };

    let title = stripTags(get('title'));
    const link = stripTags(get('link'));
    const pubDate = stripTags(get('pubDate'));
    const description = stripTags(get('description'));

    let source = '';
    const sm = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    if (sm) source = stripTags(sm[1]);

    if (source && title.endsWith(` - ${source}`))
      title = title.slice(0, -(source.length + 3)).trim();

    return {
      title,
      url: link,
      domain: source || 'Google News',
      seenDate: pubDate,
      sourceCountry: '',
      language: 'English',
      description,
      provider: 'google-news-rss',
    };
  }).filter(x => x.title && x.url);
};

const ingestGoogleNews = async () => {
  const queries = [
    'travel airline airport flight',
    'travel tourism visa border',
    'travel train rail bus',
    'travel hotel resort destination',
    'travel cruise tourism',
    'travel attraction tourism opening',
  ];

  const all = [];

  for (const query of queries) {
    try {
      const url =
        `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' when:2d')}` +
        '&hl=en-US&gl=US&ceid=US:en';

      const xml = await fetchText(url);
      all.push(...parseGoogleNewsRss(xml));
    } catch (err) {
      console.error(`Google News RSS failed for "${query}":`, err.message);
    }
  }

  return all;
};

const ingestGdelt = async () => {
  try {
    const params = new URLSearchParams({
      query: `(${travelQuery}) sourcelang:english`,
      mode: 'ArtList',
      maxrecords: '60',
      format: 'json',
      sort: 'HybridRel',
    });

    const payload = await fetchJson(`${GDELT_ENDPOINT}?${params.toString()}`);
    const raw = Array.isArray(payload?.articles) ? payload.articles : [];

    return raw.map(item => ({
      title: normalizeText(item?.title),
      url: normalizeText(item?.url),
      domain: normalizeText(item?.domain),
      seenDate: item?.seendate || '',
      sourceCountry: item?.sourcecountry || '',
      language: item?.language || '',
      description: '',
      provider: 'gdelt',
    })).filter(x => x.title && x.url);
  } catch (err) {
    console.error(`GDELT unavailable, continuing with fallback sources: ${err.message}`);
    return [];
  }
};

const storyKey = (title = '') => normalizeText(title)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\b(the|a|an|and|or|to|of|for|in|on|at|with|from|by)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const isRecentNews = (value = '') => {
  if (!value) return true;

  const compact = String(value).match(/^(\d{4})(\d{2})(\d{2})/);
  let d;

  if (compact)
    d = new Date(`${compact[1]}-${compact[2]}-${compact[3]}T00:00:00Z`);
  else
    d = new Date(value);

  if (Number.isNaN(d.getTime())) return true;

  const age = Date.now() - d.getTime();
  return age <= 4 * 24 * 60 * 60 * 1000 && age >= -24 * 60 * 60 * 1000;
};

export const ingestTravelNews = async () => {
  const [gdelt, google] = await Promise.all([
    ingestGdelt(),
    ingestGoogleNews(),
  ]);

  console.log(`📰 News ingestion: GDELT=${gdelt.length}, GoogleRSS=${google.length}`);

  const raw = [...gdelt, ...google];
  const seen = new Set();
  const unique = [];

  for (const item of raw) {
    if (!item?.title || !item?.url) continue;
    if (!isRecentNews(item.seenDate)) continue;

    const key = storyKey(item.title);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    unique.push(item);

    if (unique.length >= 60) break;
  }

  const candidates = unique.slice(0, 40).map((item, index) => ({
    ...item,
    id: index + 1,
  }));

  const enriched = [];
  for (const item of candidates) {
    if (item.description) {
      enriched.push(item);
      continue;
    }
    enriched.push(await enrichArticle(item));
  }

  console.log(`📰 News candidates after dedupe/freshness: ${enriched.length}`);
  return enriched;
};

export const selectTopTravelStories = async (candidates, limit = DEFAULT_LIMIT) => {
  const client = getOpenAI();
  if (!client || !candidates.length) return [];

  const model =
    process.env.OPENAI_NEWS_MODEL ||
    process.env.OPENAI_MODEL ||
    'gpt-5-mini';

  const requestedLimit = Math.max(
    1,
    Math.min(10, Number(limit || DEFAULT_LIMIT))
  );

  const candidatePayload = candidates.map(
    ({ id, title, domain, seenDate, sourceCountry, description }) => ({
      id,
      title,
      domain,
      seenDate,
      sourceCountry,
      description,
    })
  );

  const systemPrompt = `You are the senior travel-news editor for OptionTrip.com.

Select up to ${requestedLimit} distinct CURRENT travel stories with the strongest meaningful traveler impact.

CRITICAL FRESHNESS RULE:
The publication date of an article is not necessarily the date of the event.
Reject retrospective coverage of old disruptions unless there is a genuinely new development that matters to travelers now.
Prefer events happening now, announced now, beginning soon, or materially affecting upcoming travel.
If a story discusses the cause, investigation, anniversary, report, or retrospective analysis of an old disruption, do not describe the original disruption as if it is happening now.

Prefer:
- airline and route changes
- airport disruptions
- rail and bus changes
- visas and borders
- strikes and major disruptions
- hotels and resorts
- cruises
- attractions and destination access
- material travel safety

Group duplicate coverage of the same event.

Reject:
- celebrity travel
- generic lifestyle listicles
- old news presented as current
- rumors
- weakly sourced claims
- irrelevant stories

Use ONLY article IDs supplied by the user.

Return valid JSON exactly in this structure:

{
  "stories": [
    {
      "headline": "string",
      "score": 0.0,
      "reason": "string",
      "article_ids": [1],
      "vertical": "flights"
    }
  ]
}

vertical must be one of:
flights, stays, ground, visa, activities, cruise, safety, general.

If there are no sufficiently useful stories, return:
{"stories":[]}`;

  const tokenBudgets = [3000, 4500];
  let lastError = null;

  for (let attempt = 0; attempt < tokenBudgets.length; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        max_completion_tokens: tokenBudgets[attempt],
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: JSON.stringify(candidatePayload),
          },
        ],
      });

      const choice = completion.choices?.[0];
      const raw = choice?.message?.content || '';

      console.log(
        `📰 Selector attempt ${attempt + 1}: finish=${choice?.finish_reason || 'unknown'}, chars=${raw.length}, completion_tokens=${completion.usage?.completion_tokens ?? 'unknown'}, reasoning_tokens=${completion.usage?.completion_tokens_details?.reasoning_tokens ?? 'unknown'}`
      );

      if (!raw.trim()) {
        lastError = new Error('Selector returned empty content');
        continue;
      }

      let parsed;

      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        lastError = new Error(`Selector returned invalid JSON: ${err.message}`);
        console.warn(`📰 ${lastError.message}`);
        continue;
      }

      const rows = Array.isArray(parsed?.stories)
        ? parsed.stories
        : [];

      const validVerticals = new Set([
        'flights',
        'stays',
        'ground',
        'visa',
        'activities',
        'cruise',
        'safety',
        'general',
      ]);

      const stories = rows
        .slice(0, requestedLimit)
        .map(story => {
          const articleIds = Array.isArray(story?.article_ids)
            ? [...new Set(story.article_ids.map(Number).filter(Number.isFinite))]
            : [];

          const articles = articleIds
            .map(id => candidates.find(item => Number(item.id) === id))
            .filter(Boolean);

          return {
            headline: normalizeText(story?.headline),
            score: Number(story?.score || 0),
            reason: normalizeText(story?.reason),
            article_ids: articleIds,
            vertical: validVerticals.has(story?.vertical)
              ? story.vertical
              : 'general',
            articles,
          };
        })
        .filter(story =>
          story.headline &&
          story.articles.length > 0
        );

      console.log(
        `📰 Selector accepted ${stories.length}/${rows.length} stories`
      );

      /*
       * A valid empty array is an editorial decision, not an API failure.
       */
      if (Array.isArray(parsed?.stories) && rows.length === 0) {
        return [];
      }

      if (stories.length > 0) {
        return stories;
      }

      lastError = new Error(
        'Selector produced stories but none mapped to valid candidate IDs'
      );

    } catch (err) {
      lastError = err;
      console.warn(
        `📰 Selector attempt ${attempt + 1} failed: ${err.message}`
      );
    }
  }

  console.error(
    `📰 Selector exhausted retries: ${lastError?.message || 'unknown error'}`
  );

  return [];
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
    max_completion_tokens: 3500,
    messages: [
      {
        role: 'system',
        content: `Write an original, concise English travel news article for OptionTrip.com using only the supplied source material. Do not invent numbers, quotes, dates or operational details. If a detail is unclear, omit it or say it has not been confirmed. Explain what changed, why travelers should care, who may be affected, and what travelers should check next. Do not copy source wording.

The confidence field measures confidence in the factual reliability and freshness of the finished article, not writing quality.

Use approximately:
- 0.90-1.00 when current facts are clearly supported by multiple reliable supplied materials
- 0.75-0.89 when the story is current and adequately supported
- 0.65-0.74 when usable but some nonessential details remain uncertain
- below 0.65 when freshness, the core event, or important facts cannot be established from supplied material

A newly published article about an old event is NOT automatically current news. If the supplied material mainly discusses a historical incident, investigation, retrospective, anniversary, or old disruption, make that context explicit and lower confidence if current traveler impact is unclear.

Return only JSON: {"title":"","excerpt":"","content_html":"","seo_title":"","meta_description":"","image_prompt":"","tags":[""],"confidence":0}. content_html should contain 4-8 short paragraphs with useful subheadings when appropriate, but no external links and no source list. image_prompt must describe an original editorial travel image, realistic, clean, no logos except a small readable OptionTrip.com wordmark near the lower center, no copyrighted characters.`
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

  const baseName =
    slugify(title) ||
    `optiontrip-news-${Date.now()}`;

  const makeJpeg = async ({
    width,
    quality
  }) => {
    const inputBytes = image.buffer.length;

    const buffer = await sharp(image.buffer, {
      failOn: 'none'
    })
      .rotate()
      .resize({
        width,
        height: Math.round(width * 9 / 16),
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true
      })
      .flatten({
        background: '#ffffff'
      })
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();

    console.log(
      `🖼️ WordPress image optimized: ` +
      `${Math.round(inputBytes / 1024)}KB -> ` +
      `${Math.round(buffer.length / 1024)}KB ` +
      `(${width}px, q=${quality})`
    );

    return buffer;
  };

  const upload = async (buffer, suffix = '') => {
    const fileName = `${baseName}${suffix}.jpg`;

    console.log(
      `🖼️ Uploading WordPress media: ${fileName}, ` +
      `${Math.round(buffer.length / 1024)}KB`
    );

    const response = await fetch(`${wpBase()}/media`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'image/jpeg',
        'Content-Disposition':
          `attachment; filename="${fileName}"`,
      },
      body: buffer,
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '');

      const err = new Error(
        `WordPress media upload failed: ${response.status}` +
        (responseText
          ? ` ${responseText.slice(0, 300)}`
          : '')
      );

      err.status = response.status;
      throw err;
    }

    const media = await response.json();

    console.log(
      `✅ WordPress media uploaded: id=${media?.id || 'unknown'}`
    );

    return media;
  };

  /*
   * Pass 1:
   * High-quality editorial image, comfortably below the
   * WordPress/PHP 2 MB upload ceiling in normal circumstances.
   */
  let optimized = await makeJpeg({
    width: 1600,
    quality: 82
  });

  /*
   * Do not rely only on JPEG quality. If an unusually complex
   * image is still large, shrink it before touching WordPress.
   */
  if (optimized.length > 1500 * 1024) {
    optimized = await makeJpeg({
      width: 1280,
      quality: 72
    });
  }

  try {
    return await upload(optimized);
  } catch (err) {
    if (err?.status !== 413) {
      throw err;
    }

    console.warn(
      '⚠️ WordPress returned 413. Retrying with emergency compression.'
    );
  }

  /*
   * Pass 2:
   * Emergency version for restrictive proxies/PHP configurations.
   */
  const emergency = await makeJpeg({
    width: 1024,
    quality: 62
  });

  try {
    return await upload(emergency, '-compressed');
  } catch (err) {
    if (err?.status === 413) {
      console.error(
        '❌ WordPress media still rejected with 413 after compression.'
      );
    }

    throw err;
  }
};
const wordpressPostExists = async (slug) => {
  const response = await fetch(`${wpBase()}/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug&per_page=1`);
  if (!response.ok) return false;
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
};


let wpCategoryCache = null;

const getWordPressCategories = async () => {
  if (wpCategoryCache) return wpCategoryCache;

  const response = await fetch(
    `${wpBase()}/categories?per_page=100&hide_empty=false&_fields=id,name,slug`
  );

  if (!response.ok)
    throw new Error(`Could not load WordPress categories: ${response.status}`);

  wpCategoryCache = await response.json();
  return wpCategoryCache;
};

const categorySignals = {
  airlines: [
    'airline', 'airlines', 'flight', 'flights', 'airport', 'airports',
    'aviation', 'airways', 'air carrier'
  ],
  cruise: ['cruise', 'cruises', 'cruise ship'],
  'real-estate': ['real estate'],
  pets: ['pet travel', 'traveling with pets', 'travelling with pets'],
};

const chooseWordPressCategories = async ({ draft, story }) => {
  const categories = await getWordPressCategories();

  const bySlug = new Map(
    categories.map(c => [String(c.slug || '').toLowerCase(), c])
  );

  const selected = new Set();

  for (const required of ['news', 'english']) {
    const c = bySlug.get(required);
    if (c) selected.add(c.id);
  }

  const text = normalizeText([
    draft?.title,
    draft?.excerpt,
    draft?.meta_description,
    story?.headline,
    story?.vertical,
    ...(story?.articles || []).map(a =>
      `${a.title || ''} ${a.sourceCountry || ''} ${a.description || ''}`
    )
  ].join(' ')).toLowerCase();

  if (
    story?.vertical === 'flights' ||
    categorySignals.airlines.some(term => text.includes(term))
  ) {
    const c = bySlug.get('airlines');
    if (c) selected.add(c.id);
  }

  if (
    story?.vertical === 'cruise' ||
    categorySignals.cruise.some(term => text.includes(term))
  ) {
    const c = bySlug.get('cruise');
    if (c) selected.add(c.id);
  }

  for (const c of categories) {
    const slug = String(c.slug || '').toLowerCase();
    const name = normalizeText(c.name || '').toLowerCase();

    if (!slug || !name) continue;
    if (['news', 'english', 'uncategorized', 'airlines'].includes(slug)) continue;
    if (name.length < 4) continue;

    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i');

    if (re.test(text))
      selected.add(c.id);
  }

  const result = [...selected].slice(0, 6);

  console.log(
    `📰 Categories for "${draft?.title || story?.headline}":`,
    categories
      .filter(c => result.includes(c.id))
      .map(c => `${c.name}(${c.id})`)
      .join(', ')
  );

  return result;
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

  const categories = await chooseWordPressCategories({ draft, story });

  const body = {
    title: draft.title,
    slug,
    status: 'publish',
    excerpt: draft.excerpt || draft.meta_description || '',
    content,
    categories,
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

      console.log(
        `📰 Draft result: title="${draft?.title || ''}", confidence=${draft?.confidence ?? 'missing'}, content_chars=${draft?.content_html?.length || 0}, image_prompt=${draft?.image_prompt ? 'yes' : 'no'}`
      );

      const draftConfidence = Number(draft?.confidence || 0);
      const editorScore = Number(story?.score || 0);
      const sourceCount = Array.isArray(story?.articles)
        ? story.articles.length
        : 0;

      if (!draft?.title || draftConfidence < 0.72) {
        published.push({
          skipped: true,
          reason: 'low-draft-confidence',
          headline: story.headline,
          draftConfidence,
          editorScore,
          sourceCount
        });
        continue;
      }

      if (editorScore < 0.70) {
        published.push({
          skipped: true,
          reason: 'low-editor-score',
          headline: story.headline,
          draftConfidence,
          editorScore,
          sourceCount
        });
        continue;
      }

      if (sourceCount < 2 && editorScore < 0.85) {
        published.push({
          skipped: true,
          reason: 'insufficient-source-support',
          headline: story.headline,
          draftConfidence,
          editorScore,
          sourceCount
        });
        continue;
      }
      const image = await generateAiImage(draft.image_prompt);

      let media = null;

      if (image) {
        try {
          media = await uploadWordPressMedia(image, draft.title);
        } catch (mediaError) {
          console.error(
            `Travel news media failed for "${draft.title}":`,
            mediaError.message
          );

          console.warn(
            '⚠️ Continuing article publication without featured image.'
          );
        }
      }

      const post = await publishWordPressPost({
        draft,
        story,
        media
      });
      published.push({ id: post?.id, link: post?.link, slug: post?.slug, skipped: post?.skipped || false });
    } catch (err) {
      console.error(`Travel news publish failed for "${story.headline}":`, err.message);
      published.push({ skipped: true, reason: err.message, headline: story.headline });
    }
  }

  console.log(`📰 Travel news automation finished: ${published.filter(item => !item.skipped).length} published`);
  return { enabled: true, candidates: candidates.length, selected: stories.length, published };
};
