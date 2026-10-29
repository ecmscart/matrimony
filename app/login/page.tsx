"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login, setAuth, ApiRequestError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      const res = await login(data.email, data.password);
      setAuth(res);
      router.push(res.user.isVerified === false ? "/verify-email" : "/profiles");
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : "Login failed",
      );
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 md:flex md:items-center md:justify-center md:py-16">
      <div className="mx-auto w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            <span className="text-2xl font-semibold text-[#2e263b]">
              Maher <span className="text-primary">Marriage Bureau</span>
            </span>
          </Link>
          <h1 className="headline-serif mt-6 text-3xl font-semibold text-[#241d30]">
            Welcome Back
          </h1>
          <p className="mt-2 text-[#655d72]">
            Sign in to continue finding your perfect match
          </p>
        </div>

        {/* Form */}
        <div className="glass-panel rounded-3xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {formError}
              </div>
            )}
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-10 py-3"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-10 py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end -mt-2">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary transition-colors hover:text-primary-dark"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl gradient-primary py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                New to Maher Marriage Bureau?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="block w-full rounded-xl border-2 border-primary/45 py-3 text-center font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}
