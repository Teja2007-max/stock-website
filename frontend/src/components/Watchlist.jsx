import React, { useState, useEffect, useContext } from 'react';
import { Star, StarOff, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Watchlist = ({ onSelectStock }) => {
  const { user, token } = useContext(AuthContext);
  const [watchlist, setWatchlist] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/watchlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWatchlist(data);
      // Fetch live prices for each symbol
      data.forEach(item => fetchPrice(item.symbol));
    } catch { }
  };

  const fetchPrice = async (symbol) => {
    try {
      const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}?polling=true`);
      const data = await res.json();
      if (data.quote) {
        setPrices(prev => ({ ...prev, [symbol]: data.quote }));
      }
    } catch { }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      await fetch(`/api/user/watchlist/${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    } catch { }
  };

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [token]);

  if (!user || watchlist.length === 0) return null;

  return (
    <div className="card glass-panel" style={{ marginBottom: 24 }}>
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Star size={16} fill="#f59e0b" color="#f59e0b" />
        My Watchlist
      </h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {watchlist.map(item => {
          const q = prices[item.symbol];
          const pos = (q?.regularMarketChangePercent || 0) >= 0;
          return (
            <div
              key={item.symbol}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'rgba(0,0,0,0.03)',
                borderRadius: 8,
                border: '1px solid var(--panel-border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => onSelectStock(item.symbol)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--panel-border)'}
            >
              <div>
                <strong style={{ fontSize: '0.85rem' }}>{item.symbol}</strong>
                {q && (
                  <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                    {q.shortName || q.longName || ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {q ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      ₹{q.regularMarketPrice?.toFixed(2)}
                    </div>
                    <div className={`text-sm ${pos ? 'text-green' : 'text-red'}`}>
                      {pos ? '+' : ''}{q.regularMarketChangePercent?.toFixed(2)}%
                      {pos ? <TrendingUp size={12} style={{ marginLeft: 4 }} /> : <TrendingDown size={12} style={{ marginLeft: 4 }} />}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted text-sm">Loading...</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.symbol); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: 4 }}
                  title="Remove from watchlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Add to watchlist button component (used in stock analysis header)
export const AddToWatchlistBtn = ({ symbol }) => {
  const { token } = useContext(AuthContext);
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !symbol) return;
    fetch('/api/user/watchlist', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setInList(data.some(w => w.symbol === symbol.toUpperCase()));
      })
      .catch(() => { });
  }, [token, symbol]);

  const toggle = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (inList) {
        await fetch(`/api/user/watchlist/${encodeURIComponent(symbol)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setInList(false);
      } else {
        await fetch('/api/user/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ symbol }),
        });
        setInList(true);
      }
    } catch { }
    setLoading(false);
  };

  if (!token) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        background: inList ? 'rgba(245,158,11,0.12)' : 'transparent',
        border: `1px solid ${inList ? '#f59e0b' : 'var(--panel-border)'}`,
        borderRadius: 8,
        padding: '6px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: inList ? '#f59e0b' : 'var(--text-secondary)',
        fontSize: '0.8rem',
        fontWeight: 500,
        transition: 'all 0.2s',
      }}
      title={inList ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {inList ? <Star size={14} fill="#f59e0b" /> : <StarOff size={14} />}
      {inList ? 'Watching' : 'Watch'}
    </button>
  );
};
export default Watchlist;
