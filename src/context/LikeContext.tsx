"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface LikeEntry {
  liked: boolean;
  count: number;
}

interface LikeContextValue {
  getLiked: (outfitId: string) => boolean | undefined;
  getCount: (outfitId: string) => number | undefined;
  setLike: (outfitId: string, liked: boolean, count: number) => void;
}

const LikeContext = createContext<LikeContextValue>({
  getLiked: () => undefined,
  getCount: () => undefined,
  setLike: () => {},
});

export function LikeProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Record<string, LikeEntry>>({});

  const getLiked = useCallback(
    (id: string) => entries[id]?.liked,
    [entries]
  );

  const getCount = useCallback(
    (id: string) => entries[id]?.count,
    [entries]
  );

  const setLike = useCallback((id: string, liked: boolean, count: number) => {
    setEntries((prev) => ({ ...prev, [id]: { liked, count } }));
  }, []);

  return (
    <LikeContext.Provider value={{ getLiked, getCount, setLike }}>
      {children}
    </LikeContext.Provider>
  );
}

export const useLikeContext = () => useContext(LikeContext);
