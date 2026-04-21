import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown } from 'lucide-react';
const API = '/api';
// Regional index groups — country-specific indices listed first
const REGIONAL_INDICES = {
  India: [
    { symbol: '^BSESN', label: 'SENSEX', flag: '🇮🇳' },
    { symbol: '^NSEI', label: 'NIFTY 50', flag: '🇮🇳' },
  ],
  'United States': [
    { symbol: '^GSPC', label: 'S&P 500', flag: '🇺🇸' },
    { symbol: '^DJI', label: 'DOW JONES', flag: '🇺🇸' },
    { symbol: '^IXIC', label: 'NASDAQ', flag: '🇺🇸' },
  ],
  'United Kingdom': [
    { symbol: '^FTSE', label: 'FTSE 100', flag: '🇬🇧' },
  ],
  Germany: [
    { symbol: '^GDAXI', label: 'DAX', flag: '🇩🇪' },
  ],
  Japan: [
    { symbol: '^N225', label: 'NIKKEI 225', flag: '🇯🇵' },
  ],
  'Hong Kong': [
    { symbol: '^HSI', label: 'HANG SENG', flag: '🇭🇰' },
  ],
};
// Always-shown global indices
const GLOBAL_INDICES = [
  { symbol: '^BSESN', label: 'SENSEX', flag: '🇮🇳' },
  { symbol: '^NSEI', label: 'NIFTY 50', flag: '🇮🇳' },
  { symbol: '^GSPC', label: 'S&P 500', flag: '🇺🇸' },
  { symbol: '^DJI', label: 'DOW JONES', flag: '🇺🇸' },
  { symbol: '^IXIC', label: 'NASDAQ', flag: '🇺🇸' },
  { symbol: '^FTSE', label: 'FTSE 100', flag: '🇬🇧' },
  { symbol: '^GDAXI', label: 'DAX', flag: '🇩🇪' },
  { symbol: '^N225', label: 'NIKKEI 225', flag: '🇯🇵' },
  { symbol: '^HSI', label: 'HANG SENG', flag: '🇭🇰' },
  { symbol: 'GC=F', label: 'GOLD', flag: '🥇' },
  { symbol: 'CL=F', label: 'CRUDE OIL', flag: '🛢️' },
  { symbol: 'BTC-USD', label: 'BITCOIN', flag: '₿' },
];

const fmt = (n) => {
  if (n == null || !Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 10000) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const MarketTicker = () => {
  const [quotes, setQuotes] = useState({});
  const [flash, setFlash] = useState({});
  const [country, setCountry] = useState('');
  const [orderedIndices, setOrderedIndices] = useState(GLOBAL_INDICES);
  const prevQuotesRef = useRef({});
  const flashTimerRef = useRef(null);
  // Detect country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const { data } = await axios.get('https://ipapi.co/json/', { timeout: 4000 });
        if (data?.country_name) {
          setCountry(data.country_name);
        }
      } catch {
        // fallback: show all global indices
      }
    };
    detectCountry();
  }, []);
  // Re-order indices: put user's country first
  useEffect(() => {
    if (!country) return;
    const local = REGIONAL_INDICES[country] || [];
    if (local.length === 0) return;

    // Local symbols first, then remaining global ones (deduped)
    const localSymbols = new Set(local.map(i => i.symbol));
    const rest = GLOBAL_INDICES.filter(i => !localSymbols.has(i.symbol));
    setOrderedIndices([...local, ...rest]);
  }, [country]);
  // Fetch indices data
  const fetchIndices = useCallback(async () => {
    try {
      const symbols = orderedIndices.map(i => i.symbol).join(',');
      const { data } = await axios.get(`${API}/stocks/indices?symbols=${encodeURIComponent(symbols)}`);

      if (data && typeof data === 'object') {
        // Detect price changes for flash animation
        const newFlash = {};
        Object.entries(data).forEach(([sym, q]) => {
          const prev = prevQuotesRef.current[sym];
          if (prev && prev.price !== q.price) {
            newFlash[sym] = q.price > prev.price ? 'up' : 'down';
          }
        });

        prevQuotesRef.current = data;
        setQuotes(data);
        if (Object.keys(newFlash).length > 0) {
          setFlash(newFlash);
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => setFlash({}), 900);
        }
      }
    } catch {
      // silently retry next interval
    }
  }, [orderedIndices]);
  // Poll every 5 seconds for near-real-time updates
  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 5000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  if (Object.keys(quotes).length === 0) return null;

  // Duplicate for seamless infinite scroll
  const items = [...orderedIndices, ...orderedIndices];

  return (
    <div style={{
      background: 'var(--panel-bg)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--panel-border)',
      overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex',
          animation: 'marketTickerScroll 50s linear infinite',
          width: 'max-content',
        }}
        onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
        onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
      >
        {items.map((idx, i) => {
          const q = quotes[idx.symbol];
          if (!q) return null;
          const up = (q.changePercent || 0) >= 0;
          const flashDir = flash[idx.symbol];

          return (
            <div
              key={`${idx.symbol}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 18px',
                borderRight: '1px solid var(--panel-border)',
                whiteSpace: 'nowrap',
                cursor: 'default',
                transition: 'background 0.4s ease',
                background: flashDir === 'up'
                  ? 'rgba(34,197,94,0.15)'
                  : flashDir === 'down'
                    ? 'rgba(239,68,68,0.15)'
                    : 'transparent',
              }}
            >
              <span style={{ fontSize: '0.72rem' }}>{idx.flag}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--text-secondary)',
                fontFamily: 'Outfit',
                letterSpacing: '0.03em',
              }}>
                {idx.label}
              </span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'Outfit',
                transition: 'color 0.3s',
              }}>
                {fmt(q.price)}
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: up ? '#22c55e' : '#ef4444',
                display: 'flex', alignItems: 'center', gap: 2,
                minWidth: 65,
              }}>
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {up ? '+' : ''}{q.changePercent?.toFixed(2)}%
              </span>
              {/* Mini change indicator dot */}
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: up ? '#22c55e' : '#ef4444',
                opacity: flashDir ? 1 : 0.4,
                transition: 'opacity 0.3s',
                boxShadow: flashDir ? `0 0 6px ${up ? '#22c55e' : '#ef4444'}` : 'none',
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default MarketTicker;