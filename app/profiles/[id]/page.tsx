import ProfileDetailView from "@/components/ProfileDetailView";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileDetailPage({ params }: ProfilePageProps) {
  const { id } = await params;
  return <ProfileDetailView profileId={id} />;
}
