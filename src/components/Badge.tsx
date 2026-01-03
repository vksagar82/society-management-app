"use client";

import React from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  FireIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "red" | "purple" | "indigo" | "cyan" | "orange";
  trend?: number;
  trendLabel?: string;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = "blue",
  trend,
  trendLabel,
  description,
}) => {
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50",
      border: "border-blue-300",
      icon: "text-blue-600",
      trend: "text-blue-700 bg-blue-100 border-blue-200",
      ring: "ring-blue-200",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 via-emerald-100 to-green-50",
      border: "border-green-300",
      icon: "text-green-600",
      trend: "text-green-700 bg-green-100 border-green-200",
      ring: "ring-green-200",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 via-red-100 to-rose-50",
      border: "border-red-300",
      icon: "text-red-600",
      trend: "text-red-700 bg-red-100 border-red-200",
      ring: "ring-red-200",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50",
      border: "border-orange-300",
      icon: "text-orange-600",
      trend: "text-orange-700 bg-orange-100 border-orange-200",
      ring: "ring-orange-200",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 via-purple-100 to-fuchsia-50",
      border: "border-purple-300",
      icon: "text-purple-600",
      trend: "text-purple-700 bg-purple-100 border-purple-200",
      ring: "ring-purple-200",
    },
    indigo: {
      bg: "bg-gradient-to-br from-indigo-50 via-indigo-100 to-blue-50",
      border: "border-indigo-300",
      icon: "text-indigo-600",
      trend: "text-indigo-700 bg-indigo-100 border-indigo-200",
      ring: "ring-indigo-200",
    },
    cyan: {
      bg: "bg-gradient-to-br from-cyan-50 via-cyan-100 to-teal-50",
      border: "border-cyan-300",
      icon: "text-cyan-600",
      trend: "text-cyan-700 bg-cyan-100 border-cyan-200",
      ring: "ring-cyan-200",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-sm transform hover:-translate-y-1 ${colors.ring} ring-2`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {icon && (
          <div
            className={`${colors.icon} text-4xl flex-shrink-0 opacity-80 transform transition-transform duration-300 hover:scale-110 mb-4`}
          >
            {icon}
          </div>
        )}
        <div className="w-full">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">
            {title}
          </p>
          <p className="text-4xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mt-1">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-600 mt-2 font-medium">
              {description}
            </p>
          )}
          {trend !== undefined && (
            <div
              className={`mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold border ${colors.trend} shadow-sm`}
            >
              {trend > 0 ? (
                <ArrowUpIcon className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownIcon className="w-3.5 h-3.5" />
              )}
              {Math.abs(trend)}%
              {trendLabel && (
                <span className="text-gray-600 font-medium">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    open: {
      bg: "bg-gradient-to-r from-red-100 to-red-200",
      text: "text-red-800",
      icon: ExclamationCircleIcon,
      border: "border-red-300",
    },
    in_progress: {
      bg: "bg-gradient-to-r from-blue-100 to-blue-200",
      text: "text-blue-800",
      icon: ClockIcon,
      border: "border-blue-300",
    },
    resolved: {
      bg: "bg-gradient-to-r from-green-100 to-green-200",
      text: "text-green-800",
      icon: CheckCircleIcon,
      border: "border-green-300",
    },
    closed: {
      bg: "bg-gradient-to-r from-gray-100 to-gray-200",
      text: "text-gray-800",
      icon: XCircleIcon,
      border: "border-gray-300",
    },
    active: {
      bg: "bg-gradient-to-r from-green-100 to-emerald-200",
      text: "text-green-800",
      icon: CheckCircleIcon,
      border: "border-green-300",
    },
    expired: {
      bg: "bg-gradient-to-r from-red-100 to-rose-200",
      text: "text-red-800",
      icon: XCircleIcon,
      border: "border-red-300",
    },
    pending_renewal: {
      bg: "bg-gradient-to-r from-yellow-100 to-amber-200",
      text: "text-yellow-800",
      icon: ClockIcon,
      border: "border-yellow-300",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    bg: "bg-gradient-to-r from-gray-100 to-gray-200",
    text: "text-gray-800",
    icon: ExclamationCircleIcon,
    border: "border-gray-300",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${config.bg} ${config.text} border-2 ${config.border} shadow-sm`}
    >
      <Icon className="w-4 h-4" />
      {status.replace("_", " ")}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const priorityConfig = {
    low: {
      bg: "bg-gradient-to-r from-green-100 to-emerald-200",
      text: "text-green-800",
      icon: SignalIcon,
      border: "border-green-300",
    },
    medium: {
      bg: "bg-gradient-to-r from-yellow-100 to-amber-200",
      text: "text-yellow-800",
      icon: SignalIcon,
      border: "border-yellow-300",
    },
    high: {
      bg: "bg-gradient-to-r from-orange-100 to-orange-200",
      text: "text-orange-800",
      icon: ExclamationCircleIcon,
      border: "border-orange-300",
    },
    urgent: {
      bg: "bg-gradient-to-r from-red-100 to-rose-200",
      text: "text-red-800",
      icon: FireIcon,
      border: "border-red-300",
    },
  };

  const config = priorityConfig[priority as keyof typeof priorityConfig] || {
    bg: "bg-gradient-to-r from-gray-100 to-gray-200",
    text: "text-gray-800",
    icon: SignalIcon,
    border: "border-gray-300",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${config.bg} ${config.text} border-2 ${config.border} shadow-sm`}
    >
      <Icon className="w-4 h-4" />
      {priority}
    </span>
  );
};
