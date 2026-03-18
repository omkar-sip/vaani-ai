/**
 * VaaniAI Admin Charts — Premium Bright-Theme SVG Components
 * Unique pie charts, gradient bars, and animated trend lines
 */

const PALETTE = [
  { fill: '#F97316', light: '#FFF7ED', label: 'orange' },
  { fill: '#0D9488', light: '#F0FDFA', label: 'teal' },
  { fill: '#2563EB', light: '#EFF6FF', label: 'blue' },
  { fill: '#16A34A', light: '#F0FDF4', label: 'green' },
  { fill: '#7C3AED', light: '#F5F3FF', label: 'purple' },
  { fill: '#DC2626', light: '#FEF2F2', label: 'rose' },
];

/**
 * Unique segmented pie chart with center label, gradient strokes, and hover tooltips.
 */
export function PieChart({ data, size = 220 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 8;
  const innerR = outerR * 0.58;

  // Build arc segments
  const segments = data.reduce((items, d, i) => {
    const pct = d.value / total;
    const sweep = pct * 360;
    const start = items.length ? items[items.length - 1].start + items[items.length - 1].sweep : -90;
    items.push({ ...d, pct, sweep, start, color: PALETTE[i % PALETTE.length] });
    return items;
  }, []);

  function arcPath(cx, cy, r, startDeg, sweepDeg) {
    const s = (startDeg * Math.PI) / 180;
    const e = ((startDeg + sweepDeg) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}>
        <defs>
          {segments.map((seg, i) => (
            <linearGradient key={`g${i}`} id={`pie-g-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={seg.color.fill} stopOpacity="1" />
              <stop offset="100%" stopColor={seg.color.fill} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={outerR} fill="#F9FAFB" stroke="#F3F4F6" strokeWidth="1" />
        {/* Segments */}
        {segments.map((seg, i) => (
          seg.sweep > 0.3 && (
            <path
              key={i}
              d={arcPath(cx, cy, (outerR + innerR) / 2, seg.start, Math.max(seg.sweep - 2, 0.5))}
              fill="none"
              stroke={`url(#pie-g-${i})`}
              strokeWidth={outerR - innerR}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease, opacity 0.3s' }}
            />
          )
        ))}
        {/* Center label */}
        <circle cx={cx} cy={cy} r={innerR - 4} fill="#fff" />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#111827" fontSize="26" fontWeight="800" fontFamily="Plus Jakarta Sans, Inter, sans-serif">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#9CA3AF" fontSize="11" fontWeight="600" fontFamily="Plus Jakarta Sans, Inter, sans-serif">
          total events
        </text>
      </svg>

      <div className="pie-legend">
        {segments.map((seg, i) => (
          <div className="pie-legend-item" key={i}>
            <span className="pie-legend-dot" style={{ background: seg.color.fill }} />
            <span>{seg.label}</span>
            <span className="pie-legend-pct">{Math.round(seg.pct * 100)}%</span>
            <span className="pie-legend-value">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Vibrant bar chart with gradient fills and rounded caps.
 */
export function BarChart({ data, height = 220 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.min(52, Math.floor(340 / (data.length || 1)));
  const gap = 16;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap, height, padding: '0 12px', justifyContent: 'center' }}>
      {data.map((d, i) => {
        const barH = Math.max(6, (d.value / max) * (height - 52));
        const color = PALETTE[i % PALETTE.length];
        return (
          <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              {d.displayValue || d.value}
            </span>
            <div style={{ position: 'relative', width: barW, height: barH }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 10,
                  background: `linear-gradient(180deg, ${color.fill}, ${color.fill}99)`,
                  boxShadow: `0 4px 14px ${color.fill}30`,
                  transition: 'height 0.5s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Shine effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.2), transparent)',
                  borderRadius: '10px 0 0 10px',
                }} />
              </div>
            </div>
            <span style={{
              fontSize: 11,
              color: '#9CA3AF',
              fontWeight: 600,
              textAlign: 'center',
              maxWidth: barW + 20,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Animated trend line chart with gradient fill and point markers.
 */
export function TrendLineChart({ data, width = 420, height = 140 }) {
  if (!data.length) {
    return <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 24 }}>No trend data yet</div>;
  }

  const max = Math.max(...data.map((d) => d.count), 1);
  const padX = 36;
  const padY = 24;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * plotW;
    const y = padY + plotH - (d.count / max) * plotH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padY + plotH} L ${points[0].x} ${padY + plotH} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = padY + plotH * (1 - frac);
        return (
          <line key={frac} x1={padX} y1={y} x2={padX + plotW} y2={y} stroke="#F3F4F6" strokeWidth="1" />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#trendFill)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="url(#trendStroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Points and labels */}
      {points.map((p, i) => (
        <g key={p.date}>
          <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#F97316" strokeWidth="2.5" />
          <circle cx={p.x} cy={p.y} r="2" fill="#F97316" />
          {/* X-axis date labels — show every few */}
          {(data.length <= 7 || i % Math.ceil(data.length / 6) === 0) && (
            <text
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="9.5"
              fontWeight="600"
              fontFamily="Plus Jakarta Sans, Inter, sans-serif"
            >
              {p.date.slice(5)}
            </text>
          )}
          {/* Value labels on top */}
          {data.length <= 10 && (
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fill="#F97316"
              fontSize="10"
              fontWeight="700"
              fontFamily="Plus Jakarta Sans, Inter, sans-serif"
            >
              {p.count}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
