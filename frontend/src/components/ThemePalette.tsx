"use client";

import { useEffect, useState } from "react";
import { Palette, Check, X } from "lucide-react";

const palettes = [
  { name: "orange", color: "#EA580C", label: "Orange" },
  { name: "blue", color: "#3B82F6", label: "Blue" },
  { name: "green", color: "#10B981", label: "Green" },
  { name: "gray", color: "#6B7280", label: "Gray" },
];

export function ThemePalette() {
  const [currentPalette, setCurrentPalette] = useState("orange");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved palette from localStorage
    if (typeof window !== "undefined") {
      const savedPalette = localStorage.getItem("theme-palette") || "orange";
      setCurrentPalette(savedPalette);
      document.documentElement.setAttribute("data-theme", savedPalette);
    }
  }, []);

  const changePalette = (palette: string) => {
    console.log("Changing theme to:", palette);
    setCurrentPalette(palette);
    document.documentElement.setAttribute("data-theme", palette);
    localStorage.setItem("theme-palette", palette);
    console.log(
      "Current data-theme:",
      document.documentElement.getAttribute("data-theme")
    );
    console.log(
      "Primary color:",
      getComputedStyle(document.documentElement).getPropertyValue("--primary")
    );
    setIsOpen(false);
    // Force a re-render by toggling a CSS variable
    document.documentElement.style.setProperty(
      "--theme-updated",
      Date.now().toString()
    );
  };

  return (
    <>
      {/* Palette Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          backgroundColor: palettes.find((p) => p.name === currentPalette)
            ?.color,
        }}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full hover:opacity-90 shadow-lg flex items-center justify-center hover:scale-110 transition-all"
        aria-label="Change color theme"
      >
        <Palette className="h-5 w-5 text-white" />
      </button>

      {/* Theme Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-[320px] border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Theme Colors</h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{ backgroundColor: "hsl(var(--primary))" }}
                className="h-8 w-8 rounded-full hover:opacity-90 flex items-center justify-center transition-all"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Choose your preferred color theme
            </p>

            {/* Color Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {palettes.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => changePalette(palette.name)}
                  className="relative aspect-square rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
                  style={{ backgroundColor: palette.color }}
                  aria-label={`Select ${palette.label} theme`}
                >
                  {currentPalette === palette.name && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check
                        className="h-6 w-6 text-white drop-shadow-lg"
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Current Theme Info */}
            <div className="flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-lg mb-3">
              <span className="text-sm text-gray-400">Current:</span>
              <span
                className="text-sm font-semibold capitalize"
                style={{
                  color: palettes.find((p) => p.name === currentPalette)?.color,
                }}
              >
                {palettes.find((p) => p.name === currentPalette)?.label}
              </span>
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <span style={{ color: "hsl(var(--primary))" }} className="mt-0.5">
                ⚠
              </span>
              <p>
                This is a demo feature. Theme will persist after page reload.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
