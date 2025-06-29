import { useState, MouseEvent } from "react";
import { motion } from "framer-motion";
import Card from "./Card";

interface ChartDataPoint {
  label: string;
  value: number;
}

interface HoverPoint {
  index: number;
  x: number;
  y: number;
  data: ChartDataPoint;
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  width?: number;
  title?: string;
  subtitle?: string;
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  width = 800,
  title = "Performance Overview",
  subtitle = "Your business metrics for the last 30 days",
  color = "#4D45E1",
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.min(
      Math.floor((x / rect.width) * data.length),
      data.length - 1
    );

    const pxPerPoint = width / (data.length - 1);
    const value = data[index].value;
    const pointY = height - value;

    setHoverPoint({
      index,
      x: index * pxPerPoint,
      y: pointY,
      data: data[index],
    });
  };


  return (
    <Card>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{subtitle}</p>

      <div
        className="relative h-56"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Grid Lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="0"
              y1={(height / 4) * i}
              x2={width}
              y2={(height / 4) * i}
              stroke="#e5e7eb"
              strokeDasharray="5,5"
            />
          ))}

          {/* Gradient + Area */}
          <defs>
            <linearGradient
              id="chartGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <motion.path
            d={`M 0,${height} ${data
              .map((d, i) => {
                const x = i * (width / (data.length - 1));
                const y = height - d.value;
                return `${x},${y}`;
              })
              .join(" L ")} L ${width},${height} Z`}
            fill="url(#chartGradient)"
            fillOpacity="0.2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Line Path */}
          <motion.path
            d={`M ${data.map((d, i) => `${i * (800 / (data.length - 1))},${200 - d.value}`).join(' L ')}`}
            fill="none"
            stroke={color}
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Points */}
          {data.map((d, i) => {
            const cx = i * (width / (data.length - 1));
            const cy = height - d.value;
            return (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={hoverPoint?.index === i ? 6 : 4}
                fill={hoverPoint?.index === i ? color : "#fff"}
                stroke={color}
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring" }}
              />
            );
          })}

          {/* Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={i * (width / (data.length - 1))}
              y={height + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {d.label}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {isHovering && hoverPoint && (
          <div
            className="absolute bg-white shadow-lg rounded-md px-3 py-2 text-sm pointer-events-none"
            style={{
              left: `${(hoverPoint.x / width) * 100}%`,
              top: `${(hoverPoint.y / height) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <div className="font-medium">{hoverPoint.data.label}</div>
            <div className="text-blue-600">
              {Math.round(hoverPoint.data.value)}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LineChart;
