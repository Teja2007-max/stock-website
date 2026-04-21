// ============================================================
// StockEdge Advanced Prediction Engine v2.0
// Enhancements: VWAP, ATR, Stochastic, Golden/Death Cross,
//   Support/Resistance, Volume Confirmation, Weighted Regression,
//   Negation-Aware Sentiment, Multi-Indicator Confirmation
// ============================================================

// --- Core Indicators ---

const calculateSMA = (data, window) => {
  let sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      sma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < window; j++) {
        sum += data[i - j].close;
      }
      sma.push(sum / window);
    }
  }
  return sma;
};

const calculateEMA = (data, window) => {
  let ema = [];
  const k = 2 / (window + 1);
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      ema.push(null);
    } else if (i === window - 1) {
      let sum = 0;
      for (let j = 0; j < window; j++) sum += data[i - j].close;
      ema.push(sum / window);
    } else {
      ema.push((data[i].close - ema[i - 1]) * k + ema[i - 1]);
    }
  }
  return ema;
};

const calculateMACD = (data) => {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  let macdLine = [];

  for (let i = 0; i < data.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push(ema12[i] - ema26[i]);
    } else {
      macdLine.push(null);
    }
  }

  let validMacd = macdLine.filter(m => m !== null);
  let validSignal = [];
  const k = 2 / (9 + 1);

  for (let i = 0; i < validMacd.length; i++) {
    if (i < 8) {
      validSignal.push(null);
    } else if (i === 8) {
      let sum = 0;
      for (let j = 0; j < 9; j++) sum += validMacd[i - j];
      validSignal.push(sum / 9);
    } else {
      validSignal.push((validMacd[i] - validSignal[i - 1]) * k + validSignal[i - 1]);
    }
  }

  let signalLine = [];
  let paddingCount = data.length - validSignal.length;
  for (let i = 0; i < paddingCount; i++) signalLine.push(null);
  signalLine = signalLine.concat(validSignal);

  let histogram = [];
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram.push(macdLine[i] - signalLine[i]);
    } else {
      histogram.push(null);
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
};

const calculateRSI = (data, window = 14) => {
  let rsi = [null];
  let gains = 0, losses = 0;

  for (let i = 1; i <= window && i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
    rsi.push(null);
  }

  if (data.length > window) {
    let avgGain = gains / window;
    let avgLoss = losses / window;
    let rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
    rsi[window] = 100 - (100 / (1 + rs));

    for (let i = window + 1; i < data.length; i++) {
      const diff = data[i].close - data[i - 1].close;
      let gain = diff >= 0 ? diff : 0;
      let loss = diff < 0 ? -diff : 0;

      avgGain = (avgGain * (window - 1) + gain) / window;
      avgLoss = (avgLoss * (window - 1) + loss) / window;
      rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  return rsi;
};

const calculateBollingerBands = (data, smaWindow = 20, multiplier = 2) => {
  const sma = calculateSMA(data, smaWindow);
  let upper = [];
  let lower = [];

  for (let i = 0; i < data.length; i++) {
    if (i < smaWindow - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSq = 0;
      for (let j = 0; j < smaWindow; j++) {
        sumSq += Math.pow(data[i - j].close - sma[i], 2);
      }
      const stdDev = Math.sqrt(sumSq / smaWindow);
      upper.push(sma[i] + multiplier * stdDev);
      lower.push(sma[i] - multiplier * stdDev);
    }
  }

  return { sma, upper, lower };
};

// --- NEW: Stochastic Oscillator (%K / %D) ---
const calculateStochastic = (data, kPeriod = 14, dPeriod = 3) => {
  let kValues = [];
  let dValues = [];

  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(null);
    } else {
      let lowest = Infinity, highest = -Infinity;
      for (let j = 0; j < kPeriod; j++) {
        const bar = data[i - j];
        if (bar.low < lowest) lowest = bar.low;
        if (bar.high > highest) highest = bar.high;
      }
      const range = highest - lowest;
      const k = range === 0 ? 50 : ((data[i].close - lowest) / range) * 100;
      kValues.push(k);
    }
  }

  // %D = SMA of %K
  for (let i = 0; i < kValues.length; i++) {
    if (kValues[i] === null || i < kPeriod - 1 + dPeriod - 1) {
      dValues.push(null);
    } else {
      let sum = 0, count = 0;
      for (let j = 0; j < dPeriod; j++) {
        if (kValues[i - j] !== null) { sum += kValues[i - j]; count++; }
      }
      dValues.push(count > 0 ? sum / count : null);
    }
  }

  return { k: kValues, d: dValues };
};

