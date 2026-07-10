import { redirect } from "next/navigation";
import { getSession, getProfile } from "@/lib/dal";
import OnboardingWrapper from "./OnboardingWrapper";

export default async function OnboardingPage() {
  const [user, profile] = await Promise.all([getSession(), getProfile()]);

  if (!user) redirect("/auth/login?next=/onboarding");
  if (profile?.profile_completed) redirect("/profile");

  const onboardingCompleted = !!(profile as Record<string, unknown> | null)?.onboarding_completed;

  return (
    <OnboardingWrapper
      userId={user.id}
      onboardingCompleted={onboardingCompleted}
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
