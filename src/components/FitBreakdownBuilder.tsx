"use client";

import { useState } from "react";
import Image from "next/image";
import PieceEditorModal, { type Piece } from "./PieceEditorModal";

export type { Piece };

const QUICK_CATEGORIES = [
  { label: "Top", icon: "👕" },
  { label: "Bottom", icon: "👖" },
  { label: "Shoes", icon: "👟" },
  { label: "Outerwear", icon: "🧥" },
  { label: "Accessory", icon: "🕶️" },
  { label: "Other", icon: "+" },
];

interface Props {
  pieces: Piece[];
  onChange: (pieces: Piece[]) => void;
}

export default function FitBreakdownBuilder({ pieces, onChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);
  const [defaultCategory, setDefaultCategory] = useState("");

  const openAdd = (category: string) => {
    setEditingPiece(null);
    setDefaultCategory(category);
    setModalOpen(true);
  };

  const openEdit = (piece: Piece) => {
    setEditingPiece(piece);
    setDefaultCategory(piece.category);
    setModalOpen(true);
  };

  const handleSave = (piece: Piece) => {
    if (editingPiece) {
      onChange(pieces.map((p) => (p.id === piece.id ? piece : p)));
    } else {
      onChange([...pieces, piece]);
    }
    setModalOpen(false);
    setEditingPiece(null);
  };

  const handleRemove = (id: string) => {
    onChange(pieces.filter((p) => p.id !== id));
  };

  return (
    <>
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-neutral-900">Fit Breakdown</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Add the pieces so people can shop the fit. Keep it simple — links are optional.</p>
        </div>

        {/* Quick category buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_CATEGORIES.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => openAdd(label === "Shoes" ? "Footwear" : label)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {label}
            </button>
          ))}
        </div>

        {/* Added pieces */}
        {pieces.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl px-4 py-8 text-center border-2 border-dashed border-neutral-150">
            <p className="text-sm text-neutral-400 font-medium">No pieces added yet</p>
            <p className="text-xs text-neutral-300 mt-1">Start with the basics: top, bottoms, shoes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pieces.map((piece) => (
              <div key={piece.id} className="flex items-center gap-3 bg-neutral-50 rounded-xl px-3 py-3">
                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                  {piece.imageUrl ? (
                    <Image src={piece.imageUrl} alt={piece.name} width={44} height={44} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-neutral-400">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 leading-tight truncate">{piece.name}</p>
                  <p className="text-xs text-neutral-400 truncate">
                    {[piece.brand, piece.category, piece.price ? `$${piece.price}` : ""].filter(Boolean).join(" · ")}
                  </p>
                  {piece.shopLink && (
                    <span className="text-[10px] font-medium text-emerald-600">Shop link added</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(piece)}
                    className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(piece.id)}
                    className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PieceEditorModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPiece(null); }}
        onSave={handleSave}
        initial={editingPiece}
        defaultCategory={defaultCategory}
      />
    </>
  );
}
