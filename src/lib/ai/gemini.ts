import {
  GoogleGenerativeAI,
  type GenerateContentResult,
} from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (genAI) return genAI;
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not configured");
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

/**
 * Generate a chat response using Gemini with optional RAG context.
 */
export async function chatWithGemini(
  userMessage: string,
  context: string | null,
  chatHistory: { role: "user" | "model"; parts: { text: string }[] }[],
  systemInstruction: string
): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
  });

  const prompt = context
    ? `Kontext aus der Maschinendokumentation:\n---\n${context}\n---\n\nFrage: ${userMessage}`
    : userMessage;

  const chat = model.startChat({ history: chatHistory });
  const result: GenerateContentResult = await chat.sendMessage(prompt);
  return result.response.text();
}

/**
 * Generate embeddings for a text chunk using Gemini's embedding model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: "text-embedding-004",
  });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings for multiple text chunks.
 */
export async function generateEmbeddings(
  chunks: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    embeddings.push(embedding);
  }
  return embeddings;
}
