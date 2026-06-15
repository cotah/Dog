import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SESSION_KEY = "taloa_ai_session_id";

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}
export type ChatContext = "emergency" | "lost_pet" | "general";

// session_id persistente por dispositivo (usado para o limite de 20/sessao).
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export interface StreamChatParams {
  messages: ChatMessage[];
  context: ChatContext;
  petContext?: Record<string, unknown> | null;
  tagCode?: string | null;
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

// Faz POST no /v1/ai/chat e consome o stream SSE. Anexa o JWT se houver sessao.
export async function streamChat(
  params: StreamChatParams,
  handlers: StreamHandlers,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        session_id: getSessionId(),
        messages: params.messages,
        context: params.context,
        pet_context: params.petContext ?? null,
        tag_code: params.tagCode ?? null,
      }),
    });
  } catch {
    handlers.onError("Couldn't reach TALOA AI. Check your connection.");
    return;
  }

  if (!res.ok || !res.body) {
    let detail = "TALOA AI is unavailable right now.";
    if (res.status === 429) detail = "You've reached the limit of this chat session.";
    else {
      try {
        detail = (await res.json()).detail ?? detail;
      } catch {
        /* sem corpo */
      }
    }
    handlers.onError(detail);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE: eventos separados por linha em branco
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const line = evt.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const data = line.slice(6);
      if (data === "[DONE]") {
        handlers.onDone();
        return;
      }
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          handlers.onError(parsed.error);
          return;
        }
        if (parsed.text) handlers.onDelta(parsed.text);
      } catch {
        /* ignora chunk malformado */
      }
    }
  }
  handlers.onDone();
}
