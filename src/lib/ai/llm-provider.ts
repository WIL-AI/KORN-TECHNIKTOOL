/**
 * Configurable LLM provider abstraction.
 *
 * Supports: Gemini (default), OpenAI-compatible endpoints, custom server.
 * Configuration via environment variables or runtime settings.
 */

export type LLMProviderType = "gemini" | "openai" | "custom";

export interface LLMProviderConfig {
  type: LLMProviderType;
  apiKey: string;
  baseUrl?: string; // For OpenAI-compatible or custom endpoints
  model?: string; // Override default model
  embeddingModel?: string; // Override default embedding model
}

export interface ChatOptions {
  systemInstruction: string;
  history: { role: "user" | "assistant"; content: string }[];
  context: string | null;
}

export interface LLMProvider {
  chat(userMessage: string, options: ChatOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// ── Configuration ──────────────────────────────────────────

const STORAGE_KEY = "korn-llm-config";

function getDefaultConfig(): LLMProviderConfig {
  // Check env vars in priority order
  const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const customUrl = process.env.NEXT_PUBLIC_LLM_BASE_URL;

  if (customUrl) {
    return {
      type: "custom",
      apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY || "",
      baseUrl: customUrl,
      model: process.env.NEXT_PUBLIC_LLM_MODEL,
      embeddingModel: process.env.NEXT_PUBLIC_LLM_EMBEDDING_MODEL,
    };
  }
  if (openaiKey) {
    return {
      type: "openai",
      apiKey: openaiKey,
      baseUrl: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL,
    };
  }
  if (geminiKey) {
    return { type: "gemini", apiKey: geminiKey };
  }
  return { type: "gemini", apiKey: "" };
}

export function getLLMConfig(): LLMProviderConfig {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as LLMProviderConfig;
        if (parsed.apiKey) return parsed;
      }
    } catch { /* use defaults */ }
  }
  return getDefaultConfig();
}

export function setLLMConfig(config: LLMProviderConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearLLMConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isLLMConfigured(): boolean {
  const config = getLLMConfig();
  return !!config.apiKey || (config.type === "custom" && !!config.baseUrl);
}

// ── Gemini Provider ────────────────────────────────────────

async function createGeminiProvider(config: LLMProviderConfig): Promise<LLMProvider> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(config.apiKey);
  const modelName = config.model || "gemini-2.0-flash";
  const embeddingModelName = config.embeddingModel || "text-embedding-004";

  return {
    async chat(userMessage, options) {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction: options.systemInstruction,
      });
      const prompt = options.context
        ? `Kontext aus der Maschinendokumentation:\n---\n${options.context}\n---\n\nFrage: ${userMessage}`
        : userMessage;
      const history = options.history.map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      }));
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      return result.response.text();
    },
    async embed(text) {
      const model = client.getGenerativeModel({ model: embeddingModelName });
      const result = await model.embedContent(text);
      return result.embedding.values;
    },
    async embedBatch(texts) {
      const model = client.getGenerativeModel({ model: embeddingModelName });
      const results: number[][] = [];
      for (const text of texts) {
        const result = await model.embedContent(text);
        results.push(result.embedding.values);
      }
      return results;
    },
  };
}

// ── OpenAI-compatible Provider ─────────────────────────────

async function createOpenAIProvider(config: LLMProviderConfig): Promise<LLMProvider> {
  const baseUrl = config.baseUrl || "https://api.openai.com/v1";
  const modelName = config.model || "gpt-4o-mini";
  const embeddingModelName = config.embeddingModel || "text-embedding-3-small";

  async function openaiRequest(endpoint: string, body: unknown): Promise<unknown> {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  return {
    async chat(userMessage, options) {
      const messages: { role: string; content: string }[] = [
        { role: "system", content: options.systemInstruction },
      ];
      for (const m of options.history) {
        messages.push({ role: m.role, content: m.content });
      }
      const prompt = options.context
        ? `Kontext aus der Maschinendokumentation:\n---\n${options.context}\n---\n\nFrage: ${userMessage}`
        : userMessage;
      messages.push({ role: "user", content: prompt });

      const data = (await openaiRequest("/chat/completions", {
        model: modelName,
        messages,
      })) as { choices: { message: { content: string } }[] };
      return data.choices[0].message.content;
    },
    async embed(text) {
      const data = (await openaiRequest("/embeddings", {
        model: embeddingModelName,
        input: text,
      })) as { data: { embedding: number[] }[] };
      return data.data[0].embedding;
    },
    async embedBatch(texts) {
      const data = (await openaiRequest("/embeddings", {
        model: embeddingModelName,
        input: texts,
      })) as { data: { embedding: number[] }[] };
      return data.data.map((d) => d.embedding);
    },
  };
}

// ── Factory ────────────────────────────────────────────────

let cachedProvider: LLMProvider | null = null;
let cachedConfigKey = "";

export async function getLLMProvider(): Promise<LLMProvider> {
  const config = getLLMConfig();
  const configKey = JSON.stringify(config);
  if (cachedProvider && cachedConfigKey === configKey) return cachedProvider;

  switch (config.type) {
    case "openai":
    case "custom":
      cachedProvider = await createOpenAIProvider(config);
      break;
    case "gemini":
    default:
      cachedProvider = await createGeminiProvider(config);
      break;
  }
  cachedConfigKey = configKey;
  return cachedProvider;
}
