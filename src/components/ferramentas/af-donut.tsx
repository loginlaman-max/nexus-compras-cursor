"use client";

interface AfDonutSegment {
  label: string;
  value: number;
  color: string;
}

interface AfDonutProps {
  segments: AfDonutSegment[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}

export function AfDonut({
  segments,
  size = 150,
  thickness = 20,
  center,
}: AfDonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  let off = 0;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => {
          const len = (Math.max(0, s.value) / total) * c;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-off}
              strokeLinecap="butt"
            />
          );
          off += len;
          return seg;
        })}
      </svg>
      {center && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {center}
        </div>
      )}
    </div>
  );
}
