import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, TrendingUp, TrendingDown, Search, ArrowUpDown } from 'lucide-react';

const ScreenerPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('marketCap');
  const [sortDir, setSortDir] = useState('desc');
  const [filters, setFilters] = useState({ minPE: '', maxPE: '', minCap: '', search: '' });

  useEffect(() => {
    setLoading(true);
    fetch('/api/stocks/screener?country=India')
      .then(r => r.json())
      .then(data => { 
        if (Array.isArray(data)) {
          setStocks(data); 
        } else {
          setStocks([]);
        }
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = stocks
    .filter(s => {
      if (filters.search && !s.symbol.toLowerCase().includes(filters.search.toLowerCase()) && !s.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.minPE && s.pe && s.pe < parseFloat(filters.minPE)) return false;
      if (filters.maxPE && s.pe && s.pe > parseFloat(filters.maxPE)) return false;
      if (filters.minCap && s.marketCap < parseFloat(filters.minCap) * 1e7) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] || 0, bv = b[sortKey] || 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

  const formatCap = (cap) => {
    if (!cap) return '—';
    if (cap >= 1e12) return `₹${(cap / 1e12).toFixed(1)}T`;
    if (cap >= 1e7) return `₹${(cap / 1e7).toFixed(0)} Cr`;
    return `₹${cap.toLocaleString()}`;
  };

  const renderSortHeader = (label, field) => (
    <th onClick={() => toggleSort(field)} style={{
      ...thStyle, cursor: 'pointer', userSelect: 'none',
      color: sortKey === field ? '#3b82f6' : 'var(--text-secondary)',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <ArrowUpDown size={11} style={{ opacity: sortKey === field ? 1 : 0.3 }} />
      </span>
    </th>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'Outfit', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
          <SlidersHorizontal size={26} color="#3b82f6" />
          Stock Screener
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Filter and discover stocks by fundamentals — Top 30 Indian stocks
        </p>
      </div>

      {/* Filters */}
      <div className="card glass-panel" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input type="text" placeholder="Search by name or symbol..." value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{ width: '100%', padding: '8px 12px 8px 34px', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--panel-border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PE:</span>
          <input type="number" placeholder="Min" value={filters.minPE} onChange={e => setFilters({ ...filters, minPE: e.target.value })}
            style={{ width: 60, padding: '6px 8px', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>to</span>
          <input type="number" placeholder="Max" value={filters.maxPE} onChange={e => setFilters({ ...filters, maxPE: e.target.value })}
            style={{ width: 60, padding: '6px 8px', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Min MCap (Cr):</span>
          <input type="number" placeholder="e.g. 50000" value={filters.minCap} onChange={e => setFilters({ ...filters, minCap: e.target.value })}
            style={{ width: 90, padding: '6px 8px', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--panel-border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.78rem', outline: 'none' }} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{filtered.length} stocks</span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p className="text-muted">Loading 30 stocks...</p>
        </div>
      ) : (
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--panel-border)' }}>
                  <th style={thStyle}>Stock</th>
                  {renderSortHeader('Price', 'price')}
                  {renderSortHeader('Change %', 'change')}
                  {renderSortHeader('P/E', 'pe')}
                  {renderSortHeader('Market Cap', 'marketCap')}
                  {renderSortHeader('Div Yield', 'divYield')}
                  {renderSortHeader('EPS', 'eps')}
                  {renderSortHeader('Volume', 'volume')}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const pos = s.change >= 0;
                  return (
                    <tr key={s.symbol} style={{ borderBottom: '1px solid var(--panel-border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, fontFamily: 'Outfit', fontSize: '0.88rem' }}>{s.symbol.replace('.NS', '')}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>{s.name}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Outfit', fontWeight: 600 }}>₹{s.price?.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontSize: '0.78rem',
                          background: pos ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: pos ? '#22c55e' : '#ef4444',
                        }}>
                          {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {pos ? '+' : ''}{s.change?.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Outfit', fontWeight: 500 }}>{s.pe ? s.pe.toFixed(1) : '—'}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Outfit', fontWeight: 500 }}>{formatCap(s.marketCap)}</td>
                      <td style={{ padding: '12px 16px', color: s.divYield ? '#22c55e' : 'var(--text-secondary)', fontWeight: 500 }}>
                        {s.divYield ? `${s.divYield.toFixed(2)}%` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'Outfit', fontWeight: 500 }}>{s.eps ? `₹${s.eps.toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.82rem' }}>{s.volume?.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-secondary)',
  background: 'rgba(0,0,0,0.03)',
};

export default ScreenerPage;
