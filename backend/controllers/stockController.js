const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const { processStockData } = require('../services/predictionService');
const History = require('../models/History');

// Suppress Yahoo Finance validation warnings
try { yahooFinance.setGlobalConfig({ validation: { logErrors: false } }); } catch {}

const COUNTRY_SYMBOLS = {
  'India': ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'WIPRO.NS'],
  'United Kingdom': ['HSBA.L', 'BP.L', 'AZN.L', 'ULVR.L', 'VOD.L'],
  'Germany': ['SAP.DE', 'BMW.DE', 'SIE.DE', 'BAYN.DE', 'ALV.DE'],
  'Japan': ['7203.T', '9984.T', '6758.T', '8306.T', '9432.T'],
  'Canada': ['SHOP.TO', 'RY.TO', 'TD.TO', 'ENB.TO', 'BMO.TO'],
  'Australia': ['CBA.AX', 'BHP.AX', 'ANZ.AX', 'CLS.AX', 'WBC.AX'],
  'China': ['600519.SS', '601398.SS', '601288.SS', '601939.SS', '601857.SS'],
  'Hong Kong': ['0700.HK', '9988.HK', '3690.HK', '0939.HK', '0005.HK'],
  'France': ['MC.PA', 'OR.PA', 'RMS.PA', 'TTE.PA', 'SAN.PA'],
  'Brazil': ['VALE3.SA', 'PETR4.SA', 'ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA'],
  'South Korea': ['005930.KS', '000660.KS', '051910.KS', '207940.KS', '005380.KS'],
  'South Africa': ['NPN.JO', 'PRX.JO', 'CFR.JO', 'FSR.JO', 'MTN.JO'],
  'United States': ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN'],
  'default': ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN'],
};

const COUNTRY_SUFFIXES = {
  'India': ['.NS', '.BO'],
  'United Kingdom': ['.L'],
  'Germany': ['.DE'],
  'Japan': ['.T'],
  'Canada': ['.TO'],
  'Australia': ['.AX'],
  'China': ['.SS', '.SZ'],
  'Hong Kong': ['.HK'],
  'France': ['.PA'],
  'Brazil': ['.SA'],
  'South Korea': ['.KS', '.KQ'],
  'South Africa': ['.JO'],
  'United States': [],
  'default': []
};

const getStockData = async (req, res) => {
  const { symbol } = req.params;
  const { period1, period2, interval, country } = req.query;

  try {
    let targetSymbol = symbol.toUpperCase();
    
    let news = [];
    // Always attempt to resolve company name to a valid ticker via yahooFinance search
    try {
      const searchRes = await yahooFinance.search(symbol);
      news = searchRes.news || [];
      const suffixes = COUNTRY_SUFFIXES[country] || [];
      
      const exactMatch = searchRes.quotes.find(q => q.symbol && q.symbol.toUpperCase() === targetSymbol);
      
      const exactBaseCountryMatch = searchRes.quotes.find(q => 
        q.symbol && suffixes.some(s => q.symbol.toUpperCase() === targetSymbol + s)
      );
      
      const countryMatch = searchRes.quotes.find(q => 
        q.quoteType === 'EQUITY' && q.symbol && suffixes.some(s => q.symbol.toUpperCase().endsWith(s))
      );

      let bestMatch;
      if (targetSymbol.includes('.')) {
        bestMatch = exactMatch || exactBaseCountryMatch || countryMatch || searchRes.quotes.find(q => q.quoteType === 'EQUITY') || searchRes.quotes[0];
      } else {
        bestMatch = exactBaseCountryMatch || exactMatch || countryMatch || searchRes.quotes.find(q => q.quoteType === 'EQUITY') || searchRes.quotes[0];
      }
      
      if (bestMatch && bestMatch.symbol) {
        targetSymbol = bestMatch.symbol;
      }
    } catch (e) {
      console.error('Search fallback error:', e.message);
    }

    const queryOptions = {
      period1: period1 || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      interval: interval || '1d',
    };
    if (period2) queryOptions.period2 = period2;

    const [result, quote] = await Promise.all([
      yahooFinance.chart(targetSymbol, queryOptions, { validateResult: false }),
      yahooFinance.quote(targetSymbol, {}, { validateResult: false }),
    ]);

    const chartData = result.quotes || [];
    if (chartData.length === 0) {
      return res.status(404).json({ message: `No data found for symbol: ${targetSymbol}` });
    }

    const processedData = processStockData(chartData, news);

    if (req.user && req.query.polling !== 'true') {
      console.log("Saving history. User:", req.user._id, targetSymbol);
      History.create({
        user: req.user._id,
        symbol: targetSymbol,
        action: 'SEARCH',
        metadata: {
          currentPrice: quote?.regularMarketPrice,
          signal: processedData.signal,
        }
      })
      .then(doc => console.log("Successfully created history!", doc._id))
      .catch(err => console.error('Failed to save search history:', err.message));
    }

    res.json({
      quote,
      analysis: processedData,
      news: news.slice(0, 8).map(n => ({
        title: n.title,
        publisher: n.publisher,
        link: n.link,
        publishedAt: n.providerPublishTime,
        thumbnail: n.thumbnail?.resolutions?.[0]?.url || null,
      })),
    });
  } catch (error) {
    console.error(`Stock error [${symbol}]:`, error.message);
    res.status(500).json({ message: 'Error fetching stock data', error: error.message });
  }
};

