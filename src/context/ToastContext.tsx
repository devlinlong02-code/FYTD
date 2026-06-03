"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastContextValue {
  showToast: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

interface ToastState {
  id: number;
  message: string;
  duration: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, duration = 2500) => {
    const id = ++idRef.current;
    setToast({ id, message, duration });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          duration={toast.duration}
          onDismiss={() => setToast(null)}
        />
      )}
    </ToastContext.Provider>
  );
}

function Toast({
  message,
  duration,
  onDismiss,
}: {
  message: string;
  duration: number;
  onDismiss: () => void;
}) {
  // Use CSS animation to auto-dismiss
  return (
    <div
      className="fixed bottom-24 left-1/2 z-[9999] pointer-events-none"
      style={{ transform: "translateX(-50%)" }}
      onAnimationEnd={onDismiss}
    >
      <div
        className="animate-fade-in-up bg-neutral-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap"
        style={{
          animationDuration: `${duration}ms`,
          animationFillMode: "forwards",
          animationName: "toast-lifecycle",
        }}
      >
        {message}
      </div>
    </div>
  );
}
