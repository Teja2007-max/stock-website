import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import {
  Search, MapPin, TrendingUp, TrendingDown, Activity,
  AlertCircle, Clock, Globe, RefreshCw, BarChart2, History, Building2,
  Sun, Moon, Download, Star, Eye
} from 'lucide-react';
import Chart from '../components/Chart';
import FullHistoryModal from '../components/FullHistoryModal';
import SemiCircleGauge from '../components/SemiCircleGauge';
import CompanyDetails from '../components/CompanyDetails';
import ChartLoader from '../components/ChartLoader';
import Watchlist, { AddToWatchlistBtn } from '../components/Watchlist';
import SectorHeatmap from '../components/SectorHeatmap';
import PriceAlerts from '../components/PriceAlerts';
import { AuthContext } from '../context/AuthContext';

const API = '/api';

const MARKET_INFO = {
  India: {
    markets: ['NSE', 'BSE'],
    currency: 'INR',
    symbol: '₹',
    open: '09:15',
    close: '15:30',
    tz: 'Asia/Kolkata',
    defaultSymbols: ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'WIPRO.NS'],
  },
  'United States': {
    markets: ['NASDAQ', 'NYSE'],
    currency: 'USD',
    symbol: '$',
    open: '09:30',
    close: '16:00',
    tz: 'America/New_York',
    defaultSymbols: ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN'],
  },
  'United Kingdom': {
    markets: ['LSE'],
    currency: 'GBP',
    symbol: '£',
    open: '08:00',
    close: '16:30',
    tz: 'Europe/London',
    defaultSymbols: ['HSBA.L', 'BP.L', 'AZN.L', 'VOD.L', 'ULVR.L'],
  },
  Japan: {
    markets: ['TSE'],
    currency: 'JPY',
    symbol: '¥',
    open: '09:00',
    close: '15:00',
    tz: 'Asia/Tokyo',
    defaultSymbols: ['7203.T', '9984.T', '6758.T', '6861.T', '9432.T'],
  },
  China: {
    markets: ['SSE', 'SZSE'],
    currency: 'CNY',
    symbol: '¥',
    open: '09:30',
    close: '15:00',
    tz: 'Asia/Shanghai',
    defaultSymbols: ['600519.SS', '601398.SS', '601288.SS', '601939.SS', '601857.SS'],
  },
  'Hong Kong': {
    markets: ['HKEX'],
    currency: 'HKD',
    symbol: 'HK$',
    open: '09:30',
    close: '16:00',
    tz: 'Asia/Hong_Kong',
    defaultSymbols: ['0700.HK', '9988.HK', '3690.HK', '0939.HK', '0005.HK'],
  },
  Germany: {
    markets: ['FRA'],
    currency: 'EUR',
    symbol: '€',
    open: '09:00',
    close: '17:30',
    tz: 'Europe/Berlin',
    defaultSymbols: ['SAP.DE', 'SIE.DE', 'VOW3.DE', 'ALV.DE', 'DTE.DE'],
  },
  France: {
    markets: ['EURONEXT'],
    currency: 'EUR',
    symbol: '€',
    open: '09:00',
    close: '17:30',
    tz: 'Europe/Paris',
    defaultSymbols: ['MC.PA', 'OR.PA', 'RMS.PA', 'TTE.PA', 'SAN.PA'],
  },
  Australia: {
    markets: ['ASX'],
    currency: 'AUD',
    symbol: 'A$',
    open: '10:00',
    close: '16:00',
    tz: 'Australia/Sydney',
    defaultSymbols: ['BHP.AX', 'CBA.AX', 'CSL.AX', 'NAB.AX', 'WBC.AX'],
  },
  Canada: {
    markets: ['TSX'],
    currency: 'CAD',
    symbol: 'C$',
    open: '09:30',
    close: '16:00',
    tz: 'America/Toronto',
    defaultSymbols: ['RY.TO', 'TD.TO', 'SHOP.TO', 'CNR.TO', 'ENB.TO'],
  },
  Brazil: {
    markets: ['B3'],
    currency: 'BRL',
    symbol: 'R$',
    open: '10:00',
    close: '17:55',
    tz: 'America/Sao_Paulo',
    defaultSymbols: ['VALE3.SA', 'PETR4.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA'],
  },
  'South Korea': {
    markets: ['KRX'],
    currency: 'KRW',
    symbol: '₩',
    open: '09:00',
    close: '15:30',
    tz: 'Asia/Seoul',
    defaultSymbols: ['005930.KS', '000660.KS', '051910.KS', '207940.KS', '005380.KS'],
  },
  'South Africa': {
    markets: ['JSE'],
    currency: 'ZAR',
    symbol: 'R',
    open: '09:00',
    close: '17:00',
    tz: 'Africa/Johannesburg',
    defaultSymbols: ['NPN.JO', 'PRX.JO', 'CFR.JO', 'FSR.JO', 'MTN.JO'],
  }
};

const DEFAULT_MARKET = MARKET_INFO['India'];

// Official NSE India Trading Holidays 2026 (source: nseindia.com)
// Format: 'M/D/YYYY' => 'Holiday Name'  (keyed by country)
const HOLIDAYS = {
  India: {
    '1/15/2026': 'Municipal Corporation Election',
    '1/26/2026': 'Republic Day',
    '3/3/2026': 'Holi',
    '3/26/2026': 'Shri Ram Navami',
    '3/31/2026': 'Shri Mahavir Jayanti',
    '4/3/2026': 'Good Friday',
    '4/14/2026': 'Dr. Baba Saheb Ambedkar Jayanti',
    '5/1/2026': 'Maharashtra Day',
    '5/28/2026': 'Bakri Id',
    '6/26/2026': 'Muharram',
    '9/14/2026': 'Ganesh Chaturthi',
    '10/2/2026': 'Mahatma Gandhi Jayanti',
    '10/20/2026': 'Dussehra',
    '11/10/2026': 'Diwali-Balipratipada',
    '11/24/2026': 'Prakash Gurpurb Sri Guru Nanak Dev',
    '12/25/2026': 'Christmas',
  },
  'United States': {
    '1/1/2026': "New Year's Day",
    '1/19/2026': 'Martin Luther King Jr. Day',
    '2/16/2026': "Presidents' Day",
    '4/3/2026': 'Good Friday',
    '5/25/2026': 'Memorial Day',
    '7/3/2026': 'Independence Day (Observed)',
    '9/7/2026': 'Labor Day',
    '11/26/2026': 'Thanksgiving',
    '12/25/2026': 'Christmas',
  },
};

