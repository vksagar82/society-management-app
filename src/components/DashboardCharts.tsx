"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Enhanced Line Chart with gradients and modern styling
export const LineChart: React.FC<{
  title: string;
  data: { label: string; value: number }[];
  height?: number;
  onClick?: () => void;
  clickable?: boolean;
}> = ({ title, data, height = 300, onClick, clickable = false }) => {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  return (
    <div
      className={`bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-md p-6 border border-blue-100 ${
        clickable
          ? "cursor-pointer hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {title}
        </h3>
        {clickable && (
          <ChevronRightIcon className="w-5 h-5 text-blue-600 animate-pulse" />
        )}
      </div>
      <svg
        viewBox="0 0 800 300"
        className="w-full mx-auto"
        style={{ height: `${height}px` }}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1="60"
            y1={300 - (i * 300) / 4}
            x2="780"
            y2={300 - (i * 300) / 4}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <polygon
          points={`60,280 ${data
            .map(
              (d, i) =>
                `${60 + (i * 720) / (data.length - 1 || 1)},${
                  280 - ((d.value - min) / range) * 240
                }`
            )
            .join(" ")} ${
            60 + (720 * (data.length - 1)) / (data.length - 1 || 1)
          },280`}
          fill="url(#lineGradient)"
        />

        {/* Line path with gradient */}
        <polyline
          points={data
            .map(
              (d, i) =>
                `${60 + (i * 720) / (data.length - 1 || 1)},${
                  280 - ((d.value - min) / range) * 240
                }`
            )
            .join(" ")}
          fill="none"
          stroke="url(#lineStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Enhanced dots with glow effect */}
        {data.map((d, i) => (
          <g key={`dot-${i}`}>
            <circle
              cx={60 + (i * 720) / (data.length - 1 || 1)}
              cy={280 - ((d.value - min) / range) * 240}
              r="6"
              fill="#3b82f6"
              opacity="0.2"
            />
            <circle
              cx={60 + (i * 720) / (data.length - 1 || 1)}
              cy={280 - ((d.value - min) / range) * 240}
              r="4"
              fill="#fff"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`label-${i}`}
            x={60 + (i * 720) / (data.length - 1 || 1)}
            y="295"
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            fontWeight="500"
          >
            {d.label}
          </text>
        ))}
      </svg>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <span className="text-sm font-medium text-gray-700">Trend Data</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Bar Chart with gradients
export const BarChart: React.FC<{
  title: string;
  data: { label: string; value: number; color?: string }[];
  height?: number;
  onClick?: () => void;
  clickable?: boolean;
}> = ({ title, data, height = 300, onClick, clickable = false }) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      className={`bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-md p-6 border border-indigo-100 ${
        clickable
          ? "cursor-pointer hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {title}
        </h3>
        {clickable && (
          <ChevronRightIcon className="w-5 h-5 text-indigo-600 animate-pulse" />
        )}
      </div>
      <svg
        viewBox="0 0 800 300"
        className="w-full mx-auto"
        style={{ height: `${height}px` }}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`grid-${i}`}
            x1="60"
            y1={300 - (i * 300) / 4}
            x2="780"
            y2={300 - (i * 300) / 4}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Bars with gradients */}
        {data.map((d, i) => {
          const barHeight = (d.value / max) * 240;
          const barWidth = 700 / (data.length || 1);
          const x = 60 + i * barWidth + barWidth * 0.1;

          return (
            <g key={`bar-${i}`}>
              <defs>
                <linearGradient
                  id={`barGradient${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={d.color || "#3b82f6"} />
                  <stop
                    offset="100%"
                    stopColor={d.color || "#3b82f6"}
                    stopOpacity="0.7"
                  />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={280 - barHeight}
                width={barWidth * 0.8}
                height={barHeight}
                fill={`url(#barGradient${i})`}
                rx="6"
                className="transition-all duration-300 hover:opacity-80"
              />
              <text
                x={x + (barWidth * 0.8) / 2}
                y="295"
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
                fontWeight="500"
              >
                {d.label}
              </text>
              <text
                x={x + (barWidth * 0.8) / 2}
                y={280 - barHeight - 8}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#374151"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {data.map((d, i) => (
          <div key={`legend-${i}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: d.color || "#3b82f6" }}
            ></div>
            <span className="text-sm font-medium text-gray-700">
              {d.label}: {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Pie Chart with shadows
export const PieChart: React.FC<{
  title: string;
  data: { label: string; value: number; color: string }[];
  size?: number;
  onClick?: () => void;
  clickable?: boolean;
}> = ({ title, data, size = 200, onClick, clickable = false }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Filter out items with 0 value for pie chart calculation
  const dataWithValues = data.filter((d) => d.value > 0);
  const totalWithValues = dataWithValues.reduce((sum, d) => sum + d.value, 0);

  // If no data with values, show a message
  if (totalWithValues === 0) {
    return (
      <div
        className={`bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md p-6 border border-purple-100 ${
          clickable ? "cursor-pointer hover:shadow-xl" : ""
        }`}
        onClick={onClick}
      >
        {title && (
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {title}
          </h3>
        )}
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-500 text-center">No data available</p>
        </div>
      </div>
    );
  }

  let currentAngle = -90;

  const segments = dataWithValues.map((d) => {
    const sliceAngle = (d.value / totalWithValues) * 360;

    // Handle 100% case - use 359.9 degrees instead of 360 to ensure arc renders
    const actualSliceAngle = sliceAngle >= 359.9 ? 359.9 : sliceAngle;
    const startAngle = (currentAngle * Math.PI) / 180;
    const endAngle = ((currentAngle + actualSliceAngle) * Math.PI) / 180;

    const x1 = size + size * Math.cos(startAngle);
    const y1 = size + size * Math.sin(startAngle);
    const x2 = size + size * Math.cos(endAngle);
    const y2 = size + size * Math.sin(endAngle);

    const largeArc = actualSliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${size} ${size}`,
      `L ${x1} ${y1}`,
      `A ${size} ${size} 0 ${largeArc} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    const segment = {
      pathData,
      color: d.color,
      label: d.label,
      value: d.value,
    };
    currentAngle += actualSliceAngle;
    return segment;
  });

  return (
    <div
      className={`bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-md p-6 border border-purple-100 ${
        clickable
          ? "cursor-pointer hover:shadow-xl hover:border-purple-200 transition-all duration-300 hover:-translate-y-1"
          : ""
      }`}
      onClick={onClick}
    >
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title}
          </h3>
          {clickable && (
            <ChevronRightIcon className="w-5 h-5 text-purple-600 animate-pulse" />
          )}
        </div>
      )}
      <div className="flex flex-col gap-6 items-center justify-center">
        <svg
          width={size * 2 + 20}
          height={size * 2 + 20}
          className="flex-shrink-0 mx-auto"
        >
          <defs>
            {segments.map((segment, i) => (
              <filter key={`shadow${i}`} id={`shadow${i}`}>
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="2"
                  floodOpacity="0.2"
                />
              </filter>
            ))}
          </defs>
          {segments.map((segment, i) => (
            <path
              key={`segment-${i}`}
              d={segment.pathData}
              fill={segment.color}
              opacity="0.9"
              filter={`url(#shadow${i})`}
              className="transition-all duration-300 hover:opacity-100"
            />
          ))}
        </svg>
        <div className="w-full flex flex-col gap-3 items-center justify-center">
          {data.map((d, i) => {
            const percentage =
              total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
            return (
              <div
                key={`legend-${i}`}
                className={`flex items-center justify-center gap-3 w-full ${
                  d.value === 0 ? "opacity-40" : ""
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-sm font-medium text-gray-700 text-center flex-1">
                  {d.label}
                </span>
                <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {d.value} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Enhanced Progress Bar with shimmer effect
export const ProgressBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color?: string;
}> = ({ label, value, max, color = "bg-blue-600" }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">
          {value} / {max}
        </span>
      </div>
      <div className="relative w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-500 ease-out rounded-full shadow-md relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

// Enhanced Trend Card with Heroicons
export const TrendCard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  isPositive?: boolean;
  icon?: React.ReactNode;
}> = ({ title, value, change, isPositive = true, icon }) => {
  const showPositive = isPositive ? change >= 0 : change < 0;
  const TrendIcon = change >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  const ArrowIcon = change >= 0 ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl p-5 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
          {title}
        </span>
        {icon ? (
          <span className="text-2xl">{icon}</span>
        ) : (
          <TrendIcon className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <p className="text-3xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
        {value}
      </p>
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-bold ${
          showPositive
            ? "text-green-700 bg-gradient-to-r from-green-50 to-green-100 border border-green-200"
            : "text-red-700 bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
        } px-3 py-1.5 rounded-full shadow-sm`}
      >
        <ArrowIcon className="w-3.5 h-3.5" />
        {Math.abs(change)}% vs last month
      </div>
    </div>
  );
};
