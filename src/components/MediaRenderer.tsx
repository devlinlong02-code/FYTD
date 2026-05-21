import Image from "next/image";

interface MediaRendererProps {
  url: string;
  alt: string;
  mediaType?: "image" | "video" | null;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export default function MediaRenderer({
  url,
  alt,
  mediaType,
  fill = true,
  className = "object-cover",
  priority = false,
  sizes,
}: MediaRendererProps) {
  if (mediaType === "video") {
    if (fill) {
      return (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full ${className}`}
          aria-label={alt}
        />
      );
    }
    return (
      <video
        src={url}
        autoPlay
        muted
        loop
        playsInline
        className={`w-full h-full ${className}`}
        aria-label={alt}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}
