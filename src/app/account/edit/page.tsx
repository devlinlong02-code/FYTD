import { redirect } from "next/navigation";
import { getSession, getProfile } from "@/lib/dal";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
  const [user, profile] = await Promise.all([getSession(), getProfile()]);
  if (!user) redirect("/auth/login?next=/account/edit");

  return (
    <EditProfileForm
      userId={user.id}
      initialData={{
        display_name: profile?.display_name ?? "",
        username: profile?.username ?? "",
        avatar_url: profile?.avatar_url ?? "",
        bio: profile?.bio ?? "",
        location: profile?.location ?? "",
        style_tags: (profile?.style_tags as string[] | undefined) ?? [],
        instagram_url: (profile as Record<string, string> | null)?.instagram_url ?? "",
        tiktok_url: (profile as Record<string, string> | null)?.tiktok_url ?? "",
        website_url: (profile as Record<string, string> | null)?.website_url ?? "",
      }}
    />
  );
}
