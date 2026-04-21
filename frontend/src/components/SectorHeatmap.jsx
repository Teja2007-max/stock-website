import React, { useState, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import ChartLoader from './ChartLoader';

const SectorHeatmap = ({ country }) => {
  const [sectors, setSectors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/sectors?country=${encodeURIComponent(country)}`)
      .then(r => r.json())
      .then(data => { setSectors(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [country]);

  if (loading) return <ChartLoader size={100} label="Loading sector data..." />;
  if (!sectors) return null;

  const entries = Object.entries(sectors).sort((a, b) => b[1].avgChange - a[1].avgChange);
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v.avgChange)), 1);

  const getColor = (change) => {
    const intensity = Math.min(1, Math.abs(change) / maxAbs);
    if (change >= 0) return `rgba(34,197,94,${0.15 + intensity * 0.6})`;
    return `rgba(239,68,68,${0.15 + intensity * 0.6})`;
  };

  const getTextColor = (change) => change >= 0 ? '#16a34a' : '#dc2626';

  return (
    <div className="card glass-panel" style={{ marginTop: 24 }}>
      <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart2 size={16} />
        Sector Heatmap
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 10,
      }}>
        {entries.map(([sector, data]) => (
          <div
            key={sector}
            style={{
              background: getColor(data.avgChange),
              borderRadius: 10,
              padding: '14px 12px',
              border: '1px solid rgba(0,0,0,0.06)',
              transition: 'transform 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 4, color: '#1e293b' }}>
              {sector}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'Outfit', color: getTextColor(data.avgChange) }}>
              {data.avgChange >= 0 ? '+' : ''}{data.avgChange.toFixed(2)}%
            </div>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {data.stocks.map(s => (
                <span key={s.symbol} style={{
                  fontSize: '0.65rem',
                  padding: '2px 5px',
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: 4,
                  color: s.change >= 0 ? '#16a34a' : '#dc2626',
                  fontWeight: 500,
                }}>
                  {s.symbol.replace('.NS', '')} {s.change >= 0 ? '+' : ''}{s.change.toFixed(1)}%
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectorHeatmap;
