export type Note = {
  id?: string;
  title: string;
  description: string;
  class: string;
  subject: string;
  topic: string;
  tags: string[];
  pdfURL: string;
  uploaderId: string;
  uploaderName: string;
  uploaderEmail: string;
  uploadDate: unknown;
  downloadsCount: number;
  status: "pending" | "approved" | "rejected";
};