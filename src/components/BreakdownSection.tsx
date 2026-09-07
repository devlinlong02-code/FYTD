"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toggleSavedItem } from "@/app/actions/saved-items";
import { normalizeExternalUrl } from "@/lib/links";
import { calculateFitValue, formatFitValue } from "@/lib/fitValue";
import type { Outfit, OutfitItem } from "@/types";

// ─── Inline SVG icons (no lucide dependency) ─────────────────────────────────

function BookmarkIcon({ filled, size = 14 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ArrowRightIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function MessageIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ChevronDownIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUpIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function SendIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ShareIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// ─── Category emoji ───────────────────────────────────────────────────────────

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    top: "👕", bottom: "👖", footwear: "👟", outerwear: "🧥",
    accessory: "⌚", bag: "👜", hat: "🧢", jewelry: "💍", other: "✨",
  };
  return map[category.toLowerCase()] ?? "✨";
}

const STAR_PATH = "M6 1L7.545 4.09L11 4.635L8.5 7.07L9.09 10.5L6 8.875L2.91 10.5L3.5 7.07L1 4.635L4.455 4.09L6 1Z";

// ─── Share breakdown button ───────────────────────────────────────────────────

function ShareBreakdownButton({ outfit }: { outfit: Outfit }) {
  const handleShare = useCallback(async () => {
    const fitVal = outfit.items.filter((i) => i.price > 0).reduce((a, i) => a + i.price, 0);
    const lines: string[] = [outfit.title, `by ${outfit.creatorHandle}`, ""];
    outfit.items.forEach((item) => {
      const parts = [item.category];
      if (item.brand) parts.push(item.brand);
      parts.push(item.name);
      if (item.price > 0) parts.push(`$${item.price.toLocaleString()}`);
      lines.push(parts.join(" · "));
    });
    if (fitVal > 0) { lines.push(""); lines.push(`Total: $${fitVal.toLocaleString()}`); }
    lines.push(""); lines.push("fytd.org");

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = 400 * scale;
    canvas.height = (80 + lines.length * 26 + 40) * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 400, canvas.height / scale);
    ctx.fillStyle = "#000"; ctx.font = "bold 18px -apple-system,sans-serif";
    ctx.fillText(outfit.title, 32, 52);
    ctx.fillStyle = "#888"; ctx.font = "13px -apple-system,sans-serif";
    ctx.fillText(`by ${outfit.creatorHandle}`, 32, 72);
    let y = 104;
    lines.slice(2).forEach((line) => {
      if (!line) { y += 10; return; }
      if (line.startsWith("Total:")) { ctx.fillStyle = "#000"; ctx.font = "bold 13px -apple-system,sans-serif"; }
      else if (line === "fytd.org") { ctx.fillStyle = "#aaa"; ctx.font = "11px -apple-system,sans-serif"; ctx.fillText(line, 400 - 32 - ctx.measureText(line).width, y); return; }
      else { ctx.fillStyle = "#333"; ctx.font = "13px -apple-system,sans-serif"; }
      ctx.fillText(line, 32, y); y += 26;
    });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "fytd-breakdown.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: `${outfit.title} — FYTD Breakdown` }); return; } catch { /* fall through */ } }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "fytd-breakdown.png"; a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [outfit]);

  return (
    <button
      onClick={handleShare}
      title="Share breakdown"
      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--page-surface)", border: "0.5px solid var(--page-border)", cursor: "pointer", color: "var(--page-text-muted)" }}
    >
      <ShareIcon size={14} />
    </button>
  );
}

// ─── Q&A ─────────────────────────────────────────────────────────────────────

type QAAnswer = {
  id: string;
  answer: string;
  user_id: string;
  profiles: { username: string | null } | null;
};

type QAQuestion = {
  id: string;
  question: string;
  user_id: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
  item_answers: QAAnswer[];
};

