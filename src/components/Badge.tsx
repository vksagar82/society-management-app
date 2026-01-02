"use client";

import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "red" | "yellow";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = "blue",
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    yellow: "bg-yellow-50 border-yellow-200",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${iconColorClasses[color]} text-4xl`}>{icon}</div>
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    open: { bg: "bg-red-100", text: "text-red-800" },
    in_progress: { bg: "bg-blue-100", text: "text-blue-800" },
    resolved: { bg: "bg-green-100", text: "text-green-800" },
    closed: { bg: "bg-gray-100", text: "text-gray-800" },
    active: { bg: "bg-green-100", text: "text-green-800" },
    expired: { bg: "bg-red-100", text: "text-red-800" },
    pending_renewal: { bg: "bg-yellow-100", text: "text-yellow-800" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const priorityConfig = {
    low: { bg: "bg-green-100", text: "text-green-800" },
    medium: { bg: "bg-yellow-100", text: "text-yellow-800" },
    high: { bg: "bg-orange-100", text: "text-orange-800" },
    urgent: { bg: "bg-red-100", text: "text-red-800" },
  };

  const config = priorityConfig[priority as keyof typeof priorityConfig] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
    >
      {priority}
    </span>
  );
};
