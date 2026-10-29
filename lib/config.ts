type Cfg = {
  apiBaseUrl: string;
  apiOrigin: string;
  uploadsBaseUrl: string;
  contact: {
    supportEmail: string;
    infoEmail: string;
    phone: string;
    addressShort: string;
    addressFull: string;
    hoursWeekday: string;
    hoursSunday: string;
  };
};

/** Prefer NEXT_PUBLIC_API_BASE_URL; accept NEXT_PUBLIC_API_URL (origin only) as fallback. */
function resolveApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const originOnly = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (originOnly) {
    const base = originOnly.replace(/\/$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }

  return "http://localhost:4000/api";
}

const apiBaseUrl = resolveApiBaseUrl();
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");
const uploadsBaseUrl = (
  process.env.NEXT_PUBLIC_UPLOADS_BASE_URL?.trim() || `${apiOrigin}/uploads`
).replace(/\/$/, "");

export const config: Cfg = {
  apiBaseUrl,
  // Backend serves static files (uploads, etc.) from the host root,
  // not under /api. Strip the trailing /api segment for asset URLs.
  apiOrigin,
  // Persistent photos live above public_html; Nest serves them at /uploads.
  uploadsBaseUrl,
  contact: {
    supportEmail: "support@mahermarriagebureau.com",
    infoEmail: "info@mahermarriagebureau.com",
    phone: "+91 98115 99425, +91 98119 90161",
    addressShort: "Okhla Vihar, New Delhi",
    addressFull:
      "C-122, Okhla Vihar, Block D, Jamia Nagar, Okhla, New Delhi, Delhi 110025",
    hoursWeekday: "Mon - Sat: 9:00 AM - 7:00 PM",
    hoursSunday: "Sunday: 10:00 AM - 5:00 PM",
  },
};
