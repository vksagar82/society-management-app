"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Key,
  Clock,
  Smartphone,
  ChevronRight,
  Mail,
  MessageSquare,
  Globe,
  DollarSign,
  Moon,
  Save,
  Sparkles,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type TabType = "profile" | "security" | "notifications" | "preferences";

const settingsTabs = [
  { id: "profile" as TabType, label: "Profile", icon: User },
  { id: "security" as TabType, label: "Security", icon: Shield },
  { id: "notifications" as TabType, label: "Notifications", icon: Bell },
  { id: "preferences" as TabType, label: "Preferences", icon: SettingsIcon },
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<TabType>("security");

  // Set active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["profile", "security", "notifications", "preferences"].includes(tabParam)
    ) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  // Notification toggles state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Preferences state
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [language, setLanguage] = useState("English");
  const [currency, setCurrency] = useState("EUR");

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <Card className="border-0" style={{ backgroundColor: "#141414" }}>
              <CardContent className="p-3">
                <nav className="space-y-1">
                  {settingsTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                          isActive
                            ? "text-white shadow-lg"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                        style={
                          isActive
                            ? {
                                backgroundColor: "hsl(var(--primary))",
                              }
                            : {}
                        }
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}

                  <div className="pt-4 mt-4 border-t border-gray-800">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-gray-400 hover:text-white hover:bg-white/5">
                      <HelpCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        Help & Support
                      </span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9">
            <Card className="border-0" style={{ backgroundColor: "#141414" }}>
              <CardContent className="p-4 sm:p-6">
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        Security
                      </h2>
                      <p className="text-sm text-gray-500">
                        Manage your account security settings
                      </p>
                    </div>

                    {/* Change Password */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "hsl(var(--primary) / 0.1)",
                          }}
                        >
                          <Key
                            className="h-5 w-5"
                            style={{ color: "hsl(var(--primary))" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            Change Password
                          </h3>
                          <p className="text-xs text-gray-500">
                            Update your password regularly for security
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          router.push("/dashboard/change-password")
                        }
                        variant="outline"
                        size="sm"
                        className="ml-4 border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        Change
                      </Button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "hsl(var(--primary) / 0.1)",
                          }}
                        >
                          <Shield
                            className="h-5 w-5"
                            style={{ color: "hsl(var(--primary))" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            Two-Factor Authentication
                          </h3>
                          <p className="text-xs text-gray-500">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                      </div>
                      <button
                        className="ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: "#374151",
                          focusRingColor: "hsl(var(--primary))",
                        }}
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
                      </button>
                    </div>

                    {/* Login History */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "hsl(var(--primary) / 0.1)",
                          }}
                        >
                          <Clock
                            className="h-5 w-5"
                            style={{ color: "hsl(var(--primary))" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            Login History
                          </h3>
                          <p className="text-xs text-gray-500">
                            View recent login activity
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4 border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        View
                      </Button>
                    </div>

                    {/* Active Sessions */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all group">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: "hsl(var(--primary) / 0.1)",
                          }}
                        >
                          <Smartphone
                            className="h-5 w-5"
                            style={{ color: "hsl(var(--primary))" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            Active Sessions
                          </h3>
                          <p className="text-xs text-gray-500">
                            Manage devices logged into your account
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4 border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        Profile
                      </h2>
                      <p className="text-sm text-gray-500">
                        Manage your profile information
                      </p>
                    </div>

                    {/* Profile Photo Section */}
                    <div
                      className="flex items-center gap-4 p-6 rounded-xl"
                      style={{ backgroundColor: "#0F0F0F" }}
                    >
                      <div
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)`,
                        }}
                      >
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                          {user.full_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        Change Photo
                      </Button>
                    </div>

                    {/* Personal Information Form */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Personal Information
                          </h3>
                          <p className="text-xs text-gray-500">
                            Manage your basic profile information
                          </p>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            defaultValue={user.full_name.split(" ")[0]}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{ focusRingColor: "hsl(var(--primary))" }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            defaultValue={user.full_name
                              .split(" ")
                              .slice(1)
                              .join(" ")}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{ focusRingColor: "hsl(var(--primary))" }}
                          />
                        </div>
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue={user.email}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{ focusRingColor: "hsl(var(--primary))" }}
                        />
                      </div>

                      {/* Phone Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Phone
                        </label>
                        <div className="flex gap-2">
                          <select className="px-3 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-offset-2">
                            <option>🇺🇸 +1</option>
                            <option>🇬🇧 +44</option>
                            <option>🇮🇳 +91</option>
                          </select>
                          <input
                            type="tel"
                            defaultValue={user.phone}
                            placeholder="Enter your phone number"
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{ focusRingColor: "hsl(var(--primary))" }}
                          />
                        </div>
                      </div>

                      {/* Country and Date of Birth */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Country
                          </label>
                          <select className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white focus:outline-none focus:ring-2 focus:ring-offset-2">
                            <option>🇺🇸 United States</option>
                            <option>🇬🇧 United Kingdom</option>
                            <option>🇮🇳 India</option>
                            <option>🇨🇦 Canada</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{ focusRingColor: "hsl(var(--primary))" }}
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <Button
                          size="lg"
                          style={{
                            backgroundColor: "hsl(var(--primary))",
                            color: "white",
                          }}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        Notifications
                      </h2>
                      <p className="text-sm text-gray-500">
                        Control how you receive notifications
                      </p>
                    </div>

                    {/* Communication Preferences */}
                    <div className="space-y-1 mb-6">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <h3 className="text-base font-semibold text-white">
                          Communication Preferences
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 ml-7">
                        Control how you receive notifications
                      </p>
                    </div>

                    {/* Email Alerts */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: emailAlerts
                              ? "hsl(var(--primary) / 0.1)"
                              : "#2A2A2A",
                          }}
                        >
                          <Mail
                            className="h-5 w-5"
                            style={{
                              color: emailAlerts
                                ? "hsl(var(--primary))"
                                : "#666",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            Email Alerts
                          </h3>
                          <p className="text-xs text-gray-500">
                            Receive transaction alerts via email
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEmailAlerts(!emailAlerts)}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          emailAlerts ? "" : "bg-gray-600"
                        }`}
                        style={
                          emailAlerts
                            ? {
                                backgroundColor: "hsl(var(--primary))",
                                focusRingColor: "hsl(var(--primary))",
                              }
                            : {}
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            emailAlerts ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: pushNotifications
                              ? "hsl(var(--primary) / 0.1)"
                              : "#2A2A2A",
                          }}
                        >
                          <Smartphone
                            className="h-5 w-5"
                            style={{
                              color: pushNotifications
                                ? "hsl(var(--primary))"
                                : "#666",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            Push Notifications
                          </h3>
                          <p className="text-xs text-gray-500">
                            Get instant updates on your device
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          pushNotifications ? "" : "bg-gray-600"
                        }`}
                        style={
                          pushNotifications
                            ? {
                                backgroundColor: "hsl(var(--primary))",
                                focusRingColor: "hsl(var(--primary))",
                              }
                            : {}
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            pushNotifications
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* SMS Alerts */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: smsAlerts
                              ? "hsl(var(--primary) / 0.1)"
                              : "#2A2A2A",
                          }}
                        >
                          <MessageSquare
                            className="h-5 w-5"
                            style={{
                              color: smsAlerts ? "hsl(var(--primary))" : "#666",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            SMS Alerts
                          </h3>
                          <p className="text-xs text-gray-500">
                            Receive important alerts via SMS
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSmsAlerts(!smsAlerts)}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          smsAlerts ? "" : "bg-gray-600"
                        }`}
                        style={
                          smsAlerts
                            ? {
                                backgroundColor: "hsl(var(--primary))",
                                focusRingColor: "hsl(var(--primary))",
                              }
                            : {}
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            smsAlerts ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Marketing Emails */}
                    <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                      <div className="flex gap-4 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: marketingEmails
                              ? "hsl(var(--primary) / 0.1)"
                              : "#2A2A2A",
                          }}
                        >
                          <Mail
                            className="h-5 w-5"
                            style={{
                              color: marketingEmails
                                ? "hsl(var(--primary))"
                                : "#666",
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white mb-1">
                            Marketing Emails
                          </h3>
                          <p className="text-xs text-gray-500">
                            Receive promotional offers and updates
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMarketingEmails(!marketingEmails)}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          marketingEmails ? "" : "bg-gray-600"
                        }`}
                        style={
                          marketingEmails
                            ? {
                                backgroundColor: "hsl(var(--primary))",
                                focusRingColor: "hsl(var(--primary))",
                              }
                            : {}
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            marketingEmails ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        Preferences
                      </h2>
                      <p className="text-sm text-gray-500">
                        Customize your application preferences
                      </p>
                    </div>

                    {/* Language & Region */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Language & Region
                          </h3>
                          <p className="text-xs text-gray-500">
                            Language and regional settings
                          </p>
                        </div>
                      </div>

                      {/* Language */}
                      <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex gap-4 flex-1">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "hsl(var(--primary) / 0.1)",
                            }}
                          >
                            <Globe
                              className="h-5 w-5"
                              style={{ color: "hsl(var(--primary))" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white mb-1">
                              Language
                            </h3>
                            <p className="text-xs text-gray-500">
                              Choose your preferred language
                            </p>
                          </div>
                        </div>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="ml-4 px-4 py-2 rounded-lg border border-gray-700 bg-black/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                          style={{ minWidth: "120px" }}
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Hindi">Hindi</option>
                        </select>
                      </div>

                      {/* Currency */}
                      <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex gap-4 flex-1">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "hsl(var(--primary) / 0.1)",
                            }}
                          >
                            <DollarSign
                              className="h-5 w-5"
                              style={{ color: "hsl(var(--primary))" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white mb-1">
                              Currency
                            </h3>
                            <p className="text-xs text-gray-500">
                              Set your default currency
                            </p>
                          </div>
                        </div>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="ml-4 px-4 py-2 rounded-lg border border-gray-700 bg-black/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                          style={{ minWidth: "120px" }}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                        </select>
                      </div>
                    </div>

                    {/* Display Preferences */}
                    <div className="space-y-4 pt-6 border-t border-gray-800">
                      <div className="flex items-center gap-3">
                        <SettingsIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Display Preferences
                          </h3>
                          <p className="text-xs text-gray-500">
                            Customize your interface
                          </p>
                        </div>
                      </div>

                      {/* Dark Mode */}
                      <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex gap-4 flex-1">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: darkMode
                                ? "hsl(var(--primary) / 0.1)"
                                : "#2A2A2A",
                            }}
                          >
                            <Moon
                              className="h-5 w-5"
                              style={{
                                color: darkMode
                                  ? "hsl(var(--primary))"
                                  : "#666",
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white mb-1">
                              Dark Mode
                            </h3>
                            <p className="text-xs text-gray-500">
                              Use dark theme
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setDarkMode(!darkMode)}
                          className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            darkMode ? "" : "bg-gray-600"
                          }`}
                          style={
                            darkMode
                              ? {
                                  backgroundColor: "hsl(var(--primary))",
                                  focusRingColor: "hsl(var(--primary))",
                                }
                              : {}
                          }
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              darkMode ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Auto Save */}
                      <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex gap-4 flex-1">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: autoSave
                                ? "hsl(var(--primary) / 0.1)"
                                : "#2A2A2A",
                            }}
                          >
                            <Save
                              className="h-5 w-5"
                              style={{
                                color: autoSave
                                  ? "hsl(var(--primary))"
                                  : "#666",
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white mb-1">
                              Auto Save
                            </h3>
                            <p className="text-xs text-gray-500">
                              Automatically save your work
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAutoSave(!autoSave)}
                          className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            autoSave ? "" : "bg-gray-600"
                          }`}
                          style={
                            autoSave
                              ? {
                                  backgroundColor: "hsl(var(--primary))",
                                  focusRingColor: "hsl(var(--primary))",
                                }
                              : {}
                          }
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              autoSave ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Animations */}
                      <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex gap-4 flex-1">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: animations
                                ? "hsl(var(--primary) / 0.1)"
                                : "#2A2A2A",
                            }}
                          >
                            <Sparkles
                              className="h-5 w-5"
                              style={{
                                color: animations
                                  ? "hsl(var(--primary))"
                                  : "#666",
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white mb-1">
                              Animations
                            </h3>
                            <p className="text-xs text-gray-500">
                              Enable smooth animations and transitions
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAnimations(!animations)}
                          className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            animations ? "" : "bg-gray-600"
                          }`}
                          style={
                            animations
                              ? {
                                  backgroundColor: "hsl(var(--primary))",
                                  focusRingColor: "hsl(var(--primary))",
                                }
                              : {}
                          }
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              animations ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Payment & Financial */}
                    <div className="space-y-4 pt-6 border-t border-gray-800">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="text-base font-semibold text-white">
                            Payment & Financial
                          </h3>
                          <p className="text-xs text-gray-500">
                            Payment and financial preferences
                          </p>
                        </div>
                      </div>

                      {/* Default Payment Method */}
                      <div className="flex items-start justify-between p-4 rounded-xl hover:bg-white/5 transition-all">
                        <div className="flex gap-4 flex-1">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "hsl(var(--primary) / 0.1)",
                            }}
                          >
                            <CreditCard
                              className="h-5 w-5"
                              style={{ color: "hsl(var(--primary))" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white mb-1">
                              Default Payment Method
                            </h3>
                            <p className="text-xs text-gray-500">
                              Choose your default payment card
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4 border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