// --- NEW: ATR (Average True Range) ---
const calculateATR = (data, window = 14) => {
  let atr = [null];

  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );

    if (i < window) {
      atr.push(null);
    } else if (i === window) {
      // First ATR = average of first `window` true ranges
      let sum = tr;
      for (let j = 1; j < window; j++) {
        const prev = data[i - j];
        const prev2 = data[i - j - 1];
        sum += Math.max(prev.high - prev.low, Math.abs(prev.high - prev2.close), Math.abs(prev.low - prev2.close));
      }
      atr.push(sum / window);
    } else {
      // Wilder's smoothing
      atr.push((atr[i - 1] * (window - 1) + tr) / window);
    }
  }
  return atr;
};

// --- NEW: VWAP (Volume Weighted Average Price) ---
const calculateVWAP = (data) => {
  let vwap = [];
  let cumVolPrice = 0;
  let cumVol = 0;

  for (let i = 0; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    const vol = data[i].volume || 0;
    cumVolPrice += typicalPrice * vol;
    cumVol += vol;
    vwap.push(cumVol > 0 ? cumVolPrice / cumVol : data[i].close);
  }
  return vwap;
};

// --- NEW: Volume Trend (is recent volume above or below average?) ---
const calculateVolumeTrend = (data, window = 20) => {
  const n = data.length;
  if (n < window + 1) return { ratio: 1, trend: 'NORMAL' };

  let recentVol = 0, avgVol = 0;
  for (let i = n - 5; i < n; i++) recentVol += (data[i].volume || 0);
  recentVol /= 5;

  for (let i = n - window - 1; i < n - 1; i++) avgVol += (data[i].volume || 0);
  avgVol /= window;

  const ratio = avgVol > 0 ? recentVol / avgVol : 1;
  let trend = 'NORMAL';
  if (ratio > 1.5) trend = 'HIGH';
  else if (ratio < 0.6) trend = 'LOW';

  return { ratio, trend };
};

// --- NEW: Support & Resistance Levels ---
const findSupportResistance = (data, lookback = 60) => {
  const slice = data.slice(-Math.min(data.length, lookback));
  const currentPrice = slice[slice.length - 1].close;

  // Find local pivots (swing highs and lows)
  let pivotHighs = [];
  let pivotLows = [];

  for (let i = 2; i < slice.length - 2; i++) {
    const h = slice[i].high;
    const l = slice[i].low;
    if (h > slice[i - 1].high && h > slice[i - 2].high && h > slice[i + 1].high && h > slice[i + 2].high) {
      pivotHighs.push(h);
    }
    if (l < slice[i - 1].low && l < slice[i - 2].low && l < slice[i + 1].low && l < slice[i + 2].low) {
      pivotLows.push(l);
    }
  }

  // Nearest resistance (above current price)
  const resistanceLevels = pivotHighs.filter(p => p > currentPrice).sort((a, b) => a - b);
  const resistance = resistanceLevels.length > 0 ? resistanceLevels[0] : null;

  // Nearest support (below current price)
  const supportLevels = pivotLows.filter(p => p < currentPrice).sort((a, b) => b - a);
  const support = supportLevels.length > 0 ? supportLevels[0] : null;

  return { support, resistance };
};

