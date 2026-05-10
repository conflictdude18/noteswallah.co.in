export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "like" | "comment" | "bookmark" | "system";
  read: boolean;
  createdAt: string;
  noteId?: string | null;
}