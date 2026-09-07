"use client";

import { useState, useEffect, useCallback } from "react";
import { useFeedBreakdown } from "@/context/FeedBreakdownContext";
import { useAuthPrompt } from "@/context/AuthPromptContext";
import { toggleSavedItem } from "@/app/actions/saved-items";
import BreakdownSheet, { type SheetState } from "@/components/BreakdownSheet";
import type { Outfit } from "@/types";

export default function FeedBreakdownSheetPortal({
  isAuthenticated,
  currentUserId,
}: {
  isAuthenticated: boolean;
  currentUserId: string | null;
}) {
  const { state, closeBreakdown } = useFeedBreakdown();
  const { openPrompt } = useAuthPrompt();
  const [sheetState, setSheetState] = useState<SheetState>("closed");
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);

  // Open to half when context signals isOpen; close otherwise
  useEffect(() => {
    if (state.isOpen) {
      setActiveItemIndex(0);
      setSheetState("half");
    } else {
      setSheetState("closed");
    }
  }, [state.isOpen]);

  // Reset saved state when a different outfit opens
  useEffect(() => {
    setSavedItemIds([]);
  }, [state.outfitId]);

  const handleSheetStateChange = useCallback(
    (s: SheetState) => {
      setSheetState(s);
      if (s === "closed") closeBreakdown();
    },
    [closeBreakdown]
  );

  const handleToggleSavedItem = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated) { openPrompt("save"); return; }
      setSavedItemIds((prev) =>
        prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
      await toggleSavedItem(itemId, state.outfitId).catch(() => {
        // Roll back on error
        setSavedItemIds((prev) =>
          prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
      });
    },
    [isAuthenticated, openPrompt, state.outfitId]
  );

  if (!state.isOpen && state.items.length === 0) return null;

  // BreakdownSheet only uses outfit.id and outfit.items
  const partialOutfit = { id: state.outfitId, items: state.items } as unknown as Outfit;

  return (
    <BreakdownSheet
      outfit={partialOutfit}
      sheetState={sheetState}
      onSheetStateChange={handleSheetStateChange}
      activeItemIndex={activeItemIndex}
      onItemChange={setActiveItemIndex}
      isAuthenticated={isAuthenticated}
      currentUserId={currentUserId}
      savedItemIds={savedItemIds}
      onToggleSavedItem={handleToggleSavedItem}
      openPrompt={openPrompt}
    />
  );
}