// --- NEW: Golden / Death Cross Detection ---
const detectCross = (sma50, sma200) => {
  const n = sma50.length;
  if (n < 3) return 'NONE';

  // Check last 5 bars for a recent crossover
  for (let i = n - 1; i >= Math.max(0, n - 5); i--) {
    if (sma50[i] == null || sma200[i] == null || sma50[i - 1] == null || sma200[i - 1] == null) continue;
    const prevAbove = sma50[i - 1] > sma200[i - 1];
    const currAbove = sma50[i] > sma200[i];
    if (!prevAbove && currAbove) return 'GOLDEN'; // SMA50 crossed above SMA200
    if (prevAbove && !currAbove) return 'DEATH';   // SMA50 crossed below SMA200
  }

  // No recent cross — report current state
  const last50 = sma50[n - 1];
  const last200 = sma200[n - 1];
  if (last50 != null && last200 != null) {
    return last50 > last200 ? 'BULLISH_ALIGNED' : 'BEARISH_ALIGNED';
  }
  return 'NONE';
};

// --- IMPROVED: Weighted Linear Regression (exponential time-decay) ---
const predictPriceAdvanced = (data, lastMetrics, atrValue, supportResistance, forwardDays = 5) => {
  const n = Math.min(data.length, 60);
  if (n < 2) return { predictions: [], slope: 0 };

  // Exponentially-weighted linear regression (recent data matters more)
  let sumW = 0, sumWX = 0, sumWY = 0, sumWXY = 0, sumWX2 = 0;
  for (let i = 0; i < n; i++) {
    const weight = Math.exp(0.03 * (i - n + 1)); // exponential decay, most recent = weight ~1
    const y = data[data.length - n + i].close;
    sumW += weight;
    sumWX += weight * i;
    sumWY += weight * y;
    sumWX2 += weight * i * i;
    sumWXY += weight * i * y;
  }
  let slope = (sumW * sumWXY - sumWX * sumWY) / (sumW * sumWX2 - sumWX * sumWX);
  slope = slope * 0.5; // dampen to prevent unrealistic explosion

  const currentPrice = data[data.length - 1].close;

  // Mean reversion target (SMA 50)
  const meanTarget = lastMetrics.sma50 || currentPrice;

  // Momentum factor (MACD context)
  const momentum = (lastMetrics.macdHistogram || 0) * 0.6;

  // Volatility scaling — ATR determines how far predictions can deviate
  const volatilityScale = atrValue ? (atrValue / currentPrice) : 0.02;

  let predictions = [];
  for (let i = 1; i <= forwardDays; i++) {
    let baseProjected = currentPrice + slope * i;

    // Mean reversion pull (strengthens over time)
    let meanPull = (meanTarget - baseProjected) * (i / 12);

    // Momentum push (fades over days)
    let momentumPush = momentum * Math.max(0, (5 - i) / 5);

    let predicted = baseProjected + meanPull + momentumPush;

    // Clamp predictions to support/resistance levels (soft boundary)
    if (supportResistance.resistance && predicted > supportResistance.resistance) {
      // Pull back toward resistance (don't let it fly through easily)
      predicted = supportResistance.resistance + (predicted - supportResistance.resistance) * 0.3;
    }
    if (supportResistance.support && predicted < supportResistance.support) {
      // Pull back toward support
      predicted = supportResistance.support - (supportResistance.support - predicted) * 0.3;
    }

    // Clamp to realistic daily range based on ATR
    const maxMove = currentPrice * volatilityScale * i * 1.5;
    predicted = Math.max(currentPrice - maxMove, Math.min(currentPrice + maxMove, predicted));

    predictions.push(predicted);
  }
  return { predictions, slope };
};

