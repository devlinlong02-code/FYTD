"use client";

import Link from "next/link";
import TagPill from "./TagPill";
import { AestheticTag } from "@/types";

const ALL_TAGS: AestheticTag[] = [
  "streetwear",
  "clean fit",
  "old money",
  "minimal",
  "gym fit",
  "casual",
  "formal",
  "summer",
  "campus",
  "night out",
  "business casual",
];

interface FilterBarProps {
  activeTag: AestheticTag | null;
  onSelect?: (tag: AestheticTag | null) => void;
}

export default function FilterBar({ activeTag, onSelect }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {onSelect ? (
        <>
          <TagPill tag="All" active={activeTag === null} onClick={() => onSelect(null)} />
          {ALL_TAGS.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              active={activeTag === tag}
              onClick={() => onSelect(activeTag === tag ? null : tag)}
            />
          ))}
        </>
      ) : (
        <>
          <Link href="/">
            <TagPill tag="All" active={activeTag === null} onClick={() => {}} />
          </Link>
          {ALL_TAGS.map((tag) => (
            <Link key={tag} href={activeTag === tag ? "/" : `/?tag=${encodeURIComponent(tag)}`}>
              <TagPill tag={tag} active={activeTag === tag} onClick={() => {}} />
            </Link>
          ))}
        </>
      )}
    </div>
  );
}
