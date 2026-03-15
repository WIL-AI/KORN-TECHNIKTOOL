"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { demoMachines } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatContent() {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [context, setContext] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  const selectedMachine = demoMachines.find((m) => m.id === context);

  function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulated AI response (will be replaced with actual RAG in Step 5)
    setTimeout(() => {
      const response: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content:
          context === "all"
            ? `Basierend auf der Dokumentation aller ${demoMachines.length} Maschinen: Diese Funktion wird mit der Gemini API und RAG-Pipeline verbunden, sobald Supabase konfiguriert ist.`
            : `Für die ${selectedMachine?.name}: Diese Funktion wird mit der Gemini API und RAG-Pipeline verbunden, sobald Supabase konfiguriert ist.`,
      };
      setMessages((prev) => [...prev, response]);
      setIsLoading(false);
    }, 1500);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col px-4 py-4">
      {/* Context Selector */}
      <div className="mb-4 flex items-center gap-2">
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

      {/* Messages */}
      <ScrollArea className="flex-1 rounded-2xl border bg-card p-4">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[40vh] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">{t("title")}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("welcome")}
            </p>
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
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
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
                <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                  {t("thinking")}
                </div>
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
