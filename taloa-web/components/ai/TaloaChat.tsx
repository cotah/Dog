"use client";

import { AlertTriangle, Send, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import {
  type ChatContext,
  type ChatMessage,
  hasActiveSession,
  streamChat,
} from "@/lib/api/ai";
import { track } from "@/lib/analytics";

// Reunite: tempo ate o chat abrir sozinho (deixa o finder ver o perfil antes).
const AUTO_OPEN_DELAY_MS = 15000;

export function TaloaChat({
  context = "general",
  petContext = null,
  tagCode = null,
}: {
  context?: ChatContext;
  petContext?: Record<string, unknown> | null;
  tagCode?: string | null;
}) {
  const t = useTranslations("ai");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Reunite: dispara reunite_flow_completed uma unica vez (3a resposta do finder).
  const reuniteTrackedRef = useRef(false);
  // Auto-open: timer dos 15s e flag de "fechado manualmente" (nao reabrir sozinho).
  const autoOpenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissedRef = useRef(false);

  const isReunite = context === "reunite";
  const petName =
    typeof petContext?.name === "string" && petContext.name
      ? (petContext.name as string)
      : t("thisPet");

  // Mensagem inicial do assistente, contextualizada com o nome do pet.
  function seedGreeting() {
    setMessages((prev) =>
      prev.length === 0
        ? [{ role: "assistant", content: t("reuniteGreeting", { petName }) }]
        : prev,
    );
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming]);

  function clearAutoOpen() {
    if (autoOpenTimerRef.current) {
      clearTimeout(autoOpenTimerRef.current);
      autoOpenTimerRef.current = null;
    }
  }

  // Abertura (manual, por evento ou pelo timer): cancela o timer e semeia o reunite.
  function openChat() {
    clearAutoOpen();
    setOpen(true);
    if (isReunite) seedGreeting();
  }

  // Fechar manualmente: marca como dispensado para NAO reabrir sozinho depois.
  function closeChat() {
    dismissedRef.current = true;
    clearAutoOpen();
    setOpen(false);
  }

  // Reunite (finders deslogados): NAO abre na hora. Abre sozinho apos 15s,
  // dando tempo para verem o perfil do pet primeiro. Nao abre para o dono
  // (sessao ativa) nem se a pessoa ja tiver fechado o chat.
  useEffect(() => {
    if (!isReunite) return;
    let cancelled = false;
    hasActiveSession().then((loggedIn) => {
      if (cancelled || loggedIn || dismissedRef.current) return;
      autoOpenTimerRef.current = setTimeout(() => {
        if (dismissedRef.current) return;
        setOpen(true);
        seedGreeting();
      }, AUTO_OPEN_DELAY_MS);
    });
    return () => {
      cancelled = true;
      clearAutoOpen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReunite, petName]);

  // "I Found This Pet" (FoundReportSection) dispara este evento: abre o chat
  // imediatamente, sem esperar os 15s. Acao explicita — abre mesmo se ja fechou.
  useEffect(() => {
    if (!isReunite) return;
    function onOpenRequest() {
      openChat();
    }
    window.addEventListener("taloa:open-chat", onOpenRequest);
    return () => window.removeEventListener("taloa:open-chat", onOpenRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReunite]);

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

    // Reunite Flow: ao chegar a 3a resposta do finder consideramos as 3
    // perguntas respondidas. Dispara uma unica vez (sem PII).
    if (isReunite && !reuniteTrackedRef.current) {
      const finderAnswers = history.filter((m) => m.role === "user").length;
      if (finderAnswers >= 3) {
        reuniteTrackedRef.current = true;
        track("reunite_flow_completed", { tag_code: tagCode });
      }
    }

    await streamChat(
      {
        messages: history,
        context,
        petContext,
        tagCode,
        finderPhone: isReunite ? phone.trim() || null : null,
      },
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
          onClick={openChat}
          className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-taloa-primary px-5 font-semibold text-white shadow-lg hover:bg-taloa-secondary"
          aria-label={t("askTaloa")}
        >
          <Sparkles className="h-5 w-5" />
          {t("askTaloa")}
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:justify-end sm:p-5"
          onClick={closeChat}
        >
          <div
            className="flex h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-card bg-white shadow-xl sm:h-[600px] sm:rounded-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-taloa-primary px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">{t("askTaloa")}</span>
              </div>
              <button
                onClick={closeChat}
                aria-label={t("closeChat")}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Disclaimer fixo */}
            <div className="flex items-start gap-2 bg-taloa-warning/10 px-4 py-2 text-xs text-slate-600">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-taloa-warning" />
              <p>{t("disclaimer")}</p>
            </div>

            {/* Mensagens */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="mt-6 text-center text-sm text-slate-400">
                  <p>{t("greeting1")}</p>
                  <p>{t("greeting2")}</p>
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

            {/* Footer: telefone opcional (reunite) + input */}
            <div className="border-t border-slate-100">
              {isReunite && (
                <div className="px-3 pt-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    placeholder={t("phonePlaceholder")}
                    aria-label={t("phoneLabel")}
                    className="h-10 w-full rounded-input border border-slate-200 px-3 text-sm outline-none focus:border-taloa-primary"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">{t("phoneLabel")}</p>
                </div>
              )}

              <form
                onSubmit={onSend}
                className="flex items-center gap-2 p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("inputPlaceholder")}
                  disabled={streaming}
                  className="h-12 flex-1 rounded-input border border-slate-300 px-3 outline-none focus:border-taloa-primary disabled:bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  aria-label={t("send")}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input bg-taloa-primary text-white hover:bg-taloa-secondary disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
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
