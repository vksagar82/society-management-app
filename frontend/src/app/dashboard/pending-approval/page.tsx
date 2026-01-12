"use client";

import { motion } from "framer-motion";
import { Clock, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-900 to-purple-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-0 bg-gray-950/90 backdrop-blur-sm">
          <CardHeader className="space-y-3 text-center pb-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-warning/20 flex items-center justify-center">
                <Clock className="h-10 w-10 text-warning animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Pending Approval
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your account is awaiting admin approval
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-6">
            <div className="bg-gray-900/50 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    Account Status
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Your registration has been received successfully. However,
                    you need to be approved by a society administrator before
                    you can access the dashboard.
                  </p>
                </div>
              </div>

              {user?.full_name && (
                <div className="flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-lg">
                  <span className="text-sm text-gray-400">Registered as:</span>
                  <span className="text-sm font-semibold text-white">
                    {user.full_name}
                  </span>
                </div>
              )}

              {user?.email && (
                <div className="flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-lg">
                  <span className="text-sm text-gray-400">Email:</span>
                  <span className="text-sm font-semibold text-white">
                    {user.email}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-sm text-gray-300 text-center">
                <span className="text-warning font-semibold">⚠ Note:</span> You
                will receive an email notification once your account has been
                approved. Please contact your society administrator if you have
                any questions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
