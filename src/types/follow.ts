export interface Follow {
  id: string;
  followerId: string;
  followerName: string;
  followerAvatar?: string;
  followingId: string;
  followingName: string;
  createdAt: string;
}