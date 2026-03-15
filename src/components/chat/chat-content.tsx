"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { demoMachines } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { sendRagMessage, type ChatMessage } from "@/lib/ai/rag";
import { isGeminiConfigured } from "@/lib/ai/gemini";

export function ChatContent() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState<string>(
    searchParams.get("machine") || "all"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedMachine = demoMachines.find((m) => m.id === context);
  const geminiReady = isGeminiConfigured();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await sendRagMessage(
        userMessage.content,
        context === "all" ? null : context,
        messages,
        locale
      );

      const response: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: responseText,
      };
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (message === "GEMINI_NOT_CONFIGURED") {
        setError(t("notConfigured"));
      } else {
        setError(t("errorOccurred"));
        console.error("Chat error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 py-4">
      {/* Context Selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge
          variant={context === "all" ? "default" : "outline"}
          className="cursor-pointer rounded-lg px-3 py-1"
          onClick={() => setContext("all")}
        >
          {t("contextAll")}
        </Badge>
        {demoMachines.map((m) => (
          <Badge
            key={m.id}
            variant={context === m.id ? "default" : "outline"}
            className="cursor-pointer rounded-lg px-3 py-1"
            onClick={() => setContext(m.id)}
          >
            {m.name}
          </Badge>
        ))}
      </div>

      {/* API Status Warning */}
      {!geminiReady && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {t("notConfigured")}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 rounded-2xl border bg-card p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[40vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">{t("title")}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("welcome")}
            </p>
            {selectedMachine && (
              <p className="mt-2 max-w-sm text-xs text-primary">
                {t("contextMachine")}: {selectedMachine.name}
              </p>
            )}
            <p className="mt-2 max-w-sm text-xs text-muted-foreground">
              {t("noDocumentsHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          className="min-h-[44px] max-h-32 resize-none rounded-xl"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
