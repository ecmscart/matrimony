"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, User, LogOut, Sparkles, Settings, Download } from "lucide-react";
import Logo from "@/components/Logo";
import { downloadProfileAsPdf } from "@/components/DownloadProfilePDF";
import {
  AUTH_CHANGE_EVENT,
  getMyProfile,
  getMyProfileCompletion,
  getStoredUser,
  logout,
  startSessionKeepAlive,
} from "@/lib/api";
import type { AuthUser } from "@/lib/types";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [canDownloadOwnProfile, setCanDownloadOwnProfile] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Refresh tokens periodically so long form sessions stay valid.
  useEffect(() => {
    if (!user) return;
    startSessionKeepAlive();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCanDownloadOwnProfile(false);
      return;
    }
    let cancelled = false;
    getMyProfileCompletion()
      .then((completion) => {
        if (cancelled) return;
        const basic = completion.sections?.find((s) => s.section === "basic");
        setCanDownloadOwnProfile(
          Boolean(completion.hasProfile) && (basic?.percentage ?? 0) === 100,
        );
      })
      .catch(() => {
        if (!cancelled) setCanDownloadOwnProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setIsOpen(false);
    await logout();
    router.push("/");
  };

  const handleDownloadOwnProfile = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const profile = await getMyProfile();
      if (!profile) return;
      await downloadProfileAsPdf(profile);
    } finally {
      setIsDownloadingPdf(false);
      setMenuOpen(false);
      setIsOpen(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : "";

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/profiles", label: "Profiles" },
    ...(user ? [{ href: "/my-profile", label: "My Profile" }] : []),
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/60 bg-[#fff9f2]/85 backdrop-blur-xl">
      <div className="section-shell">
        <div className="flex min-h-18 justify-between items-center gap-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-11 w-auto" />
            <span className="text-[1.1rem] md:text-xl font-semibold leading-tight text-[#2a2432]">
              Maher <span className="text-primary">Marriage Bureau</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-[#f0e5d9] bg-white/90 px-2 py-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm text-[#574e60] transition-colors hover:bg-[#fff2e6] hover:text-primary ${
                  item.href === "/my-profile"
                    ? "font-semibold"
                    : "font-medium"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-[#efdfcc] bg-white px-2.5 py-1.5 transition-colors hover:bg-[#fff5ec]"
                  aria-label="Open profile menu"
                >
                  <span className="w-9 h-9 rounded-full gradient-primary text-white flex items-center justify-center font-semibold shadow-sm">
                    {initials}
                  </span>
                  <span className="text-sm font-medium text-[#4c4358] max-w-[120px] truncate">
                    {user.firstName}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[#f2dfce] bg-white shadow-xl">
                    <div className="px-4 py-3 border-b border-[#f7ece2]">
                      <p className="text-sm font-semibold text-[#2f2938] truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-[#716a7a] truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/my-profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#3a324a] transition-colors hover:bg-[#fff5ec]"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    {canDownloadOwnProfile && (
                      <button
                        type="button"
                        onClick={() => void handleDownloadOwnProfile()}
                        disabled={isDownloadingPdf}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#3a324a] transition-colors hover:bg-[#fff5ec] disabled:opacity-60"
                      >
                        <Download className="w-4 h-4" />
                        {isDownloadingPdf ? "Downloading…" : "Download PDF"}
                      </button>
                    )}
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#3a324a] transition-colors hover:bg-[#fff5ec]"
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-primary/45 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#d9485f]/25 transition-transform hover:-translate-y-0.5"
                >
                  <User className="w-4 h-4" />
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-full border border-[#ecdcc8] bg-white p-2 text-[#534c5f]"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-[#f0e5d9] pb-4">
            <div className="mt-4 rounded-2xl glass-panel p-3">
              <div className="flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-4 py-2.5 text-sm text-[#51485d] transition-colors hover:bg-[#fff1e6] hover:text-primary ${
                      item.href === "/my-profile"
                        ? "font-semibold"
                        : "font-medium"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <hr className="my-3 border-[#efdfcf]" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    <span className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center font-semibold">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#2f2938] truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-[#6f667b] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/my-profile"
                    onClick={() => setIsOpen(false)}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#51485d] transition-colors hover:bg-[#fff1e6] hover:text-primary"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  {canDownloadOwnProfile && (
                    <button
                      type="button"
                      onClick={() => void handleDownloadOwnProfile()}
                      disabled={isDownloadingPdf}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#51485d] transition-colors hover:bg-[#fff1e6] hover:text-primary disabled:opacity-60"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloadingPdf ? "Downloading…" : "Download PDF"}
                    </button>
                  )}
                  <Link
                    href="/account"
                    onClick={() => setIsOpen(false)}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#51485d] transition-colors hover:bg-[#fff1e6] hover:text-primary"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl border border-primary/45 px-4 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
