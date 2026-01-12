"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Key, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.post("/api/v1/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });

      setSuccess(true);
      reset();

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to change password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="p-6 space-y-6"
      style={{ backgroundColor: "#0A0A0A", minHeight: "calc(100vh - 4rem)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Key className="h-8 w-8" style={{ color: "hsl(var(--primary))" }} />
            Change Password
          </h1>
          <p className="text-gray-500 mt-1">
            Update your password to keep your account secure
          </p>
        </div>

        {/* Change Password Form */}
        <Card className="border-0" style={{ backgroundColor: "#141414" }}>
          <CardHeader>
            <CardTitle className="text-white">Password Settings</CardTitle>
            <CardDescription className="text-gray-500">
              Enter your current password and choose a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current_password" className="text-gray-300">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="current_password"
                    type="password"
                    placeholder="Enter current password"
                    className="pl-10 bg-black/50 border-gray-800 text-white placeholder:text-gray-600 focus:border-primary"
                    {...register("current_password")}
                  />
                </div>
                {errors.current_password && (
                  <p className="text-sm text-red-500">
                    {errors.current_password.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password"
                    className="pl-10 bg-black/50 border-gray-800 text-white placeholder:text-gray-600 focus:border-primary"
                    {...register("new_password")}
                  />
                </div>
                {errors.new_password && (
                  <p className="text-sm text-red-500">
                    {errors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                    className="pl-10 bg-black/50 border-gray-800 text-white placeholder:text-gray-600 focus:border-primary"
                    {...register("confirm_password")}
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-500">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-md flex items-center gap-2"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">{error}</span>
                </motion.div>
              )}

              {/* Success Message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-md flex items-center gap-2"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">
                    Password changed successfully!
                  </span>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full font-semibold h-11 transition-all"
                style={{
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                }}
                disabled={isLoading}
              >
                {isLoading ? "Changing Password..." : "Change Password"}
              </Button>

              {/* Password Requirements */}
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #2A2A2A",
                }}
              >
                <p className="text-sm font-medium text-gray-400 mb-2">
                  Password Requirements:
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Must contain at least one uppercase letter (A-Z)</li>
                  <li>• Must contain at least one lowercase letter (a-z)</li>
                  <li>• Must contain at least one digit (0-9)</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
