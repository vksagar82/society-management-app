"use client";

import { motion } from "framer-motion";
import {
  Users,
  Building2,
  FileText,
  Settings,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div
      className="p-6 space-y-6"
      style={{ backgroundColor: "#0A0A0A", minHeight: "calc(100vh - 4rem)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Welcome Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            Good evening, {user?.full_name}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back to your society management dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className="border-0 hover:shadow-lg transition-all"
              style={{
                background:
                  "linear-gradient(to bottom right, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))",
                backgroundColor: "#141414",
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Users
                </CardTitle>
                <Users
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--primary))" }}
                />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">0</div>
                <p
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <TrendingUp className="h-3 w-3" />
                  +0% from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className="border-0 hover:shadow-lg transition-all"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))",
                backgroundColor: "#141414",
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Societies
                </CardTitle>
                <Building2 className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">0</div>
                <p className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Registered societies
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className="border-0 hover:shadow-lg transition-all"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))",
                backgroundColor: "#141414",
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Open Issues
                </CardTitle>
                <FileText className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">0</div>
                <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Pending resolution
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card
              className="border-0 hover:shadow-lg transition-all"
              style={{
                background:
                  "linear-gradient(to bottom right, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))",
                backgroundColor: "#141414",
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Your Role
                </CardTitle>
                <Settings className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize text-white">
                  {user?.role || "User"}
                </div>
                <p className="text-xs text-green-500 mt-1">Account type</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <Card className="border-0" style={{ backgroundColor: "#141414" }}>
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-500">
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Link href="/dashboard/users" className="group">
                <div
                  className="flex items-center gap-4 p-4 rounded-lg transition-all cursor-pointer hover:bg-white/5"
                  style={{ border: "1px solid #2A2A2A" }}
                >
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}
                  >
                    <Users
                      className="h-6 w-6"
                      style={{ color: "hsl(var(--primary))" }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Manage Users</div>
                    <div className="text-xs text-gray-500">
                      View and manage accounts
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/societies" className="group">
                <div
                  className="flex items-center gap-4 p-4 rounded-lg transition-all cursor-pointer hover:bg-white/5"
                  style={{ border: "1px solid #2A2A2A" }}
                >
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Building2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      View Societies
                    </div>
                    <div className="text-xs text-gray-500">
                      Browse all societies
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/dashboard/issues" className="group">
                <div
                  className="flex items-center gap-4 p-4 rounded-lg transition-all cursor-pointer hover:bg-white/5"
                  style={{ border: "1px solid #2A2A2A" }}
                >
                  <div className="p-3 rounded-lg bg-amber-500/10">
                    <FileText className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Report Issue</div>
                    <div className="text-xs text-gray-500">
                      Create a new ticket
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
