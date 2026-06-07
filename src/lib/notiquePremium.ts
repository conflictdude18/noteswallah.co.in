import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export async function getPremiumStatus(userId: string) {
  const snap = await getDoc(doc(db, "users", userId));

  if (!snap.exists()) {
    return {
      premium: false,
      trialActive: false,
      trialEndsAt: null,
    };
  }

  const data = snap.data();

  const premium = Boolean(data.notiquePremium);

  const trialEnd = data.freeTrialEndsAt
    ? new Date(data.freeTrialEndsAt)
    : null;

  const trialActive =
    !premium &&
    trialEnd !== null &&
    trialEnd.getTime() > Date.now();

  return {
    premium,
    trialActive,
    trialEndsAt: data.freeTrialEndsAt || null,
  };
}