"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "fytd_saved_outfits";

function loadIds(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useSavedOutfits() {
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadIds();
  });

  const persist = (ids: string[]) => {
    setSavedIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {}
  };

  const save = useCallback(
    (id: string) => {
      if (!savedIds.includes(id)) persist([...savedIds, id]);
    },
    [savedIds]
  );

  const remove = useCallback(
    (id: string) => {
      persist(savedIds.filter((s) => s !== id));
    },
    [savedIds]
  );

  const toggle = useCallback(
    (id: string) => {
      if (savedIds.includes(id)) {
        remove(id);
      } else {
        save(id);
      }
    },
    [savedIds, save, remove]
  );

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  return { savedIds, save, remove, toggle, isSaved };
}