const getMarketStatus = (market, country = 'India') => {
  const now = new Date();
  const tz = market.tz;
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, timeZone: tz, hour: '2-digit', minute: '2-digit' });
  const [h, m] = timeStr.split(':').map(Number);
  const currentMinutes = h * 60 + m;
  const [oh, om] = market.open.split(':').map(Number);
  const [ch, cm] = market.close.split(':').map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;

  const day = now.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz });
  const mdy = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', timeZone: tz });

  if (['Sat', 'Sun'].includes(day)) return { open: false, label: 'Closed (Weekend)' };

  // Check country-specific holidays
  const countryHolidays = HOLIDAYS[country] || {};
  if (countryHolidays[mdy]) return { open: false, label: `Closed (${countryHolidays[mdy]})` };

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) return { open: true, label: 'Market Open' };
  if (currentMinutes < openMinutes) return { open: false, label: `Opens at ${market.open}` };
  return { open: false, label: 'Market Closed' };
};

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'MAX'];
const TIMEFRAME_MAP = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'MAX': 1825,
};

const Dashboard = () => {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState({ country: 'India', city: '', market: DEFAULT_MARKET });
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [trending, setTrending] = useState([]);
  const [timeframe, setTimeframe] = useState('1Y');
  const [error, setError] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('stockedge_theme') === 'dark');
  const { user } = useContext(AuthContext);

  // Theme toggle
  useEffect(() => {
    const root = document.querySelector('.app-container');
    if (root) {
      if (darkMode) {
        root.classList.remove('colorful-premium-bg');
        document.body.style.backgroundColor = '#0b0e14';
        document.body.style.color = '#f0f6fc';
      } else {
        root.classList.add('colorful-premium-bg');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#0f172a';
      }
    }
    localStorage.setItem('stockedge_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // PDF export
  const exportToPDF = async () => {
    if (!stockData) return;

    const win = window.open('', '_blank');
    if (!win) {
      alert("Please allow popups to export the PDF report.");
      return;
    }
    win.document.write('<html><head><title>Generating Report...</title></head><body style="font-family: sans-serif; padding: 40px; text-align: center;"><h2>Generating PDF Report, please wait...</h2></body></html>');

    const quote = stockData.quote;
    const analysis = stockData.analysis;
    const last = analysis?.historical?.[analysis.historical.length - 1];
    const currSymbol = locationInfo.market.symbol;

    // Capture chart, gauge, and indicators as images
    const captures = {};
    const captureEl = async (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        try {
          const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
          captures[key] = canvas.toDataURL('image/png');
        } catch {}
      }
    };

    await Promise.all([
      captureEl('pdf-chart', 'chart'),
      captureEl('pdf-gauge', 'gauge'),
      captureEl('pdf-indicators', 'indicators'),
    ]);

    win.document.open();
    win.document.write(`
      <html><head><title>StockEdge Report - ${quote?.symbol}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px 40px; color: #1e293b; max-width: 900px; margin: 0 auto; line-height: 1.5; }
        h1 { border-bottom: 3px solid #3b82f6; padding-bottom: 10px; margin-bottom: 4px; font-size: 24px; }
        h2 { color: #334155; font-size: 16px; margin-top: 28px; margin-bottom: 12px; border-left: 4px solid #3b82f6; padding-left: 10px; }
        .subtitle { color: #64748b; font-size: 12px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
        .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin: 12px 0; }
        .box { background: #f8fafc; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
        .sm-val { font-size: 14px; font-weight: 600; margin-top: 3px; }
        .green { color: #16a34a; } .red { color: #dc2626; } .blue { color: #2563eb; } .muted { color: #94a3b8; }
        .img-container { text-align: center; margin: 16px 0; }
        .img-container img { max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; }
        .gauge-row { display: flex; align-items: center; justify-content: center; gap: 40px; margin: 16px 0; }
        .gauge-row img { max-width: 280px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
        th, td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; background: #f8fafc; }
        .pattern-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .bull-badge { background: #dcfce7; color: #16a34a; }
        .bear-badge { background: #fee2e2; color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 14px; border-top: 2px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
        @media print { body { padding: 15px; } .img-container img { max-height: 300px; } }
      </style></head><body>

      <h1>📊 ${quote?.longName || quote?.shortName || quote?.symbol}</h1>
      <div class="subtitle">${quote?.symbol} · Generated by StockEdge on ${new Date().toLocaleString()} · ${locationInfo.market.markets.join('/')}</div>

      <!-- Price Overview -->
      <div class="grid">
        <div class="box">
          <div class="label">Current Price</div>
          <div class="value">${currSymbol}${quote?.regularMarketPrice?.toFixed(2)}</div>
        </div>
        <div class="box">
          <div class="label">Change</div>
          <div class="value ${(quote?.regularMarketChange||0)>=0?'green':'red'}">
            ${(quote?.regularMarketChange||0)>=0?'+':''}${quote?.regularMarketChange?.toFixed(2)} (${quote?.regularMarketChangePercent?.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div class="grid4">
        <div class="box"><div class="label">Open</div><div class="sm-val">${currSymbol}${quote?.regularMarketOpen?.toFixed(2)}</div></div>
        <div class="box"><div class="label">Prev Close</div><div class="sm-val">${currSymbol}${quote?.regularMarketPreviousClose?.toFixed(2)}</div></div>
        <div class="box"><div class="label">52W High</div><div class="sm-val green">${currSymbol}${quote?.fiftyTwoWeekHigh?.toFixed(2)}</div></div>
        <div class="box"><div class="label">52W Low</div><div class="sm-val red">${currSymbol}${quote?.fiftyTwoWeekLow?.toFixed(2)}</div></div>
      </div>

      <!-- Chart -->
      ${captures.chart ? `<h2>📈 Price Chart</h2><div class="img-container"><img src="${captures.chart}" alt="Chart" /></div>` : ''}

      <!-- AI Signal -->
      <h2>🤖 AI Recommendation</h2>
      <div class="gauge-row">
        ${captures.gauge ? `<img src="${captures.gauge}" alt="Gauge" />` : ''}
        <div>
          <div class="box" style="text-align:center; min-width: 200px;">
            <div class="label">Signal</div>
            <div class="value ${analysis?.signal==='BUY'?'green':analysis?.signal==='SELL'?'red':'blue'}" style="font-size: 28px;">${analysis?.signal}</div>
            <div class="muted" style="font-size: 13px; margin-top: 4px;">Confidence: ${analysis?.confidence}%</div>
            <div class="muted" style="font-size: 12px;">Trend: ${analysis?.trend} · Sentiment: ${analysis?.sentiment?.toFixed(2)}</div>
            ${analysis?.crossSignal && analysis.crossSignal !== 'NONE' ? `<div style="margin-top: 6px; font-size: 12px;" class="${analysis.crossSignal.includes('BULL') || analysis.crossSignal === 'GOLDEN' ? 'green' : 'red'}">${analysis.crossSignal === 'GOLDEN' ? '★ Golden Cross' : analysis.crossSignal === 'DEATH' ? '✕ Death Cross' : analysis.crossSignal.replace('_', ' ')}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Chart Patterns -->
      ${analysis?.patterns?.length > 0 ? `
        <h2>🔍 Chart Patterns Detected</h2>
        <table>
          <tr><th>Pattern</th><th>Signal</th><th>Confidence</th><th>Description</th></tr>
          ${analysis.patterns.map(p => `<tr><td><strong>${p.name}</strong></td><td><span class="pattern-badge ${p.type === 'bullish' ? 'bull-badge' : 'bear-badge'}">${p.type.toUpperCase()}</span></td><td>${p.confidence}%</td><td>${p.description}</td></tr>`).join('')}
        </table>` : ''}

      <!-- 5-Day Forecast -->
      ${analysis?.prediction?.length > 0 ? `
        <h2>📅 5-Day Price Forecast</h2>
        <table>
          <tr><th>Day</th><th>Predicted Price</th><th>vs Current</th></tr>
          ${analysis.prediction.map((p, i) => {
            const diff = p - (quote?.regularMarketPrice || 0);
            const pct = ((diff / (quote?.regularMarketPrice || 1)) * 100);
            return `<tr><td>Day ${i + 1}</td><td>${currSymbol}${p.toFixed(2)}</td><td class="${diff >= 0 ? 'green' : 'red'}">${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)</td></tr>`;
          }).join('')}
        </table>` : ''}

      <!-- Technical Indicators -->
      <h2>📊 Technical Indicators</h2>
      ${captures.indicators ? `<div class="img-container"><img src="${captures.indicators}" alt="Indicators" /></div>` : ''}
      <table>
        <tr><th>Indicator</th><th>Value</th><th>Status</th></tr>
        <tr><td>RSI (14)</td><td>${last?.rsi?.toFixed(1) || 'N/A'}</td><td class="${(last?.rsi||50) > 70 ? 'red' : (last?.rsi||50) < 30 ? 'green' : ''}">${(last?.rsi||50) > 70 ? 'Overbought' : (last?.rsi||50) < 30 ? 'Oversold' : 'Neutral'}</td></tr>
        ${last?.stochK != null ? `<tr><td>Stochastic %K / %D</td><td>${last.stochK?.toFixed(1)} / ${last.stochD?.toFixed(1) || '—'}</td><td class="${last.stochK > 80 ? 'red' : last.stochK < 20 ? 'green' : ''}">${last.stochK > 80 ? 'Overbought' : last.stochK < 20 ? 'Oversold' : 'Neutral'}</td></tr>` : ''}
        <tr><td>MACD (12,26)</td><td>${last?.macd?.toFixed(2) || 'N/A'}</td><td class="${(last?.macd||0) > 0 ? 'green' : 'red'}">${(last?.macd||0) > 0 ? 'Bullish' : 'Bearish'}</td></tr>
        <tr><td>MACD Histogram</td><td>${last?.macdHistogram?.toFixed(2) || 'N/A'}</td><td class="${(last?.macdHistogram||0) > 0 ? 'green' : 'red'}">${(last?.macdHistogram||0) > 0 ? 'Positive' : 'Negative'}</td></tr>
        <tr><td>Bollinger Upper</td><td>${currSymbol}${last?.bbUpper?.toFixed(2) || 'N/A'}</td><td></td></tr>
        <tr><td>Bollinger Lower</td><td>${currSymbol}${last?.bbLower?.toFixed(2) || 'N/A'}</td><td></td></tr>
        <tr><td>SMA 50</td><td>${currSymbol}${last?.sma50?.toFixed(2) || 'N/A'}</td><td></td></tr>
        <tr><td>SMA 200</td><td>${currSymbol}${last?.sma200?.toFixed(2) || 'N/A'}</td><td></td></tr>
        ${last?.atr != null ? `<tr><td>ATR (14)</td><td>${currSymbol}${last.atr.toFixed(2)} (${((last.atr/last.close)*100).toFixed(2)}%)</td><td>Volatility</td></tr>` : ''}
        ${last?.vwap != null ? `<tr><td>VWAP</td><td>${currSymbol}${last.vwap.toFixed(2)}</td><td class="${last.close > last.vwap ? 'green' : 'red'}">${last.close > last.vwap ? 'Above' : 'Below'}</td></tr>` : ''}
        ${analysis?.support ? `<tr><td>Support Level</td><td class="green">${currSymbol}${analysis.support.toFixed(2)}</td><td></td></tr>` : ''}
        ${analysis?.resistance ? `<tr><td>Resistance Level</td><td class="red">${currSymbol}${analysis.resistance.toFixed(2)}</td><td></td></tr>` : ''}
      </table>

      <!-- Market Data -->
      <h2>📋 Market Data</h2>
      <div class="grid4">
        <div class="box"><div class="label">Volume</div><div class="sm-val">${quote?.regularMarketVolume?.toLocaleString()}</div></div>
        <div class="box"><div class="label">Avg Volume</div><div class="sm-val">${quote?.averageDailyVolume3Month?.toLocaleString() || 'N/A'}</div></div>
        <div class="box"><div class="label">Market Cap</div><div class="sm-val">${currSymbol}${(quote?.marketCap/10000000)?.toFixed(0)} Cr</div></div>
        <div class="box"><div class="label">P/E Ratio</div><div class="sm-val">${quote?.trailingPE?.toFixed(2) || 'N/A'}</div></div>
      </div>
      <div class="grid4">
        <div class="box"><div class="label">Volume Trend</div><div class="sm-val">${analysis?.volumeTrend || '—'}</div></div>
        <div class="box"><div class="label">EPS</div><div class="sm-val">${quote?.epsTrailingTwelveMonths?.toFixed(2) || 'N/A'}</div></div>
        <div class="box"><div class="label">Div Yield</div><div class="sm-val">${quote?.dividendYield ? (quote.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</div></div>
        <div class="box"><div class="label">Beta</div><div class="sm-val">${quote?.beta?.toFixed(2) || 'N/A'}</div></div>
      </div>

      <div class="footer">
        ⚠️ This report is for educational purposes only. Not financial advice.<br/>
        StockEdge AI Stock Market Predictor · ${new Date().getFullYear()}
      </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 800);
  };

  const fetchTrending = useCallback(async (country) => {
    setTrendingLoading(true);
    try {
      const { data } = await axios.get(`${API}/stocks/trending?country=${encodeURIComponent(country)}`);
      setTrending(data || []);
    } catch (e) {
      console.error('Trending error:', e);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const locRes = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const country = locRes.data.address?.country || 'India';
            const city = locRes.data.address?.city || locRes.data.address?.town || locRes.data.address?.state_district || '';
            const market = MARKET_INFO[country] || DEFAULT_MARKET;
            setLocationInfo({ country, city, market });
            fetchTrending(country);
            setLocationGranted(true);
          } catch (error) {
            console.warn("Location fetch failed, falling back to default:", error);
            setLocationInfo({ country: 'India', city: '', market: DEFAULT_MARKET });
            fetchTrending('India');
            setLocationGranted(true);
          }
        },
        (error) => {
          console.error("Location permission denied or error:", error);
          setLocationError("Location access is required to use this application.");
        }
      );
    } else {
      console.error("Geolocation is not supported by your browser.");
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, [fetchTrending]);

  const handleSearch = async (sym = symbol, isPolling = false) => {
    if (!sym) return;
    if (!isPolling) {
      setLoading(true);
      setError('');
      setStockData(null);
    }
    try {
      const days = TIMEFRAME_MAP[timeframe] || 1;
      const period1 = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Determine interval strictly based on timeframe to allow true live candle movement
      let interval = '1d';
      if (timeframe === '1D') interval = '2m'; // Yahoo only supports intraday up to 7 days-60 days based on granularity
      else if (timeframe === '1W') interval = '15m';
      else if (timeframe === '1M') interval = '1h';

      const config = {};
      if (user) {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo && userInfo.token) config.headers = { Authorization: `Bearer ${userInfo.token}` };
      }
      const countryParam = locationInfo?.country ? `&country=${encodeURIComponent(locationInfo.country)}` : '';
      const pollParam = isPolling ? '&polling=true' : '';
      const { data } = await axios.get(`${API}/stocks/${sym}?period1=${period1}&interval=${interval}${countryParam}${pollParam}`, config);
      setStockData(data);
      if (!isPolling) setSymbol(sym.toUpperCase());
    } catch (err) {
      if (!isPolling) setError(err.response?.data?.message || 'Symbol not found or data unavailable.');
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    if (!stockData || !symbol) return;
    
    // Poll every 1 second for real-time price updates
    const interval = setInterval(() => {
      handleSearch(symbol, true);
    }, 1000);

    return () => clearInterval(interval);
  }, [stockData, symbol, locationInfo.market, timeframe]);

  const marketStatus = getMarketStatus(locationInfo.market, locationInfo.country);
  const lastBar = stockData?.analysis?.historical?.[stockData.analysis.historical.length - 1];
  const signal = stockData?.analysis?.signal;
  const quote = stockData?.quote;
  const currSym = locationInfo.market.symbol;

  if (locationError) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(220, 20, 20, 0.25)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div className="animate-fade-in card" style={{ textAlign: 'center', width: '90%', maxWidth: 450, padding: '40px 30px', background: 'linear-gradient(145deg, #4a0d0d, #2d0505)', border: '1px solid #ff4444', boxShadow: '0 20px 50px rgba(255, 0, 0, 0.4)', borderRadius: 24 }}>
          <MapPin size={50} color="#ff8888" style={{ marginBottom: 20 }} />
          <h2 style={{ marginBottom: 12, color: '#ffeeee', fontSize: '1.8rem' }}>Location Required</h2>
          <p style={{ color: '#ffbbbb', fontSize: '1rem', marginBottom: 16 }}>{locationError}</p>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 12, marginTop: 24 }}>
            <p style={{ margin: 0, color: '#ffdddd', fontSize: '0.9rem', lineHeight: 1.5 }}>
              StockEdge requires your location to determine active trading hours and local market data. Please allow location access in your browser.
            </p>
          </div>
          <button className="btn" onClick={() => window.location.reload()} style={{ width: '100%', marginTop: 24, background: '#e53935', color: 'white', border: 'none', fontWeight: 'bold', padding: '12px', fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(229, 57, 53, 0.4)' }}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!locationGranted) {
    return (
      <div className="animate-fade-in card glass-panel" style={{ textAlign: 'center', margin: '40px auto', maxWidth: 440, padding: '36px 40px' }}>
        {/* Pulsing location pin animation */}
        <div style={{ display: 'inline-block', marginBottom: 20 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Radar pulse rings */}
            <circle cx="60" cy="60" r="20" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0">
              <animate attributeName="r" from="18" to="55" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="60" cy="60" r="20" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0">
              <animate attributeName="r" from="18" to="55" dur="2s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="2s" begin="0.6s" repeatCount="indefinite" />
            </circle>
            <circle cx="60" cy="60" r="20" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0">
              <animate attributeName="r" from="18" to="55" dur="2s" begin="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.3" to="0" dur="2s" begin="1.2s" repeatCount="indefinite" />
            </circle>
            {/* Map pin icon */}
            <g transform="translate(60, 56)">
              {/* Pin body */}
              <path d="M0,-22 C-12,-22 -18,-14 -18,-6 C-18,6 0,24 0,24 C0,24 18,6 18,-6 C18,-14 12,-22 0,-22Z"
                fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5">
                <animate attributeName="fill" values="#3b82f6;#60a5fa;#3b82f6" dur="2s" repeatCount="indefinite" />
              </path>
              {/* Inner circle */}
              <circle cx="0" cy="-6" r="7" fill="#ffffff" />
              <circle cx="0" cy="-6" r="4" fill="#3b82f6">
                <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>
          Requesting location access to set up your local market...
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Top bar */}
      <div className="d-flex justify-between align-center mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="title-glow" style={{ fontSize: '1.8rem' }}>
            <BarChart2 size={26} style={{ verticalAlign: 'middle', marginRight: 10, color: 'var(--accent-blue)' }} />
            Market Dashboard
          </h1>
          <div className="d-flex align-center gap-3" style={{ marginTop: 6, flexWrap: 'wrap', gap: 16 }}>
            <span className="d-flex align-center gap-2 text-muted text-sm">
              <MapPin size={13} /> {locationInfo.city ? `${locationInfo.city}, ` : ''}{locationInfo.country}
            </span>
            <span className="d-flex align-center gap-2 text-muted text-sm">
              <Globe size={13} />
              {locationInfo.market.markets.join('/')}
            </span>
            <span className={`d-flex align-center gap-2 text-sm ${marketStatus.open ? 'text-green' : 'text-red'}`}>
              <Clock size={13} />
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: marketStatus.open ? 'var(--accent-green)' : 'var(--accent-red)', marginRight: 4, boxShadow: marketStatus.open ? '0 0 6px var(--accent-green)' : 'none' }}></span>
              {marketStatus.label}
            </span>
          </div>
        </div>
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn"
          style={{
            padding: '8px 14px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8rem',
            background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          {darkMode ? 'Light' : 'Dark'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 640 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search stock symbol (e.g. AAPL, TSLA, RELIANCE.NS, TCS.NS)…"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ paddingLeft: 44 }}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleSearch()}
          disabled={loading || !symbol}
          style={{ minWidth: 120 }}
        >
          {loading ? <><RefreshCw size={16} className="spin" /> Fetching…</> : <><Search size={16} /> Analyse</>}
        </button>
      </div>

      {error && (
        <div className="card glass-panel mb-4" style={{ border: '1px solid var(--accent-red)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} color="var(--accent-red)" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Watchlist (shown when no stock selected) */}
      {!stockData && !loading && (
        <Watchlist onSelectStock={(s) => { setSymbol(s); handleSearch(s); }} />
      )}

      {/* Trending section (only shown when no stock selected) */}
      {!stockData && !loading && (
        <div className="card glass-panel" style={{ marginBottom: 24 }}>
          <div className="d-flex justify-between align-center mb-4">
            <h3 className="card-title" style={{ margin: 0 }}>
              <TrendingUp size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Trending in {locationInfo.country}
            </h3>
            <span className="text-sm text-muted">{locationInfo.market.currency} · Click to analyse</span>
          </div>
          {trendingLoading ? (
            <div className="spinner" style={{ marginTop: 20 }}></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {trending.map((t) => {
                const pos = (t.regularMarketChangePercent || 0) >= 0;
                // Generate sparkline SVG path from data
                const sparkline = t.sparkline || [];
                let sparkPath = '';
                let sparkArea = '';
                if (sparkline.length > 2) {
                  const min = Math.min(...sparkline);
                  const max = Math.max(...sparkline);
                  const range = max - min || 1;
                  const w = 180, h = 36;
                  const points = sparkline.map((v, i) => {
                    const x = (i / (sparkline.length - 1)) * w;
                    const y = h - ((v - min) / range) * (h - 4) - 2;
                    return `${x},${y}`;
                  });
                  sparkPath = `M${points.join(' L')}`;
                  sparkArea = `${sparkPath} L${w},${h} L0,${h} Z`;
                }
                return (
                  <div
                    key={t.symbol}
                    className="metric-box"
                    style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--panel-border)', position: 'relative', overflow: 'hidden' }}
                    onClick={() => { setSymbol(t.symbol); handleSearch(t.symbol); }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--panel-border)'}
                  >
                    <div className="d-flex justify-between align-center">
                      <strong style={{ fontSize: '0.85rem' }}>{t.symbol?.replace('.NS', '').replace('.L', '')}</strong>
                      {pos ? <TrendingUp size={16} color="var(--accent-green)" /> : <TrendingDown size={16} color="var(--accent-red)" />}
                    </div>
                    <div className="metric-value" style={{ fontSize: '1.3rem' }}>
                      {t.regularMarketPrice ? `${t.regularMarketPrice?.toFixed(2)}` : '—'}
                    </div>
                    <div className={`text-sm ${pos ? 'text-green' : 'text-red'}`}>
                      {pos ? '+' : ''}{t.regularMarketChangePercent?.toFixed(2)}%
                    </div>
                    {/* Sparkline */}
                    {sparkPath && (
                      <svg width="100%" height="36" viewBox="0 0 180 36" preserveAspectRatio="none"
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.25 }}>
                        <defs>
                          <linearGradient id={`sg-${t.symbol?.replace('.', '-')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={pos ? '#22c55e' : '#ef4444'} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={pos ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d={sparkArea} fill={`url(#sg-${t.symbol?.replace('.', '-')})`} />
                        <path d={sparkPath} fill="none" stroke={pos ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
                      </svg>
                    )}
                    <div className="text-sm text-muted" style={{ marginTop: 4, fontSize: '0.75rem', position: 'relative' }}>
                      {t.shortName || t.longName || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card glass-panel" style={{ textAlign: 'center', padding: '30px 40px' }}>
          <ChartLoader size={160} label={`Fetching data & running analysis for ${symbol}…`} />
        </div>
      )}

      {/* Stock Detail Dashboard */}
      {stockData && !loading && (
        <>
          {/* Quote header */}
          <div className="card glass-panel mb-4" style={{ padding: '20px 24px' }}>
            <div className="d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="text-muted text-sm">{quote?.symbol}</div>
                <h2 style={{ fontSize: '1.6rem', marginTop: 2 }}>{quote?.longName || quote?.shortName || quote?.symbol}</h2>
                <div className="d-flex align-center gap-3" style={{ marginTop: 6 }}>
                  <span style={{ fontSize: '2rem', fontFamily: 'Outfit', fontWeight: 700 }}>
                    {currSym}{quote?.regularMarketPrice?.toFixed(2)}
                  </span>
                  <span className={`${(quote?.regularMarketChange || 0) >= 0 ? 'text-green' : 'text-red'}`} style={{ fontWeight: 600 }}>
                    {(quote?.regularMarketChange || 0) >= 0 ? '+' : ''}
                    {quote?.regularMarketChange?.toFixed(2)} ({quote?.regularMarketChangePercent?.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'right' }}>
                <div>
                  <div className="text-muted text-sm">Open</div>
                  <div className="text-sm">{currSym}{quote?.regularMarketOpen?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">Prev Close</div>
                  <div className="text-sm">{currSym}{quote?.regularMarketPreviousClose?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">52W High</div>
                  <div className="text-sm text-green">{currSym}{quote?.fiftyTwoWeekHigh?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted text-sm">52W Low</div>
                  <div className="text-sm text-red">{currSym}{quote?.fiftyTwoWeekLow?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="d-flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                className="btn"
                onClick={() => { setTimeframe(tf); handleSearch(); }}
                style={{
                  background: timeframe === tf ? 'var(--accent-blue)' : 'transparent',
                  border: `1px solid ${timeframe === tf ? 'var(--accent-blue)' : 'var(--panel-border)'}`,
                  color: timeframe === tf ? 'white' : 'var(--text-secondary)',
                  minWidth: 52,
                }}
              >
                {tf}
              </button>
            ))}
            <button
              className="btn"
              onClick={() => setShowFullHistory(true)}
              style={{ border: '1px solid rgba(88,166,255,0.45)', color: '#58a6ff', background: 'rgba(88,166,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <History size={14} /> Full History
            </button>
            <button
              className="btn"
              onClick={() => setShowCompanyDetails(true)}
              style={{ border: '1px solid rgba(88,166,255,0.45)', color: '#58a6ff', background: 'rgba(88,166,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Building2 size={14} /> Company Details
            </button>
            <button
              className="btn"
              onClick={exportToPDF}
              style={{ border: '1px solid rgba(88,166,255,0.45)', color: '#58a6ff', background: 'rgba(88,166,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} /> Export PDF
            </button>
            <AddToWatchlistBtn symbol={stockData?.quote?.symbol || symbol} />
            <button
              className="btn"
              onClick={() => { setStockData(null); setSymbol(''); setError(''); }}
              style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}
            >
              ✕ Back
            </button>
          </div>

          <div className="dashboard-grid">
            {/* Chart */}
            <div id="pdf-chart" className="card glass-panel" style={{ minHeight: 460 }}>
              <div className="d-flex justify-between align-center mb-3">
                <span className="text-muted text-sm">
                  Candlestick · Bollinger Bands · Prediction overlay
                </span>
              </div>
              <Chart
                key={`${stockData.quote?.symbol || symbol}-${timeframe}`}
                data={stockData.analysis.historical}
                predictionData={stockData.analysis.prediction}
              />
            </div>

            {/* Right side panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Price Alerts */}
              <PriceAlerts
                currentSymbol={stockData?.quote?.symbol}
                currentPrice={stockData?.quote?.regularMarketPrice}
              />

              {/* AI Signal — Gauge */}
              <div id="pdf-gauge" className={`card glass-panel ${signal === 'BUY' ? 'signal-buy' : signal === 'SELL' ? 'signal-sell' : 'signal-hold'}`} style={{ textAlign: 'center' }}>
                <div className="d-flex align-center gap-2 mb-2" style={{ justifyContent: 'center' }}>
                  <Activity size={18} />
                  <h3 style={{ margin: 0, fontSize: '0.95rem' }}>AI Recommendation</h3>
                </div>
                <SemiCircleGauge
                  value={
                    signal === 'BUY'
                      ? 50 + (stockData.analysis.confidence / 100) * 50
                      : signal === 'SELL'
                      ? 50 - (stockData.analysis.confidence / 100) * 50
                      : 50
                  }
                  signal={signal}
                  confidence={stockData.analysis.confidence}
                  trend={stockData.analysis.trend}
                />
              </div>

              {/* Chart Patterns Detected */}
              {stockData.analysis.patterns?.length > 0 && (
                <div className="card glass-panel">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={16} />
                    Patterns Detected
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stockData.analysis.patterns.map((p, i) => (
                      <div key={i} style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: p.type === 'bullish' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${p.type === 'bullish' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}>
                        <div className="d-flex justify-between align-center">
                          <strong style={{ fontSize: '0.85rem' }}>{p.name}</strong>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontWeight: 600,
                              background: p.type === 'bullish' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                              color: p.type === 'bullish' ? '#16a34a' : '#dc2626',
                            }}
                          >
                            {p.type.toUpperCase()} · {p.confidence}%
                          </span>
                        </div>
                        <div className="text-muted text-sm" style={{ marginTop: 4 }}>{p.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Predicted Prices */}
              {stockData.analysis.prediction?.length > 0 && (
                <div className="card glass-panel">
                  <h3 className="card-title">5-Day Forecast</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(() => {
                      const today = new Date();
                      let currentDate = new Date(today);
                      return stockData.analysis.prediction.map((p, i) => {
                        do {
                          currentDate.setDate(currentDate.getDate() + 1);
                        } while (currentDate.getDay() === 0 || currentDate.getDay() === 6);

                        const d = new Date(currentDate);
                        const up = p >= (quote?.regularMarketPrice || 0);
                        return (
                          <div key={i} className="d-flex justify-between align-center" style={{ padding: '6px 0', borderBottom: '1px solid var(--panel-border)' }}>
                            <span className="text-sm text-muted">{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className={`text-sm ${up ? 'text-green' : 'text-red'}`}>
                              {up ? '↑' : '↓'} {currSym}{p.toFixed(2)}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Technical Indicators */}
              <div id="pdf-indicators" className="card glass-panel">
                <h3 className="card-title">Technical Indicators</h3>
                {lastBar && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* RSI */}
                    <div>
                      <div className="d-flex justify-between text-sm mb-2">
                        <span className="text-muted">RSI (14)</span>
                        <span className={lastBar.rsi > 70 ? 'text-red' : lastBar.rsi < 30 ? 'text-green' : 'text-primary'}>
                          {lastBar.rsi?.toFixed(1) || 'N/A'}
                          {lastBar.rsi > 70 ? ' Overbought' : lastBar.rsi < 30 ? ' Oversold' : ''}
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, position: 'relative' }}>
                        <div style={{
                          width: `${Math.min(100, Math.max(0, lastBar.rsi || 50))}%`,
                          height: '100%',
                          background: lastBar.rsi > 70 ? 'var(--accent-red)' : lastBar.rsi < 30 ? 'var(--accent-green)' : 'var(--accent-blue)',
                          borderRadius: 3,
                          transition: 'width 0.5s ease'
                        }}></div>
                        <div style={{ position: 'absolute', left: '70%', top: -2, height: 9, width: 1, background: 'rgba(255,100,100,0.5)' }}></div>
                        <div style={{ position: 'absolute', left: '30%', top: -2, height: 9, width: 1, background: 'rgba(100,255,100,0.5)' }}></div>
                      </div>
                    </div>

                    {/* Stochastic Oscillator */}
                    {lastBar.stochK != null && (
                      <div>
                        <div className="d-flex justify-between text-sm mb-2">
                          <span className="text-muted">Stochastic %K / %D</span>
                          <span className={lastBar.stochK > 80 ? 'text-red' : lastBar.stochK < 20 ? 'text-green' : 'text-primary'}>
                            {lastBar.stochK?.toFixed(1)} / {lastBar.stochD?.toFixed(1) || '—'}
                            {lastBar.stochK > 80 ? ' Overbought' : lastBar.stochK < 20 ? ' Oversold' : ''}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, position: 'relative' }}>
                          <div style={{ width: `${Math.min(100, Math.max(0, lastBar.stochK))}%`, height: '100%', background: '#a855f7', borderRadius: 3, transition: 'width 0.5s ease' }}></div>
                          <div style={{ position: 'absolute', left: '80%', top: -2, height: 9, width: 1, background: 'rgba(255,100,100,0.5)' }}></div>
                          <div style={{ position: 'absolute', left: '20%', top: -2, height: 9, width: 1, background: 'rgba(100,255,100,0.5)' }}></div>
                        </div>
                      </div>
                    )}

                    {/* Bollinger Position */}
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">BB Upper</span>
                      <span>{currSym}{lastBar.bbUpper?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">BB Middle (SMA20)</span>
                      <span>{currSym}{lastBar.bbMiddle?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">BB Lower</span>
                      <span>{currSym}{lastBar.bbLower?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--panel-border)' }}></div>
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">SMA 50</span>
                      <span>{lastBar.sma50 ? `${currSym}${lastBar.sma50.toFixed(2)}` : 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">SMA 200</span>
                      <span>{lastBar.sma200 ? `${currSym}${lastBar.sma200.toFixed(2)}` : 'N/A'}</span>
                    </div>

                    {/* Golden / Death Cross */}
                    {stockData.analysis.crossSignal && stockData.analysis.crossSignal !== 'NONE' && (
                      <div className="d-flex justify-between text-sm">
                        <span className="text-muted">SMA 50/200 Cross</span>
                        <span className={stockData.analysis.crossSignal.includes('GOLDEN') || stockData.analysis.crossSignal.includes('BULLISH') ? 'text-green' : 'text-red'} style={{ fontWeight: 600 }}>
                          {stockData.analysis.crossSignal === 'GOLDEN' ? '★ Golden Cross' :
                           stockData.analysis.crossSignal === 'DEATH' ? '✕ Death Cross' :
                           stockData.analysis.crossSignal === 'BULLISH_ALIGNED' ? '↑ Bullish Aligned' : '↓ Bearish Aligned'}
                        </span>
                      </div>
                    )}

                    <div style={{ height: 1, background: 'var(--panel-border)', margin: '4px 0' }}></div>
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">MACD (12, 26)</span>
                      <span className={lastBar.macd > 0 ? 'text-green' : 'text-red'}>{lastBar.macd?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">MACD Signal (9)</span>
                      <span>{lastBar.macdSignal?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-between text-sm">
                      <span className="text-muted">MACD Histogram</span>
                      <span className={lastBar.macdHistogram > 0 ? 'text-green' : 'text-red'}>{lastBar.macdHistogram > 0 ? '+' : ''}{lastBar.macdHistogram?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--panel-border)', margin: '4px 0' }}></div>

                    {/* ATR */}
                    {lastBar.atr != null && (
                      <div className="d-flex justify-between text-sm">
                        <span className="text-muted">ATR (14) — Volatility</span>
                        <span>{currSym}{lastBar.atr?.toFixed(2)} <span className="text-muted">({((lastBar.atr / lastBar.close) * 100).toFixed(2)}%)</span></span>
                      </div>
                    )}

                    {/* VWAP */}
                    {lastBar.vwap != null && (
                      <div className="d-flex justify-between text-sm">
                        <span className="text-muted">VWAP</span>
                        <span className={lastBar.close > lastBar.vwap ? 'text-green' : 'text-red'}>
                          {currSym}{lastBar.vwap?.toFixed(2)} {lastBar.close > lastBar.vwap ? '(Above)' : '(Below)'}
                        </span>
                      </div>
                    )}

                    {/* Support / Resistance */}
                    {(stockData.analysis.support || stockData.analysis.resistance) && (
                      <>
                        <div style={{ height: 1, background: 'var(--panel-border)', margin: '4px 0' }}></div>
                        {stockData.analysis.resistance && (
                          <div className="d-flex justify-between text-sm">
                            <span className="text-muted">Resistance Level</span>
                            <span className="text-red">{currSym}{stockData.analysis.resistance.toFixed(2)}</span>
                          </div>
                        )}
                        {stockData.analysis.support && (
                          <div className="d-flex justify-between text-sm">
                            <span className="text-muted">Support Level</span>
                            <span className="text-green">{currSym}{stockData.analysis.support.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Volume Trend */}
                    {stockData.analysis.volumeTrend && (
                      <div className="d-flex justify-between text-sm">
                        <span className="text-muted">Volume Trend</span>
                        <span className={stockData.analysis.volumeTrend === 'HIGH' ? 'text-green' : stockData.analysis.volumeTrend === 'LOW' ? 'text-red' : 'text-muted'} style={{ fontWeight: 500 }}>
                          {stockData.analysis.volumeTrend === 'HIGH' ? '▲ Above Average' : stockData.analysis.volumeTrend === 'LOW' ? '▼ Below Average' : '— Normal'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="d-flex align-center gap-2 text-sm text-muted" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--panel-border)' }}>
                  <AlertCircle size={13} />
                  <span>Not financial advice. For educational use only.</span>
                </div>
              </div>

              {/* Volume & Market Cap */}
              <div className="card glass-panel">
                <h3 className="card-title">Market Data</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="d-flex justify-between text-sm">
                    <span className="text-muted">Volume</span>
                    <span>{quote?.regularMarketVolume?.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-between text-sm">
                    <span className="text-muted">Avg Volume</span>
                    <span>{quote?.averageDailyVolume3Month?.toLocaleString() || '—'}</span>
                  </div>
                  <div className="d-flex justify-between text-sm">
                    <span className="text-muted">Market Cap</span>
                    <span>{quote?.marketCap ? `${(quote.marketCap / 1e9).toFixed(2)}B` : '—'}</span>
                  </div>
                  <div className="d-flex justify-between text-sm">
                    <span className="text-muted">P/E Ratio</span>
                    <span>{quote?.trailingPE?.toFixed(2) || '—'}</span>
                  </div>
                  <div className="d-flex justify-between text-sm">
                    <span className="text-muted">Exchange</span>
                    <span>{quote?.fullExchangeName || quote?.exchange || '—'}</span>
                  </div>
                  <div className="d-flex justify-between text-sm">
                    <span className="text-muted">Currency</span>
                    <span>{quote?.currency || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* News Feed */}
          {stockData.news?.length > 0 && (
            <div className="card glass-panel" style={{ marginTop: 24 }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={16} />
                Related News
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {stockData.news.map((n, i) => (
                  <a
                    key={i}
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.03)',
                      borderRadius: 10,
                      border: '1px solid var(--panel-border)',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'rgba(88,166,255,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--panel-border)'; e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                  >
                    {n.thumbnail && (
                      <img
                        src={n.thumbnail}
                        alt=""
                        style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {n.title}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: 4, display: 'flex', gap: 8 }}>
                        <span>{n.publisher}</span>
                        {n.publishedAt && <span>• {new Date(n.publishedAt * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}



      {/* Sector Heatmap (shown when no stock selected) */}
      {!stockData && !loading && (
        <SectorHeatmap country={locationInfo.country} />
      )}
    </div>

      {/* Full History Modal */}
      {showFullHistory && stockData && (
        <FullHistoryModal
          symbol={stockData.quote?.symbol || symbol}
          currSym={currSym}
          country={locationInfo.country}
          onClose={() => setShowFullHistory(false)}
        />
      )}

      {/* Company Details Modal */}
      {showCompanyDetails && stockData && (
        <CompanyDetails
          symbol={stockData.quote?.symbol || symbol}
          onClose={() => setShowCompanyDetails(false)}
        />
      )}
    </>
  );
};

export default Dashboard;

