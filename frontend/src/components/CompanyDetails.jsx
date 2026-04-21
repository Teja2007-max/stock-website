import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X, Building2, Globe, Users, TrendingUp, TrendingDown,
  BarChart3, DollarSign, PieChart, Target, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, Loader2,
} from 'lucide-react';

const API = '/api';

const fmtNum = (n, decimals = 2) => {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const fmtCr = (n) => {
  if (n == null) return '—';
  const cr = n / 10000000;
  if (Math.abs(cr) >= 100) return `₹${cr.toFixed(0)} Cr`;
  return `₹${cr.toFixed(2)} Cr`;
};

const fmtLCr = (n) => {
  if (n == null) return '—';
  const lcr = n / 10000000;
  if (Math.abs(lcr) >= 10000) return `₹${(lcr / 100).toFixed(0)} LCr`;
  if (Math.abs(lcr) >= 100) return `₹${lcr.toFixed(0)} Cr`;
  return `₹${lcr.toFixed(2)} Cr`;
};

const pctColor = (v) => {
  if (v == null) return 'var(--text-secondary)';
  return v >= 0 ? '#22c55e' : '#ef4444';
};

// --- Section with collapsible toggle ---
const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: 'var(--panel-bg)', border: '1px solid var(--panel-border)',
      borderRadius: 14, marginBottom: 16, overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'transparent', border: 'none',
        cursor: 'pointer', color: 'var(--text-primary)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', fontWeight: 700, fontFamily: 'Outfit' }}>
          {Icon && <Icon size={18} color="#3b82f6" />} {title}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  );
};

// --- Ratio Row ---
const RatioRow = ({ label, value, suffix = '', good }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
    borderBottom: '1px solid var(--panel-border)',
  }}>
    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{
      fontSize: '0.85rem', fontWeight: 600,
      color: good != null ? (good ? '#22c55e' : '#ef4444') : 'var(--text-primary)',
    }}>
      {value}{suffix}
    </span>
  </div>
);

