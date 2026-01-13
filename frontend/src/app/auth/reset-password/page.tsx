"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPassword } from "@/store/slices/authSlice";

const resetPasswordSchema = z
  .object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [token, setToken] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setLocalError("Invalid or missing reset token");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setLocalError("Invalid reset token");
      return;
    }

    try {
      await dispatch(
        resetPassword({ token, new_password: data.new_password })
      ).unwrap();
      setShowSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setLocalError(err || "Failed to reset password. Please try again.");
    }
  };

  if (localError && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-900 to-purple-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-gray-950/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Invalid Reset Link
              </h3>
              <p className="text-gray-400 mb-6">
                The password reset link is invalid or has expired.
              </p>
              <Link href="/auth/forgot-password">
                <Button
                  style={{
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                  className="w-full hover:opacity-90"
                >
                  Request New Link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-900 to-purple-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-gray-950/90 backdrop-blur-sm">
          <CardHeader className="space-y-3 text-center pb-4">
            <div className="flex justify-center">
              <div
                style={{ backgroundColor: "hsl(var(--primary))" }}
                className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Shield className="h-7 w-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {showSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Password Reset Successful
                </h3>
                <p className="text-gray-400 mb-6">
                  Your password has been reset successfully. Redirecting to
                  login...
                </p>
                <Link href="/auth/login">
                  <Button
                    style={{
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                    className="w-full hover:opacity-90"
                  >
                    Continue to Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-gray-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="new_password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary pl-10 pr-10"
                      {...register("new_password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.new_password && (
                    <p className="text-sm text-destructive">
                      {errors.new_password.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and
                    digit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary pl-10 pr-10"
                      {...register("confirm_password")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-sm text-destructive">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>

                {(error || localError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                  >
                    {localError || error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  style={{
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                  className="w-full hover:opacity-90 font-semibold h-11 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>

                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-white hover:bg-gray-900/50"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-900 to-purple-800">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
