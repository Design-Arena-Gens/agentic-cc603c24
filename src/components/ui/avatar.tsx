"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  src?: string | null;
  className?: string;
}

export function Avatar({ initials, src, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        referrerPolicy="no-referrer"
        className={cn("h-8 w-8 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700",
        className
      )}
    >
      {initials}
    </div>
  );
}
