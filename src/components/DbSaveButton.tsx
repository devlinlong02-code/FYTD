"use client";

import { useState } from "react";
import SaveButton from "./SaveButton";
import { toggleSave } from "@/app/actions/saved";
import { useAuthPrompt } from "@/context/AuthPromptContext";

interface DbSaveButtonProps {
  outfitId: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
}

export default function DbSaveButton({
  outfitId,
  initialSaved,
  isAuthenticated,
}: DbSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const { openPrompt } = useAuthPrompt();

  async function handleToggle() {
    if (!isAuthenticated) {
      openPrompt("save");
      return;
    }

    setPending(true);
    const result = await toggleSave(outfitId);
    setSaved(result.saved);
    setPending(false);
  }

  return (
    <SaveButton saved={saved} onToggle={handleToggle} pending={pending} />
  );
}
