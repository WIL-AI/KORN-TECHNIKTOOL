import { supabase } from "@/lib/supabase/client";
import { getLLMProvider, isLLMConfigured } from "./llm-provider";
import type { MatchDocumentResult } from "@/lib/supabase/types";

const SYSTEM_PROMPT_DE = `Du bist ein hilfreicher KI-Assistent für die digitale Maschinenakte der Firma KORN.
Du beantwortest Fragen zu Maschinen, Wartung, Betriebsanleitungen und technischen Dokumenten.
Antworte immer präzise, sachlich und auf Deutsch, es sei denn der Nutzer schreibt auf Englisch.
Wenn du relevante Informationen aus der Dokumentation hast, beziehe dich darauf.
Wenn du keine relevanten Informationen findest, sage das ehrlich und schlage vor, die passenden Dokumente hochzuladen.
Formatiere deine Antworten mit Absätzen für bessere Lesbarkeit.`;

const SYSTEM_PROMPT_EN = `You are a helpful AI assistant for KORN's digital machine file system.
You answer questions about machines, maintenance, operating manuals, and technical documents.
Always respond precisely, factually, and in the language the user writes in.
If you have relevant information from documentation, reference it.
If you don't have relevant information, say so honestly and suggest uploading the appropriate documents.
Format your responses with paragraphs for better readability.`;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Search for relevant document chunks using vector similarity.
 */
async function searchDocuments(
  query: string,
  machineId: string | null,
  matchCount = 5
): Promise<MatchDocumentResult[]> {
  try {
    const provider = await getLLMProvider();
    const queryEmbedding = await provider.embed(query);

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_machine_id: machineId,
    });

    if (error) {
      console.error("Vector search error:", error);
      return [];
    }

    return (data as MatchDocumentResult[]) || [];
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
}

/**
 * Build context string from matched document chunks.
 */
function buildContext(matches: MatchDocumentResult[]): string | null {
  if (matches.length === 0) return null;

  const relevantMatches = matches.filter((m) => m.similarity > 0.3);
  if (relevantMatches.length === 0) return null;

  return relevantMatches
    .map((m) => m.content)
    .join("\n\n");
}

/**
 * Send a message through the RAG pipeline.
 */
export async function sendRagMessage(
  userMessage: string,
  machineId: string | null,
  history: ChatMessage[],
  locale: string = "de"
): Promise<string> {
  if (!isLLMConfigured()) {
    throw new Error("LLM_NOT_CONFIGURED");
  }

  // Search for relevant documents
  const matches = await searchDocuments(
    userMessage,
    machineId === "all" ? null : machineId
  );
  const context = buildContext(matches);

  const systemPrompt = locale === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_DE;

  const provider = await getLLMProvider();
  return provider.chat(userMessage, {
    systemInstruction: systemPrompt,
    history: history.map((m) => ({ role: m.role, content: m.content })),
    context,
  });
}

/**
 * Check if Supabase is configured and reachable.
 */
export async function isSupabaseConfigured(): Promise<boolean> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url.includes("your-project")) return false;

    const { error } = await supabase.from("machines").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
