"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  MapPin,
  GraduationCap,
  Briefcase,
  Users,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import MembershipTierIcon from "@/components/MembershipTierIcon";
import type { Profile } from "@/lib/data";

interface ProfileCardProps {
  profile: Profile;
  index: number;
}

function formatMaritalStatus(status?: string) {
  if (!status) return "";
  return status.replace(/_/g, " ");
}

export default function ProfileCard({ profile, index }: ProfileCardProps) {
  const images =
    profile.images && profile.images.length > 0
      ? profile.images
      : profile.image
        ? [profile.image]
        : [];
  const count = images.length;

  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const swipedRef = useRef(false);

  const profileIdLabel = profile.profileNumber || profile.id;
  const activeImage = images[current] ?? "";
  const isRestrictedImage = profile.privateImageUrls?.includes(activeImage);
  const maritalStatus = formatMaritalStatus(profile.maritalStatus);

  const step = (e: React.MouseEvent, dir: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c + dir + count) % count);
  };

  const selectImage = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(i);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    swipedRef.current = false;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || count < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 40) {
      swipedRef.current = true;
      setCurrent((c) => (c + (dx < 0 ? 1 : -1) + count) % count);
    }
    touchStartX.current = null;
  };

  const onContainerClick = (e: React.MouseEvent) => {
    if (swipedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      swipedRef.current = false;
    }
  };

  return (
    <Link href={`/profiles/${profile.id}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="group overflow-hidden rounded-2xl border border-[#f0dfce] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <div
          className="relative aspect-[3/4] overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onClick={onContainerClick}
        >
          {activeImage ? (
            <Image
              key={activeImage}
              src={activeImage}
              alt={`Profile ${profileIdLabel}`}
              fill
              unoptimized
              className={`object-cover transition-transform duration-500 ${
                isRestrictedImage ? "blur-md scale-105" : "group-hover:scale-105"
              }`}
            />
          ) : (
            <div className="h-full w-full bg-gray-200" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d1320]/70 via-transparent to-transparent" />

          {isRestrictedImage && profile.photosUpgradeMessage && (
            <div className="absolute inset-x-3 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-black/70 px-3 py-2 text-center text-xs font-medium text-white">
              {profile.photosUpgradeMessage}
            </div>
          )}

          <div className="absolute left-3 top-3">
            <MembershipTierIcon profile={profile} size={52} />
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => step(e, -1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-800 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => step(e, 1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-800 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 px-2 py-1">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={(e) => selectImage(e, i)}
                    aria-label={`Go to photo ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === current ? "w-4 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="text-lg font-semibold">
              {String(profile.age)}
              {profile.height ? (
                <span className="font-normal text-white/90">
                  {" "}
                  · {profile.height}
                </span>
              ) : null}
              {maritalStatus ? (
                <span className="font-normal text-white/90">
                  {" "}
                  · {maritalStatus}
                </span>
              ) : null}
            </h3>
            <p className="flex items-center gap-1 text-sm text-[#e4dbe9]">
              <MapPin className="w-3 h-3" />
              {profile.city}, {profile.state}
            </p>
            <p className="mt-1 text-xs font-medium text-white/90">
              Profile ID: {profileIdLabel}
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 flex flex-col gap-2 text-sm text-[#675f72]">
            {(profile.height || maritalStatus) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {profile.height ? (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-primary" />
                    <span>Height: {profile.height}</span>
                  </div>
                ) : null}
                {maritalStatus ? (
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <span>{maritalStatus}</span>
                  </div>
                ) : null}
              </div>
            )}
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>{profile.education}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>
                {profile.occupation} • {profile.income}
              </span>
            </div>
            {profile.caste && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>{profile.caste}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {profile.interests.slice(0, 3).map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-[#fff1e6] px-2.5 py-1 text-xs font-medium text-primary"
              >
                {interest}
              </span>
            ))}
          </div>

          <span className="block w-full rounded-full gradient-primary py-2.5 text-center text-sm font-medium text-white">
            View Full Profile
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
