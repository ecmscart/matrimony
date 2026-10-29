"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setAuth } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

function parseAuthPayload(hash: string): AuthResponse | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const data = JSON.parse(json) as AuthResponse;
    if (!data?.accessToken || !data?.refreshToken || !data?.user?.id) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export default function LoginAsPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = parseAuthPayload(window.location.hash);
    // Clear tokens from the URL immediately so they aren't left in history.
    window.history.replaceState(null, "", "/auth/login-as");

    if (!auth) {
      setError(
        "Invalid or missing login session. Close this tab and try again from admin.",
      );
      return;
    }

    setAuth(auth);
    router.replace(
      auth.user.isVerified === false ? "/verify-email" : "/profiles",
    );
  }, [router]);

  if (error) {
    return (
      <main className="min-h-[50vh] grid place-items-center px-4">
        <p className="text-sm text-red-600 text-center max-w-md">{error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-[50vh] grid place-items-center px-4">
      <p className="text-sm text-neutral-600">Signing you in…</p>
    </main>
  );
}
