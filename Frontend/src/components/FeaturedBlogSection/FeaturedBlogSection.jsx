import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, getFeaturedImage, formatDate, stripHtml, fetchImageOverrides } from '../../services/wordpressApi';
import './FeaturedBlogSection.css';

const FALLBACK = '/images/trending/trending10.jpg';
const REFRESH_INTERVAL = 5 * 60 * 1000;

const HeroSkeleton = () => (
  <div className="fbs-hero fbs-hero--skeleton">
    <div className="fbs-skeleton-block" style={{ height: '100%', minHeight: 360 }} />
  </div>
);

const SideCardSkeleton = () => (
  <div className="fbs-side-card fbs-side-card--skeleton">
    <div className="fbs-skeleton-block fbs-skeleton-img" />
    <div className="fbs-side-card__body">
      <div className="fbs-skeleton-line" style={{ width: '30%', height: 11 }} />
      <div className="fbs-skeleton-line" style={{ width: '90%', height: 16, marginTop: 8 }} />
      <div className="fbs-skeleton-line" style={{ width: '65%', height: 16, marginTop: 4 }} />
      <div className="fbs-skeleton-line" style={{ width: '40%', height: 11, marginTop: 8 }} />
    </div>
  </div>
);

const EmptyBlogFallback = () => (
  <div className="fbs-empty">
    <div className="fbs-empty__icon" aria-hidden="true"><i className="fa fa-compass" /></div>
    <div className="fbs-empty__copy">
      <span>Travel inspiration is refreshing</span>
      <strong>Keep planning instead of waiting for the feed.</strong>
      <p>Explore destination ideas or tell Vi what kind of trip you want. The rest of OptionTrip stays fully usable even when the news feed is unavailable.</p>
    </div>
    <div className="fbs-empty__actions">
      <Link to="/trip-ideas" className="nir-btn">Explore Trip Ideas</Link>
      <Link to="/travel-buddy" className="fbs-empty__secondary">Ask Vi</Link>
    </div>
  </div>
);

const FeaturedBlogSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState({});

  useEffect(() => { fetchImageOverrides().then(setOverrides); }, []);

  const loadPosts = (bg = false) => {
    if (!bg) setLoading(true);
    fetchPosts(5)
      .then((res) => setPosts(res.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts(false);
    const interval = setInterval(() => loadPosts(true), REFRESH_INTERVAL);
    const onVisible = () => { if (document.visibilityState === 'visible') loadPosts(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const [hero, ...sidePosts] = posts;

  const heroImage   = hero ? (overrides[hero.id] || getFeaturedImage(hero, 'large') || FALLBACK) : FALLBACK;
  const heroTitle   = hero?.title?.rendered || '';
  const heroExcerpt = hero ? stripHtml(hero?.excerpt?.rendered || '', 160) : '';
  const heroSlug    = hero?.slug || '';
  const heroDate    = formatDate(hero?.date);
  const heroCategory = hero?._embedded?.['wp:term']?.[0]?.[0]?.name || 'Travel';

  return (
    <section
      className="fbs-section"
      style={{ backgroundImage: 'url(/images/shape2.png)' }}
    >
      <div className="container">
        <div className="section-title mb-5 w-75 mx-auto text-center">
          <h4 className="mb-1 theme1">Fresh from the Blog</h4>
          <h2 className="mb-1">
            Latest <span className="theme">Travel Stories</span>
          </h2>
          <p>Handpicked articles, guides, and inspiration for your next adventure.</p>
        </div>

        <div className="fbs-grid">
          {loading ? (
            <HeroSkeleton />
          ) : hero ? (
            <Link to={`/blog/${heroSlug}`} className="fbs-hero">
              <img
                src={heroImage}
                alt={heroTitle}
                className="fbs-hero__img"
                loading="lazy"
                onError={(e) => { e.currentTarget.src = FALLBACK; }}
              />
              <div className="fbs-hero__overlay">
                <span className="fbs-badge">{heroCategory}</span>
                <h3
                  className="fbs-hero__title"
                  dangerouslySetInnerHTML={{ __html: heroTitle }}
                />
                <p className="fbs-hero__excerpt">{heroExcerpt}</p>
                <span className="fbs-hero__date">{heroDate}</span>
              </div>
            </Link>
          ) : (
            <EmptyBlogFallback />
          )}

          {loading ? (
            <div className="fbs-side-grid">
              {[0, 1, 2, 3].map((i) => <SideCardSkeleton key={i} />)}
            </div>
          ) : hero ? (
            <div className="fbs-side-grid">
              {sidePosts.map((post) => {
                const img      = overrides[post.id] || getFeaturedImage(post, 'medium') || FALLBACK;
                const title    = post?.title?.rendered || '';
                const slug     = post?.slug || '';
                const date     = formatDate(post?.date);
                const category = post?._embedded?.['wp:term']?.[0]?.[0]?.name || 'Travel';
                const excerpt  = stripHtml(post?.excerpt?.rendered || '', 80);

                return (
                  <Link key={post.id} to={`/blog/${slug}`} className="fbs-side-card">
                    <div className="fbs-side-card__img-wrap">
                      <img
                        src={img}
                        alt={title}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = FALLBACK; }}
                      />
                    </div>
                    <div className="fbs-side-card__body">
                      <span className="fbs-badge fbs-badge--sm">{category}</span>
                      <h4
                        className="fbs-side-card__title"
                        dangerouslySetInnerHTML={{ __html: title }}
                      />
                      <p className="fbs-side-card__excerpt">{excerpt}</p>
                      <span className="fbs-side-card__date">{date}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="text-center mt-5">
          <Link to="/blog" className="nir-btn">View All Articles</Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBlogSection;
