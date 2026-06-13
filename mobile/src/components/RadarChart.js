import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { DIM_META } from '../fqcore';
import { C } from '../theme';

function polar(angleDeg, r, cx, cy) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function RadarChart({ scores, size = 260 }) {
  const cx = size / 2, cy = size / 2;
  const maxR = size / 2 - 36;
  const dims = DIM_META;
  const n = dims.length;
  const angles = dims.map((_, i) => (i * 360) / n);
  const grid = [0.25, 0.5, 0.75, 1.0];

  const poly = (frac) =>
    angles.map(a => { const p = polar(a, maxR * frac, cx, cy); return `${p.x},${p.y}`; }).join(' ');

  const dataPts = dims.map((d, i) => {
    const val = (scores[d.key] || 0) / 100;
    return polar(angles[i], maxR * Math.max(val, 0.02), cx, cy);
  });

  return (
    <Svg width={size} height={size}>
      {grid.map((f, gi) => (
        <Polygon key={gi} points={poly(f)} fill="none" stroke={C.border} strokeWidth={f === 1 ? 1.5 : 1} />
      ))}
      {angles.map((a, i) => {
        const o = polar(a, maxR, cx, cy);
        return <Line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke={C.border} strokeWidth={1} />;
      })}
      <Polygon points={dataPts.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(34,211,238,0.15)" stroke={C.accent2} strokeWidth={2} strokeLinejoin="round" />
      {dataPts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill={dims[i].color} stroke={C.bg} strokeWidth={2} />
      ))}
      {dims.map((d, i) => {
        const lp = polar(angles[i], maxR + 18, cx, cy);
        return (
          <SvgText key={i} x={lp.x} y={lp.y} fill={d.color} fontSize={12} fontWeight="700"
            textAnchor="middle" alignmentBaseline="middle">{d.label}</SvgText>
        );
      })}
    </Svg>
  );
}
