"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AuthPromptSheet from "@/components/AuthPromptSheet";

export type ActionType = "save" | "create" | "profile" | "account" | "like" | "comment" | "follow";

interface AuthPromptContextValue {
  isAuthenticated: boolean;
  authLoaded: boolean;
  openPrompt: (action: ActionType) => void;
  closePrompt: () => void;
}

const AuthPromptContext = createContext<AuthPromptContextValue>({
  isAuthenticated: false,
  authLoaded: false,
  openPrompt: () => {},
  closePrompt: () => {},
});

export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>("save");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setAuthLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openPrompt = useCallback((action: ActionType) => {
    if (!authLoaded) return;
    setActionType(action);
    setOpen(true);
  }, [authLoaded]);

  const closePrompt = useCallback(() => setOpen(false), []);

  return (
    <AuthPromptContext.Provider value={{ isAuthenticated, authLoaded, openPrompt, closePrompt }}>
      {children}
      <AuthPromptSheet isOpen={open} onClose={closePrompt} actionType={actionType} />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  return useContext(AuthPromptContext);
}
