"use client";

import { useState } from "react";

type UserAvatarProps = {
  name?: string;
  src?: string;
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

  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-red-600 font-black text-white ${sizeClasses[size]}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}