function QuestionThread({
  question,
  isAuthenticated,
  isExpanded,
  onToggle,
  onAnswer,
}: {
  question: QAQuestion;
  isAuthenticated: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onAnswer: (text: string) => Promise<void>;
}) {
  const [answerText, setAnswerText] = useState("");
  const answers = question.item_answers ?? [];

  const handleAnswer = async () => {
    if (!answerText.trim()) return;
    await onAnswer(answerText.trim());
    setAnswerText("");
  };

  return (
    <div style={{ background: "var(--page-surface)", border: "0.5px solid var(--page-border)", borderRadius: 10, overflow: "hidden" }}>
      <button onClick={onToggle} style={{ width: "100%", padding: "10px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--page-text-primary)", margin: "0 0 3px", lineHeight: 1.4 }}>
            {question.question}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--page-text-muted)", margin: 0, letterSpacing: "0.04em" }}>
            @{question.profiles?.username ?? "user"}
            {answers.length > 0 && <span style={{ marginLeft: 8 }}>· {answers.length} {answers.length === 1 ? "answer" : "answers"}</span>}
          </p>
        </div>
        <span style={{ color: "var(--page-text-muted)", display: "flex", marginTop: 2, flexShrink: 0 }}>
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>

      {isExpanded && (
        <div style={{ borderTop: "0.5px solid var(--page-border)", padding: "10px 12px" }}>
          {answers.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {answers.map((a) => (
                <div key={a.id} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, borderLeft: "2px solid var(--page-border)" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--page-text-primary)", margin: "0 0 4px", lineHeight: 1.4 }}>{a.answer}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--page-text-muted)", margin: 0, letterSpacing: "0.04em" }}>@{a.profiles?.username ?? "user"}</p>
                </div>
              ))}
            </div>
          )}
          {isAuthenticated && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text" value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAnswer(); }}
                placeholder="Answer this question…" maxLength={500}
                style={{ flex: 1, height: 34, background: "var(--page-bg)", border: "0.5px solid var(--page-border)", borderRadius: 999, padding: "0 12px", fontFamily: "var(--font-body)", fontSize: 12, color: "var(--page-text-primary)", outline: "none" }}
              />
              <button
                onClick={handleAnswer} disabled={!answerText.trim()}
                style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, border: "none", display: "flex", alignItems: "center", justifyContent: "center", background: answerText.trim() ? "var(--page-text-primary)" : "var(--page-surface)", cursor: answerText.trim() ? "pointer" : "default" }}
              >
                <span style={{ display: "flex", color: answerText.trim() ? "var(--page-bg)" : "var(--page-text-muted)" }}><SendIcon size={12} /></span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemQAPanel({
  item,
  isAuthenticated,
  currentUserId,
}: {
  item: OutfitItem;
  isAuthenticated: boolean;
  currentUserId: string | null;
}) {
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("item_questions")
      .select("id, question, user_id, profiles!user_id(username, avatar_url), item_answers(id, answer, user_id, profiles!user_id(username))")
      .eq("item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setQuestions((data as unknown as QAQuestion[]) ?? []);
    setIsLoading(false);
  }, [item.id, supabase]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || !currentUserId || isSubmitting) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("item_questions").insert({
      item_id: item.id,
      user_id: currentUserId,
      question: newQuestion.trim(),
    });
    if (!error) { setNewQuestion(""); await fetchQuestions(); }
    setIsSubmitting(false);
  };

  const handleAnswer = async (questionId: string, text: string) => {
    if (!currentUserId) return;
    await supabase.from("item_answers").insert({ question_id: questionId, user_id: currentUserId, answer: text });
    await fetchQuestions();
  };

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid var(--page-border)" }}>
      {isAuthenticated && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
          <input
            type="text" value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmitQuestion(); }}
            placeholder={`Ask about this ${item.category.toLowerCase() || "piece"}…`}
            maxLength={200}
            style={{ flex: 1, height: 36, background: "var(--page-surface)", border: "0.5px solid var(--page-border)", borderRadius: 999, padding: "0 14px", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--page-text-primary)", outline: "none" }}
          />
          <button
            onClick={handleSubmitQuestion} disabled={!newQuestion.trim() || isSubmitting}
            style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, border: "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 200ms ease", background: newQuestion.trim() ? "var(--page-text-primary)" : "var(--page-surface)", cursor: newQuestion.trim() ? "pointer" : "default" }}
          >
            <span style={{ display: "flex", color: newQuestion.trim() ? "var(--page-bg)" : "var(--page-text-muted)" }}><SendIcon size={14} /></span>
          </button>
        </div>
      )}

      {isLoading ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--page-text-muted)", textAlign: "center", padding: "12px 0", margin: 0 }}>Loading…</p>
      ) : questions.length === 0 ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--page-text-muted)", textAlign: "center", padding: "12px 0 4px", margin: 0 }}>
          No questions yet.{isAuthenticated ? " Be the first to ask." : " Sign in to ask."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {questions.map((q) => (
            <QuestionThread
              key={q.id}
              question={q}
              isAuthenticated={isAuthenticated}
              isExpanded={expandedId === q.id}
              onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
              onAnswer={(text) => handleAnswer(q.id, text)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function BreakdownItemCard({
  item,
  outfitId,
  isSaved,
  saveCount,
  isAuthenticated,
  currentUserId,
  onSave,
  isLast,
}: {
  item: OutfitItem;
  outfitId: string;
  isSaved: boolean;
  saveCount: number;
  isAuthenticated: boolean;
  currentUserId: string | null;
  onSave: () => void;
  isLast: boolean;
}) {
  const [showQA, setShowQA] = useState(false);
  const [saveAnimating, setSaveAnimating] = useState(false);

  const handleSave = () => {
    if (!isAuthenticated) return;
    setSaveAnimating(true);
    setTimeout(() => setSaveAnimating(false), 350);
    onSave();
  };

  const hasShopLink = !!item.shopLink && item.shopLink !== "#";
  const isSimlar = item.shopType === "similar";
  const questionsCount = item.questionsCount ?? 0;
  // `note` is FYTD's "How I Found It" field
  const hasFoundIt = !!item.note?.trim();

  return (
    <div style={{ background: "var(--page-bg)", borderBottom: isLast ? "none" : "0.5px solid var(--page-border)", padding: "16px 16px 14px" }}>
      {/* Main row */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Item image */}
        <div style={{ width: 68, height: 68, borderRadius: 10, overflow: "hidden", background: "var(--page-surface)", border: "0.5px solid var(--page-border)", flexShrink: 0, position: "relative" }}>
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="68px" />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
              {getCategoryEmoji(item.category)}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Category + similar badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 500, color: "var(--page-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {item.category}
            </span>
            {isSimlar && (
              <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,165,0,0.08)", border: "0.5px solid rgba(255,165,0,0.2)", borderRadius: 999, padding: "1px 6px", fontFamily: "var(--font-mono)", fontSize: 8, color: "rgba(255,165,0,0.7)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Similar
              </span>
            )}
          </div>

          {/* Name */}
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--page-text-primary)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.name}
          </p>

          {/* Brand */}
          {item.brand && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--page-text-muted)", margin: "0 0 10px", letterSpacing: "0.02em" }}>
              {item.brand}
            </p>
          )}

          {/* Price + actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {item.price > 0 ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 400, color: "var(--page-text-primary)", letterSpacing: "-0.01em", margin: 0 }}>
                ${item.price.toLocaleString()}
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--page-text-muted)", margin: 0, letterSpacing: "0.04em" }}>
                No price
              </p>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={!isAuthenticated}
                aria-label={isSaved ? "Unsave item" : "Save item"}
                style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: isSaved ? "var(--page-text-primary)" : "var(--page-surface)", border: "0.5px solid var(--page-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: isAuthenticated ? "pointer" : "default", transition: "all 200ms ease" }}
              >
                <span style={{ display: "flex", color: isSaved ? "var(--page-bg)" : "var(--page-text-secondary)", transform: saveAnimating ? "scale(1.3)" : "scale(1)", transition: "transform 200ms ease" }}>
                  <BookmarkIcon filled={isSaved} size={14} />
                </span>
              </button>

              {hasShopLink && (
                <a
                  href={normalizeExternalUrl(item.shopLink) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ height: 32, padding: "0 12px", borderRadius: 999, background: "var(--page-text-primary)", color: "var(--page-bg)", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none", letterSpacing: "0.02em", flexShrink: 0 }}
                >
                  {isSimlar ? "Shop Similar" : "Shop Exact"}
                  <ArrowRightIcon size={11} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How I Found It */}
      {hasFoundIt && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid var(--page-border)" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 500, color: "var(--page-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 5px" }}>
            How I found it
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--page-text-secondary)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
            "{item.note}"
          </p>
        </div>
      )}

      {/* Footer: saves + questions + ask */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "0.5px solid var(--page-border)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "var(--page-text-muted)", display: "flex" }}><BookmarkIcon size={12} /></span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--page-text-muted)", letterSpacing: "0.02em" }}>
            {saveCount > 0 ? `${saveCount.toLocaleString()} saved` : "Be first to save"}
          </span>
        </div>

        {questionsCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "var(--page-text-muted)", display: "flex" }}><MessageIcon size={12} /></span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--page-text-muted)", letterSpacing: "0.02em" }}>
              {questionsCount} {questionsCount === 1 ? "question" : "questions"}
            </span>
          </div>
        )}

        <button
          onClick={() => setShowQA((p) => !p)}
          style={{ marginLeft: "auto", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500, color: "var(--page-text-secondary)", background: "none", border: "0.5px solid var(--page-border)", borderRadius: 999, padding: "4px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 150ms ease" }}
        >
          {showQA ? <><span>Hide</span><ChevronUpIcon size={11} /></> : <><span>Ask</span><MessageIcon size={11} /></>}
        </button>
      </div>

      {/* Q&A panel — expands on ask */}
      {showQA && (
        <ItemQAPanel
          item={item}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface BreakdownSectionProps {
  outfit: Outfit;
  isAuthenticated: boolean;
  currentUserId: string | null;
  initialSavedItemIds: string[];
}

export default function BreakdownSection({
  outfit,
  isAuthenticated,
  currentUserId,
  initialSavedItemIds,
}: BreakdownSectionProps) {
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set(initialSavedItemIds));
  const [itemSaveCounts, setItemSaveCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    outfit.items.forEach((item) => { counts[item.id] = item.savesCount ?? 0; });
    return counts;
  });

  const fitValue = calculateFitValue(outfit.items);

  const handleSaveItem = useCallback(async (itemId: string) => {
    const isSaved = savedItemIds.has(itemId);
    setSavedItemIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(itemId); else next.add(itemId);
      return next;
    });
    setItemSaveCounts((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + (isSaved ? -1 : 1)),
    }));
    await toggleSavedItem(itemId, outfit.id).catch(() => {});
  }, [savedItemIds, outfit.id]);

  if (outfit.items.length === 0) return null;

  return (
    <div style={{ background: "var(--page-bg)", marginTop: 8 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "0.5px solid var(--page-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontFamily: "var(--font-editorial)", fontSize: 18, fontWeight: 500, color: "var(--page-text-primary)", letterSpacing: "-0.02em", margin: "0 0 3px" }}>
            The Breakdown
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--page-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            {outfit.items.length} {outfit.items.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {outfit.isPerfectBreakdown && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,215,0,0.1)", border: "0.5px solid rgba(255,215,0,0.3)", borderRadius: 999, padding: "4px 10px" }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d={STAR_PATH} fill="#FFD700" stroke="#FFD700" strokeWidth="0.5" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, color: "rgba(255,215,0,0.9)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Perfect
              </span>
            </div>
          )}
          <ShareBreakdownButton outfit={outfit} />
        </div>
      </div>

      {/* Total fit value bar */}
      {fitValue > 0 && (
        <div style={{ padding: "12px 16px", background: "var(--page-surface)", borderBottom: "0.5px solid var(--page-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--page-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
            Total fit value
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 400, color: "var(--page-text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            {formatFitValue(fitValue)}
          </p>
        </div>
      )}

      {/* Item cards */}
      <div>
        {outfit.items.map((item, i) => (
          <BreakdownItemCard
            key={item.id}
            item={item}
            outfitId={outfit.id}
            isSaved={savedItemIds.has(item.id)}
            saveCount={itemSaveCounts[item.id] ?? 0}
            isAuthenticated={isAuthenticated}
            currentUserId={currentUserId}
            onSave={() => handleSaveItem(item.id)}
            isLast={i === outfit.items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
