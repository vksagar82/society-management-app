"use client";

import { useState, useEffect } from "react";

/**
 * Mobile-First Responsive Utilities
 *
 * This file contains responsive utility classes and breakpoint helpers
 * for mobile-first design approach.
 *
 * Breakpoints:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const SIDEBAR_WIDTH = {
  collapsed: "w-20",
  expanded: "w-64",
  mobile: "w-64",
} as const;

export const RESPONSIVE_CLASSES = {
  container: "mx-auto px-4 sm:px-6 lg:px-8",
  gridAuto: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  flexCenter: "flex items-center justify-center",
  card: "bg-white rounded-lg shadow-md p-4 sm:p-6",
  button: "px-4 py-2 rounded-lg font-medium transition-colors",
  input:
    "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  badge:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
} as const;

/**
 * Hook to detect if the screen is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook to get current screen size
 */
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  useEffect(() => {
    const getScreenSize = () => {
      if (window.innerWidth < BREAKPOINTS.md) {
        setScreenSize("mobile");
      } else if (window.innerWidth < BREAKPOINTS.lg) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    getScreenSize();
    window.addEventListener("resize", getScreenSize);
    return () => window.removeEventListener("resize", getScreenSize);
  }, []);

  return screenSize;
}
