"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Shield, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { ThemePalette } from "@/components/ThemePalette";
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
import { requestPasswordReset } from "@/store/slices/authSlice";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await dispatch(requestPasswordReset(data.email)).unwrap();
      setShowSuccess(true);
    } catch (err) {
      console.error("Password reset request failed:", err);
    }
  };

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
              Reset Password
            </CardTitle>
            <CardDescription className="text-gray-400">
              Enter your email to receive a reset link
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
                  Check Your Email
                </h3>
                <p className="text-gray-400 mb-6">
                  We&apos;ve sent a password reset link to your email address.
                </p>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="w-full bg-gray-900/50 border-gray-800 text-white hover:bg-gray-800 hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-md bg-destructive/10 text-destructive text-sm"
                  >
                    {error}
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
                  {isLoading ? "Sending..." : "Send Reset Link"}
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

      {/* Theme Palette Selector */}
      <ThemePalette />
    </div>
  );
}
