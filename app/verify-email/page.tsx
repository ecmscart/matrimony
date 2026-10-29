"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  verifyEmail,
  resendOtp,
  getStoredUser,
  updateStoredUser,
  logout,
  ApiRequestError,
} from "@/lib/api";

const verifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

const RESEND_COOLDOWN_SECONDS = 30;
const PENDING_SIGNUP_EMAIL_KEY = "pendingSignupEmail";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storedUser = useMemo(() => getStoredUser(), []);

  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [ready, setReady] = useState(false);

  const displayEmail = storedUser?.email || searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>({ resolver: zodResolver(verifySchema) });

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
    }
    // Signup no longer requires OTP — send leftover pending links away.
    if (searchParams.get("pending") === "1") {
      router.replace(storedUser ? "/my-profile" : "/signup");
      return;
    }

    if (!storedUser) {
      router.replace("/login");
      return;
    }
    if (storedUser.isVerified) {
      router.replace("/my-profile");
      return;
    }
    setReady(true);
  }, [searchParams, storedUser, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = async (data: VerifyFormData) => {
    setFormError(null);
    setMessage(null);
    try {
      await verifyEmail(data.otp);
      updateStoredUser({ isVerified: true });
      setMessage("Email verified! Taking you to complete your profile…");
      setTimeout(() => router.push("/my-profile"), 1200);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to verify email";
      setFormError(msg);
      toast.error(msg);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setFormError(null);
    setMessage(null);
    setResending(true);
    try {
      const res = await resendOtp("email");
      setMessage(res.message || "A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("A new code has been sent.");
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Could not resend the code. Please try again.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const handleUseAnotherAccount = async () => {
    if (storedUser) {
      await logout();
    }
    router.push("/login");
  };

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-12 md:flex md:items-center md:justify-center md:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            <span className="text-2xl font-semibold text-[#2e263b]">
              Maher <span className="text-primary">Marriage Bureau</span>
            </span>
          </Link>
          <h1 className="headline-serif mt-6 text-3xl font-semibold text-[#241d30]">
            Verify Your Email
          </h1>
          <p className="mt-2 text-[#655d72]">
            We&apos;ve sent a 6-digit verification code to{" "}
            <span className="font-medium text-[#241d30]">{displayEmail}</span>
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[1.05rem]">
                {formError}
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-[1.05rem]">
                {message}
              </div>
            )}

            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("otp")}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  id="otp"
                  placeholder="123456"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-10 py-3 tracking-[0.4em]"
                />
              </div>
              {errors.otp && (
                <p className="text-red-500 text-[1.05rem] mt-1">
                  {errors.otp.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl gradient-primary py-3 font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Verifying…" : "Verify Email"}
            </button>

            <div className="text-center text-sm text-[#655d72]">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-60 disabled:no-underline"
              >
                <RefreshCw
                  className={`w-4 h-4 ${resending ? "animate-spin" : ""}`}
                />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </form>

          <div className="my-6 h-px bg-[#efdfce]" />

          <button
            type="button"
            onClick={handleUseAnotherAccount}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-[#655d72] hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Use a different account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
