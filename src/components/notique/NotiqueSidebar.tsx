"use client";

import Image from "next/image";
import {
  MessageSquarePlus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type NotiqueChat = {
  id: string;
  title: string;
  lastMessage?: string;
};

type NotiqueSidebarProps = {
  chats: NotiqueChat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  open?: boolean;
  onClose?: () => void;
};

function getTwoWordTitle(title?: string) {
  if (!title) return "New Chat";

  const words = title
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return words.join(" ") || "New Chat";
}

export default function NotiqueSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  open,
  onClose,
}: NotiqueSidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[10001] flex h-[100dvh] w-[280px] shrink-0 flex-col border-r border-white/10 bg-[#07090d] px-4 py-4 text-white transition-transform duration-300 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-end lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <Image
              src="/notique-icon.png"
              alt="Notique AI"
              fill
              sizes="44px"
              className="object-contain p-1"
              priority
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black">Notique AI</h2>
            <p className="truncate text-xs text-white/45">
              Study assistant
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:scale-[1.01]"
        >
          <MessageSquarePlus size={18} />
          New Chat
        </button>

        <button
          type="button"
          className="mb-5 flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/55"
        >
          <Search size={17} />
          Search chats
        </button>

        <div className="mb-2 flex items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.16em] text-white/35">
          <Sparkles size={13} />
          Recent
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-28 lg:pb-2">
          {chats.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/45">
              No chats yet. Start a new conversation with Notique.
            </div>
          ) : (
            chats.map((chat) => {
              const active = chat.id === activeChatId;
              const title = getTwoWordTitle(chat.title);

              return (
                <div
                  key={chat.id}
                  className={`group flex w-full min-w-0 items-center gap-2 rounded-2xl transition ${
                    active ? "bg-white text-black" : "hover:bg-white/[0.06]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectChat(chat.id)}
                    className="min-w-0 flex-1 px-3 py-3 text-left"
                  >
                    <span
                      className={`block max-w-full truncate text-sm font-bold ${
                        active ? "text-black" : "text-white"
                      }`}
                    >
                      {title}
                    </span>

                    {chat.lastMessage && (
                      <span
                        className={`mt-1 block max-w-full truncate text-xs ${
                          active ? "text-black/55" : "text-white/35"
                        }`}
                      >
                        {chat.lastMessage}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteChat(chat.id)}
                    className={`mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                      active
                        ? "hover:bg-black/10"
                        : "text-white/40 hover:bg-white/10 hover:text-red-400"
                    }`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-bold text-white">Free Beta</p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            Notique is free for all students during beta.
          </p>
        </div>
      </aside>
    </>
  );
}