const getTrendingOptions = async (req, res) => {
  const { country } = req.query;
  const symbols = COUNTRY_SYMBOLS[country] || COUNTRY_SYMBOLS['default'];

  try {
    // Fetch quotes + 1-day sparkline data in parallel
    const results = await Promise.allSettled(
      symbols.map(async (s) => {
        const [quote, chart] = await Promise.all([
          yahooFinance.quote(s, {}, { validateResult: false }),
          yahooFinance.chart(s, {
            period1: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            interval: '15m',
          }, { validateResult: false }).catch(() => null),
        ]);
        // Extract sparkline close prices (last ~26 points = 1 trading day at 15m)
        const sparkline = chart?.quotes
          ?.filter(q => q.close != null)
          ?.slice(-26)
          ?.map(q => q.close) || [];
        return { ...quote, sparkline };
      })
    );
    const validQuotes = results
      .filter(r => r.status === 'fulfilled' && r.value?.regularMarketPrice)
      .map(r => r.value);

    res.json(validQuotes);
  } catch (error) {
    console.error('Trending error:', error.message);
    res.status(500).json({ message: 'Error fetching trending stocks' });
  }
};

const getFullHistory = async (req, res) => {
  const { symbol } = req.params;
  const { country } = req.query;

  try {
    let targetSymbol = symbol.toUpperCase();

    // Resolve symbol via search
    try {
      const searchRes = await yahooFinance.search(symbol);
      const suffixes = COUNTRY_SUFFIXES[country] || [];
      const exactMatch = searchRes.quotes.find(q => q.symbol && q.symbol.toUpperCase() === targetSymbol);
      const exactBaseCountryMatch = searchRes.quotes.find(q =>
        q.symbol && suffixes.some(s => q.symbol.toUpperCase() === targetSymbol + s)
      );
      const countryMatch = searchRes.quotes.find(q =>
        q.quoteType === 'EQUITY' && q.symbol && suffixes.some(s => q.symbol.toUpperCase().endsWith(s))
      );
      let bestMatch;
      if (targetSymbol.includes('.')) {
        bestMatch = exactMatch || exactBaseCountryMatch || countryMatch || searchRes.quotes.find(q => q.quoteType === 'EQUITY') || searchRes.quotes[0];
      } else {
        bestMatch = exactBaseCountryMatch || exactMatch || countryMatch || searchRes.quotes.find(q => q.quoteType === 'EQUITY') || searchRes.quotes[0];
      }
      if (bestMatch && bestMatch.symbol) targetSymbol = bestMatch.symbol;
    } catch (e) {
      console.error('Search fallback error:', e.message);
    }

    // Fetch maximum history — Yahoo Finance supports data back to IPO
    const queryOptions = {
      period1: '1900-01-01', // Yahoo will return from earliest available date
      interval: '1wk',      // Weekly intervals for long-term view
    };

    const [result, quote] = await Promise.all([
      yahooFinance.chart(targetSymbol, queryOptions, { validateResult: false }),
      yahooFinance.quote(targetSymbol, {}, { validateResult: false }),
    ]);

    const chartData = result.quotes || [];
    if (chartData.length === 0) {
      return res.status(404).json({ message: `No data found for symbol: ${targetSymbol}` });
    }

    // Run standard technical analysis
    const processedData = processStockData(chartData);

    // ---- Compute full-history statistics ----
    const closes = chartData.map(d => d.close).filter(v => Number.isFinite(v));
    const highs  = chartData.map(d => d.high).filter(v => Number.isFinite(v));
    const lows   = chartData.map(d => d.low).filter(v => Number.isFinite(v));
    const volumes = chartData.map(d => d.volume).filter(v => Number.isFinite(v));

    const ath = Math.max(...highs);
    const atl = Math.min(...lows.filter(v => v > 0));
    const firstClose = closes[0];
    const lastClose  = closes[closes.length - 1];
    const totalReturnPct = firstClose > 0 ? ((lastClose - firstClose) / firstClose) * 100 : 0;

    // CAGR
    const firstDate = new Date(chartData[0].date || chartData[0].time);
    const lastDate  = new Date(chartData[chartData.length - 1].date || chartData[chartData.length - 1].time);
    const years = (lastDate - firstDate) / (365.25 * 24 * 60 * 60 * 1000);
    const cagr = years > 0 && firstClose > 0 ? (Math.pow(lastClose / firstClose, 1 / years) - 1) * 100 : 0;

    // Annualized Volatility (weekly returns stddev * sqrt(52))
    const weeklyReturns = [];
    for (let i = 1; i < closes.length; i++) {
      if (closes[i - 1] > 0) weeklyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    const meanReturn = weeklyReturns.reduce((a, b) => a + b, 0) / weeklyReturns.length;
    const variance = weeklyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / weeklyReturns.length;
    const annualizedVolatility = Math.sqrt(variance) * Math.sqrt(52) * 100;

    // Max Drawdown
    let peak = -Infinity;
    let maxDrawdown = 0;
    let drawdownStart = null, drawdownEnd = null, peakDate = null;
    for (let i = 0; i < chartData.length; i++) {
      const c = chartData[i].close;
      if (!Number.isFinite(c)) continue;
      if (c > peak) { peak = c; peakDate = chartData[i].date || chartData[i].time; }
      const dd = (peak - c) / peak * 100;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
        drawdownStart = peakDate;
        drawdownEnd = chartData[i].date || chartData[i].time;
      }
    }

    // Yearly performance breakdown
    const yearlyMap = {};
    chartData.forEach(d => {
      const dt = new Date(d.date || d.time);
      const yr = dt.getFullYear();
      if (!Number.isFinite(d.close)) return;
      if (!yearlyMap[yr]) yearlyMap[yr] = { open: d.close, close: d.close, high: d.high || d.close, low: d.low || d.close, year: yr };
      else {
        yearlyMap[yr].close = d.close;
        if ((d.high || 0) > yearlyMap[yr].high) yearlyMap[yr].high = d.high;
        if ((d.low || Infinity) < yearlyMap[yr].low) yearlyMap[yr].low = d.low;
      }
    });
    const yearlyPerformance = Object.values(yearlyMap)
      .sort((a, b) => a.year - b.year)
      .map(y => ({
        year: y.year,
        open: y.open,
        close: y.close,
        high: y.high,
        low: y.low,
        returnPct: y.open > 0 ? ((y.close - y.open) / y.open) * 100 : 0,
      }));

    // Average daily volume
    const avgVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;

    res.json({
      quote,
      analysis: processedData,
      fullStats: {
        ath,
        atl,
        totalReturnPct,
        cagr,
        annualizedVolatility,
        maxDrawdown,
        drawdownStart,
        drawdownEnd,
        firstDate: firstDate.toISOString().split('T')[0],
        lastDate: lastDate.toISOString().split('T')[0],
        totalWeeks: chartData.length,
        avgWeeklyVolume: Math.round(avgVolume),
      },
      yearlyPerformance,
    });
  } catch (error) {
    console.error(`Full history error [${symbol}]:`, error.message);
    res.status(500).json({ message: 'Error fetching full history', error: error.message });
  }
};

