import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Clock, Search, TrendingUp, TrendingDown, BarChart2, Filter } from 'lucide-react';

const getCurrencySymbol = (symbol) => {
  if (!symbol) return '$';
  if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) return '₹';
  if (symbol.endsWith('.L')) return '£';
  if (symbol.endsWith('.DE') || symbol.endsWith('.PA')) return '€';
  if (symbol.endsWith('.T') || symbol.endsWith('.SS') || symbol.endsWith('.SZ')) return '¥';
  if (symbol.endsWith('.HK')) return 'HK$';
  if (symbol.endsWith('.AX')) return 'A$';
  if (symbol.endsWith('.TO')) return 'C$';
  if (symbol.endsWith('.SA')) return 'R$';
  if (symbol.endsWith('.KS') || symbol.endsWith('.KQ')) return '₩';
  if (symbol.endsWith('.JO')) return 'R';
  return '$';
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        const { data } = await axios.get('/api/user/history', config);
        setHistory(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const filtered = filter
    ? history.filter(h => h.symbol?.toLowerCase().includes(filter.toLowerCase()))
    : history;

  // Stats
  const totalSearches = history.length;
  const uniqueStocks = new Set(history.map(h => h.symbol)).size;
  const buySignals = history.filter(h => h.metadata?.signal === 'BUY').length;
  const sellSignals = history.filter(h => h.metadata?.signal === 'SELL').length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'Outfit', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <Clock size={26} color="#3b82f6" />
            Search History
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Your recent stock analysis activity
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="card glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Searches</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit', color: '#3b82f6', marginTop: 4 }}>{totalSearches}</div>
        </div>
        <div className="card glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Unique Stocks</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit', color: '#a78bfa', marginTop: 4 }}>{uniqueStocks}</div>
        </div>
        <div className="card glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Buy Signals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit', color: '#22c55e', marginTop: 4 }}>{buySignals}</div>
        </div>
        <div className="card glass-panel" style={{ padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Sell Signals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit', color: '#ef4444', marginTop: 4 }}>{sellSignals}</div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card glass-panel" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Filter size={16} color="var(--text-secondary)" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by symbol..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '0.88rem', flex: 1,
            fontFamily: 'Inter',
          }}
        />
        {filter && (
          <button onClick={() => setFilter('')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
            Clear
          </button>
        )}
      </div>

      {/* History Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p className="text-muted">Loading history...</p>
        </div>
      ) : (
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
          {/* Desktop Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--panel-border)' }}>
                  <th style={thStyle}>Date & Time</th>
                  <th style={thStyle}>Symbol</th>
                  <th style={thStyle}>Action</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Signal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const signalColor = item.metadata?.signal === 'BUY' ? '#22c55e' : item.metadata?.signal === 'SELL' ? '#ef4444' : '#3b82f6';
                  return (
                    <tr key={item._id} style={{
                      borderBottom: '1px solid var(--panel-border)',
                      transition: 'background 0.2s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                          {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          <span style={{ marginLeft: 6, color: 'var(--text-secondary)', fontSize: '0.68rem' }}>({timeAgo(item.timestamp)})</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                          {item.symbol}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontWeight: 600,
                          background: 'rgba(59,130,246,0.12)',
                          color: '#3b82f6',
                        }}>
                          {item.action}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, fontFamily: 'Outfit', fontSize: '0.88rem' }}>
                          {item.metadata?.currentPrice ? `${getCurrencySymbol(item.symbol)}${item.metadata.currentPrice.toFixed(2)}` : '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.75rem',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontWeight: 700,
                          background: `${signalColor}18`,
                          color: signalColor,
                        }}>
                          {item.metadata?.signal === 'BUY' && <TrendingUp size={12} />}
                          {item.metadata?.signal === 'SELL' && <TrendingDown size={12} />}
                          {item.metadata?.signal === 'HOLD' && <BarChart2 size={12} />}
                          {item.metadata?.signal || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <Search size={32} style={{ opacity: 0.3, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                      {filter ? 'No results matching your filter.' : 'No history found. Try searching for some stocks!'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '14px 18px',
  textAlign: 'left',
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-secondary)',
  background: 'rgba(0,0,0,0.03)',
};

const tdStyle = {
  padding: '14px 18px',
};

export default HistoryPage;
