export type CreatorBadgeId =
  | "first_upload"
  | "rising_creator"
  | "top_contributor"
  | "streak_master"
  | "community_favorite"
  | "verified_creator"
  | "profile_complete";

export type CreatorBadge = {
  id: CreatorBadgeId;
  title: string;
  description: string;
  unlocked: boolean;
};

export type CreatorStats = {
  userId: string;
  displayName: string;
  photoURL?: string;
  uploads: number;
  approvedUploads: number;
  totalDownloads: number;
  totalLikes: number;
  totalViews: number;
  uploadStreak: number;
  bestUploadStreak: number;
  profileCompletion: number;
  badges: CreatorBadge[];
  updatedAt?: unknown;
  creatorLevel?: CreatorLevel;
};

export type CreatorLevel = {
  level: number;
  title: string;
  minApprovedUploads: number;
};