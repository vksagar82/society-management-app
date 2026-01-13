"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
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
  Building2,
  MapPin,
  Phone,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  getCurrentUser,
  User as UserType,
  logout,
} from "@/store/slices/authSlice";

type TabType = "profile" | "security" | "notifications" | "preferences";

const settingsTabs = [
  { id: "profile" as TabType, label: "Profile", icon: User },
  { id: "security" as TabType, label: "Security", icon: Shield },
  { id: "notifications" as TabType, label: "Notifications", icon: Bell },
  { id: "preferences" as TabType, label: "Preferences", icon: SettingsIcon },
];

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fullUserData, setFullUserData] = useState<UserType | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  // Fetch complete user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await api.get<UserType>("/api/v1/users/me");
        setFullUserData(userData);
        setProfileData({
          full_name: userData.full_name,
          email: userData.email,
          phone: userData.phone || "",
          avatar_url: userData.avatar_url || "",
        });

        // Load user preferences from settings
        if (userData.settings) {
          setLanguage(userData.settings.language || "English");
          setCurrency(userData.settings.currency || "INR");
          setDarkMode(userData.settings.darkMode ?? true);
          setAutoSave(userData.settings.autoSave ?? true);
          setAnimations(userData.settings.animations ?? true);
          setEmailAlerts(userData.settings.emailAlerts ?? true);
          setPushNotifications(userData.settings.pushNotifications ?? true);
          setSmsAlerts(userData.settings.smsAlerts ?? false);
          setMarketingEmails(userData.settings.marketingEmails ?? false);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!fullUserData) return;

    setIsLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await api.put<UserType>(
        `/api/v1/users/${fullUserData.id}`,
        {
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url || undefined,
        }
      );

      setFullUserData(updated);
      setSaveSuccess(true);

      // Refresh user in Redux store
      dispatch(getCurrentUser());

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    if (!fullUserData) return;

    setIsLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await api.put<UserType>(
        `/api/v1/users/${fullUserData.id}`,
        {
          settings: {
            language,
            currency,
            darkMode,
            autoSave,
            animations,
            emailAlerts,
            pushNotifications,
            smsAlerts,
            marketingEmails,
          },
        }
      );

      setFullUserData(updated);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error.message || "Failed to update preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (avatarUrl: string) => {
    if (!fullUserData) return;

    try {
      await api.post(`/api/v1/users/profile/avatar`, avatarUrl);
      setProfileData({ ...profileData, avatar_url: avatarUrl });
      dispatch(getCurrentUser());
    } catch (error) {
      console.error("Failed to update avatar:", error);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !fullUserData) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file");
      setTimeout(() => setSaveError(null), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image size should be less than 5MB");
      setTimeout(() => setSaveError(null), 3000);
      return;
    }

    setAvatarUploading(true);
    setSaveError(null);

    try {
      // Convert file to base64 or upload to a service
      // For now, we'll use a placeholder URL or you can integrate with cloud storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // Update profile with new avatar URL (you may want to upload to cloud storage first)
        // For demonstration, we'll update with the data URL
        // In production, upload to S3/Cloudinary/etc and use that URL

        const updated = await api.put<UserType>(
          `/api/v1/users/${fullUserData.id}`,
          {
            avatar_url: base64String,
          }
        );

        setFullUserData(updated);
        setProfileData({ ...profileData, avatar_url: base64String });
        dispatch(getCurrentUser());
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      setSaveError(error.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById("avatar-upload")?.click();
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth/login");
  };

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
  const [currency, setCurrency] = useState("INR");

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
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
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

                    {/* Success/Error Messages */}
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-400"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">
                          Profile updated successfully!
                        </span>
                      </motion.div>
                    )}

                    {saveError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400"
                      >
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-sm">{saveError}</span>
                      </motion.div>
                    )}

                    {/* Profile Photo Section */}
                    <div
                      className="flex items-center gap-4 p-6 rounded-xl"
                      style={{ backgroundColor: "#0F0F0F" }}
                    >
                      {/* Hidden file input */}
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <div
                        className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 overflow-hidden"
                        style={{
                          ...(profileData.avatar_url
                            ? {
                                backgroundImage: `url(${profileData.avatar_url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : {
                                backgroundImage: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }),
                        }}
                      >
                        {!profileData.avatar_url &&
                          profileData.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                          {profileData.full_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">
                          {profileData.email}
                        </p>
                        {fullUserData?.global_role && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary capitalize">
                            {fullUserData.global_role}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={triggerFileInput}
                        disabled={avatarUploading}
                        className="border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {avatarUploading ? "Uploading..." : "Change Photo"}
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
                            Update your basic profile information
                          </p>
                        </div>
                      </div>

                      {/* Full Name Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.full_name}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              full_name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{ focusRingColor: "hsl(var(--primary))" }}
                          placeholder="Enter your full name"
                        />
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{ focusRingColor: "hsl(var(--primary))" }}
                          placeholder="Enter your email"
                        />
                      </div>

                      {/* Phone Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Enter your phone number"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-black/50 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{ focusRingColor: "hsl(var(--primary))" }}
                        />
                      </div>

                      {/* Account Information (Read-only) */}
                      {fullUserData && (
                        <div className="pt-4 border-t border-gray-800">
                          <div className="flex items-center gap-3 mb-4">
                            <Shield className="h-5 w-5 text-gray-500" />
                            <div>
                              <h3 className="text-base font-semibold text-white">
                                Account Information
                              </h3>
                              <p className="text-xs text-gray-500">
                                Read-only account details
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-black/30 border border-gray-800">
                              <p className="text-xs text-gray-500 mb-1">
                                User ID
                              </p>
                              <p className="text-sm text-white font-mono truncate">
                                {fullUserData.id}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-black/30 border border-gray-800">
                              <p className="text-xs text-gray-500 mb-1">Role</p>
                              <p className="text-sm text-white capitalize">
                                {fullUserData.global_role}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-black/30 border border-gray-800">
                              <p className="text-xs text-gray-500 mb-1">
                                Status
                              </p>
                              <p className="text-sm text-white">
                                {fullUserData.is_active ? (
                                  <span className="text-green-400">Active</span>
                                ) : (
                                  <span className="text-red-400">Inactive</span>
                                )}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-black/30 border border-gray-800">
                              <p className="text-xs text-gray-500 mb-1">
                                Member Since
                              </p>
                              <p className="text-sm text-white">
                                {new Date(
                                  fullUserData.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Society Memberships */}
                      {fullUserData?.user_societies &&
                        fullUserData.user_societies.length > 0 && (
                          <div className="pt-4 border-t border-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                              <Building2 className="h-5 w-5 text-gray-500" />
                              <div>
                                <h3 className="text-base font-semibold text-white">
                                  Society Memberships
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Your affiliated societies
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {fullUserData.user_societies.map((society) => (
                                <div
                                  key={society.id}
                                  className="p-4 rounded-lg bg-black/30 border border-gray-800 hover:border-gray-700 transition-colors"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-medium text-white mb-1">
                                        {society.society?.name ||
                                          "Unknown Society"}
                                      </h4>
                                      {society.society?.address && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                          <MapPin className="h-3 w-3" />
                                          {society.society.address}
                                          {society.society.city &&
                                            `, ${society.society.city}`}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 capitalize">
                                          {society.role}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                                            society.approval_status ===
                                            "approved"
                                              ? "bg-green-500/20 text-green-400"
                                              : society.approval_status ===
                                                "pending"
                                              ? "bg-yellow-500/20 text-yellow-400"
                                              : "bg-red-500/20 text-red-400"
                                          }`}
                                        >
                                          {society.approval_status}
                                        </span>
                                        {society.joined_at && (
                                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">
                                            Joined{" "}
                                            {new Date(
                                              society.joined_at
                                            ).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Save Button */}
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (fullUserData) {
                              setProfileData({
                                full_name: fullUserData.full_name,
                                email: fullUserData.email,
                                phone: fullUserData.phone || "",
                                avatar_url: fullUserData.avatar_url || "",
                              });
                            }
                          }}
                          className="border-gray-700 text-gray-300 hover:bg-white/5"
                        >
                          Reset
                        </Button>
                        <Button
                          onClick={handleProfileUpdate}
                          disabled={isLoading}
                          size="lg"
                          style={{
                            backgroundColor: "hsl(var(--primary))",
                            color: "white",
                          }}
                          className="hover:opacity-90"
                        >
                          {isLoading ? (
                            <>
                              <span className="animate-spin mr-2">⏳</span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
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

                    {/* Save Notifications Button */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-800">
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Settings saved successfully!</span>
                        </div>
                      )}
                      {saveError && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{saveError}</span>
                        </div>
                      )}
                      <Button
                        onClick={handlePreferencesUpdate}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-white px-6"
                      >
                        {isLoading ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Saving...
                          </>
                        ) : (
                          "Save Notification Settings"
                        )}
                      </Button>
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

                    {/* Save Preferences Button */}
                    <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-800">
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Preferences saved successfully!</span>
                        </div>
                      )}
                      {saveError && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{saveError}</span>
                        </div>
                      )}
                      <Button
                        onClick={handlePreferencesUpdate}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary/90 text-white px-6"
                      >
                        {isLoading ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
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
