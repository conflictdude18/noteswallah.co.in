import type { User } from "firebase/auth";

export async function getNotiqueAccess(user: User | null) {
  if (!user) {
    return {
      allowed: false,
      status: "signed-out",
      message: "Please sign in to use Notique AI.",
    };
  }

  return {
    allowed: true,
    status: "free",
    message: "Notique AI is free for everyone.",
  };
}