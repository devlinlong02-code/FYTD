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
import PieceEditorModal, { type Piece } from "./PieceEditorModal";

export type { Piece };

const QUICK_CATEGORIES = [
  { label: "Top" },
  { label: "Bottom" },
  { label: "Shoes" },
  { label: "Outerwear" },
  { label: "Accessory" },
  { label: "Other" },
];

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
      style={style}
      className="flex items-center gap-2 bg-neutral-50 rounded-xl px-3 py-3"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-neutral-300 hover:text-neutral-500 touch-none shrink-0"
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
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
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
              className="text-neutral-400"
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
        <p className="text-sm font-semibold text-neutral-900 leading-tight truncate">
          {piece.name}
        </p>
        <p className="text-xs text-neutral-400 truncate">
          {[piece.brand, piece.category, piece.price ? `$${piece.price}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {piece.note && (
          <p className="text-[10px] italic text-neutral-300 truncate">{piece.note}</p>
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
          className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(piece.id)}
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
  );
}

interface Props {
  pieces: Piece[];
  onChange: (pieces: Piece[]) => void;
  outfitImageUrl?: string;
}

export default function FitBreakdownBuilder({ pieces, onChange, outfitImageUrl }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null);
  const [defaultCategory, setDefaultCategory] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

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

  const handleAdd = (piece: Piece) => {
    onChange([...pieces, piece]);
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

  return (
    <>
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-bold text-neutral-900">Fit Breakdown</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Add the pieces so people can shop the fit. Keep it simple — links are optional.
          </p>
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
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {label}
            </button>
          ))}
        </div>

        {/* Added pieces — drag to reorder */}
        {pieces.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl px-4 py-8 text-center border-2 border-dashed border-neutral-150">
            <p className="text-sm text-neutral-400 font-medium">No pieces added yet</p>
            <p className="text-xs text-neutral-300 mt-1">
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
        onEdit={handleEdit}
        onUpdateHotspot={handleUpdateHotspot}
        initial={editingPiece}
        defaultCategory={defaultCategory}
        pieces={pieces}
        outfitImageUrl={outfitImageUrl}
      />
    </>
  );
}
