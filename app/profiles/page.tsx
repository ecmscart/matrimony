"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import ProfileAccessMessage from "@/components/ProfileAccessMessage";
import ProfilesFilterModal, {
  countActiveFilters,
  DEFAULT_PROFILE_FILTERS,
  type ProfileFilterValues,
} from "@/components/ProfilesFilterModal";
import {
  ApiRequestError,
  getMe,
  getStoredUser,
  listProfiles,
  updateStoredUser,
} from "@/lib/api";
import type { Profile } from "@/lib/types";

const PAGE_SIZE = 24;

export default function ProfilesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ProfileFilterValues>(
    DEFAULT_PROFILE_FILTERS,
  );
  const [showFilters, setShowFilters] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // City options from a stable unfiltered snapshot so the dropdown doesn't
  // collapse when other filters are applied.
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  const activeFilterCount = countActiveFilters(filters);

  useEffect(() => {
    if (!getStoredUser()) return;
    getMe()
      .then((me) => {
        updateStoredUser({
          isProfileVerified: me.isProfileVerified,
          isVip: me.isVip,
          isPremium: me.isPremium,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!getStoredUser()) return;
    listProfiles({ limit: 100 })
      .then((res) => {
        const cities = [
          ...new Set(
            res.data
              .filter((p) => p.isPublished !== false)
              .map((p) => p.city)
              .filter(Boolean),
          ),
        ].sort((a, b) => a.localeCompare(b));
        setCityOptions(cities);
      })
      .catch(() => {
        // Options are best-effort; ignore failures here.
      });
  }, []);

  const buildListQuery = useCallback(
    (nextPage: number) => {
      const [ageMinStr, ageMaxStr] =
        filters.ageRange !== "any"
          ? filters.ageRange.split("-")
          : [undefined, undefined];
      const trimmedSearch = searchQuery.trim();
      const isProfileNumberSearch = /^maher\d+$/i.test(trimmedSearch);
      return {
        search: !isProfileNumberSearch ? trimmedSearch || undefined : undefined,
        profileNumber: isProfileNumberSearch ? trimmedSearch : undefined,
        gender: filters.gender !== "any" ? filters.gender : undefined,
        religion: filters.religion !== "any" ? filters.religion : undefined,
        caste: filters.caste !== "any" ? filters.caste : undefined,
        city: filters.city !== "any" ? filters.city : undefined,
        state: filters.state !== "any" ? filters.state : undefined,
        maritalStatus:
          filters.maritalStatus !== "any"
            ? filters.maritalStatus.replace(/ /g, "_")
            : undefined,
        motherTongue:
          filters.motherTongue !== "any" ? filters.motherTongue : undefined,
        height: filters.height !== "any" ? filters.height : undefined,
        familyType:
          filters.familyType !== "any" ? filters.familyType : undefined,
        income: filters.income !== "any" ? filters.income : undefined,
        complexion:
          filters.complexion !== "any" ? filters.complexion : undefined,
        hasChildren:
          filters.hasChildren === "yes"
            ? "true"
            : filters.hasChildren === "no"
              ? "false"
              : undefined,
        ageMin: ageMinStr ? Number(ageMinStr) : undefined,
        ageMax: ageMaxStr ? Number(ageMaxStr) : undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      };
    },
    [searchQuery, filters],
  );
  const queryRef = useRef(buildListQuery);
  queryRef.current = buildListQuery;

  useEffect(() => {
    setPage(1);
    const handle = setTimeout(() => {
      setLoading(true);
      setError(null);
      setAccessDenied(null);
      listProfiles(buildListQuery(1))
        .then((res) => {
          const visible = res.data.filter((p) => p.isPublished !== false);
          setProfiles(visible);
          const totalCount = res.meta?.total ?? visible.length;
          setTotal(totalCount);
          setHasMore(
            Boolean(res.meta?.hasNextPage) ||
              (res.meta?.page ?? 1) * PAGE_SIZE < totalCount,
          );
        })
        .catch((err: unknown) => {
          if (err instanceof ApiRequestError && err.statusCode === 403) {
            setAccessDenied(err.message);
            setIsGuest(!getStoredUser());
            setProfiles([]);
            setTotal(0);
            setHasMore(false);
            return;
          }
          setError(
            err instanceof Error ? err.message : "Failed to load profiles",
          );
          setProfiles([]);
          setTotal(0);
          setHasMore(false);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [buildListQuery]);

  useEffect(() => {
    if (page <= 1) return;
    let cancelled = false;
    setLoadingMore(true);
    listProfiles(queryRef.current(page))
      .then((res) => {
        if (cancelled) return;
        const visible = res.data.filter((p) => p.isPublished !== false);
        setProfiles((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...visible.filter((p) => !seen.has(p.id))];
        });
        const totalCount = res.meta?.total ?? 0;
        setTotal(totalCount);
        setHasMore(
          Boolean(res.meta?.hasNextPage) || page * PAGE_SIZE < totalCount,
        );
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingMore(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, profiles.length]);

  return (
    <div className="min-h-screen">
      <div className="section-shell pt-8 md:pt-10">
        <div className="overflow-hidden rounded-[2rem] border border-[#f0dfcf] bg-white/90 p-6 md:p-8">
          <h1 className="headline-serif mb-2 text-3xl font-semibold text-[#251e31]">
            Browse Profiles
          </h1>
          <p className="text-[#655e71]">
            Find your perfect match from our verified profiles.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8d8798]" />
              <input
                type="text"
                placeholder="Search by name, city, or occupation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="soft-ring w-full rounded-full border border-[#efdfce] bg-white px-12 py-3"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="relative flex items-center justify-center gap-2 rounded-full border border-[#efdfce] bg-white px-6 py-3 text-[#4e445f] transition-colors hover:bg-[#fff2e6]"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="section-shell py-8 md:py-10">
        {accessDenied ? (
          <ProfileAccessMessage message={accessDenied} isGuest={isGuest} />
        ) : (
          <>
            <p className="mb-6 text-[#5e586d]">
              {loading ? (
                "Loading profiles..."
              ) : (
                <>
                  Showing <span className="font-semibold">{profiles.length}</span>{" "}
                  of <span className="font-semibold">{total}</span> profiles
                </>
              )}
            </p>
            {error ? (
              <div className="text-center py-20">
                <p className="text-red-500 text-lg">{error}</p>
              </div>
            ) : profiles.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {profiles.map((profile, i) => (
                    <ProfileCard key={profile.id} profile={profile} index={i} />
                  ))}
                </div>
                <div ref={sentinelRef} className="h-10" />
                {loadingMore && (
                  <p className="mt-4 text-center text-sm text-[#7d758d]">
                    Loading more profiles...
                  </p>
                )}
                {hasMore && !loadingMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-full border border-[#efdfce] bg-white px-6 py-2.5 text-sm font-medium text-[#4e445f] hover:bg-[#fff2e6]"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            ) : (
              !loading && (
                <div className="text-center py-20">
                  <p className="text-lg text-[#7d758d]">
                    No profiles found matching your search.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </div>

      <ProfilesFilterModal
        open={showFilters}
        values={filters}
        cityOptions={cityOptions}
        onClose={() => setShowFilters(false)}
        onApply={(next) => {
          setFilters(next);
          setShowFilters(false);
        }}
      />
    </div>
  );
}
