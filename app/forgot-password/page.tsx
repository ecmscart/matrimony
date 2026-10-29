"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Mail, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPassword, ApiRequestError } from "@/lib/api";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setFormError(null);
    setMessage(null);
    try {
      const res = await forgotPassword(data.email);
      setMessage(
        res.message ||
          "If an account exists for that email, a reset code has been sent.",
      );
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError
          ? err.message
          : "Unable to send reset code",
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
            Forgot Password
          </h1>
          <p className="mt-2 text-[#655d72]">
            Enter your email and we&apos;ll send you a reset code
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl gradient-primary py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send Reset Code"}
            </button>

            {message && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/reset-password?email=${encodeURIComponent(getValues("email"))}`,
                  )
                }
                className="block w-full rounded-xl border-2 border-primary/45 py-3 text-center font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                I have a code
              </button>
            )}
          </form>

          {/* Back to login */}
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#655d72] transition-colors hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
