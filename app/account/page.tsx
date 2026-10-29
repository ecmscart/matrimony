"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  ApiRequestError,
  changePassword,
  clearAuth,
  deleteMe,
  getAccessToken,
  getMe,
  resendOtp,
  updateMe,
  updateStoredUser,
  verifyEmail,
} from "@/lib/api";
import type { MeUser } from "@/lib/types";

type Notice = { type: "success" | "error"; text: string } | null;

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile (name/phone)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);

  // Email verification
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<Notice>(null);

  // Delete account
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then((data) => {
        setMe(data);
        setFirstName(data.firstName ?? "");
        setLastName(data.lastName ?? "");
        setPhone(data.phone ?? "");
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          router.replace("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileNotice(null);
    setSavingProfile(true);
    try {
      const updated = await updateMe({ firstName, lastName, phone });
      setMe(updated);
      updateStoredUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      setProfileNotice({ type: "success", text: "Account details updated." });
    } catch (err) {
      setProfileNotice({
        type: "error",
        text:
          err instanceof ApiRequestError
            ? err.message
            : "Unable to update account details",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordNotice({
        type: "success",
        text: "Password changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordNotice({
        type: "error",
        text:
          err instanceof ApiRequestError
            ? err.message
            : "Unable to change password",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const onResendOtp = async () => {
    setVerifyNotice(null);
    try {
      await resendOtp("email");
      setVerifyNotice({
        type: "success",
        text: "A new verification code has been sent to your email.",
      });
    } catch (err) {
      setVerifyNotice({
        type: "error",
        text:
          err instanceof ApiRequestError ? err.message : "Unable to send code",
      });
    }
  };

  const onVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyNotice(null);
    setVerifying(true);
    try {
      await verifyEmail(otp);
      setMe((prev) => (prev ? { ...prev, isVerified: true } : prev));
      updateStoredUser({ isVerified: true });
      setOtp("");
      setVerifyNotice({
        type: "success",
        text: "Email verified successfully.",
      });
    } catch (err) {
      setVerifyNotice({
        type: "error",
        text:
          err instanceof ApiRequestError ? err.message : "Verification failed",
      });
    } finally {
      setVerifying(false);
    }
  };

  const onDeleteAccount = async () => {
    setDeleteNotice(null);
    setDeleting(true);
    try {
      await deleteMe();
      clearAuth();
      router.push("/");
    } catch (err) {
      setDeleteNotice({
        type: "error",
        text:
          err instanceof ApiRequestError
            ? err.message
            : "Unable to deactivate account",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="section-shell py-20 text-center text-[#655d72]">
        Loading your account…
      </div>
    );
  }

  return (
    <div className="section-shell py-10 md:py-14">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="headline-serif text-3xl font-semibold text-[#241d30] md:text-4xl">
            Account Settings
          </h1>
          <p className="mt-2 text-[#655d72]">
            Manage your login details, password, and account.
          </p>
        </div>

        {/* Account details */}
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-[#2f273c]">
            <User className="h-5 w-5 text-primary" />
            Account Details
          </h2>
          <form onSubmit={onSaveProfile} className="space-y-5">
            {profileNotice && <NoticeBox notice={profileNotice} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                value={me?.email ?? ""}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-[#efdfce] bg-[#f7f1ea] px-4 py-3 text-[#8c8597]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-10 py-3"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl gradient-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </section>

        {/* Email verification */}
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-[#2f273c]">
            {me?.isVerified ? (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            )}
            Email Verification
          </h2>
          {me?.isVerified ? (
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Your email is verified.
            </p>
          ) : (
            <form onSubmit={onVerifyEmail} className="space-y-4">
              <p className="text-sm text-[#655d72]">
                Enter the 6-digit code sent to{" "}
                <span className="font-medium text-[#2f273c]">{me?.email}</span>{" "}
                to verify your email.
              </p>
              {verifyNotice && <NoticeBox notice={verifyNotice} />}
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3 tracking-[0.4em] sm:max-w-[200px]"
                />
                <button
                  type="submit"
                  disabled={verifying || otp.length !== 6}
                  className="rounded-xl gradient-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {verifying ? "Verifying…" : "Verify Email"}
                </button>
              </div>
              <button
                type="button"
                onClick={onResendOtp}
                className="text-sm font-medium text-primary transition-colors hover:text-primary-dark"
              >
                Resend code
              </button>
            </form>
          )}
        </section>

        {/* Change password */}
        <section className="glass-panel rounded-3xl p-6 md:p-8">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-[#2f273c]">
            <Lock className="h-5 w-5 text-primary" />
            Change Password
          </h2>
          <form onSubmit={onChangePassword} className="space-y-5">
            {passwordNotice && <NoticeBox notice={passwordNotice} />}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 chars with upper, lower & number"
                  className="soft-ring w-full rounded-xl border border-[#efdfce] bg-white px-4 py-3 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword}
              className="rounded-xl gradient-primary px-6 py-3 font-semibold text-white disabled:opacity-60"
            >
              {savingPassword ? "Updating…" : "Update Password"}
            </button>
          </form>
        </section>

        {/* Danger zone */}
        <section className="rounded-3xl border border-red-200 bg-red-50/60 p-6 md:p-8">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-700">
            <Trash2 className="h-5 w-5" />
            Deactivate Account
          </h2>
          <p className="mb-4 text-sm text-red-700/80">
            Deactivating disables your account and hides your profile. You can
            contact support to restore it later.
          </p>
          {deleteNotice && <NoticeBox notice={deleteNotice} />}
          {confirmDelete ? (
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                onClick={onDeleteAccount}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deactivating…" : "Yes, deactivate"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-xl border border-[#efdfce] bg-white px-6 py-3 font-semibold text-[#4c4358]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-xl border-2 border-red-300 px-6 py-3 font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
            >
              Deactivate my account
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function NoticeBox({ notice }: { notice: NonNullable<Notice> }) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        notice.type === "success"
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-600"
      }`}
    >
      {notice.text}
    </div>
  );
}
