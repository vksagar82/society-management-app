import { useAuth } from "./context";
import { useState, useEffect } from "react";
import { useSelectedSociety } from "./useSelectedSociety";

export function useSelectedSocietyName() {
  const societyId = useSelectedSociety();
  const { loading } = useAuth();
  const [societyName, setSocietyName] = useState<string | null>(null);

  useEffect(() => {
    const fetchSocietyName = async () => {
      if (societyId) {
        try {
          const token = localStorage.getItem("auth_token");
          const response = await fetch("/api/societies", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const societies = await response.json();
            const selectedSociety = societies.find(
              (s: any) => s.id === societyId
            );
            if (selectedSociety) {
              setSocietyName(selectedSociety.name);
            }
          }
        } catch (error) {
          console.error("Failed to fetch society name:", error);
        }
      }
    };

    if (societyId && !loading) {
      fetchSocietyName();
    }
  }, [societyId, loading]);

  return societyName;
}
