"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Star,
  Phone,
  X,
  Calendar,
  Building2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { User } from "@/store/slices/authSlice";
import { useAppSelector } from "@/store/hooks";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<User[]>("/api/v1/users/");
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCurrentUser = (userId: string) => currentUser?.id === userId;
  const canManageStatus =
    currentUser?.global_role === "developer" ||
    currentUser?.global_role === "admin";

  const toggleActivation = async (user: User) => {
    if (!canManageStatus || isCurrentUser(user.id)) return;
    const nextStatus = !user.is_active;
    try {
      setUpdatingUserId(user.id);
      const updated = await api.put<User>(`/api/v1/users/${user.id}`, {
        is_active: nextStatus,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: updated.is_active } : u
        )
      );

      setSelectedUser((prev) =>
        prev && prev.id === user.id
          ? { ...prev, is_active: updated.is_active }
          : prev
      );
    } catch (error) {
      console.error("Failed to update user status", error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
      style={{ backgroundColor: "#0A0A0A", minHeight: "calc(100vh - 4rem)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <Users
                className="h-6 w-6 sm:h-8 sm:w-8"
                style={{ color: "hsl(var(--primary))" }}
              />
              User Management
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Manage and view all registered users
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            style={{ backgroundColor: "hsl(var(--primary))", color: "white" }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <Card className="mb-6 border-0" style={{ backgroundColor: "#141414" }}>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10 bg-black/50 border-gray-800 text-white placeholder:text-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: "hsl(var(--primary))" }}
            ></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-0" style={{ backgroundColor: "#141414" }}>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">
                No users found
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "No users have been registered yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user) => {
              const isCurrent = isCurrentUser(user.id);
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className="hover:shadow-lg transition-all border-0 relative"
                    style={{
                      backgroundColor: isCurrent ? "#1A1A1A" : "#141414",
                      border: isCurrent
                        ? "2px solid hsl(var(--primary))"
                        : "1px solid #2A2A2A",
                      boxShadow: isCurrent
                        ? "0 4px 12px hsl(var(--primary) / 0.3)"
                        : "none",
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center font-semibold"
                            style={{
                              backgroundColor: "hsl(var(--primary))",
                              color: "white",
                            }}
                          >
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-lg text-white">
                              {user.full_name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1 text-gray-500">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCurrent ? (
                            <div
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: "hsl(var(--primary))",
                                color: "white",
                              }}
                            >
                              <Star className="h-3 w-3 fill-current" />
                              You
                            </div>
                          ) : null}

                          {canManageStatus && !isCurrent && (
                            <Button
                              size="sm"
                              variant={
                                user.is_active ? "destructive" : "default"
                              }
                              style={
                                user.is_active
                                  ? {
                                      backgroundColor: "#ef4444",
                                      color: "white",
                                    }
                                  : {
                                      backgroundColor: "hsl(var(--primary))",
                                      color: "white",
                                    }
                              }
                              disabled={updatingUserId === user.id}
                              onClick={() => toggleActivation(user)}
                            >
                              {updatingUserId === user.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : null}
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2">
                        {user.phone && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Phone:</span>
                            <span className="flex items-center gap-1 text-gray-300">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Role:</span>
                          <span className="flex items-center gap-1 font-medium text-gray-300">
                            <Shield className="h-3 w-3" />
                            {user.global_role || user.role || "User"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className="flex items-center gap-1">
                            {user.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-green-500 font-medium">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="text-red-500 font-medium">
                                  Inactive
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-800 text-gray-300 hover:bg-white/5 hover:text-white"
                          onClick={() => setSelectedUser(user)}
                        >
                          View Details
                        </Button>
                        {isCurrent && (
                          <Button
                            size="sm"
                            className="flex-1"
                            style={{
                              backgroundColor: "hsl(var(--primary))",
                              color: "white",
                            }}
                            onClick={() => router.push("/dashboard/profile")}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit Profile
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedUser(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-[#141414] border border-[#1A1A1A] rounded-lg shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#1A1A1A]">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    User Details
                  </h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className="h-12 w-12 sm:h-16 sm:w-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)`,
                      }}
                    >
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                        {selectedUser.full_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Phone
                      </p>
                      <p className="text-sm text-white">{selectedUser.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Global Role
                      </p>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                        style={{
                          backgroundColor: "hsl(var(--primary) / 0.2)",
                        }}
                      >
                        {selectedUser.global_role}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Account Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          selectedUser.is_active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {selectedUser.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined
                      </p>
                      <p className="text-sm text-white">
                        {new Date(selectedUser.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Societies Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Societies ({selectedUser.user_societies?.length || 0})
                      </p>
                    </div>
                    {selectedUser.user_societies &&
                    selectedUser.user_societies.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.user_societies.map((us) => (
                          <div
                            key={us.id}
                            className="bg-[#0F0F0F] border border-[#1A1A1A] rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {us.society?.name || "Unknown Society"}
                                </p>
                                {us.society?.city && (
                                  <p className="text-xs text-gray-500">
                                    {us.society.city}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  us.approval_status === "approved"
                                    ? "bg-green-500/20 text-green-400"
                                    : us.approval_status === "rejected"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {us.approval_status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No society memberships
                      </p>
                    )}
                  </div>

                  {canManageStatus && !isCurrentUser(selectedUser.id) && (
                    <div className="flex justify-end pt-2">
                      <Button
                        variant={
                          selectedUser.is_active ? "destructive" : "default"
                        }
                        style={
                          selectedUser.is_active
                            ? {
                                backgroundColor: "#ef4444",
                                color: "white",
                              }
                            : {
                                backgroundColor: "hsl(var(--primary))",
                                color: "white",
                              }
                        }
                        disabled={updatingUserId === selectedUser.id}
                        onClick={() => toggleActivation(selectedUser)}
                      >
                        {updatingUserId === selectedUser.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {selectedUser.is_active ? "Deactivate" : "Activate"}{" "}
                        User
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
