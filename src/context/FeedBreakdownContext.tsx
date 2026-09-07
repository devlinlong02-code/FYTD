"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { OutfitItem } from "@/types";

interface FeedBreakdownState {
  isOpen: boolean;
  items: OutfitItem[];
  outfitTitle: string;
  outfitId: string;
  savedItemIds: Set<string>;
}

interface FeedBreakdownContextValue {
  openBreakdown: (outfitId: string, title: string, items: OutfitItem[], savedItemIds: Set<string>) => void;
  closeBreakdown: () => void;
  state: FeedBreakdownState;
}

const FeedBreakdownContext = createContext<FeedBreakdownContextValue | null>(null);

export function FeedBreakdownProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FeedBreakdownState>({
    isOpen: false,
    items: [],
    outfitTitle: "",
    outfitId: "",
    savedItemIds: new Set(),
  });

  const openBreakdown = useCallback(
    (outfitId: string, title: string, items: OutfitItem[], savedItemIds: Set<string>) => {
      setState({ isOpen: true, outfitId, outfitTitle: title, items, savedItemIds });
    },
    []
  );

  const closeBreakdown = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <FeedBreakdownContext.Provider value={{ openBreakdown, closeBreakdown, state }}>
      {children}
    </FeedBreakdownContext.Provider>
  );
}

export function useFeedBreakdown() {
  const ctx = useContext(FeedBreakdownContext);
  if (!ctx) throw new Error("useFeedBreakdown must be used inside FeedBreakdownProvider");
  return ctx;
}
