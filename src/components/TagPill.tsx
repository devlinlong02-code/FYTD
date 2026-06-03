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
    ? "bg-neutral-900 text-white tracking-wide shadow-sm"
    : onClick
    ? "bg-transparent border border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 cursor-pointer transition-all duration-150"
    : "bg-transparent border border-neutral-200 text-neutral-400";

  return (
    <span className={`${base} ${styles}`} onClick={onClick}>
      {tag}
    </span>
  );
}
