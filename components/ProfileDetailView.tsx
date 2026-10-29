"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Heart,
  ArrowLeft,
  Users,
  Ruler,
  Languages,
  Building,
  Sparkles,
  Loader2,
} from "lucide-react";
import MembershipTierIcon from "@/components/MembershipTierIcon";
import ProfileAccessMessage from "@/components/ProfileAccessMessage";
import ProfileGallery from "@/components/ProfileGallery";
import {
  ApiRequestError,
  getProfile,
  getStoredUser,
} from "@/lib/api";
import type { Profile } from "@/lib/types";

interface ProfileDetailViewProps {
  profileId: string;
}

export default function ProfileDetailView({ profileId }: ProfileDetailViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setAccessDenied(null);
    setNotFound(false);

    getProfile(profileId)
      .then((data) => {
        if (data.isPublished === false) {
          setNotFound(true);
          return;
        }
        setProfile(data);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiRequestError) {
          if (err.statusCode === 403) {
            setAccessDenied(err.message);
            setIsGuest(!getStoredUser());
            return;
          }
          if (err.statusCode === 404) {
            setNotFound(true);
            return;
          }
        }
        setAccessDenied("Failed to load profile. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (accessDenied) {
    return <ProfileAccessMessage message={accessDenied} isGuest={isGuest} />;
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Profile not found</h2>
        <Link href="/profiles" className="mt-4 text-primary hover:underline">
          Back to profiles
        </Link>
      </div>
    );
  }

  const formattedDateOfBirth = (() => {
    if (!profile.dateOfBirth) return "Not shared";
    const parsed = new Date(profile.dateOfBirth);
    if (Number.isNaN(parsed.getTime())) return "Not shared";
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  })();
  const profileIdLabel = profile.profileNumber || profile.id;

  const hasFamilyDetails = Boolean(
      profile.fatherOccupation ||
      profile.motherName ||
      profile.motherOccupation ||
      profile.totalSiblings ||
      profile.brotherEducation ||
      profile.sisterEducation ||
      (profile.siblings && profile.siblings.length > 0) ||
      profile.otherDetails,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/profiles"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profiles
        </Link>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="relative">
            <ProfileGallery
              images={profile.images}
              name={`Profile ${profileIdLabel}`}
              privateImageUrls={profile.privateImageUrls}
              upgradeMessage={profile.photosUpgradeMessage}
            />
            <div className="absolute bottom-6 left-6 right-6 text-white z-10">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">
                {String(profile.age)}
              </h1>
              <p className="text-gray-200 flex items-center gap-2 mt-2 text-base sm:text-lg">
                <MapPin className="w-5 h-5 shrink-0" />
                <span className="break-words">
                  {profile.city}, {profile.state}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-black/45 px-3 py-1 text-sm font-medium text-white">
                  Profile ID: {profileIdLabel}
                </span>
                <MembershipTierIcon profile={profile} size={57} />
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                About
              </h2>
              <p className="text-gray-600 leading-relaxed">{profile.about}</p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Profile Details
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailItem
                  icon={<Calendar className="w-5 h-5 text-primary" />}
                  label="Date of Birth"
                  value={formattedDateOfBirth}
                />
                <DetailItem
                  icon={<Ruler className="w-5 h-5 text-primary" />}
                  label="Height"
                  value={profile.height}
                />
                <DetailItem
                  icon={<GraduationCap className="w-5 h-5 text-primary" />}
                  label="Education"
                  value={profile.education}
                />
                <DetailItem
                  icon={<GraduationCap className="w-5 h-5 text-primary" />}
                  label="University"
                  value={profile.educationUniversity}
                />
                <DetailItem
                  icon={<Briefcase className="w-5 h-5 text-primary" />}
                  label="Occupation"
                  value={profile.occupation}
                />
                <DetailItem
                  icon={<Building className="w-5 h-5 text-primary" />}
                  label="Income"
                  value={profile.income}
                />
                <DetailItem
                  icon={<Users className="w-5 h-5 text-primary" />}
                  label="Family Type"
                  value={profile.familyType}
                />
                <DetailItem
                  icon={<Languages className="w-5 h-5 text-primary" />}
                  label="Mother Tongue"
                  value={profile.motherTongue}
                />
                <DetailItem
                  icon={<Heart className="w-5 h-5 text-primary" />}
                  label="Marital Status"
                  value={profile.maritalStatus}
                />
                <DetailItem
                  icon={<Users className="w-5 h-5 text-primary" />}
                  label="Religion"
                  value={profile.religion}
                />
                <DetailItem
                  icon={<Users className="w-5 h-5 text-primary" />}
                  label="Caste"
                  value={profile.caste}
                />
                <DetailItem
                  icon={<Users className="w-5 h-5 text-primary" />}
                  label="Caste Preference"
                  value={profile.castePreference}
                />
                <DetailItem
                  icon={<Heart className="w-5 h-5 text-primary" />}
                  label="Marriage Preference"
                  value={profile.marriagePreference}
                />
                <DetailItem
                  icon={<Sparkles className="w-5 h-5 text-primary" />}
                  label="Complexion"
                  value={profile.complexion}
                />
                <DetailItem
                  icon={<MapPin className="w-5 h-5 text-primary" />}
                  label="Home Town"
                  value={profile.homeTown}
                />
                <DetailItem
                  icon={<GraduationCap className="w-5 h-5 text-primary" />}
                  label="Education City"
                  value={profile.educationCity}
                />
                <DetailItem
                  icon={<MapPin className="w-5 h-5 text-primary" />}
                  label="Area"
                  value={profile.addressArea}
                />
                <DetailItem
                  icon={<MapPin className="w-5 h-5 text-primary" />}
                  label="Address City"
                  value={profile.addressCity}
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Interests & Hobbies
              </h2>
              <div className="flex flex-wrap gap-3">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-4 py-2 bg-rose-50 text-primary rounded-full font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </section>

            {profile.languagesKnown && profile.languagesKnown.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Languages Known
                </h2>
                <div className="flex flex-wrap gap-3">
                  {profile.languagesKnown.map((language) => (
                    <span
                      key={language}
                      className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {hasFamilyDetails && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Family Details
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailItem
                    icon={<Briefcase className="w-5 h-5 text-primary" />}
                    label="Father's Occupation"
                    value={profile.fatherOccupation}
                  />
                  <DetailItem
                    icon={<Users className="w-5 h-5 text-primary" />}
                    label="Mother's Name"
                    value={profile.motherName}
                  />
                  <DetailItem
                    icon={<Briefcase className="w-5 h-5 text-primary" />}
                    label="Mother's Occupation"
                    value={profile.motherOccupation}
                  />
                  <DetailItem
                    icon={<Users className="w-5 h-5 text-primary" />}
                    label="Siblings"
                    value={profile.totalSiblings}
                  />
                  <DetailItem
                    icon={<GraduationCap className="w-5 h-5 text-primary" />}
                    label="Brother's Education"
                    value={profile.brotherEducation}
                  />
                  <DetailItem
                    icon={<GraduationCap className="w-5 h-5 text-primary" />}
                    label="Sister's Education"
                    value={profile.sisterEducation}
                  />
                </div>
                {profile.siblings && profile.siblings.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Siblings
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {profile.siblings.map((s, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                        >
                          <p className="font-medium text-gray-900">
                            {s.name || `Sibling ${i + 1}`}
                          </p>
                          {(s.relation || s.ageRelation || s.maritalStatus) && (
                            <p className="text-sm text-gray-600">
                              {[s.relation, s.ageRelation, s.maritalStatus]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}
                          {s.education && (
                            <p className="text-sm text-gray-600">{s.education}</p>
                          )}
                          {s.profession && (
                            <p className="text-sm text-gray-600">
                              {s.profession}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {profile.otherDetails && (
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {profile.otherDetails}
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
      {icon}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
