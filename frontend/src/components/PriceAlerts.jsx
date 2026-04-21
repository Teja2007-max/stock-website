import React, { useState, useEffect, useContext } from 'react';
import { Bell, BellRing, Plus, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const PriceAlerts = ({ currentSymbol, currentPrice }) => {
  const { token } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: currentSymbol || '', targetPrice: '', condition: 'above' });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/alerts', { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlerts(data);
      } else {
        setAlerts([]);
      }
    } catch {}
  };

  const addAlert = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/user/alerts', { method: 'POST', headers, body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ symbol: currentSymbol || '', targetPrice: '', condition: 'above' });
      fetchAlerts();
    } catch {}
  };

  const removeAlert = async (id) => {
    await fetch(`/api/user/alerts/${id}`, { method: 'DELETE', headers });
    setAlerts(prev => prev.filter(a => a._id !== id));
  };

  useEffect(() => { fetchAlerts(); }, [token]);
  useEffect(() => { setForm(f => ({ ...f, symbol: currentSymbol || '' })); }, [currentSymbol]);

  // Check if any alerts are triggered
  useEffect(() => {
    if (!currentPrice || !currentSymbol) return;
    alerts.forEach(a => {
      if (a.triggered || a.symbol !== currentSymbol) return;
      const triggered = (a.condition === 'above' && currentPrice >= a.targetPrice) ||
                       (a.condition === 'below' && currentPrice <= a.targetPrice);
      if (triggered && Notification.permission === 'granted') {
        new Notification(`🔔 Price Alert: ${a.symbol}`, {
          body: `${a.symbol} is now ${a.condition === 'above' ? 'above' : 'below'} ₹${a.targetPrice} (Current: ₹${currentPrice.toFixed(2)})`,
          icon: '/vite.svg',
        });
      }
    });
  }, [currentPrice, currentSymbol, alerts]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!token) return null;

  const activeAlerts = alerts.filter(a => !a.triggered);

  return (
    <div className="card glass-panel" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activeAlerts.length > 0 ? 12 : 0 }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <Bell size={16} color="#f59e0b" />
          Price Alerts
          {activeAlerts.length > 0 && (
            <span style={{
              fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10,
              background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700,
            }}>{activeAlerts.length}</span>
          )}
        </h3>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600,
        }}>
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addAlert} style={{
          padding: '12px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: 10,
          marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Symbol</label>
            <input type="text" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })}
              required className="input-field" style={{ marginTop: 3, padding: '6px 10px', fontSize: '0.8rem' }} />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Target ₹</label>
            <input type="number" step="0.01" value={form.targetPrice} onChange={e => setForm({ ...form, targetPrice: e.target.value })}
              required className="input-field" style={{ marginTop: 3, padding: '6px 10px', fontSize: '0.8rem' }} />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500 }}>When</label>
            <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
              className="input-field" style={{ marginTop: 3, padding: '6px 10px', fontSize: '0.8rem' }}>
              <option value="above">Goes Above</option>
              <option value="below">Goes Below</option>
            </select>
          </div>
          <button type="submit" style={{
            padding: '7px 14px', background: '#f59e0b', border: 'none', borderRadius: 8,
            color: '#fff', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
          }}>Set Alert</button>
        </form>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activeAlerts.map(a => (
            <div key={a._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 8,
              background: a.condition === 'above' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${a.condition === 'above' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.condition === 'above' ? <TrendingUp size={13} color="#22c55e" /> : <TrendingDown size={13} color="#ef4444" />}
                <span style={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: 'Outfit' }}>{a.symbol}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {a.condition === 'above' ? '↑ above' : '↓ below'} ₹{a.targetPrice}
                </span>
              </div>
              <button onClick={() => removeAlert(a._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeAlerts.length === 0 && !showForm && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 8 }}>No active alerts. Set one to get notified.</p>
      )}
    </div>
  );
};

export default PriceAlerts;
