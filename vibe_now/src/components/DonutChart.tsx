interface DonutSegment {
  provider: string;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
}

export function DonutChart({ segments, size = 80 }: DonutChartProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-hover)"
          strokeWidth={strokeWidth}
        />
        {segments.map((segment, index) => {
          const segmentPercent = segment.percentage;
          const offset = circumference - (cumulativePercent / 100) * circumference;
          const dashArray = `${(segmentPercent / 100) * circumference} ${circumference}`;

          const result = (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );

          cumulativePercent += segmentPercent;
          return result;
        })}
      </svg>

      <div className="flex flex-col gap-1.5">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[var(--text-xs)] text-[var(--text-secondary)]">
              {segment.provider}
            </span>
            <span className="text-[var(--text-xs)] font-mono text-[var(--text-tertiary)]">
              {segment.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
