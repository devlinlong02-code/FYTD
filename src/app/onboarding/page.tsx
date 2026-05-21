import { redirect } from "next/navigation";
import { getSession, getProfile } from "@/lib/dal";
import ProfileSetupForm from "./ProfileSetupForm";

export default async function OnboardingPage() {
  const [user, profile] = await Promise.all([getSession(), getProfile()]);

  if (!user) redirect("/auth/login?next=/onboarding");
  if (profile?.profile_completed) redirect("/profile");

  return (
    <ProfileSetupForm
      userId={user.id}
      initialData={{
        display_name: profile?.display_name ?? "",
        username: profile?.username ?? "",
        avatar_url: profile?.avatar_url ?? "",
        bio: profile?.bio ?? "",
        style_tags: (profile?.style_tags as string[] | undefined) ?? [],
      }}
    />
  );
}
