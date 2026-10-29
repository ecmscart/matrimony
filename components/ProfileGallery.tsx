"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

interface ProfileGalleryProps {
  images: string[];
  name: string;
  privateImageUrls?: string[];
  upgradeMessage?: string | null;
}

export default function ProfileGallery({
  images,
  name,
  privateImageUrls = [],
  upgradeMessage,
}: ProfileGalleryProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const swipedRef = useRef(false);
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[current] : "";
  const isRestrictedImage =
    hasImages && privateImageUrls.includes(currentImage);

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    swipedRef.current = false;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || images.length < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > 40) {
      swipedRef.current = true;
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  const openFullImage = () => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    if (!hasImages || isRestrictedImage) return;
    window.open(currentImage, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="relative aspect-[3/4] max-h-[min(80vh,40rem)] w-full group bg-gray-900"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {hasImages ? (
        <Image
          src={currentImage}
          alt={`${name} - Photo ${current + 1}`}
          fill
          unoptimized
          className={`object-contain transition-all duration-300 ${
            isRestrictedImage ? "blur-md scale-105" : ""
          }`}
        />
      ) : (
        <div className="h-full w-full bg-gray-200" />
      )}

      <button
        type="button"
        onClick={openFullImage}
        disabled={!hasImages || isRestrictedImage}
        aria-label="Open full photo in a new tab"
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent ${
          hasImages && !isRestrictedImage ? "cursor-zoom-in" : "cursor-default"
        }`}
      />

      {isRestrictedImage && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/35 px-6 text-center">
          <Lock className="mb-3 h-8 w-8 text-white" />
          <p className="max-w-sm text-sm font-medium text-white">
            {upgradeMessage ?? "Upgrade to view photos. Contact admin."}
          </p>
          <Link
            href="/contact"
            className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900"
          >
            Contact Admin
          </Link>
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-100 shadow transition-colors hover:bg-white z-20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-100 shadow transition-colors hover:bg-white z-20"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === current ? "bg-white scale-110" : "bg-white/50"
              }`}
              aria-label={`View photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
