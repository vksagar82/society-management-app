"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "admin" | "manager" | "member";
  society_id: string;
  flat_no?: string;
  wing?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    societyId: string
  ) => Promise<void>;
  updateUserRole: (
    userId: string,
    newRole: "admin" | "manager" | "member"
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem("auth_token");
      }
    } catch (err) {
      console.error("Error checking user:", err);
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const { token, user: userData } = await response.json();
      localStorage.setItem("auth_token", token);
      setUser(userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("auth_token");
      setUser(null);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    societyId: string
  ) => {
    try {
      setError(null);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone, societyId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Signup failed");
      }

      const { token, user: userData } = await response.json();
      localStorage.setItem("auth_token", token);
      setUser(userData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    }
  };

  const updateUserRole = async (
    userId: string,
    newRole: "admin" | "manager" | "member"
  ) => {
    try {
      setError(null);
      const token = localStorage.getItem("auth_token");

      const response = await fetch("/api/auth/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      // Refresh user data if updating own role
      if (user?.id === userId) {
        await checkUser();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update role";
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, signup, updateUserRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
