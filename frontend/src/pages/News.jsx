import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Newspaper, TrendingUp, Globe2, Building2, Landmark,
  Clock, RefreshCw, ChevronRight,
  Flame, Zap, DollarSign, Bitcoin, BarChart3, Ship,
} from 'lucide-react';

const API = '/api';

const CATEGORY_CONFIG = {
  markets:       { icon: TrendingUp,  color: '#22c55e', label: 'Global Markets' },
  business:      { icon: Building2,   color: '#3b82f6', label: 'Business' },
  international: { icon: Globe2,      color: '#a78bfa', label: 'World News' },
  economy:       { icon: Landmark,    color: '#f59e0b', label: 'Economy' },
  wallstreet:    { icon: DollarSign,  color: '#10b981', label: 'Wall Street' },
  europe:        { icon: Ship,        color: '#6366f1', label: 'Europe' },
  asia:          { icon: BarChart3,   color: '#ef4444', label: 'Asia-Pacific' },
  commodities:   { icon: Flame,       color: '#f97316', label: 'Commodities' },
  crypto:        { icon: Bitcoin,     color: '#eab308', label: 'Crypto' },
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// --- Featured Card ---
const FeaturedCard = ({ article }) => {
  if (!article) return null;
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="news-featured-card"
      style={{
        display: 'block',
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        textDecoration: 'none',
        color: 'inherit',
        minHeight: 240,
        transition: 'transform 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {article.image && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${article.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.18,
        }} />
      )}
      <div style={{
        position: 'relative', padding: '28px 24px', display: 'flex',
        flexDirection: 'column', justifyContent: 'flex-end', height: '100%', minHeight: 240,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Flame size={14} color="#ef4444" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Top Story
          </span>
        </div>
        <h2 style={{
          fontSize: '1.45rem', fontWeight: 800, fontFamily: 'Outfit', lineHeight: 1.3,
          color: 'var(--text-primary)', marginBottom: 10,
        }}>
          {article.title}
        </h2>
        {article.snippet && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14, maxWidth: 600 }}>
            {article.snippet.slice(0, 150)}…
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
            {article.source}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> {timeAgo(article.pubDate)}
          </span>
        </div>
      </div>
    </a>
  );
};

