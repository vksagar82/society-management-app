"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  Shield,
  Mail,
  Lock,
  User,
  UserPlus,
  CheckCircle2,
  Building2,
} from "lucide-react";
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
import { register as registerUser } from "@/store/slices/authSlice";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .min(10, "Phone must be at least 10 digits")
      .max(20, "Phone must not exceed 20 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    society_ids: z
      .array(z.number())
      .min(1, "Please select at least one society"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);
  const [societies, setSocieties] = useState<
    Array<{ id: number; name: string; city: string }>
  >([]);
  const [loadingSocieties, setLoadingSocieties] = useState(true);
  const [selectedSocieties, setSelectedSocieties] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Fetch societies on component mount
  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/societies/public"
        );
        if (response.ok) {
          const data = await response.json();
          setSocieties(data);
        }
      } catch (error) {
        console.error("Failed to fetch societies:", error);
      } finally {
        setLoadingSocieties(false);
      }
    };
    fetchSocieties();
  }, []);

  // Update form value when selectedSocieties changes
  useEffect(() => {
    setValue("society_ids", selectedSocieties);
  }, [selectedSocieties, setValue]);

  const toggleSociety = (societyId: number) => {
    setSelectedSocieties((prev) =>
      prev.includes(societyId)
        ? prev.filter((id) => id !== societyId)
        : [...prev, societyId]
    );
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await dispatch(
        registerUser({
          email: data.email,
          password: data.password,
          full_name: data.full_name,
          phone: data.phone,
          society_ids: data.society_ids,
        })
      ).unwrap();
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      console.error("Registration failed:", err);
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
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-400">
              Join your society management platform
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
                  Registration Successful!
                </h3>
                <p className="text-gray-400">Redirecting you to login...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary"
                    {...register("full_name")}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="societies" className="text-gray-300">
                    Select Society/Societies
                  </Label>
                  {loadingSocieties ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-3 text-gray-500 text-sm">
                      Loading societies...
                    </div>
                  ) : societies.length === 0 ? (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-3 text-gray-500 text-sm">
                      No societies available
                    </div>
                  ) : (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {societies.map((society) => (
                        <label
                          key={society.id}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSocieties.includes(society.id)}
                            onChange={() => toggleSociety(society.id)}
                            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-primary focus:ring-primary focus:ring-offset-0"
                            style={{ accentColor: "hsl(var(--primary))" }}
                          />
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium">
                              {society.name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {society.city}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {errors.society_ids && (
                    <p className="text-sm text-destructive">
                      {errors.society_ids.message}
                    </p>
                  )}
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 focus:border-primary"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
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
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="text-center text-sm text-gray-400 pt-4">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    style={{ color: "hsl(var(--primary))" }}
                    className="font-medium hover:opacity-80 transition-opacity"
                  >
                    Sign in
                  </Link>
                </div>
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
