"use client";

import { useEffect, useState } from "react";

type UserAvatarProps = {
  name?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm rounded-xl",
  md: "h-14 w-14 text-xl rounded-2xl",
  lg: "h-24 w-24 text-4xl rounded-3xl",
  xl: "h-32 w-32 text-5xl rounded-3xl",
};

export default function UserAvatar({
  name = "User",
  src = "",
  size = "md",
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const cleanSrc =
    typeof src === "string" && src.trim().length > 0 ? src.trim() : "";

  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-red-600 font-black text-white ${sizeClasses[size]}`}
    >
      {cleanSrc && !failed ? (
        <img
          src={cleanSrc}
          alt={`${name} profile picture`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}