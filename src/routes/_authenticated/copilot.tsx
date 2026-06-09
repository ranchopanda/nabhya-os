import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Trash2, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppShell, PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getCopilotHistory, clearCopilotHistory } from "@/lib/copilot.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/copilot")({
  component: CopilotPage,
});

const SUGGESTIONS = [
  "Give me a snapshot of our pipeline right now",
  "Which warm leads need follow-up this week?",
  "Summarize what we shipped in the last 14 days",
  "Draft an investor update from this month's milestones",
  "Which pilots are running and how is each progressing?",
];

function CopilotPage() {
  const fetchHistory = useServerFn(getCopilotHistory);
  const clearHistory = useServerFn(clearCopilotHistory);
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["copilot_history"],
    queryFn: () => fetchHistory(),
    staleTime: 60_000,
  });

  if (historyQuery.isLoading) {
    return (
      <AppShell>
        <div className="px-6 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-6 py-8 max-w-4xl mx-auto w-full">
        <ChatInner
          initialMessages={(historyQuery.data?.messages ?? []) as UIMessage[]}
          onClear={async () => {
            await clearHistory();
            await queryClient.invalidateQueries({ queryKey: ["copilot_history"] });
          }}
        />
      </div>
    </AppShell>
  );
}

function ChatInner({
  initialMessages,
  onClear,
}: {
  initialMessages: UIMessage[];
  onClear: () => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          headers.set("Content-Type", "application/json");
          return fetch(input, { ...init, headers });
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: "copilot",
    messages: initialMessages,
    transport,
    onError: (err) => {
      console.error("Copilot error", err);
      toast.error("Copilot ran into an error. Try again in a moment.");
    },
  });

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const busy = status === "submitted" || status === "streaming";

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    await sendMessage({ text: trimmed });
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  return (
    <>
      <PageHeader
        eyebrow="AI Assistant"
        title="Nabhya Copilot"
        description="Ask anything about your leads, pilots, tasks, applications and milestones. Powered by Lovable AI."
        action={
          messages.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!confirm("Clear this conversation?")) return;
                await onClear();
                window.location.reload();
              }}
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          ) : null
        }
      />

      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] overflow-hidden">
        <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="font-display text-lg font-semibold">How can I help?</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                I can read your CRM, pilots, tasks, applications, milestones and proof vault. Ask me anything.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-6 w-full max-w-2xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-left text-sm px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive px-2">
              {String(error.message ?? error)}
            </div>
          )}
        </div>

        <form
          className="border-t p-3 flex items-end gap-2 bg-card"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot anything about Nabhya…"
            className="min-h-[44px] max-h-40 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            disabled={busy}
          />
          {busy ? (
            <Button type="button" variant="outline" onClick={() => stop()}>
              Stop
            </Button>
          ) : (
            <Button type="submit" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </Card>
    </>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  const textContent = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");

  const toolParts = message.parts.filter((p) => p.type.startsWith("tool-"));

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] ${isUser ? "" : "w-full"}`}>
        {isUser ? (
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 text-sm">
            {textContent}
          </div>
        ) : (
          <div className="space-y-2">
            {toolParts.map((part, i) => (
              <ToolCallView key={i} part={part as Record<string, unknown> & { type: string }} />
            ))}
            {textContent && (
              <div className="prose prose-sm dark:prose-invert max-w-none px-1 text-foreground">
                <ReactMarkdown>{textContent}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallView({ part }: { part: Record<string, unknown> & { type: string } }) {
  const toolName = part.type.replace(/^tool-/, "");
  const state = (part.state as string) ?? "input-streaming";
  const running = state === "input-streaming" || state === "input-available";

  return (
    <details className="group rounded-md border border-border bg-muted/30 text-xs">
      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none">
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="font-medium">{toolName}</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {running ? "running" : "done"}
        </Badge>
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-2">
        {part.input !== undefined && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Input</div>
            <pre className="text-[11px] bg-background rounded p-2 overflow-x-auto">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
        )}
        {part.output !== undefined && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Output</div>
            <pre className="text-[11px] bg-background rounded p-2 overflow-x-auto max-h-60">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}
