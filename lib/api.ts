import type {
  AuthResponse,
  CreateProfileInput,
  MeUser,
  Paginated,
  Profile,
  ProfileCompletion,
  ProfileFilters,
  ProfileImage,
  UpdateProfileInput,
} from "./types";
import { config } from "./config";

const TOKEN_KEY = "mmb_access_token";
const REFRESH_KEY = "mmb_refresh_token";
const USER_KEY = "mmb_user";

export const API_BASE_URL = config.apiBaseUrl;
export const API_ORIGIN = config.apiOrigin;

/**
 * Resolve a (potentially relative) asset URL returned by the backend.
 * Absolute FTP URLs are returned as-is. Relative `/uploads/...` paths use
 * NEXT_PUBLIC_UPLOADS_BASE_URL (persistent folder above public_html).
 */
export function imgUrl(path: string | undefined | null): string {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const uploadsMatch = trimmed.match(/^\/?uploads\/(.+)$/i);
  if (uploadsMatch) {
    return `${config.uploadsBaseUrl}/${uploadsMatch[1]}`;
  }

  return `${API_ORIGIN}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthResponse["user"] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResponse["user"];
  } catch {
    return null;
  }
}

export const AUTH_CHANGE_EVENT = "mmb:auth-change";

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function setAuth(auth: AuthResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, auth.accessToken);
  window.localStorage.setItem(REFRESH_KEY, auth.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  emitAuthChange();
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(USER_KEY);
  emitAuthChange();
}

export function updateStoredUser(partial: Partial<AuthResponse["user"]>): void {
  if (typeof window === "undefined") return;
  const current = getStoredUser();
  if (!current) return;
  const next = { ...current, ...partial };
  window.localStorage.setItem(USER_KEY, JSON.stringify(next));
  emitAuthChange();
}

export class ApiRequestError extends Error {
  statusCode: number;
  details?: { field: string; message: string }[];
  constructor(
    message: string,
    statusCode: number,
    details?: { field: string; message: string }[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  return apiFetchInternal<T>(path, options, false);
}

async function apiFetchInternal<T>(
  path: string,
  options: RequestOptions,
  isRetry: boolean,
): Promise<T> {
  const { body, auth, query, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    cache: rest.cache ?? "no-store",
  });

  // Refresh-on-401: attempt one silent token refresh and retry the request.
  if (
    res.status === 401 &&
    auth &&
    !isRetry &&
    typeof window !== "undefined" &&
    getRefreshToken()
  ) {
    const refreshed = await refreshAccessTokenOnce();
    if (refreshed) {
      return apiFetchInternal<T>(path, options, true);
    }
  }

  const isJson = res.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (payload && (payload.message || payload.error)) ||
      `Request failed with status ${res.status}`;
    throw new ApiRequestError(
      Array.isArray(message) ? message.join(", ") : String(message),
      res.status,
      payload?.details,
    );
  }

  return payload as T;
}

// --- Token refresh (single-flight) ---

let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessTokenOnce(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
      // Only clear the session on a definitive auth rejection. Network blips
      // must not log the member out mid-form.
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearAuth();
        }
        return false;
      }
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken?: string;
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data.refreshToken) {
          window.localStorage.setItem(REFRESH_KEY, data.refreshToken);
        }
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Refresh tokens if a refresh token is present. Safe to call before submit. */
export function ensureFreshSession(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!getRefreshToken()) return Promise.resolve(false);
  return refreshAccessTokenOnce();
}

// Keep the session alive while the tab is open so long profile forms can be
// filled for an hour+ without the access token expiring under the member.
const KEEP_ALIVE_MS = 20 * 60 * 1000; // every 20 minutes
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let keepAliveBound = false;

function keepAliveTick() {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return;
  }
  if (!getRefreshToken()) return;
  void refreshAccessTokenOnce();
}

export function startSessionKeepAlive(): void {
  if (typeof window === "undefined") return;

  if (!keepAliveBound) {
    keepAliveBound = true;
    window.addEventListener("focus", keepAliveTick);
    document.addEventListener("visibilitychange", keepAliveTick);
  }

  if (keepAliveTimer) return;

  // Refresh soon after load in case the access token is already stale.
  keepAliveTick();
  keepAliveTimer = setInterval(keepAliveTick, KEEP_ALIVE_MS);
}

export function stopSessionKeepAlive(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// --- Auth ---

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  password: string;
}

export function signup(payload: SignupPayload) {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export function verifySignup(email: string, otp: string) {
  return apiFetch<AuthResponse>("/auth/signup/verify", {
    method: "POST",
    body: { email, otp },
  });
}

export function resendSignupOtp(email: string) {
  return apiFetch<{ message: string }>("/auth/signup/resend-otp", {
    method: "POST",
    body: { email },
  });
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function adminLogin(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/admin/login", {
    method: "POST",
    body: { email, password },
  });
}

export function refreshAuth(refreshToken: string) {
  return apiFetch<{ accessToken: string; refreshToken?: string }>(
    "/auth/refresh",
    { method: "POST", body: { refreshToken } },
  );
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST", auth: true });
  } catch {
    // Best-effort server-side invalidation; always clear local state.
  } finally {
    clearAuth();
  }
}

export function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPassword(payload: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}

export function verifyEmail(otp: string) {
  return apiFetch<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: { otp },
    auth: true,
  });
}

export function verifyPhone(otp: string) {
  return apiFetch<{ message: string }>("/auth/verify-phone", {
    method: "POST",
    body: { otp },
    auth: true,
  });
}

export function resendOtp(type: "email" | "phone") {
  return apiFetch<{ message: string }>("/auth/resend-otp", {
    method: "POST",
    body: { type },
    auth: true,
  });
}

// --- Lookups (India: PIN code + universities) ---

export interface PincodeLookup {
  pincode: string;
  state: string | null;
  district: string | null;
  areas: string[];
}

export function lookupPincode(pincode: string) {
  return apiFetch<PincodeLookup>(`/lookup/pincode/${pincode}`);
}

export function searchUniversities(q: string) {
  return apiFetch<{ universities: string[] }>("/lookup/universities", {
    query: { q },
  });
}

// --- Users (self) ---

export function getMe() {
  return apiFetch<MeUser>("/users/me", { auth: true });
}

export function updateMe(
  payload: Partial<Pick<MeUser, "firstName" | "lastName" | "phone">>,
) {
  return apiFetch<MeUser>("/users/me", {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>("/users/me/password", {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteMe() {
  return apiFetch<{ message: string }>("/users/me", {
    method: "DELETE",
    auth: true,
  });
}

// --- Profiles ---

interface RawProfileUser {
  _id?: string;
  id?: string;
  email?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  dob?: string;
  birthDate?: string;
  date_of_birth?: string;
  gender?: "Male" | "Female";
}

interface RawProfileImage {
  url?: string;
  imageUrl?: string;
  path?: string;
  src?: string;
  _id?: string;
  id?: string;
  isPrivate?: boolean;
  private?: boolean;
}

interface RawProfile {
  _id?: string;
  id?: string;
  profileNumber?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  user?: RawProfileUser;
  dateOfBirth?: string;
  dob?: string;
  birthDate?: string;
  date_of_birth?: string;
  age: number;
  gender?: "Male" | "Female";
  religion: string;
  caste: string;
  castePreference?: string;
  marriagePreference?: string;
  complexion?: string;
  city: string;
  state: string;
  homeTown?: string;
  addressCity?: string;
  addressArea?: string;
  currentAddress?: string;
  education: string;
  educationUniversity?: string;
  educationCity?: string;
  occupation: string;
  income: string;
  height: string;
  about: string;
  familyType: string;
  maritalStatus: string;
  motherTongue: string;
  interests: string[];
  languagesKnown?: string[];
  email?: string;
  phone?: string;
  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;
  otherPhone?: string;
  coordinatorNumber?: string;
  totalSiblings?: string;
  brotherEducation?: string;
  sisterEducation?: string;
  siblings?: Array<{
    name?: string;
    relation?: string;
    ageRelation?: string;
    maritalStatus?: string;
    education?: string;
    profession?: string;
  }>;
  hasChildren?: boolean | null;
  children?: Array<{
    age?: string;
    gender?: string;
    stayingWithYou?: boolean;
  }>;
  otherDetails?: string;
  images?: Array<string | RawProfileImage>;
  profileImages?: Array<string | RawProfileImage>;
  photos?: Array<string | RawProfileImage>;
  gallery?: Array<string | RawProfileImage>;
  image?: string | RawProfileImage;
  imageUrl?: string;
  photo?: string | RawProfileImage;
  profileImage?: string | RawProfileImage;
  profile?: RawProfile;
  result?: RawProfile;
  payload?: RawProfile;
  isPublished?: boolean;
  isVerified?: boolean;
  isVip?: boolean;
  isPremium?: boolean;
  photosRestricted?: boolean;
  restrictedImageUrls?: string[];
  photosUpgradeMessage?: string | null;
}

function resolveImageUrl(
  image: string | RawProfileImage | undefined,
): string | undefined {
  if (!image) return undefined;

  if (typeof image === "string") {
    const resolved = imgUrl(image);
    return resolved || undefined;
  }

  const source = image.url ?? image.imageUrl ?? image.path ?? image.src;
  if (!source) return undefined;
  const resolved = imgUrl(source);
  return resolved || undefined;
}

function normalizeImages(images: Array<string | RawProfileImage> | undefined): {
  urls: string[];
  privateUrls: string[];
} {
  if (!Array.isArray(images)) return { urls: [], privateUrls: [] };

  const urls: string[] = [];
  const privateUrls: string[] = [];

  for (const img of images) {
    const resolved = resolveImageUrl(img);
    if (!resolved) continue;

    urls.push(resolved);
    if (typeof img !== "string" && (img.isPrivate || img.private)) {
      privateUrls.push(resolved);
    }
  }

  return { urls, privateUrls };
}

function normalizePrimaryImage(image: RawProfile["image"]): {
  url?: string;
  isPrivate?: boolean;
} {
  const url = resolveImageUrl(image);
  if (!url) return {};

  return {
    url,
    isPrivate:
      typeof image === "object" && image !== null
        ? Boolean(image.isPrivate || image.private)
        : false,
  };
}

function pickPrimaryImage(
  ...candidates: Array<RawProfile["image"] | undefined>
): { url?: string; isPrivate?: boolean } {
  for (const candidate of candidates) {
    const normalized = normalizePrimaryImage(candidate);
    if (normalized.url) return normalized;
  }

  return {};
}

function normalizeProfile(raw: RawProfile): Profile {
  const source = raw.profile ?? raw.result ?? raw.payload ?? raw;
  const id = raw.id ?? raw._id ?? "";
  const explicitName =
    source.name ??
    source.fullName ??
    source.user?.name ??
    source.user?.fullName;
  const firstName = source.user?.firstName ?? "";
  const lastName = source.user?.lastName ?? "";
  const topLevelFirstName = source.firstName ?? "";
  const topLevelLastName = source.lastName ?? "";
  const combinedName = `${firstName} ${lastName}`.trim();
  const topLevelCombinedName =
    `${topLevelFirstName} ${topLevelLastName}`.trim();
  const name =
    explicitName?.trim() || combinedName || topLevelCombinedName || "Unknown";
  const rawGender = source.gender ?? source.user?.gender;
  const gender: "Male" | "Female" =
    rawGender === "Female" || rawGender === "Male" ? rawGender : "Male";
  const allImageItems: Array<string | RawProfileImage> = [
    ...(source.images ?? []),
    ...(source.profileImages ?? []),
    ...(source.photos ?? []),
    ...(source.gallery ?? []),
  ];

  const { urls: imageUrls, privateUrls } = normalizeImages(allImageItems);
  const primary = pickPrimaryImage(
    source.image,
    source.photo,
    source.profileImage,
  );
  const primaryFromScalar =
    resolveImageUrl(source.imageUrl) ||
    resolveImageUrl(source.image) ||
    undefined;
  const image = primary.url ?? primaryFromScalar ?? imageUrls[0] ?? "";
  const images = image
    ? [image, ...imageUrls.filter((url) => url !== image)]
    : imageUrls;
  const maritalStatus = (source.maritalStatus ?? "").replace(/_/g, " ");
  const dateOfBirth =
    source.user?.dateOfBirth ??
    source.user?.dob ??
    source.user?.birthDate ??
    source.user?.date_of_birth ??
    source.dateOfBirth ??
    source.dob ??
    source.birthDate ??
    source.date_of_birth;

  return {
    id: source.id ?? source._id ?? id,
    profileNumber: source.profileNumber,
    name,
    firstName: source.firstName ?? source.user?.firstName,
    lastName: source.lastName ?? source.user?.lastName,
    email: source.email ?? source.user?.email,
    phone: source.phone,
    age: source.age,
    dateOfBirth,
    gender,
    religion: source.religion,
    caste: source.caste,
    castePreference: source.castePreference,
    marriagePreference: source.marriagePreference,
    complexion: source.complexion,
    city: source.city,
    state: source.state,
    homeTown: source.homeTown,
    addressCity: source.addressCity,
    addressArea: source.addressArea,
    currentAddress: source.currentAddress,
    education: source.education,
    educationUniversity: source.educationUniversity,
    educationCity: source.educationCity,
    occupation: source.occupation,
    income: source.income,
    height: source.height,
    about: source.about,
    image,
    privateImageUrls: Array.from(
      new Set(
        [
          ...(Array.isArray(source.restrictedImageUrls)
            ? source.restrictedImageUrls.map((url) => imgUrl(String(url)))
            : []),
          ...(primary.isPrivate && image ? [...privateUrls, image] : privateUrls),
        ].filter(Boolean),
      ),
    ),
    images: images.length > 0 ? images : image ? [image] : [],
    interests: Array.isArray(source.interests) ? source.interests : [],
    languagesKnown: Array.isArray(source.languagesKnown)
      ? source.languagesKnown
      : [],
    familyType: source.familyType,
    maritalStatus,
    motherTongue: source.motherTongue,
    fatherName: source.fatherName,
    fatherOccupation: source.fatherOccupation,
    fatherPhone: source.fatherPhone,
    motherName: source.motherName,
    motherOccupation: source.motherOccupation,
    motherPhone: source.motherPhone,
    otherPhone: source.otherPhone,
    coordinatorNumber: source.coordinatorNumber,
    totalSiblings: source.totalSiblings,
    brotherEducation: source.brotherEducation,
    sisterEducation: source.sisterEducation,
    siblings: Array.isArray(source.siblings)
      ? source.siblings.map((s) => ({
          name: s?.name ?? "",
          relation: s?.relation ?? "",
          ageRelation: s?.ageRelation ?? "",
          maritalStatus: s?.maritalStatus ?? "",
          education: s?.education ?? "",
          profession: s?.profession ?? "",
        }))
      : undefined,
    hasChildren:
      typeof source.hasChildren === "boolean" ? source.hasChildren : null,
    children: Array.isArray(source.children)
      ? source.children.map((c) => ({
          age: c?.age ?? "",
          gender: c?.gender ?? "",
          stayingWithYou: Boolean(c?.stayingWithYou),
        }))
      : undefined,
    otherDetails: source.otherDetails,
    isPublished: source.isPublished,
    isVerified: source.isVerified,
    isVip: Boolean(source.isVip),
    isPremium: Boolean(source.isPremium),
    photosRestricted: Boolean(source.photosRestricted),
    restrictedImageUrls: Array.isArray(source.restrictedImageUrls)
      ? source.restrictedImageUrls.map((url) => imgUrl(String(url))).filter(Boolean)
      : [],
    photosUpgradeMessage: source.photosUpgradeMessage ?? null,
  };
}

type RawProfileListResponse =
  | RawProfile[]
  | {
      data: RawProfile[];
      meta?: Partial<Paginated<Profile>["meta"]>;
    }
  | {
      data?: {
        profiles?: RawProfile[];
        items?: RawProfile[];
      };
      profiles?: RawProfile[];
      items?: RawProfile[];
      meta?: Partial<Paginated<Profile>["meta"]>;
    };

function extractProfilesList(res: RawProfileListResponse): RawProfile[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.profiles)) return res.data.profiles;
  if (Array.isArray(res.data?.items)) return res.data.items;

  const loose = res as {
    profiles?: RawProfile[];
    items?: RawProfile[];
  };
  if (Array.isArray(loose.profiles)) return loose.profiles;
  if (Array.isArray(loose.items)) return loose.items;

  return [];
}

export async function listProfiles(
  filters: ProfileFilters = {},
): Promise<Paginated<Profile>> {
  const res = await apiFetch<RawProfileListResponse>("/profiles", {
    query: filters as Record<string, string | number | undefined>,
    auth: true,
  });

  const rawList = extractProfilesList(res);
  const data = rawList.map(normalizeProfile);
  const meta = Array.isArray(res)
    ? {
        total: data.length,
        page: filters.page ?? 1,
        limit: filters.limit ?? data.length,
        totalPages: 1,
      }
    : {
        total: res.meta?.total ?? data.length,
        page: res.meta?.page ?? filters.page ?? 1,
        limit: res.meta?.limit ?? filters.limit ?? data.length,
        totalPages: res.meta?.totalPages ?? 1,
      };

  return { data, meta };
}

export async function getProfile(id: string): Promise<Profile> {
  const raw = await apiFetch<RawProfile>(`/profiles/${id}`, { auth: true });
  return normalizeProfile(raw);
}

export async function createMyProfile(
  payload: CreateProfileInput,
): Promise<Profile> {
  const raw = await apiFetch<RawProfile>("/profiles", {
    method: "POST",
    body: payload,
    auth: true,
  });
  return normalizeProfile(raw);
}

export async function updateMyProfile(
  payload: UpdateProfileInput,
): Promise<Profile> {
  const raw = await apiFetch<RawProfile>("/profiles/me", {
    method: "PATCH",
    body: payload,
    auth: true,
  });
  return normalizeProfile(raw);
}

export async function putMyProfile(
  payload: CreateProfileInput,
): Promise<Profile> {
  const raw = await apiFetch<RawProfile>("/profiles/me", {
    method: "PUT",
    body: payload,
    auth: true,
  });
  return normalizeProfile(raw);
}

export function getMyProfileCompletion() {
  return apiFetch<ProfileCompletion>("/profiles/me/completion", { auth: true });
}

/**
 * Fetches the logged-in member's own full profile (including private fields)
 * so the "Complete Your Profile" page can pre-fill every field the member has
 * already saved. Returns null when the member has not created a profile yet
 * (the backend responds 404 in that case).
 */
export async function getMyProfile(): Promise<Profile | null> {
  try {
    const raw = await apiFetch<RawProfile>("/profiles/me/own", { auth: true });
    return normalizeProfile(raw);
  } catch (err) {
    if (err instanceof ApiRequestError && err.statusCode === 404) {
      return null;
    }
    throw err;
  }
}

export function getAdminProfileCompletion(id: string) {
  return apiFetch<ProfileCompletion>(`/admin/profiles/${id}/completion`, {
    auth: true,
  });
}

export function deleteMyProfile() {
  return apiFetch<{ message: string }>("/profiles/me", {
    method: "DELETE",
    auth: true,
  });
}

// --- Profile images ---

interface RawOwnImage {
  id?: string;
  _id?: string;
  url?: string;
  isPrimary?: boolean;
  isPrivate?: boolean;
  sortOrder?: number;
}

/**
 * Fetches the logged-in member's saved profile images (with ids, primary/
 * private flags) so the "Complete Your Profile" page can display and manage
 * previously uploaded photos. Returns [] when no profile/images exist yet.
 */
export async function getMyProfileImages(): Promise<ProfileImage[]> {
  try {
    const raw = await apiFetch<{ images?: RawOwnImage[] }>(
      "/profiles/me/own",
      {
        auth: true,
      },
    );
    const list = Array.isArray(raw.images) ? raw.images : [];
    return list
      .map((img) => ({
        id: (img.id ?? img._id) ?? "",
        url: img.url ?? "",
        isPrimary: Boolean(img.isPrimary),
        isPrivate: Boolean(img.isPrivate),
        sortOrder: typeof img.sortOrder === "number" ? img.sortOrder : 0,
      }))
      .filter((img) => img.id && img.url)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return [];
  }
}

export async function uploadProfileImages(
  files: File[],
): Promise<{ uploaded: ProfileImage[] }> {
  const fd = new FormData();
  for (const file of files) fd.append("images", file);
  return apiFetch<{ uploaded: ProfileImage[] }>("/profiles/images", {
    method: "POST",
    body: fd,
    auth: true,
  });
}

export function setPrimaryProfileImage(id: string) {
  return apiFetch<ProfileImage>(`/profiles/images/${id}/primary`, {
    method: "PATCH",
    auth: true,
  });
}

export function reorderProfileImages(
  images: { id: string; sortOrder: number }[],
) {
  return apiFetch<{ message: string }>("/profiles/images/reorder", {
    method: "PATCH",
    body: { images },
    auth: true,
  });
}

export function deleteProfileImage(id: string) {
  return apiFetch<{ message: string }>(`/profiles/images/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function toggleAdminProfileImagePrivacy(id: string) {
  return apiFetch<{ message: string }>(`/admin/profiles/images/${id}/private`, {
    method: "PATCH",
    auth: true,
  });
}

// --- Contact ---

export interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function submitContact(payload: ContactPayload) {
  return apiFetch<{ id: string }>("/contact", {
    method: "POST",
    body: payload,
  });
}
