"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import {
  BuildingOfficeIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface Society {
  id: string;
  name: string;
  city: string;
  state: string;
}

export function SocietySelector() {
  const { user, selectedSocietyId, setSelectedSociety } = useAuth();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentSociety, setCurrentSociety] = useState<Society | null>(null);

  useEffect(() => {
    if (user?.global_role === "developer") {
      fetchSocieties();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSocietyId && societies.length > 0) {
      const society = societies.find((s) => s.id === selectedSocietyId);
      setCurrentSociety(society || null);
    }
  }, [selectedSocietyId, societies]);

  const fetchSocieties = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/societies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSocieties(data);

        // Auto-select first society if none selected
        if (!selectedSocietyId && data.length > 0) {
          setSelectedSociety(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch societies:", error);
    }
  };

  const handleSocietyChange = (societyId: string) => {
    setSelectedSociety(societyId);
    setIsOpen(false);
  };

  // Don't show for non-developers
  if (user?.global_role !== "developer") {
    return null;
  }

  // Show warning if no society selected
  if (!selectedSocietyId || !currentSociety) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-6 w-6 text-yellow-400 mr-3" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              No Society Selected
            </p>
            <p className="text-xs text-yellow-700">
              Please select a society to view data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <BuildingOfficeIcon className="h-5 w-5" />
          <div className="text-left">
            <p className="text-xs font-semibold opacity-80">Current Society</p>
            <p className="text-sm font-bold">{currentSociety.name}</p>
          </div>
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-20 max-h-96 overflow-y-auto border border-slate-200">
            {societies.map((society) => (
              <button
                key={society.id}
                onClick={() => handleSocietyChange(society.id)}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0 ${
                  society.id === selectedSocietyId
                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                    : ""
                }`}
              >
                <p className="font-semibold text-slate-800">{society.name}</p>
                <p className="text-xs text-slate-500">
                  {society.city}, {society.state}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
