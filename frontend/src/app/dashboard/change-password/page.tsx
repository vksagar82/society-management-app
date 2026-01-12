"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
} from "lucide-react";
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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-gray-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}
            >
              <Key
                className="h-6 w-6 sm:h-8 sm:w-8"
                style={{ color: "hsl(var(--primary))" }}
              />
            </div>
            Change Password
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-2">
            Update your password to keep your account secure
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <CheckCircle2
              className="h-5 w-5"
              style={{ color: "hsl(var(--primary))" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "hsl(var(--primary))" }}
            >
              Password changed successfully!
            </p>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <AlertCircle className="h-5 w-5" style={{ color: "#EF4444" }} />
            <p className="text-sm font-medium" style={{ color: "#EF4444" }}>
              {error}
            </p>
          </motion.div>
        )}

        {/* Change Password Form */}
        <Card
          className="border-0 shadow-xl"
          style={{
            backgroundColor: "#1A1A1A",
            borderTop: "2px solid hsl(var(--primary))",
          }}
        >
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">
              Password Requirements
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Your password must meet the following criteria:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Requirements List */}
            <div
              className="space-y-2 p-4 rounded-lg"
              style={{ backgroundColor: "#0A0A0A" }}
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                />
                At least 8 characters long
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                />
                Contains at least one uppercase letter
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                />
                Contains at least one lowercase letter
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "hsl(var(--primary))" }}
                />
                Contains at least one number
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="current_password"
                  className="text-gray-300 text-sm font-medium"
                >
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="current_password"
                    type="password"
                    {...register("current_password")}
                    className="pl-10 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                    placeholder="Enter your current password"
                  />
                </div>
                {errors.current_password && (
                  <p
                    className="text-xs sm:text-sm"
                    style={{ color: "#EF4444" }}
                  >
                    {errors.current_password.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="new_password"
                  className="text-gray-300 text-sm font-medium"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="new_password"
                    type="password"
                    {...register("new_password")}
                    className="pl-10 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                    placeholder="Enter your new password"
                  />
                </div>
                {errors.new_password && (
                  <p
                    className="text-xs sm:text-sm"
                    style={{ color: "#EF4444" }}
                  >
                    {errors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirm_password"
                  className="text-gray-300 text-sm font-medium"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <Input
                    id="confirm_password"
                    type="password"
                    {...register("confirm_password")}
                    className="pl-10 bg-black/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
                    placeholder="Confirm your new password"
                  />
                </div>
                {errors.confirm_password && (
                  <p
                    className="text-xs sm:text-sm"
                    style={{ color: "#EF4444" }}
                  >
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 text-white font-medium"
                  style={{
                    backgroundColor: "hsl(var(--primary))",
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <div
          className="mt-6 p-4 rounded-lg"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Shield
              className="h-4 w-4"
              style={{ color: "hsl(var(--primary))" }}
            />
            Security Tips
          </h3>
          <ul className="space-y-1 text-xs sm:text-sm text-gray-400">
            <li>• Don&apos;t reuse passwords from other websites</li>
            <li>• Avoid using personal information in your password</li>
            <li>• Consider using a password manager</li>
            <li>• Enable two-factor authentication for extra security</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
