import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { createChart, AreaSeries, HistogramSeries } from 'lightweight-charts';
import { X, TrendingUp, TrendingDown, BarChart2, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
const API = '/api';
const fmt = (n, dec = 2) => (n == null || !Number.isFinite(n) ? '—' : n.toFixed(dec));
const fmtLarge = (n) => {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
};
const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '14px 18px',
    flex: '1 1 150px',
    minWidth: 150,
  }}>
    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Outfit', color: color || '#f8fafc' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
  </div>
);
const FullHistoryModal = ({ symbol, currSym, country, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'yearly'
  const [chartMode, setChartMode] = useState('price'); // 'price' | 'returns'
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const fetchFullHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const countryParam = country ? `?country=${encodeURIComponent(country)}` : '';
      const { data: res } = await axios.get(`${API}/stocks/${encodeURIComponent(symbol)}/fullhistory${countryParam}`);
      setData(res);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load full history.');
    } finally {
      setLoading(false);
    }
  }, [symbol, country]);

  useEffect(() => { fetchFullHistory(); }, [fetchFullHistory]);

  // Build chart once data is ready
  useEffect(() => {
    if (!data || !chartContainerRef.current || activeTab !== 'chart') return;

    // Teardown old chart
    if (chartRef.current) { try { chartRef.current.remove(); } catch { } chartRef.current = null; }

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#8b949e' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: false },
      width: chartContainerRef.current.clientWidth,
      height: 340,
    });
    chartRef.current = chart;

    const rawData = data.analysis?.historical || [];
    const uniqueMap = new Map();
    rawData.forEach(d => {
      const rawTime = d.date || d.time || d.timestamp;
      if (!rawTime) return;
      const t = Math.floor(new Date(rawTime).getTime() / 1000);
      if (!Number.isFinite(t) || !Number.isFinite(d.close)) return;
      uniqueMap.set(t, { time: t, value: d.close });
    });
    const pricePoints = Array.from(uniqueMap.values()).sort((a, b) => a.time - b.time);

    if (chartMode === 'price' && pricePoints.length > 0) {
      const series = chart.addSeries(AreaSeries, {
        lineColor: '#58a6ff',
        topColor: 'rgba(88,166,255,0.35)',
        bottomColor: 'rgba(88,166,255,0.01)',
        lineWidth: 2,
      });
      series.setData(pricePoints);
    } else if (chartMode === 'returns') {
      // Yearly returns histogram
      const yp = data.yearlyPerformance || [];
      const histData = yp.map(y => ({
        time: `${y.year}-01-01`,
        value: y.returnPct,
        color: y.returnPct >= 0 ? 'rgba(46,160,67,0.85)' : 'rgba(218,54,51,0.85)',
      }));
      if (histData.length > 0) {
        const series = chart.addSeries(HistogramSeries, { priceFormat: { type: 'percent' } });
        series.setData(histData);
      }
    }

    chart.timeScale().fitContent();
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) { try { chartRef.current.remove(); } catch { } chartRef.current = null; }
    };
  }, [data, activeTab, chartMode]);
  const stats = data?.fullStats;
  const quote = data?.quote;
  const yp = data?.yearlyPerformance || [];
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'linear-gradient(145deg, #0d1117, #161b22)',
        border: '1px solid hsla(0, 0%, 100%, 0.10)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 960,
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        padding: '28px 32px',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <BarChart2 size={22} color="var(--accent-blue)" />
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Outfit', color: '#f8fafc' }}>
                Full History Analysis — {symbol}
              </h2>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              {stats ? `${stats.firstDate} → ${stats.lastDate}  ·  ${stats.totalWeeks} weekly bars` : 'Loading data from IPO…'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p className="text-muted">Fetching all-time data from IPO date…</p>
          </div>
        )}
        {/* Error */}
        {error && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-red)', padding: '20px 0' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <button className="btn" style={{ marginLeft: 'auto' }} onClick={fetchFullHistory}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}
        {data && !loading && (
          <>
            {/* Current Price Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'Outfit', color: '#f8fafc' }}>
                  {currSym}{fmt(quote?.regularMarketPrice)}
                </span>
                <span className={`${(quote?.regularMarketChangePercent || 0) >= 0 ? 'text-green' : 'text-red'}`}
                  style={{ marginLeft: 12, fontSize: '1rem', fontWeight: 600 }}>
                  {(quote?.regularMarketChangePercent || 0) >= 0 ? '+' : ''}
                  {fmt(quote?.regularMarketChangePercent)}%
                </span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {quote?.fullExchangeName || quote?.exchange || ''}
                </span>
              </div>
            </div>
            {/* Key Stats Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
              <StatCard label="All-Time High" value={`${currSym}${fmt(stats?.ath)}`} color="var(--accent-green)" />
              <StatCard label="All-Time Low" value={`${currSym}${fmt(stats?.atl)}`} color="var(--accent-red)" />
              <StatCard label="Total Return" value={`${stats?.totalReturnPct >= 0 ? '+' : ''}${fmt(stats?.totalReturnPct)}%`}
                color={stats?.totalReturnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
                sub={`Since ${stats?.firstDate}`} />
              <StatCard label="CAGR" value={`${fmt(stats?.cagr)}%`}
                color={stats?.cagr >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
                sub="Compound Annual Growth" />
              <StatCard label="Max Drawdown" value={`-${fmt(stats?.maxDrawdown)}%`} color="var(--accent-red)"
                sub={stats?.drawdownStart ? `${new Date(stats.drawdownStart).getFullYear()} → ${new Date(stats.drawdownEnd).getFullYear()}` : ''} />
              <StatCard label="Ann. Volatility" value={`${fmt(stats?.annualizedVolatility)}%`}
                sub="Weekly-based estimate" />
              <StatCard label="Avg Weekly Vol" value={fmtLarge(stats?.avgWeeklyVolume)} sub="shares/week" />
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['chart', 'Price Chart'], ['yearly', 'Yearly Performance']].map(([k, label]) => (
                <button key={k} onClick={() => setActiveTab(k)} style={{
                  padding: '6px 16px', borderRadius: 8, border: '1px solid',
                  borderColor: activeTab === k ? 'var(--accent-blue)' : 'var(--panel-border)',
                  background: activeTab === k ? 'var(--accent-blue)' : 'transparent',
                  color: activeTab === k ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                }}>{label}</button>
              ))}
              {activeTab === 'chart' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  {[['price', 'Close Price'], ['returns', 'Yearly Returns']].map(([k, label]) => (
                    <button key={k} onClick={() => setChartMode(k)} style={{
                      padding: '5px 12px', borderRadius: 6, border: '1px solid',
                      borderColor: chartMode === k ? 'rgba(88,166,255,0.6)' : 'var(--panel-border)',
                      background: chartMode === k ? 'rgba(88,166,255,0.15)' : 'transparent',
                      color: chartMode === k ? '#58a6ff' : '#94a3b8',
                      cursor: 'pointer', fontSize: '0.78rem',
                    }}>{label}</button>
                  ))}
                </div>
              )}
            </div>
            {/* Chart Tab */}
            {activeTab === 'chart' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div ref={chartContainerRef} style={{ width: '100%', height: 340 }} />
              </div>
            )}
            {/* Yearly Performance Tab */}
            {activeTab === 'yearly' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Year</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Open</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>High</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Low</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Close</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Return</th>
                      <th style={{ padding: '8px 12px', minWidth: 160 }}>Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...yp].reverse().map(y => {
                      const pos = y.returnPct >= 0;
                      const barWidth = Math.min(100, Math.abs(y.returnPct) * 1.5);
                      return (
                        <tr key={y.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '9px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: '#f8fafc' }}>
                            <Calendar size={13} style={{ color: '#94a3b8' }} />{y.year}
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', color: '#94a3b8' }}>{currSym}{fmt(y.open)}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--accent-green)' }}>{currSym}{fmt(y.high)}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', color: 'var(--accent-red)' }}>{currSym}{fmt(y.low)}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', color: '#f8fafc', fontWeight: 600 }}>{currSym}{fmt(y.close)}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: pos ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {pos ? '+' : ''}{fmt(y.returnPct)}%
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, position: 'relative' }}>
                              <div style={{ position: 'absolute', left: pos ? '50%' : `${50 - barWidth / 2}%`, width: `${barWidth / 2}%`, height: '100%', background: pos ? 'var(--accent-green)' : 'var(--accent-red)', borderRadius: 4, transition: 'width 0.3s' }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Disclaimer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, fontSize: '0.78rem', color: '#94a3b8', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <AlertCircle size={13} />
              Data sourced from Yahoo Finance via weekly bars. Not financial advice.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default FullHistoryModal;