// --- Live Market Indices (no cache — fresh every request) ---

const getIndices = async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ message: 'symbols query param required' });

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const results = {};
    // Fetch quotes in parallel
    const promises = symbolList.map(async (sym) => {
      try {
        const q = await yahooFinance.quoteCombine(sym);
        results[sym] = {
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
          previousClose: q.regularMarketPreviousClose,
          name: q.shortName || q.longName || sym,
        };
      } catch {
        // skip failed symbols
      }
    });
    await Promise.all(promises);

    res.json(results);
  } catch (error) {
    console.error('Indices fetch error:', error.message);
    res.status(500).json({ message: 'Error fetching indices' });
  }
};

// --- Company Details (Screener-style) ---
const getCompanyDetails = async (req, res) => {
  const { symbol } = req.params;

  try {
    // Only use quoteSummary modules that still work reliably
    const modules = [
      'summaryProfile',
      'summaryDetail',
      'financialData', 
      'defaultKeyStatistics',
      'earnings',
      'earningsTrend',
      'majorHoldersBreakdown',
      'institutionOwnership',
      'recommendationTrend',
      'calendarEvents',
    ];

    // Fetch quoteSummary + quote + fundamentalsTimeSeries in parallel
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const period1 = fiveYearsAgo.toISOString().split('T')[0];

    const [data, q, annualFinancials, annualBS, annualCF, qtrFinancials] = await Promise.all([
      yahooFinance.quoteSummary(symbol, { modules }, { validateResult: false }),
      yahooFinance.quoteCombine(symbol, {}, { validateResult: false }),
      yahooFinance.fundamentalsTimeSeries(symbol, { period1, type: 'annual', module: 'financials' }, { validateResult: false }).catch(() => []),
      yahooFinance.fundamentalsTimeSeries(symbol, { period1, type: 'annual', module: 'balance-sheet' }, { validateResult: false }).catch(() => []),
      yahooFinance.fundamentalsTimeSeries(symbol, { period1, type: 'annual', module: 'cash-flow' }, { validateResult: false }).catch(() => []),
      yahooFinance.fundamentalsTimeSeries(symbol, { period1, type: 'quarterly', module: 'financials' }, { validateResult: false }).catch(() => []),
    ]);

    const profile = data.summaryProfile || {};
    const detail = data.summaryDetail || {};
    const fin = data.financialData || {};
    const keyStats = data.defaultKeyStatistics || {};
    const earnings = data.earnings || {};
    const holders = data.majorHoldersBreakdown || {};
    const recommendations = data.recommendationTrend?.trend || [];

    // Map fundamentalsTimeSeries results to frontend shape
    const mapIncome = (arr) => arr
      .filter(s => s.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        date: s.date,
        revenue: s.totalRevenue ?? null,
        costOfRevenue: s.costOfRevenue ?? null,
        grossProfit: s.grossProfit ?? null,
        operatingExpense: s.operatingExpense ?? s.totalOperatingExpenses ?? null,
        operatingIncome: s.operatingIncome ?? null,
        netIncome: s.netIncome ?? null,
        ebit: s.EBIT ?? s.ebit ?? null,
        ebitda: s.EBITDA ?? s.ebitda ?? s.normalizedEBITDA ?? null,
        interestExpense: s.interestExpense ?? null,
        taxExpense: s.taxProvision ?? s.incomeTaxExpense ?? null,
      }));

    const mapBS = (arr) => arr
      .filter(s => s.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        date: s.date,
        totalAssets: s.totalAssets ?? null,
        totalLiabilities: s.totalLiabilitiesNetMinorityInterest ?? s.totalLiabilities ?? null,
        totalEquity: s.stockholdersEquity ?? s.totalEquityGrossMinorityInterest ?? null,
        cash: s.cashAndCashEquivalents ?? s.cashCashEquivalentsAndShortTermInvestments ?? null,
        totalDebt: s.totalDebt ?? s.longTermDebt ?? null,
        inventory: s.inventory ?? null,
        receivables: s.receivables ?? s.accountsReceivable ?? null,
        currentAssets: s.currentAssets ?? null,
        currentLiabilities: s.currentLiabilities ?? null,
      }));

    const mapCF = (arr) => arr
      .filter(s => s.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(s => ({
        date: s.date,
        operatingCashFlow: s.operatingCashFlow ?? null,
        investingCashFlow: s.investingCashFlow ?? null,
        financingCashFlow: s.financingCashFlow ?? null,
        freeCashFlow: s.freeCashFlow ?? null,
        capex: s.capitalExpenditure ?? null,
        dividendsPaid: s.cashDividendsPaid ?? s.commonStockDividendPaid ?? null,
      }));

    // Build Screener-style response
    const response = {
      // Company overview
      company: {
        name: q.longName || q.shortName || symbol,
        symbol: symbol,
        exchange: q.fullExchangeName || q.exchange,
        sector: profile.sector || 'N/A',
        industry: profile.industry || 'N/A',
        website: profile.website || '',
        description: profile.longBusinessSummary || '',
        employees: profile.fullTimeEmployees || 0,
        country: profile.country || '',
        city: profile.city || '',
      },

      // Current quote
      quote: {
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        previousClose: q.regularMarketPreviousClose,
        open: q.regularMarketOpen,
        dayHigh: q.regularMarketDayHigh,
        dayLow: q.regularMarketDayLow,
        volume: q.regularMarketVolume,
        avgVolume: q.averageDailyVolume3Month,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow,
        marketCap: q.marketCap,
      },

      // Key ratios (Screener-style)
      ratios: {
        pe: detail.trailingPE || keyStats.trailingEps ? (q.regularMarketPrice / keyStats.trailingEps) : null,
        forwardPE: keyStats.forwardPE || null,
        pb: keyStats.priceToBook || null,
        eps: keyStats.trailingEps || null,
        forwardEps: keyStats.forwardEps || null,
        dividendYield: detail.dividendYield ? (detail.dividendYield * 100) : null,
        dividendRate: detail.dividendRate || null,
        beta: keyStats.beta || null,
        marketCap: q.marketCap || null,
        enterpriseValue: keyStats.enterpriseValue || null,
        evToRevenue: keyStats.enterpriseToRevenue || null,
        evToEbitda: keyStats.enterpriseToEbitda || null,
        profitMargin: fin.profitMargins ? (fin.profitMargins * 100) : null,
        operatingMargin: fin.operatingMargins ? (fin.operatingMargins * 100) : null,
        roe: fin.returnOnEquity ? (fin.returnOnEquity * 100) : null,
        roa: fin.returnOnAssets ? (fin.returnOnAssets * 100) : null,
        debtToEquity: fin.debtToEquity || null,
        currentRatio: fin.currentRatio || null,
        quickRatio: fin.quickRatio || null,
        revenueGrowth: fin.revenueGrowth ? (fin.revenueGrowth * 100) : null,
        earningsGrowth: fin.earningsGrowth ? (fin.earningsGrowth * 100) : null,
        bookValue: keyStats.bookValue || null,
        sharesOutstanding: keyStats.sharesOutstanding || null,
        floatShares: keyStats.floatShares || null,
        pegRatio: keyStats.pegRatio || null,
      },

      // Quarterly results (from earnings module if available, fallback to fundamentalsTimeSeries)
      quarterlyResults: (earnings.financialsChart?.quarterly || []).map(q => ({
        date: q.date,
        revenue: q.revenue,
        earnings: q.earnings,
      })),

      // Annual income statements (from fundamentalsTimeSeries)
      incomeStatements: mapIncome(annualFinancials),

      // Quarterly income (from fundamentalsTimeSeries)
      incomeQuarterly: mapIncome(qtrFinancials).slice(-8),

      // Balance sheet (annual, from fundamentalsTimeSeries)
      balanceSheet: mapBS(annualBS),

      // Cash flow (annual, from fundamentalsTimeSeries)
      cashFlow: mapCF(annualCF),

      // Shareholding
      shareholding: {
        insidersPercent: holders.insidersPercentHeld ? (holders.insidersPercentHeld * 100) : null,
        institutionsPercent: holders.institutionsPercentHeld ? (holders.institutionsPercentHeld * 100) : null,
        floatPercent: holders.institutionsFloatPercentHeld ? (holders.institutionsFloatPercentHeld * 100) : null,
        insiderCount: holders.insidersCount || null,
        institutionCount: holders.institutionsCount || null,
      },

      // Analyst recommendations
      recommendations: recommendations.map(r => ({
        period: r.period,
        strongBuy: r.strongBuy,
        buy: r.buy,
        hold: r.hold,
        sell: r.sell,
        strongSell: r.strongSell,
      })),

      // Targets
      targets: {
        targetMean: fin.targetMeanPrice || null,
        targetHigh: fin.targetHighPrice || null,
        targetLow: fin.targetLowPrice || null,
        targetMedian: fin.targetMedianPrice || null,
        numAnalysts: fin.numberOfAnalystOpinions || null,
        recommendation: fin.recommendationKey || null,
      },
    };

    res.json(response);
  } catch (error) {
    console.error(`Company details error [${symbol}]:`, error.message);
    res.status(500).json({ message: 'Error fetching company details', error: error.message });
  }
};

