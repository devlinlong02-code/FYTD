"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PieceEditorModal, { type Piece, type ModalStep } from "./PieceEditorModal";

export type { Piece };

const QUICK_CATEGORIES = [
  { label: "Top" },
  { label: "Bottom" },
  { label: "Shoes" },
  { label: "Outerwear" },
  { label: "Accessory" },
  { label: "Other" },
];

// ─── Sortable piece row (classic layout) ─────────────────────────────────────

interface SortablePieceRowProps {
  piece: Piece;
  onEdit: (piece: Piece) => void;
  onRemove: (id: string) => void;
}

function SortablePieceRow({ piece, onEdit, onRemove }: SortablePieceRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: piece.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: "var(--page-surface)" }}
      className="flex items-center gap-2 rounded-xl px-3 py-3"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
        style={{ color: "var(--page-text-muted)" }}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3.5" cy="3" r="1.2" />
          <circle cx="8.5" cy="3" r="1.2" />
          <circle cx="3.5" cy="6" r="1.2" />
          <circle cx="8.5" cy="6" r="1.2" />
          <circle cx="3.5" cy="9" r="1.2" />
          <circle cx="8.5" cy="9" r="1.2" />
        </svg>
      </button>

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--page-border)" }}>
        {piece.imageUrl ? (
          <Image
            src={piece.imageUrl}
            alt={piece.name}
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              style={{ color: "var(--page-text-muted)" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--page-text-primary)" }}>
          {piece.name}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--page-text-muted)" }}>
          {[piece.brand, piece.category, piece.price ? `$${piece.price}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {piece.note && (
          <p className="text-[10px] italic truncate" style={{ color: "var(--page-text-muted)" }}>{piece.note}</p>
        )}
        {piece.shopLink && (
          <span className="text-[10px] font-medium text-emerald-600">Shop link added</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(piece)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: "var(--page-surface)", border: "0.5px solid var(--page-border)", color: "var(--page-text-secondary)" }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(piece.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-red-500 transition-colors"
          style={{ background: "var(--page-surface)", border: "0.5px solid var(--page-border)", color: "var(--page-text-muted)" }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  pieces: Piece[];
  onChange: (pieces: Piece[]) => void;
  outfitImageUrl?: string;
  photoFirst?: boolean;
  onScanFullOutfit?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FitBreakdownBuilder({ pieces, onChange, outfitImageUrl, photoFirst, onScanFullOutfit }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);
  const [defaultCategory, setDefaultCategory] = useState("");
  const [modalInitialStep, setModalInitialStep] = useState<ModalStep>("entry");
  const [pendingTapHotspot, setPendingTapHotspot] = useState<{ x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const openAdd = (category: string) => {
    setEditingPiece(null);
    setDefaultCategory(category);
    setModalInitialStep("entry");
    setModalOpen(true);
  };

  const openEdit = (piece: Piece) => {
    setEditingPiece(piece);
    setDefaultCategory(piece.category);
    setModalInitialStep("entry");
    setModalOpen(true);
  };

  const openManual = () => {
    setEditingPiece(null);
    setDefaultCategory("");
    setModalInitialStep("manual");
    setModalOpen(true);
  };

  const openLinkInput = () => {
    setEditingPiece(null);
    setDefaultCategory("");
    setModalInitialStep("link_input");
    setModalOpen(true);
  };

  const openOutfitScan = () => {
    if (onScanFullOutfit) {
      onScanFullOutfit();
      return;
    }
    setEditingPiece(null);
    setDefaultCategory("");
    setModalInitialStep("outfit_camera");
    setModalOpen(true);
  };

  const handlePhotoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100 * 10) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100 * 10) / 10;
    setPendingTapHotspot({ x, y });
    setEditingPiece(null);
    setDefaultCategory("");
    setModalInitialStep("manual");
    setModalOpen(true);
  };

  const handleAdd = (piece: Piece) => {
    if (pendingTapHotspot) {
      onChange([...pieces, { ...piece, hotspotX: pendingTapHotspot.x, hotspotY: pendingTapHotspot.y }]);
      setPendingTapHotspot(null);
    } else {
      onChange([...pieces, piece]);
    }
  };

  const handleAddMany = (newPieces: Piece[]) => {
    onChange([...pieces, ...newPieces]);
  };

  const handleEdit = (piece: Piece) => {
    onChange(pieces.map((p) => (p.id === piece.id ? piece : p)));
    setModalOpen(false);
    setEditingPiece(null);
  };

  const handleUpdateHotspot = (pieceId: string, x: number, y: number) => {
    onChange(pieces.map((p) => (p.id === pieceId ? { ...p, hotspotX: x, hotspotY: y } : p)));
  };

  const handleRemove = (id: string) => {
    onChange(pieces.filter((p) => p.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pieces.findIndex((p) => p.id === active.id);
      const newIndex = pieces.findIndex((p) => p.id === over.id);
      onChange(arrayMove(pieces, oldIndex, newIndex));
    }
  };

  // ─── Photo-first layout ───────────────────────────────────────────────────

  if (photoFirst) {
    const hotspottedPieces = pieces.filter((p) => p.hotspotX != null && p.hotspotY != null);

    return (
      <>
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-bold" style={{ color: "var(--page-text-primary)" }}>Fit Breakdown</h2>
          </div>

          {/* 1. Outfit photo — tappable to tag a piece */}
          <div
            onClick={handlePhotoTap}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3/4",
              borderRadius: 16,
              overflow: "hidden",
              background: "var(--page-surface)",
              cursor: "crosshair",
              border: "0.5px solid var(--page-border)",
            }}
          >
            {outfitImageUrl && (
              <Image src={outfitImageUrl} alt="" fill className="object-cover" sizes="448px" />
            )}

            {/* Hotspot dots */}
            {hotspottedPieces.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${p.hotspotX}%`,
                  top: `${p.hotspotY}%`,
                  transform: "translate(-50%,-50%)",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.75)",
                    border: "2px solid white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "white",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}
                >
                  {pieces.indexOf(p) + 1}
                </div>
              </div>
            ))}

            {/* Empty-state overlay */}
            {pieces.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: outfitImageUrl ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.08)",
                }}
              >
                <p style={{ color: outfitImageUrl ? "white" : "var(--page-text-muted)", fontSize: 13, fontWeight: 500, textAlign: "center", padding: "0 24px" }}>
                  {outfitImageUrl ? "Tap the photo to tag a piece" : "Upload a photo first"}
                </p>
              </div>
            )}

            {/* Tap-to-tag hint when pieces exist */}
            {pieces.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  background: "rgba(0,0,0,0.55)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.85)",
                  pointerEvents: "none",
                }}
              >
                Tap to tag
              </div>
            )}
          </div>

          {/* 2. Hero scan button */}
          <button
            type="button"
            onClick={openOutfitScan}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "14px 16px",
              borderRadius: 14,
              background: "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span style={{ textAlign: "left" }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>Scan the whole fit</span>
              <span style={{ display: "block", fontSize: 11, opacity: 0.75 }}>AI finds every piece in one shot</span>
            </span>
          </button>

          {/* 3. Piece chips */}
          {pieces.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
                marginTop: 12,
                paddingBottom: 4,
                scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
              }}
            >
              {pieces.map((piece, i) => (
                <div
                  key={piece.id}
                  onClick={() => openEdit(piece)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--page-surface)",
                    border: "0.5px solid var(--page-border)",
                    borderRadius: 999,
                    padding: "6px 10px 6px 8px",
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--btn-primary-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--btn-primary-text)",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--page-text-primary)",
                      maxWidth: 90,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {piece.name || piece.category}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(piece.id); }}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      padding: 0,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ color: "var(--page-text-muted)" }}>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 4. Secondary action row */}
          <div style={{ display: "flex", gap: 20, marginTop: pieces.length > 0 ? 12 : 10, paddingLeft: 2 }}>
            <button
              type="button"
              onClick={openManual}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--page-text-secondary)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              + Add manually
            </button>
            <button
              type="button"
              onClick={openLinkInput}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--page-text-secondary)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              + Paste link
            </button>
          </div>
        </div>

        <PieceEditorModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingPiece(null);
            setPendingTapHotspot(null);
          }}
          onAdd={handleAdd}
          onAddMany={handleAddMany}
          onEdit={handleEdit}
          onUpdateHotspot={handleUpdateHotspot}
          initial={editingPiece}
          defaultCategory={defaultCategory}
          pieces={pieces}
          outfitImageUrl={outfitImageUrl}
          initialStep={modalInitialStep}
        />
      </>
    );
  }

  // ─── Classic layout ───────────────────────────────────────────────────────

  return (
    <>
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-bold" style={{ color: "var(--page-text-primary)" }}>Fit Breakdown</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--page-text-muted)" }}>
            Add the pieces so people can shop the fit. Keep it simple — links are optional.
          </p>
        </div>

        {/* Quick category buttons */}
        <div className="w-full flex flex-wrap gap-2 mb-4">
          {QUICK_CATEGORIES.map(({ label }) => (
            <button
              key={label}
              type="button"
              onClick={() => openAdd(label === "Shoes" ? "Footwear" : label)}
              className="flex items-center gap-1.5 transition-colors"
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "0.5px solid var(--page-border)",
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1,
                background: "var(--page-surface)",
                color: "var(--page-text-secondary)",
              }}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {label}
            </button>
          ))}
        </div>

        {/* Added pieces — drag to reorder */}
        {pieces.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center" style={{ background: "var(--page-surface)", border: "1.5px dashed var(--page-border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--page-text-muted)" }}>No pieces added yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--page-text-muted)", opacity: 0.6 }}>
              Start with the basics: top, bottoms, shoes.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pieces.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {pieces.map((piece) => (
                  <SortablePieceRow
                    key={piece.id}
                    piece={piece}
                    onEdit={openEdit}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <PieceEditorModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPiece(null);
        }}
        onAdd={handleAdd}
        onAddMany={handleAddMany}
        onEdit={handleEdit}
        onUpdateHotspot={handleUpdateHotspot}
        initial={editingPiece}
        defaultCategory={defaultCategory}
        pieces={pieces}
        outfitImageUrl={outfitImageUrl}
        initialStep={modalInitialStep}
      />
    </>
  );
}
