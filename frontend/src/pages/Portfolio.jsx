import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown, PieChart, X } from 'lucide-react';

const PortfolioPage = () => {
  const [holdings, setHoldings] = useState([]);
  const [prices, setPrices] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ symbol: '', buyPrice: '', quantity: '', notes: '' });
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return { Authorization: `Bearer ${userInfo?.token}`, 'Content-Type': 'application/json' };
  };

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/user/portfolio', { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHoldings(data);
        data.forEach(h => fetchLivePrice(h.symbol));
      } else {
        setHoldings([]);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchLivePrice = async (symbol) => {
    try {
      const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}?polling=true`);
      const data = await res.json();
      if (data.quote) setPrices(prev => ({ ...prev, [symbol]: data.quote.regularMarketPrice }));
    } catch {}
  };

  const addHolding = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/user/portfolio', { method: 'POST', headers: getHeaders(), body: JSON.stringify(form) });
      setForm({ symbol: '', buyPrice: '', quantity: '', notes: '' });
      setShowAdd(false);
      fetchPortfolio();
    } catch {}
  };

  const removeHolding = async (id) => {
    await fetch(`/api/user/portfolio/${id}`, { method: 'DELETE', headers: getHeaders() });
    setHoldings(prev => prev.filter(h => h._id !== id));
  };

  useEffect(() => { fetchPortfolio(); }, []);

  // Calculate totals
  let totalInvested = 0, totalCurrent = 0;
  holdings.forEach(h => {
    totalInvested += h.buyPrice * h.quantity;
    totalCurrent += (prices[h.symbol] || h.buyPrice) * h.quantity;
  });
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Outfit', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <Briefcase size={26} color="#3b82f6" />
            Portfolio Tracker
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Track your investments and monitor P&L in real-time
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: '0.85rem',
          fontFamily: 'Outfit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
        }}>
          <Plus size={16} /> Add Holding
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Invested', value: `₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#3b82f6' },
          { label: 'Current Value', value: `₹${totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#a78bfa' },
          { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: totalPnL >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Returns', value: `${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%`, color: totalPnLPct >= 0 ? '#22c55e' : '#ef4444' },
        ].map(c => (
          <div key={c.label} className="card glass-panel" style={{ padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit', color: c.color, marginTop: 6 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(false)}>
          <div className="card glass-panel" style={{ padding: 28, maxWidth: 420, width: '90%', borderRadius: 16 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>Add Holding</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>
            <form onSubmit={addHolding}>
              {[
                { label: 'Symbol', key: 'symbol', type: 'text', placeholder: 'e.g. RELIANCE.NS' },
                { label: 'Buy Price (₹)', key: 'buyPrice', type: 'number', placeholder: '1200.00' },
                { label: 'Quantity', key: 'quantity', type: 'number', placeholder: '10' },
                { label: 'Notes (optional)', key: 'notes', type: 'text', placeholder: 'Long term hold' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{f.label}</label>
                  <input type={f.type} className="input-field" placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.key !== 'notes'}
                    style={{ marginTop: 4, width: '100%' }} />
                </div>
              ))}
              <button type="submit" style={{
                width: '100%', padding: 12, background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                fontFamily: 'Outfit', cursor: 'pointer', marginTop: 6,
              }}>Add to Portfolio</button>
            </form>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p className="text-muted">Loading portfolio...</p>
        </div>
      ) : holdings.length === 0 ? (
        <div className="card glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <PieChart size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No holdings yet. Click "Add Holding" to start tracking.</p>
        </div>
      ) : (
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--panel-border)' }}>
                  {['Stock', 'Qty', 'Buy Price', 'Current', 'P&L', '% Return', ''].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.03)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const curPrice = prices[h.symbol] || h.buyPrice;
                  const pnl = (curPrice - h.buyPrice) * h.quantity;
                  const pnlPct = ((curPrice - h.buyPrice) / h.buyPrice) * 100;
                  const pos = pnl >= 0;
                  return (
                    <tr key={h._id} style={{ borderBottom: '1px solid var(--panel-border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontFamily: 'Outfit', fontSize: '0.9rem' }}>{h.symbol}</div>
                        {h.notes && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{h.notes}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{h.quantity}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'Outfit', fontWeight: 600 }}>₹{h.buyPrice.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'Outfit', fontWeight: 600 }}>₹{curPrice.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: pos ? '#22c55e' : '#ef4444', fontWeight: 700, fontFamily: 'Outfit' }}>
                          {pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {pos ? '+' : ''}₹{pnl.toFixed(0)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontWeight: 700, fontSize: '0.78rem',
                          background: pos ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: pos ? '#22c55e' : '#ef4444',
                        }}>
                          {pos ? '+' : ''}{pnlPct.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button onClick={() => removeHolding(h._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
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

export default PortfolioPage;