// --- Sector Heatmap Data ---
const getSectorHeatmap = async (req, res) => {
  const { country } = req.query;
  // Sector ETFs / representative stocks for India
  const SECTOR_MAP = {
    India: {
      'Banking': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS'],
      'IT': ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
      'Pharma': ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS'],
      'Auto': ['MARUTI.NS', 'TATAMOTORS.NS', 'M&M.NS', 'BAJAJ-AUTO.NS'],
      'Energy': ['RELIANCE.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS'],
      'FMCG': ['HINDUNILVR.NS', 'ITC.NS', 'NESTLEIND.NS', 'BRITANNIA.NS'],
      'Metal': ['TATASTEEL.NS', 'HINDALCO.NS', 'JSWSTEEL.NS', 'COALINDIA.NS'],
      'Realty': ['DLF.NS', 'GODREJPROP.NS', 'OBEROIRLTY.NS', 'PHOENIXLTD.NS'],
    },
    'United States': {
      'Technology': ['AAPL', 'MSFT', 'GOOGL', 'META'],
      'Finance': ['JPM', 'BAC', 'GS', 'MS'],
      'Healthcare': ['JNJ', 'PFE', 'UNH', 'ABBV'],
      'Consumer': ['AMZN', 'TSLA', 'WMT', 'HD'],
      'Energy': ['XOM', 'CVX', 'COP', 'SLB'],
    },
  };

  const sectors = SECTOR_MAP[country] || SECTOR_MAP['India'];
  try {
    const results = {};
    const allSymbols = [];
    for (const [sector, symbols] of Object.entries(sectors)) {
      allSymbols.push(...symbols.map(s => ({ sector, symbol: s })));
    }

    const quotes = await Promise.allSettled(
      allSymbols.map(({ symbol }) => yahooFinance.quote(symbol, {}, { validateResult: false }))
    );

    allSymbols.forEach((item, i) => {
      if (!results[item.sector]) results[item.sector] = { stocks: [], avgChange: 0 };
      if (quotes[i].status === 'fulfilled' && quotes[i].value) {
        const q = quotes[i].value;
        results[item.sector].stocks.push({
          symbol: q.symbol,
          name: q.shortName || q.longName || q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChangePercent || 0,
        });
      }
    });

    // Compute average sector change
    for (const sector of Object.keys(results)) {
      const stocks = results[sector].stocks;
      results[sector].avgChange = stocks.length > 0
        ? stocks.reduce((sum, s) => sum + s.change, 0) / stocks.length
        : 0;
    }

    res.json(results);
  } catch (error) {
    console.error('Sector heatmap error:', error.message);
    res.status(500).json({ message: 'Error fetching sector data' });
  }
};

