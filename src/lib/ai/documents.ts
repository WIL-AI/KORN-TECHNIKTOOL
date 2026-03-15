import { supabase } from "@/lib/supabase/client";
import { generateEmbedding } from "./gemini";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

/**
 * Split text into overlapping chunks for embedding.
 */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (cleanText.length <= CHUNK_SIZE) {
    return [cleanText];
  }

  let start = 0;
  while (start < cleanText.length) {
    let end = start + CHUNK_SIZE;

    // Try to break at sentence boundary
    if (end < cleanText.length) {
      const lastPeriod = cleanText.lastIndexOf(".", end);
      if (lastPeriod > start + CHUNK_SIZE / 2) {
        end = lastPeriod + 1;
      }
    }

    chunks.push(cleanText.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
  }

  return chunks.filter((c) => c.length > 20);
}

/**
 * Extract text from a PDF file using PDF.js (browser-compatible).
 */
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

/**
 * Upload a document to Supabase Storage and create embeddings.
 */
export async function uploadAndProcessDocument(
  file: File,
  machineId: string,
  type: "document" | "photo" | "manual" | "datasheet" = "document"
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Upload file to Supabase Storage
    const filePath = `${machineId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("machine-files")
      .upload(filePath, file);

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from("machine-files")
      .getPublicUrl(filePath);

    // 3. Create document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        machine_id: machineId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        type,
      })
      .select()
      .single();

    if (docError || !doc) {
      return { success: false, error: docError?.message || "Failed to create document record" };
    }

    // 4. For PDFs, extract text and create embeddings
    if (file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const text = await extractPdfText(file);
        const chunks = chunkText(text);

        for (const chunk of chunks) {
          const embedding = await generateEmbedding(chunk);

          await supabase.from("document_embeddings").insert({
            document_id: doc.id,
            machine_id: machineId,
            content: chunk,
            embedding,
            metadata: { file_name: file.name, chunk_size: chunk.length },
          });
        }
      } catch (embeddingError) {
        console.error("Embedding generation failed:", embeddingError);
        // Document is still uploaded, just without embeddings
      }
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Get documents for a machine from Supabase.
 */
export async function getMachineDocuments(machineId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("machine_id", machineId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch documents:", error);
    return [];
  }

  return data || [];
}

/**
 * Delete a document and its embeddings from Supabase.
 */
export async function deleteDocument(documentId: string, filePath: string) {
  // Delete embeddings first (cascade should handle this, but just in case)
  await supabase
    .from("document_embeddings")
    .delete()
    .eq("document_id", documentId);

  // Delete document record
  await supabase.from("documents").delete().eq("id", documentId);

  // Delete file from storage
  await supabase.storage.from("machine-files").remove([filePath]);
}
