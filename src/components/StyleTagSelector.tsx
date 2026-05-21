"use client";

export const STYLE_TAGS = [
  "Streetwear",
  "Minimal",
  "Old Money",
  "Gym Fit",
  "Casual",
  "Campus",
  "Vintage",
  "Business Casual",
  "Night Out",
  "Neutral",
  "Designer",
  "Thrifted",
];

interface StyleTagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function StyleTagSelector({ selected, onChange }: StyleTagSelectorProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
            selected.includes(tag)
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
