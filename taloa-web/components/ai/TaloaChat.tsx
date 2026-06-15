"use client";

import { AlertTriangle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  type ChatContext,
  type ChatMessage,
  streamChat,
} from "@/lib/api/ai";

const DISCLAIMER =
  "TALOA AI is not a vet. For emergencies, call a vet immediately.";

export function TaloaChat({
  context = "general",
  petContext = null,
  tagCode = null,
}: {
  context?: ChatContext;
  petContext?: Record<string, unknown> | null;
  tagCode?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    // Adiciona um placeholder do assistant que sera preenchido pelo stream.
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    await streamChat(
      { messages: history, context, petContext, tagCode },
      {
        onDelta: (chunk) =>
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = {
                role: "assistant",
                content: last.content + chunk,
              };
            }
            return next;
          }),
        onDone: () => setStreaming(false),
        onError: (msg) => {
          setStreaming(false);
          setError(msg);
          // remove o placeholder vazio do assistant
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && last.content === "") next.pop();
            return next;
          });
        },
      },
    );
  }

  return (
    <>
      {/* Botao flutuante */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-taloa-primary px-5 font-semibold text-white shadow-lg hover:bg-taloa-secondary"
          aria-label="Ask TALOA"
        >
          <Sparkles className="h-5 w-5" />
          Ask TALOA
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:justify-end sm:p-5"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-card bg-white shadow-xl sm:h-[600px] sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-taloa-primary px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Ask TALOA</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Disclaimer fixo */}
            <div className="flex items-start gap-2 bg-taloa-warning/10 px-4 py-2 text-xs text-slate-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-taloa-warning" />
              <p>{DISCLAIMER}</p>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="mt-6 text-center text-sm text-slate-400">
                  <p>Hi! I&apos;m TALOA AI.</p>
                  <p>Ask me about pet safety, lost &amp; found, or finding a vet in Dublin.</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-taloa-primary text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {m.content ||
                      (streaming && m.role === "assistant" ? <TypingDots /> : "")}
                  </div>
                </div>
              ))}

              {error && (
                <p className="text-center text-sm text-taloa-alert">{error}</p>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={onSend}
              className="flex items-center gap-2 border-t border-slate-100 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question…"
                disabled={streaming}
                className="h-12 flex-1 rounded-input border border-slate-300 px-3 outline-none focus:border-taloa-primary disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                aria-label="Send"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input bg-taloa-primary text-white hover:bg-taloa-secondary disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
    </span>
  );
}
