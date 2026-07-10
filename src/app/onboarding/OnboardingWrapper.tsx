"use client";

import { useState } from "react";
import OnboardingFlow from "./OnboardingFlow";
import ProfileSetupForm from "./ProfileSetupForm";

interface Props {
  userId: string;
  onboardingCompleted: boolean;
  initialData: {
    display_name: string;
    username: string;
    avatar_url: string;
    bio: string;
    style_tags: string[];
  };
}

export default function OnboardingWrapper({ userId, onboardingCompleted, initialData }: Props) {
  const [showSetup, setShowSetup] = useState(onboardingCompleted);

  if (!showSetup) {
    return <OnboardingFlow userId={userId} onComplete={() => setShowSetup(true)} />;
  }

  return <ProfileSetupForm userId={userId} initialData={initialData} />;
}
