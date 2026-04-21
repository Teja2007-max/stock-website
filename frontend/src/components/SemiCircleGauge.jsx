import React from 'react';

/**
 * SemiCircleGauge — renders a beautiful SVG semicircular gauge.
 * Props:
 *   value: 0-100 (where 0=extreme sell, 50=hold, 100=extreme buy)
 *   signal: 'BUY' | 'SELL' | 'HOLD'
 *   confidence: number (0-100)
 *   trend: 'UP' | 'DOWN'
 */
const SELL_COLOR = '#ef4444';   // red
const HOLD_COLOR = '#f59e0b';   // amber
const BUY_COLOR  = '#22c55e';  // green

const lerp = (a, b, t) => a + (b - a) * t;

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

const lerpColor = (colorA, colorB, t) => {
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `rgb(${r},${g},${b})`;
};

// Convert 0-100 score to gauge angle (180° arc from left to right)
// 0 → leftmost (SELL), 50 → top (HOLD), 100 → rightmost (BUY)
const scoreToAngle = (score) => {
  // Maps 0→180°, 50→0°(top), 100→0° from right
  // Full arc: -180° to 0°  (or π to 0)
  return Math.PI - (score / 100) * Math.PI;
};

const polarToCart = (cx, cy, r, angle) => ({
  x: cx + r * Math.cos(angle),
  y: cy - r * Math.sin(angle),
});

const SemiCircleGauge = ({ value = 50, signal = 'HOLD', confidence = 50, trend = 'UP' }) => {
  const cx = 110, cy = 105, R = 80, innerR = 56;
  const strokeW = R - innerR; // 24px thick arc

  // Needle angle
  const needleAngle = scoreToAngle(value);
  const needleTip = polarToCart(cx, cy, R - 4, needleAngle);
  const needleBase1 = polarToCart(cx, cy, 8, needleAngle + Math.PI / 2);
  const needleBase2 = polarToCart(cx, cy, 8, needleAngle - Math.PI / 2);

  // Arc colour zones — 3 arcs: SELL (red), HOLD (amber), BUY (green)
  // Each zone = 60° (60/180 of the arc)
  // We draw them as SVG arcs from π to 0 (left to right)

  const arcPath = (startScore, endScore) => {
    const a1 = scoreToAngle(startScore);
    const a2 = scoreToAngle(endScore);
    const p1 = polarToCart(cx, cy, R, a1);
    const p2 = polarToCart(cx, cy, R, a2);
    const q1 = polarToCart(cx, cy, innerR, a1);
    const q2 = polarToCart(cx, cy, innerR, a2);
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y} L ${q2.x} ${q2.y} A ${innerR} ${innerR} 0 0 0 ${q1.x} ${q1.y} Z`;
  };

  // Needle colour follows the value
  let needleColor;
  if (value < 33) needleColor = SELL_COLOR;
  else if (value < 67) needleColor = lerpColor(SELL_COLOR, BUY_COLOR, (value - 33) / 34);
  else needleColor = BUY_COLOR;

  const signalColor = signal === 'BUY' ? BUY_COLOR : signal === 'SELL' ? SELL_COLOR : HOLD_COLOR;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      <svg width={220} height={130} viewBox={`0 0 220 130`} style={{ overflow: 'visible' }}>
        {/* Track background */}
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={SELL_COLOR} stopOpacity="0.18" />
            <stop offset="50%" stopColor={HOLD_COLOR} stopOpacity="0.18" />
            <stop offset="100%" stopColor={BUY_COLOR} stopOpacity="0.18" />
          </linearGradient>
        </defs>

        {/* SELL zone */}
        <path d={arcPath(0, 33)} fill={SELL_COLOR} opacity="0.85" />
        {/* HOLD zone */}
        <path d={arcPath(33, 67)} fill={HOLD_COLOR} opacity="0.85" />
        {/* BUY zone */}
        <path d={arcPath(67, 100)} fill={BUY_COLOR} opacity="0.85" />

        {/* Confidence arc overlay — highlight filled portion */}
        {/* Subtle glow on active zone */}

        {/* Zone labels */}
        <text x={cx - R - 2} y={cy + 18} textAnchor="middle" fill={SELL_COLOR} fontSize="9" fontWeight="700" fontFamily="Outfit">SELL</text>
        <text x={cx} y={cy - R - 10} textAnchor="middle" fill={HOLD_COLOR} fontSize="9" fontWeight="700" fontFamily="Outfit">HOLD</text>
        <text x={cx + R + 2} y={cy + 18} textAnchor="middle" fill={BUY_COLOR} fontSize="9" fontWeight="700" fontFamily="Outfit">BUY</text>

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={needleColor}
          opacity="0.95"
          style={{ filter: `drop-shadow(0 0 6px ${needleColor})` }}
        />
        {/* Needle pivot circle */}
        <circle cx={cx} cy={cy} r={9} fill="#1c2128" stroke={needleColor} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={4} fill={needleColor} />
      </svg>

      {/* Signal label */}
      <div style={{ textAlign: 'center', marginTop: -8 }}>
        <div style={{
          fontSize: '2rem', fontFamily: 'Outfit', fontWeight: 800,
          color: signalColor,
          textShadow: `0 0 20px ${signalColor}66`,
          letterSpacing: 3,
          lineHeight: 1,
        }}>
          {signal}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6 }}>
          Confidence: <strong style={{ color: 'var(--text-primary)' }}>{confidence}%</strong>
          &nbsp;·&nbsp;
          Trend: <strong style={{ color: trend === 'UP' ? BUY_COLOR : SELL_COLOR }}>
            {trend === 'UP' ? '↑ Up' : '↓ Down'}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default SemiCircleGauge;
