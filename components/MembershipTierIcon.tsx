import Image from "next/image";

export type MembershipTier = "vip" | "premium" | "verified" | "non_verified";

export function resolveMembershipTier(profile: {
  isVip?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
}): MembershipTier {
  if (profile.isVip) return "vip";
  if (profile.isPremium) return "premium";
  if (profile.isVerified) return "verified";
  return "non_verified";
}

const ICONS: Record<MembershipTier, { src: string; alt: string }> = {
  vip: { src: "/membership/vip.png", alt: "VIP member" },
  premium: { src: "/membership/premium.png", alt: "Premium member" },
  verified: { src: "/membership/verified.png", alt: "Verified member" },
  non_verified: {
    src: "/membership/non-verified.png",
    alt: "Non-verified member",
  },
};

interface MembershipTierIconProps {
  profile: {
    isVip?: boolean;
    isPremium?: boolean;
    isVerified?: boolean;
  };
  size?: number;
  className?: string;
}

export default function MembershipTierIcon({
  profile,
  size = 52,
  className = "",
}: MembershipTierIconProps) {
  const tier = resolveMembershipTier(profile);
  const icon = ICONS[tier];

  return (
    <Image
      src={icon.src}
      alt={icon.alt}
      width={size}
      height={size}
      unoptimized
      className={`object-contain bg-transparent drop-shadow-md ${className}`}
      style={{ background: "transparent" }}
    />
  );
}
