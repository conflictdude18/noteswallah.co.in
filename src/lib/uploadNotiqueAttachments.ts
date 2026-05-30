import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/firebase/firebase";

export type NotiqueAttachment = {
  type: "image" | "pdf";
  name: string;
  url: string;
  path: string;
  size: number;
};

export async function uploadNotiqueAttachments(
  files: File[],
  userId: string,
  chatId: string
): Promise<NotiqueAttachment[]> {
  const uploaded: NotiqueAttachment[] = [];

  for (const file of files) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) continue;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `notiqueChats/${userId}/${chatId}/${crypto.randomUUID()}-${safeName}`;

    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);

    const url = await getDownloadURL(fileRef);

    uploaded.push({
      type: isImage ? "image" : "pdf",
      name: file.name,
      url,
      path,
      size: file.size,
    });
  }

  return uploaded;
}