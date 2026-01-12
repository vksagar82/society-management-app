"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="lg:pl-64">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold">User Management</h1>
          </div>
        </header>

        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold">Users</h2>
                <p className="text-muted-foreground mt-1">
                  Manage and view all registered users
                </p>
              </div>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>

            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "No users have been registered yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {user.full_name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="flex items-center gap-1 font-medium">
                              <Shield className="h-3 w-3" />
                              {user.role || "User"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            <span className="flex items-center gap-1">
                              {user.is_active ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-success" />
                                  <span className="text-success font-medium">
                                    Active
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 text-destructive" />
                                  <span className="text-destructive font-medium">
                                    Inactive
                                  </span>
                                </>
                              )}
                            </span>
                          </div>
                          {user.is_approved !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Approved:
                              </span>
                              <span className="flex items-center gap-1">
                                {user.is_approved ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-success" />
                                    <span className="text-success font-medium">
                                      Yes
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 text-warning" />
                                    <span className="text-warning font-medium">
                                      Pending
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-1">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
