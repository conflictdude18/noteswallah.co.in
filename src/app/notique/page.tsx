"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as pdfjsLib from "pdfjs-dist";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { Home, Image as ImageIcon, Menu, Send, Upload } from "lucide-react";

import NotiqueSidebar from "@/components/notique/NotiqueSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import {
  uploadNotiqueAttachments,
  type NotiqueAttachment,
} from "@/lib/uploadNotiqueAttachments";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: NotiqueAttachment[];
  imagePreview?: string;
};

type NotiqueChat = {
  id: string;
  title: string;
  lastMessage?: string;
};

type PdfTextItem = {
  str: string;
};

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "👋 Hi! I’m **Notique AI**. Upload notes, PDFs, or images and I’ll help you study smarter.",
};

export default function NotiquePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [chats, setChats] = useState<NotiqueChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFreshChat, setIsFreshChat] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/signin");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, "notiqueChats", user.uid, "chats");
    const q = query(chatsRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedChats = snapshot.docs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          title: data.title || "New Chat",
          lastMessage: data.lastMessage || "",
        };
      }) as NotiqueChat[];

      setChats(loadedChats);

      if (!activeChatId && !isFreshChat && loadedChats.length > 0) {
        setActiveChatId(loadedChats[0].id);
      }
    });

    return () => unsubscribe();
  }, [user, activeChatId, isFreshChat]);

  useEffect(() => {
    if (!user || !activeChatId) {
      setMessages([welcomeMessage]);
      return;
    }

    const messagesRef = collection(
      db,
      "notiqueChats",
      user.uid,
      "chats",
      activeChatId,
      "messages"
    );

    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map((item) => {
        const data = item.data();

        return {
          role: data.role,
          content: data.content,
          attachments: data.attachments || [],
        };
      }) as ChatMessage[];

      setMessages(loadedMessages.length > 0 ? loadedMessages : [welcomeMessage]);
    });

    return () => unsubscribe();
  }, [user, activeChatId]);

  async function createChat(title = "New Chat") {
    if (!user) return null;

    const chatRef = await addDoc(
      collection(db, "notiqueChats", user.uid, "chats"),
      {
        title,
        lastMessage: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    setActiveChatId(chatRef.id);
    return chatRef.id;
  }

  async function saveMessage(
    chatId: string,
    role: "user" | "assistant",
    content: string,
    attachments: NotiqueAttachment[] = []
  ) {
    if (!user) return;

    await addDoc(
      collection(db, "notiqueChats", user.uid, "chats", chatId, "messages"),
      {
        role,
        content,
        attachments,
        createdAt: serverTimestamp(),
      }
    );

    const chatUpdate =
      role === "user"
        ? {
            title:
              content
                .replace(/[^\w\s]/g, "")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .join(" ") || "New Chat",
            lastMessage: content.slice(0, 90),
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          }
        : {
            lastMessage: content.slice(0, 90),
            updatedAt: serverTimestamp(),
          };

    await setDoc(doc(db, "notiqueChats", user.uid, "chats", chatId), chatUpdate, {
      merge: true,
    });
  }

  async function handleNewChat() {
    setIsFreshChat(true);
    setActiveChatId(null);
    setMessages([welcomeMessage]);
    setMessage("");
    setSelectedPDF(null);
    setPdfText("");
    clearSelectedImage();
    setSending(false);
    setSidebarOpen(false);
  }

  async function handleDeleteChat(chatId: string) {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "notiqueChats", user.uid, "chats", chatId));

      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([welcomeMessage]);
        setIsFreshChat(true);
      }
    } catch (error) {
      console.error("DELETE CHAT ERROR:", error);
    }
  }

  function handleSelectChat(chatId: string) {
    setIsFreshChat(false);
    setActiveChatId(chatId);
    setSidebarOpen(false);
  }

  async function handlePDFUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSelectedPDF(file);
      setPdfText("");

      const arrayBuffer = await file.arrayBuffer();

      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let extractedText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        extractedText +=
          content.items.map((item) => (item as PdfTextItem).str).join(" ") +
          "\n";
      }

      setPdfText(extractedText);
    } catch (error) {
      console.error(error);
      setSelectedPDF(null);
      setPdfText("");
    } finally {
      e.target.value = "";
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function clearSelectedImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview("");
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSend() {
    if ((!message.trim() && !selectedPDF && !selectedImage) || sending || !user) {
      return;
    }

    const userMessage = message.trim();

    const userContent = selectedPDF
      ? `📄 ${selectedPDF.name}${
          userMessage ? `\n\n${userMessage}` : "\n\nSummarise this PDF."
        }`
      : selectedImage
        ? userMessage || "Describe this image."
        : userMessage;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userContent,
        imagePreview: selectedImage ? imagePreview : undefined,
        attachments: selectedPDF
          ? [
              {
                type: "pdf",
                name: selectedPDF.name,
                url: "",
                path: "",
                size: selectedPDF.size,
              },
            ]
          : [],
      },
    ]);

    setMessage("");
    setSending(true);

    try {
      const chatId =
        activeChatId ||
        (await createChat(
          userContent.replace(/📄|🖼️/g, "").trim().slice(0, 40) || "New Chat"
        ));

      if (!chatId) return;

      setIsFreshChat(false);

      const filesToUpload = [
        ...(selectedPDF ? [selectedPDF] : []),
        ...(selectedImage ? [selectedImage] : []),
      ];

      const uploadedAttachments = await uploadNotiqueAttachments(
        filesToUpload,
        user.uid,
        chatId
      );

      await saveMessage(chatId, "user", userContent, uploadedAttachments);

      const finalPrompt = selectedPDF
        ? `
User instruction:
${userMessage || "Summarise this PDF in simple student-friendly points."}

PDF content:
${pdfText.slice(0, 12000)}
`
        : userMessage || "Explain this image clearly.";

      const response = await fetch("/api/notique", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: finalPrompt,
          image: selectedImage
            ? {
                base64: await fileToBase64(selectedImage),
                mimeType: selectedImage.type,
              }
            : null,
        }),
      });

      const data = await response.json();

      const assistantReply =
        data.reply || data.error || "Sorry, I could not generate a reply.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantReply,
        },
      ]);

      await saveMessage(chatId, "assistant", assistantReply);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong while contacting Notique AI.",
        },
      ]);
    } finally {
      setSelectedPDF(null);
      setPdfText("");
      clearSelectedImage();
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading Notique...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      <NotiqueSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex min-h-screen flex-1 flex-col">
        <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="flex w-full items-center justify-between gap-3 px-4 py-4 lg:px-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 lg:hidden"
                aria-label="Open chat sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Home size={16} />
                Home
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                New Chat
              </button>

              <div className="hidden rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-300 sm:block">
                Free Access
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-73px)] flex-1 flex-col px-3 py-3 lg:px-8 lg:py-6">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-3 pr-1 lg:space-y-6 lg:py-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-lg md:max-w-[75%] md:px-5 md:py-4 ${
                    msg.role === "user"
                      ? "bg-cyan-500 text-black"
                      : "border border-white/10 bg-white/5 text-zinc-200"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="space-y-3">
                      {msg.imagePreview && (
                        <img
                          src={msg.imagePreview}
                          alt="Uploaded"
                          className="max-h-64 w-full rounded-2xl object-cover"
                        />
                      )}

                      {msg.attachments?.map((file, fileIndex) =>
                        file.type === "image" && file.url ? (
                          <img
                            key={fileIndex}
                            src={file.url}
                            alt={file.name}
                            className="max-h-64 w-full rounded-2xl object-cover"
                          />
                        ) : file.type === "pdf" ? (
                          <a
                            key={fileIndex}
                            href={file.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-2xl border border-black/10 bg-black/10 px-4 py-3 text-sm"
                          >
                            📄 {file.name}
                          </a>
                        ) : null
                      )}

                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-zinc-400">
                  <span>Notique is thinking</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 pb-3 pt-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl lg:rounded-[2rem]">
              {selectedPDF && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  <span className="truncate">📄 {selectedPDF.name}</span>
                  <button
                    onClick={() => {
                      setSelectedPDF(null);
                      setPdfText("");
                    }}
                    className="shrink-0 text-zinc-400 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              )}

              {selectedImage && (
                <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-14 w-14 rounded-xl object-cover"
                      />

                      <div>
                        <p className="max-w-[170px] truncate text-sm text-white">
                          {selectedImage.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Image ready to send
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={clearSelectedImage}
                      className="text-sm text-zinc-400 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-2">
                <label className="shrink-0 cursor-pointer rounded-2xl p-3 text-zinc-400 transition hover:bg-white/10 hover:text-white">
                  <Upload className="h-5 w-5" />
                  <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={handlePDFUpload}
                  />
                </label>

                <label className="shrink-0 cursor-pointer rounded-2xl p-3 text-zinc-400 transition hover:bg-white/10 hover:text-white">
                  <ImageIcon className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                </label>

                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    selectedPDF
                      ? "Ask about this PDF..."
                      : selectedImage
                        ? "Ask about this image..."
                        : "Ask Notique anything..."
                  }
                  rows={1}
                  className="max-h-32 min-h-[44px] flex-1 resize-none overflow-y-auto rounded-2xl bg-transparent px-3 py-3 text-sm outline-none placeholder:text-zinc-500"
                />

                <button
                  onClick={handleSend}
                  disabled={
                    sending || (!message.trim() && !selectedPDF && !selectedImage)
                  }
                  className="shrink-0 rounded-2xl bg-cyan-500 p-3 text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] leading-snug text-zinc-500">
                Notique can make mistakes. Always verify important answers with
                your textbook or teacher.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}