// --- Financial Table ---
const FinTable = ({ headers, rows, formatFn = fmtCr }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} style={{
              padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right',
              borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)',
              fontWeight: 600, whiteSpace: 'nowrap',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((cell, ci) => (
              <td key={ci} style={{
                padding: '8px 12px', textAlign: ci === 0 ? 'left' : 'right',
                borderBottom: '1px solid var(--panel-border)', color: 'var(--text-primary)',
                whiteSpace: 'nowrap', fontWeight: ci === 0 ? 600 : 400,
              }}>
                {ci === 0 ? cell : (typeof cell === 'number' ? formatFn(cell) : (cell || '—'))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Shareholding Bar ---
const HoldingBar = ({ label, percent, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{percent != null ? `${percent.toFixed(2)}%` : '—'}</span>
    </div>
    <div style={{ height: 8, background: 'var(--panel-border)', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ width: `${percent || 0}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s' }} />
    </div>
  </div>
);

// --- Main Modal ---
const CompanyDetails = ({ symbol, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError('');
    axios.get(`${API}/stocks/${symbol}/details`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load details'))
      .finally(() => setLoading(false));
  }, [symbol]);

  if (!symbol) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'financials', label: 'Financials' },
    { id: 'balancesheet', label: 'Balance Sheet' },
    { id: 'cashflow', label: 'Cash Flow' },
    { id: 'shareholding', label: 'Shareholding' },
  ];

  const r = data?.ratios || {};
  const q = data?.quote || {};
  const c = data?.company || {};

  const getDateLabel = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${dt.toLocaleString('en', { month: 'short' })} ${dt.getFullYear()}`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      padding: '40px 20px', overflowY: 'auto',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 960,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 20, padding: 0,
        maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        color: '#0f172a',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '24px 28px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: '#ffffff', zIndex: 2,
        }}>
          <div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Loader2 size={20} className="spin" color="#3b82f6" />
                <span style={{ color: '#64748b' }}>Loading {symbol}...</span>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit', color: '#0f172a', marginBottom: 4 }}>
                  {c.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', background: 'rgba(0,0,0,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                    {symbol}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.exchange}</span>
                  <span style={{ fontSize: '0.78rem', color: '#3b82f6' }}>{c.sector}</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.industry}</span>
                </div>
                {q.price && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 10 }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{fmtNum(q.price)}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: pctColor(q.change) }}>
                      {q.change >= 0 ? '+' : ''}{fmtNum(q.change)} ({q.changePercent >= 0 ? '+' : ''}{fmtNum(q.changePercent)}%)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
            padding: 8, cursor: 'pointer', color: '#0f172a',
          }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: 20, textAlign: 'center', color: '#ef4444' }}>
            <AlertCircle size={32} style={{ marginBottom: 8 }} />
            <p>{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 0, borderBottom: '1px solid rgba(0,0,0,0.08)',
              overflowX: 'auto', padding: '0 20px',
            }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '10px 18px', background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${activeTab === t.id ? '#3b82f6' : 'transparent'}`,
                  color: activeTab === t.id ? '#0f172a' : '#64748b',
                  cursor: 'pointer', fontSize: '0.84rem', fontWeight: activeTab === t.id ? 700 : 500,
                  fontFamily: 'Outfit', whiteSpace: 'nowrap', marginBottom: -1,
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px 24px' }}>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <>
                  {/* Key Ratios Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <Section title="Valuation" icon={DollarSign}>
                      <RatioRow label="Market Cap" value={fmtLCr(r.marketCap)} />
                      <RatioRow label="P/E Ratio (TTM)" value={fmtNum(r.pe)} />
                      <RatioRow label="Forward P/E" value={fmtNum(r.forwardPE)} />
                      <RatioRow label="P/B Ratio" value={fmtNum(r.pb)} />
                      <RatioRow label="EPS (TTM)" value={`₹${fmtNum(r.eps)}`} />
                      <RatioRow label="PEG Ratio" value={fmtNum(r.pegRatio)} />
                      <RatioRow label="EV/Revenue" value={fmtNum(r.evToRevenue)} />
                      <RatioRow label="EV/EBITDA" value={fmtNum(r.evToEbitda)} />
                    </Section>

                    <Section title="Performance" icon={TrendingUp}>
                      <RatioRow label="ROE" value={fmtNum(r.roe)} suffix="%" good={r.roe > 15} />
                      <RatioRow label="ROA" value={fmtNum(r.roa)} suffix="%" good={r.roa > 5} />
                      <RatioRow label="Profit Margin" value={fmtNum(r.profitMargin)} suffix="%" good={r.profitMargin > 10} />
                      <RatioRow label="Operating Margin" value={fmtNum(r.operatingMargin)} suffix="%" />
                      <RatioRow label="Revenue Growth" value={fmtNum(r.revenueGrowth)} suffix="%" good={r.revenueGrowth > 0} />
                      <RatioRow label="Earnings Growth" value={fmtNum(r.earningsGrowth)} suffix="%" good={r.earningsGrowth > 0} />
                      <RatioRow label="Dividend Yield" value={fmtNum(r.dividendYield)} suffix="%" />
                      <RatioRow label="Beta" value={fmtNum(r.beta)} />
                    </Section>
                  </div>

                  {/* Health Ratios */}
                  <Section title="Financial Health" icon={BarChart3}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                      <div>
                        <RatioRow label="Debt/Equity" value={fmtNum(r.debtToEquity)} good={r.debtToEquity < 100} />
                        <RatioRow label="Current Ratio" value={fmtNum(r.currentRatio)} good={r.currentRatio > 1.5} />
                        <RatioRow label="Quick Ratio" value={fmtNum(r.quickRatio)} good={r.quickRatio > 1} />
                      </div>
                      <div>
                        <RatioRow label="Book Value" value={`₹${fmtNum(r.bookValue)}`} />
                        <RatioRow label="Shares Outstanding" value={r.sharesOutstanding ? `${(r.sharesOutstanding / 10000000).toFixed(2)} Cr` : '—'} />
                        <RatioRow label="Float Shares" value={r.floatShares ? `${(r.floatShares / 10000000).toFixed(2)} Cr` : '—'} />
                      </div>
                    </div>
                  </Section>

                  {/* Price Range */}
                  <Section title="Price Range" icon={Target}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <RatioRow label="Day Low" value={`₹${fmtNum(q.dayLow)}`} />
                        <RatioRow label="Day High" value={`₹${fmtNum(q.dayHigh)}`} />
                        <RatioRow label="Previous Close" value={`₹${fmtNum(q.previousClose)}`} />
                      </div>
                      <div>
                        <RatioRow label="52W Low" value={`₹${fmtNum(q.fiftyTwoWeekLow)}`} />
                        <RatioRow label="52W High" value={`₹${fmtNum(q.fiftyTwoWeekHigh)}`} />
                        <RatioRow label="Volume" value={q.volume?.toLocaleString('en-IN') || '—'} />
                      </div>
                    </div>
                  </Section>

                  {/* Analyst Targets */}
                  {data.targets?.targetMean && (
                    <Section title="Analyst Targets" icon={Target} defaultOpen={false}>
                      <RatioRow label="Target Mean" value={`₹${fmtNum(data.targets.targetMean)}`} />
                      <RatioRow label="Target High" value={`₹${fmtNum(data.targets.targetHigh)}`} />
                      <RatioRow label="Target Low" value={`₹${fmtNum(data.targets.targetLow)}`} />
                      <RatioRow label="# Analysts" value={data.targets.numAnalysts} />
                      <RatioRow label="Recommendation" value={data.targets.recommendation?.toUpperCase() || '—'} />
                    </Section>
                  )}
                  {/* About */}
                  {c.description && (
                    <Section title="About" icon={Building2} defaultOpen={false}>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        {c.description}
                      </p>
                      <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                        {c.employees > 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={13} /> {c.employees.toLocaleString()} employees
                          </span>
                        )}
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                            <Globe size={13} /> {c.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                    </Section>
                  )}
                </>
              )}
              {/* FINANCIALS TAB */}
              {activeTab === 'financials' && (
                <>
                  {/* Quarterly Results */}
                  {data.incomeQuarterly?.length > 0 && (
                    <Section title="Quarterly Results" icon={BarChart3}>
                      <FinTable
                        headers={['', ...data.incomeQuarterly.map(s => getDateLabel(s.date))]}
                        rows={[
                          ['Revenue', ...data.incomeQuarterly.map(s => s.revenue)],
                          ['Gross Profit', ...data.incomeQuarterly.map(s => s.grossProfit)],
                          ['Operating Income', ...data.incomeQuarterly.map(s => s.operatingIncome)],
                          ['Net Profit', ...data.incomeQuarterly.map(s => s.netIncome)],
                        ]}
                      />
                    </Section>
                  )}

                  {/* Annual P&L */}
                  {data.incomeStatements?.length > 0 && (
                    <Section title="Profit & Loss (Annual)" icon={DollarSign}>
                      <FinTable
                        headers={['', ...data.incomeStatements.map(s => getDateLabel(s.date))]}
                        rows={[
                          ['Revenue', ...data.incomeStatements.map(s => s.revenue)],
                          ['Cost of Revenue', ...data.incomeStatements.map(s => s.costOfRevenue)],
                          ['Gross Profit', ...data.incomeStatements.map(s => s.grossProfit)],
                          ['Operating Income', ...data.incomeStatements.map(s => s.operatingIncome)],
                          ['EBITDA', ...data.incomeStatements.map(s => s.ebitda)],
                          ['Interest Expense', ...data.incomeStatements.map(s => s.interestExpense)],
                          ['Tax', ...data.incomeStatements.map(s => s.taxExpense)],
                          ['Net Income', ...data.incomeStatements.map(s => s.netIncome)],
                        ]}
                      />
                    </Section>
                  )}
                </>
              )}

              {/* BALANCE SHEET TAB */}
              {activeTab === 'balancesheet' && data.balanceSheet?.length > 0 && (
                <Section title="Balance Sheet (Annual)" icon={PieChart}>
                  <FinTable
                    headers={['', ...data.balanceSheet.map(s => getDateLabel(s.date))]}
                    rows={[
                      ['Total Assets', ...data.balanceSheet.map(s => s.totalAssets)],
                      ['Current Assets', ...data.balanceSheet.map(s => s.currentAssets)],
                      ['Cash', ...data.balanceSheet.map(s => s.cash)],
                      ['Receivables', ...data.balanceSheet.map(s => s.receivables)],
                      ['Inventory', ...data.balanceSheet.map(s => s.inventory)],
                      ['Total Liabilities', ...data.balanceSheet.map(s => s.totalLiabilities)],
                      ['Current Liabilities', ...data.balanceSheet.map(s => s.currentLiabilities)],
                      ['Total Debt', ...data.balanceSheet.map(s => s.totalDebt)],
                      ['Equity', ...data.balanceSheet.map(s => s.totalEquity)],
                    ]}
                  />
                </Section>
              )}

              {/* CASH FLOW TAB */}
              {activeTab === 'cashflow' && data.cashFlow?.length > 0 && (
                <Section title="Cash Flow (Annual)" icon={DollarSign}>
                  <FinTable
                    headers={['', ...data.cashFlow.map(s => getDateLabel(s.date))]}
                    rows={[
                      ['Operating Cash Flow', ...data.cashFlow.map(s => s.operatingCashFlow)],
                      ['Investing Cash Flow', ...data.cashFlow.map(s => s.investingCashFlow)],
                      ['Financing Cash Flow', ...data.cashFlow.map(s => s.financingCashFlow)],
                      ['Free Cash Flow', ...data.cashFlow.map(s => s.freeCashFlow)],
                      ['CAPEX', ...data.cashFlow.map(s => s.capex)],
                      ['Dividends Paid', ...data.cashFlow.map(s => s.dividendsPaid)],
                    ]}
                  />
                </Section>
              )}
              {/* SHAREHOLDING TAB */}
              {activeTab === 'shareholding' && (
                <>
                  <Section title="Shareholding Pattern" icon={PieChart}>
                    <HoldingBar label="Promoters / Insiders" percent={data.shareholding?.insidersPercent} color="#3b82f6" />
                    <HoldingBar label="Institutions (FII + DII)" percent={data.shareholding?.institutionsPercent} color="#22c55e" />
                    <HoldingBar label="Public / Float" percent={
                      data.shareholding?.insidersPercent && data.shareholding?.institutionsPercent
                        ? Math.max(0, 100 - data.shareholding.insidersPercent - data.shareholding.institutionsPercent)
                        : null
                    } color="#f59e0b" />
                  </Section>
                  {/* Analyst Recommendations */}
                  {data.recommendations?.length > 0 && (
                    <Section title="Analyst Recommendations" icon={Target}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                          <thead>
                            <tr>
                              {['Period', 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'].map((h, i) => (
                                <th key={i} style={{
                                  padding: '8px 12px', textAlign: 'center',
                                  borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)',
                                  fontWeight: 600,
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.recommendations.map((r, i) => (
                              <tr key={i}>
                                <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--panel-border)', color: 'var(--text-primary)', fontWeight: 600 }}>{r.period}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--panel-border)', color: '#22c55e', fontWeight: 600 }}>{r.strongBuy}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--panel-border)', color: '#4ade80' }}>{r.buy}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--panel-border)', color: '#f59e0b' }}>{r.hold}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--panel-border)', color: '#f97316' }}>{r.sell}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--panel-border)', color: '#ef4444', fontWeight: 600 }}>{r.strongSell}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Section>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default CompanyDetails;
