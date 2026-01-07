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
      bg: "bg-[var(--card)]",
      border: "border-blue-400/30",
      icon: "text-cyan-200",
      trend: "text-cyan-50 bg-cyan-500/15 border-cyan-300/40",
      ring: "ring-cyan-500/10",
    },
    green: {
      bg: "bg-[var(--card)]",
      border: "border-emerald-400/30",
      icon: "text-emerald-200",
      trend: "text-emerald-50 bg-emerald-500/15 border-emerald-300/40",
      ring: "ring-emerald-500/10",
    },
    red: {
      bg: "bg-[var(--card)]",
      border: "border-rose-400/30",
      icon: "text-rose-200",
      trend: "text-rose-50 bg-rose-500/15 border-rose-300/40",
      ring: "ring-rose-500/10",
    },
    orange: {
      bg: "bg-[var(--card)]",
      border: "border-amber-400/30",
      icon: "text-amber-200",
      trend: "text-amber-50 bg-amber-500/15 border-amber-300/40",
      ring: "ring-amber-500/10",
    },
    purple: {
      bg: "bg-[var(--card)]",
      border: "border-purple-400/30",
      icon: "text-purple-200",
      trend: "text-purple-50 bg-purple-500/15 border-purple-300/40",
      ring: "ring-purple-500/10",
    },
    indigo: {
      bg: "bg-[var(--card)]",
      border: "border-indigo-400/30",
      icon: "text-indigo-200",
      trend: "text-indigo-50 bg-indigo-500/15 border-indigo-300/40",
      ring: "ring-indigo-500/10",
    },
    cyan: {
      bg: "bg-[var(--card)]",
      border: "border-cyan-400/30",
      icon: "text-cyan-200",
      trend: "text-cyan-50 bg-cyan-500/15 border-cyan-300/40",
      ring: "ring-cyan-500/10",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-sm transform hover:-translate-y-1 ${colors.ring} ring-2 text-[var(--foreground)]`}
    >
      <div className="flex flex-col items-center justify-center text-center">
        {icon && (
          <div
            className={`${colors.icon} flex-shrink-0 opacity-90 transform transition-transform duration-300 hover:scale-110 mb-3 drop-shadow-[0_0_14px_rgba(59,130,246,0.35)]`}
          >
            {icon}
          </div>
        )}
        <div className="w-full min-w-0">
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mb-2 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-50 via-white to-slate-200 bg-clip-text text-transparent mt-1 drop-shadow-[0_0_18px_rgba(0,0,0,0.35)] break-all">
            {value}
          </p>
          {description && (
            <p className="text-xs text-[var(--muted)] mt-2 font-medium truncate">
              {description}
            </p>
          )}
          {trend !== undefined && (
            <div
              className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border ${colors.trend} shadow-sm`}
            >
              {trend > 0 ? (
                <ArrowUpIcon className="w-3 h-3 flex-shrink-0" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 flex-shrink-0" />
              )}
              <span className="whitespace-nowrap">{Math.abs(trend)}%</span>
              {trendLabel && (
                <span className="hidden sm:inline text-xs font-medium truncate">
                  {trendLabel}
                </span>
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
