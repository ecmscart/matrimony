"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resetPassword, ApiRequestError } from "@/lib/api";

const resetSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const onSubmit = async (data: ResetFormData) => {
    setFormError(null);
    setMessage(null);
    try {
      const res = await resetPassword({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      setMessage(res.message || "Password reset successfully.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError
          ? err.message
          : "Unable to reset password",
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
            Reset Password
          </h1>
          <p className="mt-2 text-[#655d72]">
            Enter the code sent to your email and choose a new password
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
            {message && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {message}
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

            {/* OTP */}
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reset Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("otp")}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  id="otp"
                  placeholder="123456"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-10 py-3 tracking-[0.4em]"
                />
              </div>
              {errors.otp && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.otp.message}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("newPassword")}
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  placeholder="Enter a new password"
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
              {errors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("confirmPassword")}
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Re-enter your new password"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-10 py-3"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl gradient-primary py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-[#655d72] transition-colors hover:text-primary"
            >
              Resend code
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 font-medium text-[#655d72] transition-colors hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