// --- Stock Screener ---
const getScreener = async (req, res) => {
  const { country } = req.query;
  const SCREENER_STOCKS = {
    India: [
      'RELIANCE.NS','TCS.NS','INFY.NS','HDFCBANK.NS','ICICIBANK.NS','SBIN.NS',
      'WIPRO.NS','BAJFINANCE.NS','MARUTI.NS','TATAMOTORS.NS','SUNPHARMA.NS',
      'ITC.NS','HINDUNILVR.NS','TATASTEEL.NS','LT.NS','AXISBANK.NS',
      'DRREDDY.NS','NESTLEIND.NS','ONGC.NS','COALINDIA.NS','BRITANNIA.NS',
      'HCLTECH.NS','NTPC.NS','POWERGRID.NS','CIPLA.NS','DLF.NS',
      'M&M.NS','BAJAJ-AUTO.NS','DIVISLAB.NS','JSWSTEEL.NS',
    ],
    'United States': [
      'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','JPM','V','JNJ',
      'WMT','PG','UNH','HD','BAC','PFE','KO','PEP','ABBV','MRK',
      'CVX','XOM','COP','COST','NFLX','DIS','CSCO','INTC','AMD','QCOM',
    ],
  };

  const symbols = SCREENER_STOCKS[country] || SCREENER_STOCKS['India'];
  try {
    const quotes = await Promise.allSettled(
      symbols.map(s => yahooFinance.quote(s, {}, { validateResult: false }))
    );

    const results = [];
    quotes.forEach((q, i) => {
      if (q.status === 'fulfilled' && q.value) {
        const d = q.value;
        results.push({
          symbol: d.symbol,
          name: d.shortName || d.longName || d.symbol,
          price: d.regularMarketPrice,
          change: d.regularMarketChangePercent || 0,
          pe: d.trailingPE || null,
          marketCap: d.marketCap || 0,
          divYield: d.dividendYield ? (d.dividendYield * 100) : null,
          volume: d.regularMarketVolume || 0,
          eps: d.epsTrailingTwelveMonths || null,
          high52: d.fiftyTwoWeekHigh,
          low52: d.fiftyTwoWeekLow,
          sector: d.sector || '',
        });
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Screener error:', error.message);
    res.status(500).json({ message: 'Error fetching screener data' });
  }
};

module.exports = { getStockData, getTrendingOptions, getFullHistory, getIndices, getCompanyDetails, getSectorHeatmap, getScreener };
