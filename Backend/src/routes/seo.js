import express from 'express';

const router = express.Router();

const BASE_URL = process.env.SITE_URL || 'https://optiontrip.com';

const STATIC_ROUTES = [
  { path: '/',                changefreq: 'daily',   priority: '1.0' },
  { path: '/travel-buddy',    changefreq: 'weekly',  priority: '1.0' },
  { path: '/services',        changefreq: 'weekly',  priority: '0.9' },
  { path: '/flights',         changefreq: 'daily',   priority: '0.9' },
  { path: '/hotels',          changefreq: 'daily',   priority: '0.9' },
  { path: '/car-rental',      changefreq: 'weekly',  priority: '0.8' },
  { path: '/tours',           changefreq: 'weekly',  priority: '0.8' },
  { path: '/esim',            changefreq: 'weekly',  priority: '0.8' },
  { path: '/destinations',    changefreq: 'weekly',  priority: '0.9' },
  { path: '/where-can-i-go',  changefreq: 'weekly',  priority: '0.9' },
  { path: '/plan-my-day',     changefreq: 'weekly',  priority: '0.9' },
  { path: '/trip-ideas',      changefreq: 'weekly',  priority: '0.8' },
  { path: '/popular-routes',  changefreq: 'weekly',  priority: '0.8' },
  { path: '/travel-your-way', changefreq: 'monthly', priority: '0.7' },
  { path: '/travel-map',      changefreq: 'weekly',  priority: '0.7' },
  { path: '/travel-tips',     changefreq: 'weekly',  priority: '0.7' },
  { path: '/blog',            changefreq: 'daily',   priority: '0.8' },
  { path: '/how-it-works',    changefreq: 'monthly', priority: '0.7' },
  { path: '/help-center',     changefreq: 'monthly', priority: '0.6' },
  { path: '/about',           changefreq: 'monthly', priority: '0.5' },
  { path: '/contact',         changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy-policy',  changefreq: 'yearly',  priority: '0.3' },
  { path: '/terms',           changefreq: 'yearly',  priority: '0.3' },
];

const WP_API = process.env.WORDPRESS_API_URL || 'https://blog.optiontrip.com/wp-json/wp/v2';

const fetchBlogSlugs = async () => {
  try {
    const res = await fetch(`${WP_API}/posts?per_page=100&status=publish&_fields=slug,modified`, {
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const posts = await res.json();
    return Array.isArray(posts)
      ? posts.map(p => ({ slug: p.slug, modified: p.modified }))
      : [];
  } catch {
    return [];
  }
};

const toUrl = ({ loc, lastmod, changefreq, priority }) =>
  `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

router.get('/', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const staticEntries = STATIC_ROUTES.map(r =>
    toUrl({ loc: `${BASE_URL}${r.path}`, lastmod: today, changefreq: r.changefreq, priority: r.priority })
  );

  const blogSlugs = await fetchBlogSlugs();
  const blogEntries = blogSlugs.map(({ slug, modified }) =>
    toUrl({
      loc: `${BASE_URL}/blog/${slug}`,
      lastmod: modified ? modified.split('T')[0] : today,
      changefreq: 'monthly',
      priority: '0.7'
    })
  );

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...blogEntries,
    '</urlset>'
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

export default router;
