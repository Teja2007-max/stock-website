import React from 'react';

const ChartLoader = ({ size = 120, color = '#3b82f6', label = 'Loading...' }) => {
  const w = size;
  const h = size * 0.6;

  // A realistic stock-chart polyline path
  const points = `0,${h * 0.7} ${w * 0.08},${h * 0.55} ${w * 0.15},${h * 0.6} ${w * 0.22},${h * 0.35} ${w * 0.3},${h * 0.45} ${w * 0.38},${h * 0.25} ${w * 0.45},${h * 0.4} ${w * 0.52},${h * 0.3} ${w * 0.58},${h * 0.5} ${w * 0.65},${h * 0.2} ${w * 0.72},${h * 0.35} ${w * 0.8},${h * 0.15} ${w * 0.88},${h * 0.28} ${w * 0.95},${h * 0.1} ${w},${h * 0.18}`;

  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <svg
          width={w}
          height={h + 10}
          viewBox={`0 0 ${w} ${h + 10}`}
          style={{ overflow: 'visible' }}
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(f => (
            <line
              key={f}
              x1={0} y1={h * f} x2={w} y2={h * f}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Gradient fill under the line */}
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <clipPath id="revealClip">
              <rect x="0" y="0" width={w} height={h + 10}>
                <animate
                  attributeName="width"
                  from="0"
                  to={w}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </rect>
            </clipPath>
          </defs>

          {/* Filled area under chart */}
          <polygon
            points={`${points} ${w},${h} 0,${h}`}
            fill="url(#chartFill)"
            clipPath="url(#revealClip)"
          />

          {/* The animated chart line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#revealClip)"
          />

          {/* Glowing dot at the end */}
          <circle r="4" fill={color}>
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={`M0,${h * 0.7} L${w * 0.08},${h * 0.55} L${w * 0.15},${h * 0.6} L${w * 0.22},${h * 0.35} L${w * 0.3},${h * 0.45} L${w * 0.38},${h * 0.25} L${w * 0.45},${h * 0.4} L${w * 0.52},${h * 0.3} L${w * 0.58},${h * 0.5} L${w * 0.65},${h * 0.2} L${w * 0.72},${h * 0.35} L${w * 0.8},${h * 0.15} L${w * 0.88},${h * 0.28} L${w * 0.95},${h * 0.1} L${w},${h * 0.18}`}
            />
          </circle>
          <circle r="8" fill={color} opacity="0.25">
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={`M0,${h * 0.7} L${w * 0.08},${h * 0.55} L${w * 0.15},${h * 0.6} L${w * 0.22},${h * 0.35} L${w * 0.3},${h * 0.45} L${w * 0.38},${h * 0.25} L${w * 0.45},${h * 0.4} L${w * 0.52},${h * 0.3} L${w * 0.58},${h * 0.5} L${w * 0.65},${h * 0.2} L${w * 0.72},${h * 0.35} L${w * 0.8},${h * 0.15} L${w * 0.88},${h * 0.28} L${w * 0.95},${h * 0.1} L${w},${h * 0.18}`}
            />
          </circle>
        </svg>
      </div>
      {label && (
        <p style={{
          marginTop: 16, fontSize: '0.85rem', color: '#64748b',
          fontFamily: 'Inter, sans-serif', fontWeight: 500,
        }}>
          {label}
        </p>
      )}
    </div>
  );
};

export default ChartLoader;
