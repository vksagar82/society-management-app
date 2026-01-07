"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusCircleIcon,
  Squares2X2Icon,
  TagIcon,
} from "@heroicons/react/24/outline";
import React from "react";

const LINKS = [
  { href: "/assets", label: "All Assets", icon: Squares2X2Icon },
  { href: "/assets?add=1", label: "Add Asset", icon: PlusCircleIcon },
  { href: "/assets/categories", label: "Categories", icon: TagIcon },
];

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const hrefPath = href.split("?")[0];
    return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <aside className="w-64 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-4 py-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Assets</h2>
              <p className="text-sm text-slate-500">Quick actions</p>
            </div>
            <nav className="p-3 flex flex-col gap-2">
              {LINKS.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      active
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        active ? "text-blue-600" : "text-slate-500"
                      }`}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
