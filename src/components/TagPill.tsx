"use client";

interface TagPillProps {
  tag: string;
  active?: boolean;
  onClick?: () => void;
}

export default function TagPill({ tag, active = false, onClick }: TagPillProps) {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-colors duration-150";
  const styles = active
    ? "bg-neutral-900 text-white"
    : onClick
    ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 cursor-pointer"
    : "bg-neutral-100 text-neutral-600";

  return (
    <span className={`${base} ${styles}`} onClick={onClick}>
      {tag}
    </span>
  );
}