// --- News Card --- (unchanged below)
const NewsCard = ({ article, compact = false }) => (
  <a
    href={article.link}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: 'flex',
      flexDirection: compact ? 'row' : 'column',
      gap: compact ? 14 : 0,
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border)',
      borderRadius: 12,
      overflow: 'hidden',
      textDecoration: 'none',
      color: 'inherit',
      transition: 'all 0.25s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#3b82f6';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '';
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = '';
    }}
  >
    {!compact && article.image && (
      <div style={{
        width: '100%', height: 160,
        backgroundImage: `url(${article.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderBottom: '1px solid var(--panel-border)',
      }} />
    )}
    {compact && article.image && (
      <div style={{
        width: 90, minHeight: 70, flexShrink: 0,
        backgroundImage: `url(${article.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderRadius: '12px 0 0 12px',
      }} />
    )}
    <div style={{ padding: compact ? '10px 14px 10px 0' : '16px 18px', flex: 1 }}>
      <h4 style={{
        fontSize: compact ? '0.84rem' : '0.95rem',
        fontWeight: 700, fontFamily: 'Outfit',
        color: 'var(--text-primary)', lineHeight: 1.4,
        marginBottom: compact ? 6 : 10,
        display: '-webkit-box', WebkitLineClamp: compact ? 2 : 3,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {article.title}
      </h4>
      {!compact && article.snippet && (
        <p style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
          marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.snippet}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>
          {article.source}
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={10} /> {timeAgo(article.pubDate)}
        </span>
      </div>
    </div>
  </a>
);

// --- Live Ticker Strip ---
const NewsTicker = ({ articles }) => {
  if (!articles || articles.length === 0) return null;
  return (
    <div style={{
      overflow: 'hidden', padding: '10px 0', borderBottom: '1px solid var(--panel-border)',
      marginBottom: 24, position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={14} color="#f59e0b" />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 12, flexShrink: 0 }}>
          Headlines
        </span>
        <div style={{
          display: 'flex', gap: 24, overflow: 'hidden', flex: 1,
          animation: 'tickerScroll 45s linear infinite',
        }}>
          {articles.slice(0, 10).map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
              style={{
                whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-primary)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
                flexShrink: 0,
              }}>
              <ChevronRight size={12} color="#3b82f6" />
              {a.title?.slice(0, 80)}{a.title?.length > 80 ? '…' : ''}
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.68rem' }}>({a.source})</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main News Page ---
const News = () => {
  const [category, setCategory] = useState('markets');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchNews = useCallback(async (cat) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API}/news?category=${cat}`);
      setArticles(data.articles || []);
      setLastUpdated(data.lastUpdated);
    } catch (e) {
      setError('Failed to load news. Please try again.');
      console.error('News error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(category); }, [category, fetchNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchNews(category), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [category, fetchNews]);

  const featured = articles[0];
  const mainGrid = articles.slice(1, 7);
  const sidebar = articles.slice(7, 17);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Outfit', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <Newspaper size={26} color="#3b82f6" />
            News &amp; Analysis
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Business, markets, and international headlines — updated every 5 minutes
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Updated {timeAgo(lastUpdated)}
            </span>
          )}
          <button
            onClick={() => fetchNews(category)}
            disabled={loading}
            className="btn"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 24,
        borderBottom: '2px solid var(--panel-border)',
        overflowX: 'auto',
      }}>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const active = category === key;
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: `3px solid ${active ? cfg.color : 'transparent'}`,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: active ? 700 : 500,
                fontFamily: 'Outfit',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                marginBottom: -2,
              }}
            >
              <Icon size={16} color={active ? cfg.color : undefined} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{
          borderColor: '#ef4444', padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: '0.88rem',
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p className="text-muted">Loading {CATEGORY_CONFIG[category]?.label || ''} news…</p>
        </div>
      )}

      {/* Content */}
      {!loading && articles.length > 0 && (
        <>
          {/* Ticker */}
          <NewsTicker articles={articles} />

          {/* Featured + Main Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: sidebar.length > 0 ? '1fr 340px' : '1fr',
            gap: 24,
          }}>
            {/* Left Column */}
            <div>
              {/* Featured Card */}
              <FeaturedCard article={featured} />

              {/* Main Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
                marginTop: 24,
              }}>
                {mainGrid.map((a, i) => (
                  <NewsCard key={i} article={a} />
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            {sidebar.length > 0 && (
              <div className="card glass-panel" style={{
                padding: '18px 16px',
                height: 'fit-content',
                position: 'sticky', top: 80,
              }}>
                <h3 style={{
                  fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Outfit',
                  color: 'var(--text-primary)', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                  paddingBottom: 12, borderBottom: '1px solid var(--panel-border)',
                }}>
                  <Zap size={14} color="#f59e0b" /> More Headlines
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sidebar.map((a, i) => (
                    <a
                      key={i}
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: 'none', color: 'inherit',
                        paddingBottom: 12,
                        borderBottom: i < sidebar.length - 1 ? '1px solid var(--panel-border)' : 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.paddingLeft = '6px'}
                      onMouseLeave={e => e.currentTarget.style.paddingLeft = '0'}
                    >
                      <h5 style={{
                        fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)',
                        lineHeight: 1.45, marginBottom: 4,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {a.title}
                      </h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 600 }}>{a.source}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{timeAgo(a.pubDate)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Remaining articles */}
          {articles.length > 17 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{
                fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Outfit',
                color: 'var(--text-primary)', marginBottom: 16,
                paddingBottom: 10, borderBottom: '1px solid var(--panel-border)',
              }}>
                All {CATEGORY_CONFIG[category]?.label} News
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {articles.slice(17).map((a, i) => (
                  <NewsCard key={i} article={a} compact />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && articles.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <Newspaper size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
          <p>No articles found for this category.</p>
        </div>
      )}
    </div>
  );
};

export default News;
