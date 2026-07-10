import Image from "next/image";

interface CreatorBadgeProps {
  name: string;
  handle: string;
  avatar?: string | null;
  size?: "sm" | "md";
  colorScheme?: "dark" | "light";
  href?: string;
}

export default function CreatorBadge({
  name,
  handle,
  avatar,
  size = "md",
  colorScheme = "dark",
  href,
}: CreatorBadgeProps) {
  const imgSize = size === "sm" ? 28 : 36;
  const isLight = colorScheme === "light";

  const initials =
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const inner = (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full overflow-hidden shrink-0 bg-neutral-200 flex items-center justify-center"
        style={{ width: imgSize, height: imgSize }}
      >
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={imgSize}
            height={imgSize}
            className="object-cover w-full h-full"
          />
        ) : (
          <span
            className="font-semibold text-neutral-600 select-none"
            style={{ fontSize: imgSize * 0.38 }}
          >
            {initials}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p
          className={`font-semibold truncate leading-tight ${size === "sm" ? "text-xs" : "text-sm"} ${
            isLight
              ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              : "text-neutral-900"
          }`}
        >
          {name}
        </p>
        <p
          className={`truncate ${size === "sm" ? "text-[10px]" : "text-xs"} ${
            isLight
              ? "text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              : "text-neutral-500"
          }`}
        >
          {handle}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-flex">
        {inner}
      </a>
    );
  }

  return inner;
}
