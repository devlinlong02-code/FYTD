"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

const STYLE_OPTIONS = [
  { id: "streetwear", label: "Streetwear", emoji: "🧢" },
  { id: "clean fit", label: "Clean Fit", emoji: "✨" },
  { id: "old money", label: "Old Money", emoji: "🎩" },
  { id: "minimal", label: "Minimal", emoji: "⬜" },
  { id: "casual", label: "Casual", emoji: "👕" },
  { id: "formal", label: "Formal", emoji: "👔" },
  { id: "gym fit", label: "Gym Fit", emoji: "💪" },
  { id: "night out", label: "Night Out", emoji: "🌙" },
];

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [screen, setScreen] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const total = 5;

  function toggleStyle(id: string) {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function finish() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          ...(selectedStyles.length > 0 ? { style_tags: selectedStyles } : {}),
        })
        .eq("id", userId);
      onComplete();
    });
  }

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col max-w-md mx-auto">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-safe pt-6">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === screen ? 20 : 6,
              height: 6,
              background: i <= screen ? "#111" : "#e5e5e5",
            }}
          />
        ))}
      </div>

      {/* Screens */}
      <div className="flex-1 flex flex-col justify-center px-8 pb-8">
        {screen === 0 && (
          <div className="flex flex-col items-center text-center gap-5">
            <div className="text-6xl">👗</div>
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-3">
                Welcome to FYTD
              </h1>
              <p className="text-base text-neutral-500 leading-relaxed">
                Find Your 'Fit Daily — discover outfits and shop every single piece.
              </p>
            </div>
          </div>
        )}

        {screen === 1 && (
          <div className="flex flex-col items-center text-center gap-5">
            <div className="text-6xl">🔍</div>
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-3">
                Browse real fits
              </h2>
              <p className="text-base text-neutral-500 leading-relaxed">
                Scroll through curated outfits from creators who share every detail — no mystery brands, no guessing.
              </p>
            </div>
          </div>
        )}

        {screen === 2 && (
          <div className="flex flex-col items-center text-center gap-5">
            <div className="text-6xl">🏷️</div>
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-3">
                Shop the breakdown
              </h2>
              <p className="text-base text-neutral-500 leading-relaxed">
                Tap any outfit to see every piece with brand, price, and a direct shop link. Exact match or similar find.
              </p>
            </div>
          </div>
        )}

        {screen === 3 && (
          <div className="flex flex-col items-center text-center gap-5">
            <div className="text-6xl">📸</div>
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-3">
                Post your fits
              </h2>
              <p className="text-base text-neutral-500 leading-relaxed">
                Share your own outfits with a full breakdown. Build your profile and help others find their style.
              </p>
            </div>
          </div>
        )}

        {screen === 4 && (
          <div className="flex flex-col gap-6 w-full">
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight mb-2">
                Your style
              </h2>
              <p className="text-sm text-neutral-500">
                Pick what fits you — we'll tailor your feed. Skip anytime.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map(({ id, label, emoji }) => {
                const active = selectedStyles.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleStyle(id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                      active
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <span className="text-lg leading-none">{emoji}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-8 pb-safe pb-10 flex flex-col gap-3">
        <button
          onClick={screen < total - 1 ? () => setScreen((s) => s + 1) : finish}
          disabled={pending}
          className="w-full py-4 rounded-2xl bg-neutral-900 text-white font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {screen < total - 1 ? "Next" : pending ? "Almost there…" : "Let's go"}
        </button>
        {screen > 0 && screen < total - 1 && (
          <button
            onClick={() => setScreen((s) => s - 1)}
            className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors font-medium"
          >
            Back
          </button>
        )}
        {screen === 4 && (
          <button
            onClick={finish}
            disabled={pending}
            className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors font-medium"
          >
            Skip
          </button>
        )}
        {screen === 0 && (
          <button
            onClick={finish}
            className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors font-medium"
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
