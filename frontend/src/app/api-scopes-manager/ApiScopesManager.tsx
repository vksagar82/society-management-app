"use client";

import { useState, useEffect } from "react";
import {
  AVAILABLE_SCOPES,
  DEFAULT_ROLE_SCOPES,
  getScopesGroupedByCategory,
  RoleType,
} from "@/lib/auth/scopes";
import styles from "./ApiScopesManager.module.css";

interface RoleScope {
  id: string;
  role: RoleType;
  scope_name: string;
  scope_description?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function ApiScopesManager() {
  const [scopes, setScopes] = useState<RoleScope[]>([]);
  const [defaultScopes, setDefaultScopes] =
    useState<Record<RoleType, string[]>>(DEFAULT_ROLE_SCOPES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleType>("admin");
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const roles: RoleType[] = ["developer", "admin", "manager", "member"];
  const scopeCategories = getScopesGroupedByCategory();

  // Get token from localStorage on mount
  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    setToken(authToken);
  }, []);

  // Fetch scopes when token is available
  useEffect(() => {
    if (token) {
      fetchScopes();
    } else {
      setLoading(false);
      setError("No authentication token found. Please login.");
    }
  }, [token]);

  const fetchScopes = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError("No authentication token found. Please login.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/scopes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(
          `Failed to fetch scopes (${response.status}): ${
            errorData.error || response.statusText
          }`
        );
        console.error("Fetch scopes error:", response.status, errorData);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setScopes(data.scopes || []);
      setError(null);
      if (data.defaultScopes) {
        setDefaultScopes(data.defaultScopes as Record<RoleType, string[]>);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Fetch scopes exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleScope = async (scopeName: string, currentState: boolean) => {
    try {
      setSaving(true);
      // Align with auth context token key used across the app
      const token = localStorage.getItem("auth_token");

      // Find existing scope
      const existingScope = scopes.find(
        (s) => s.scope_name === scopeName && s.role === selectedRole
      );

      if (existingScope) {
        // Update existing
        const response = await fetch("/api/scopes", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: existingScope.id,
            isEnabled: !currentState,
            description: existingScope.scope_description,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update scope");
        }

        const updated = await response.json();
        setScopes(scopes.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        // Create new
        const response = await fetch("/api/scopes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: selectedRole,
            scopeName,
            isEnabled: true,
            description: AVAILABLE_SCOPES[scopeName]?.description,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create scope");
        }

        const created = await response.json();
        setScopes([...scopes, created]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const isScopeEnabled = (scopeName: string): boolean => {
    const scope = scopes.find(
      (s) => s.scope_name === scopeName && s.role === selectedRole
    );
    if (scope) return scope.is_enabled;
    // Fallback to default scopes when no explicit record exists
    return defaultScopes[selectedRole]?.includes(scopeName) || false;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading API scopes...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>API Scopes Management</h1>
        <p className={styles.subtitle}>
          Configure permissions for each role to control feature visibility and
          access
        </p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Role Selection */}
      <div className={styles.roleSelectionCard}>
        <div className={styles.cardContent}>
          <h2 className={styles.cardTitle}>Select Role</h2>
          <div className={styles.roleButtonsContainer}>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`${styles.roleButton} ${
                  selectedRole === role
                    ? styles.roleButtonActive
                    : styles.roleButtonInactive
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scopes by Category */}
      <div className={styles.scopesContainer}>
        {Object.entries(scopeCategories).map(([category, categoryScopes]) => (
          <div key={category} className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryTitle}>{category} Management</h3>
            </div>
            <div className={styles.scopesList}>
              {categoryScopes.map((scope) => (
                <div key={scope.name} className={styles.scopeItem}>
                  <div className={styles.scopeInfo}>
                    <h4 className={styles.scopeName}>{scope.name}</h4>
                    <p className={styles.scopeDescription}>
                      {scope.description}
                    </p>
                    <div className={styles.actionsContainer}>
                      {scope.actions.map((action) => (
                        <span key={action} className={styles.actionBadge}>
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.scopeToggleContainer}>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={isScopeEnabled(scope.name)}
                        onChange={() =>
                          toggleScope(scope.name, isScopeEnabled(scope.name))
                        }
                        disabled={saving}
                        className={styles.toggleInput}
                      />
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
