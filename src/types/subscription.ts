export type Subscription = {
  userId: string;
  plan: "free" | "premium";
  status: "active" | "expired" | "cancelled";
  amount: number;
  startedAt?: string | null;
  expiresAt?: string | null;
};