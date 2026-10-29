import Link from "next/link";
import { Lock, LogIn } from "lucide-react";

interface ProfileAccessMessageProps {
  message: string;
  isGuest?: boolean;
}

export default function ProfileAccessMessage({
  message,
  isGuest = false,
}: ProfileAccessMessageProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1e6]">
        {isGuest ? (
          <LogIn className="h-8 w-8 text-primary" />
        ) : (
          <Lock className="h-8 w-8 text-primary" />
        )}
      </div>
      <h2 className="headline-serif mb-2 text-2xl font-semibold text-[#251e31]">
        {isGuest ? "Login Required" : "Profile Access Pending"}
      </h2>
      <p className="mb-6 max-w-md text-[#655e71]">{message}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {isGuest ? (
          <>
            <Link
              href="/login"
              className="rounded-full gradient-primary px-6 py-2.5 text-sm font-medium text-white"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-[#efdfce] bg-white px-6 py-2.5 text-sm font-medium text-[#4e445f]"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <Link
            href="/contact"
            className="rounded-full gradient-primary px-6 py-2.5 text-sm font-medium text-white"
          >
            Contact Admin
          </Link>
        )}
      </div>
    </div>
  );
}