// --- IMPROVED: Negation-aware Sentiment Analysis ---
const analyzeSentiment = (newsItems) => {
  if (!newsItems || newsItems.length === 0) return 0;

  const bullishWords = ['surge', 'growth', 'profit', 'beats', 'buy', 'upgrade', 'higher', 'jump', 'rally', 'record', 'gain', 'outperform', 'exceeds', 'bullish', 'soars', 'breakout', 'momentum', 'strong', 'positive'];
  const bearishWords = ['loss', 'crash', 'misses', 'sell', 'downgrade', 'lower', 'drop', 'slump', 'plunge', 'lawsuit', 'scandal', 'debt', 'bearish', 'decline', 'weakness', 'risk', 'warning', 'negative', 'fraud'];
  const negationWords = ['not', 'no', 'never', 'neither', 'hardly', 'barely', 'doesn\'t', 'don\'t', 'didn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'won\'t', 'cannot', 'can\'t'];

  let score = 0;
  newsItems.forEach(item => {
    const text = (item.title + ' ' + (item.publisher || '')).toLowerCase();
    const words = text.split(/\s+/);
    let itemScore = 0;

    for (let w = 0; w < words.length; w++) {
      const word = words[w].replace(/[^a-z']/g, '');
      // Check for negation in the preceding 2 words
      let negated = false;
      for (let k = Math.max(0, w - 2); k < w; k++) {
        if (negationWords.includes(words[k].replace(/[^a-z']/g, ''))) { negated = true; break; }
      }

      const multiplier = negated ? -1 : 1;
      if (bullishWords.includes(word)) itemScore += 1.5 * multiplier;
      if (bearishWords.includes(word)) itemScore -= 1.5 * multiplier;
    }

    score += itemScore;
  });

  return Math.max(-1, Math.min(1, score / 8));
};

// ============================================================
// Main Processing Pipeline
// ============================================================

const processStockData = (historicalData, news = []) => {
  if (!historicalData || historicalData.length === 0) {
    return { historical: [], prediction: [], signal: 'HOLD', confidence: 0, sentiment: 0, trend: 'FLAT' };
  }

  // --- Compute all indicators ---
  const rsi = calculateRSI(historicalData);
  const bb = calculateBollingerBands(historicalData);
  const sma50 = calculateSMA(historicalData, 50);
  const sma200 = calculateSMA(historicalData, 200);
  const macdData = calculateMACD(historicalData);
  const stochastic = calculateStochastic(historicalData);
  const atr = calculateATR(historicalData);
  const vwap = calculateVWAP(historicalData);

  const enrichedData = historicalData.map((d, i) => ({
    ...d,
    rsi: rsi[i],
    bbUpper: bb.upper[i],
    bbMiddle: bb.sma[i],
    bbLower: bb.lower[i],
    sma50: sma50[i],
    sma200: sma200[i],
    macd: macdData.macd[i],
    macdSignal: macdData.signal[i],
    macdHistogram: macdData.histogram[i],
    stochK: stochastic.k[i],
    stochD: stochastic.d[i],
    atr: atr[i],
    vwap: vwap[i],
  }));

  const last = enrichedData[enrichedData.length - 1];
  const supportResistance = findSupportResistance(historicalData);
  const volumeInfo = calculateVolumeTrend(historicalData);
  const crossSignal = detectCross(sma50, sma200);
  const predictionMath = predictPriceAdvanced(historicalData, last, last.atr, supportResistance);
  const sentimentScore = analyzeSentiment(news);

  // Apply sentiment weighting into predictions (up to ±4% influence)
  let predictions = predictionMath.predictions;
  if (predictions.length > 0 && sentimentScore !== 0) {
    predictions = predictions.map((p, i) => {
      let weight = 1 + (sentimentScore * 0.04 * (1 - (i / predictions.length) * 0.3));
      return p * weight;
    });
  }

  // ============================================================
  // Advanced Signal Scoring with Multi-Indicator Confirmation
  // ============================================================
  let signal = 'HOLD';
  let confidence = 50;

  if (last) {
    let rawScore = 0;
    let confirmations = 0; // Track how many indicators agree

    // --- RSI (max ±3) ---
    if (last.rsi < 30) { rawScore += 3; confirmations++; }
    else if (last.rsi < 40) { rawScore += 1; }
    if (last.rsi > 70) { rawScore -= 3; confirmations++; }
    else if (last.rsi > 60) { rawScore -= 1; }

    // --- MACD (max ±2) ---
    if (last.macdHistogram > 0 && last.macd > 0) { rawScore += 2; confirmations++; }
    else if (last.macdHistogram > 0) rawScore += 1;
    if (last.macdHistogram < 0 && last.macd < 0) { rawScore -= 2; confirmations++; }
    else if (last.macdHistogram < 0) rawScore -= 1;

    // --- Bollinger Bands (max ±2) ---
    if (last.close < last.bbLower) { rawScore += 2; confirmations++; }
    if (last.close > last.bbUpper) { rawScore -= 2; confirmations++; }

    // --- NEW: Stochastic Oscillator (max ±2) ---
    if (last.stochK !== null && last.stochD !== null) {
      if (last.stochK < 20 && last.stochD < 20) { rawScore += 2; confirmations++; }
      else if (last.stochK < 30) rawScore += 0.5;
      if (last.stochK > 80 && last.stochD > 80) { rawScore -= 2; confirmations++; }
      else if (last.stochK > 70) rawScore -= 0.5;
      // Bullish crossover: %K crosses above %D in oversold zone
      if (last.stochK > last.stochD && last.stochK < 30) rawScore += 1;
      // Bearish crossover: %K crosses below %D in overbought zone
      if (last.stochK < last.stochD && last.stochK > 70) rawScore -= 1;
    }
    // --- NEW: Golden / Death Cross (max ±3) ---
    if (crossSignal === 'GOLDEN') { rawScore += 3; confirmations++; }
    else if (crossSignal === 'DEATH') { rawScore -= 3; confirmations++; }
    else if (crossSignal === 'BULLISH_ALIGNED') rawScore += 1;
    else if (crossSignal === 'BEARISH_ALIGNED') rawScore -= 1;
    // --- NEW: Volume Confirmation (max ±1.5) ---
    // High volume confirms the current signal direction
    if (volumeInfo.trend === 'HIGH') {
      rawScore += (rawScore > 0 ? 1.5 : rawScore < 0 ? -1.5 : 0);
    } else if (volumeInfo.trend === 'LOW') {
      // Low volume weakens any signal
      rawScore *= 0.7;
    }
    // --- NEW: VWAP Position (max ±1) ---
    if (last.vwap) {
      if (last.close > last.vwap) rawScore += 1; // Price above VWAP = bullish
      else rawScore -= 1; // Price below VWAP = bearish
    }
    // --- Linear Trend (max ±1) ---
    if (predictionMath.slope > 0) rawScore += 1;
    else if (predictionMath.slope < 0) rawScore -= 1;

    // --- Sentiment (max ±3) ---
    rawScore += (sentimentScore * 3);

    // --- Multi-indicator confirmation bonus ---
    // If 3+ indicators agree, boost confidence significantly
    if (confirmations >= 3) {
      rawScore *= 1.2;
    }

    // --- Generate Signal ---
    if (rawScore >= 4) {
      signal = 'BUY';
      confidence = Math.min(98, 55 + (rawScore * 6) + (confirmations * 3));
    } else if (rawScore <= -4) {
      signal = 'SELL';
      confidence = Math.min(98, 55 + (Math.abs(rawScore) * 6) + (confirmations * 3));
    } else {
      signal = 'HOLD';
      confidence = Math.min(85, 35 + (Math.abs(rawScore) * 8));
    }
  }
  return {
    historical: enrichedData,
    prediction: predictions,
    signal,
    confidence: Math.round(confidence),
    sentiment: sentimentScore,
    trend: predictionMath.slope > 0 ? 'UP' : 'DOWN',
    // NEW: Additional metadata for frontend
    volumeTrend: volumeInfo.trend,
    crossSignal,
    support: supportResistance.support,
    resistance: supportResistance.resistance,
  };
};
module.exports = {
  processStockData
};
