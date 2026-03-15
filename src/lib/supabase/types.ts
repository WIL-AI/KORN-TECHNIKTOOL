export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "online" | "maintenance" | "offline";
  qr_code_hash: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Document {
  id: string;
  machine_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  type: "document" | "photo" | "manual" | "datasheet";
  created_at: string;
  uploaded_by: string | null;
}

export interface MaintenanceLog {
  id: string;
  machine_id: string;
  note: string;
  image_url: string | null;
  created_at: string;
  created_by: string | null;
}

export interface DocumentEmbedding {
  id: string;
  document_id: string;
  machine_id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MatchDocumentResult {
  id: string;
  document_id: string;
  machine_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface Database {
  public: {
    Tables: {
      machines: {
        Row: Machine;
        Insert: Omit<Machine, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Machine, "id" | "created_at" | "updated_at">>;
      };
      documents: {
        Row: Document;
        Insert: Omit<Document, "id" | "created_at">;
        Update: Partial<Omit<Document, "id" | "created_at">>;
      };
      maintenance_logs: {
        Row: MaintenanceLog;
        Insert: Omit<MaintenanceLog, "id" | "created_at">;
        Update: Partial<Omit<MaintenanceLog, "id" | "created_at">>;
      };
      document_embeddings: {
        Row: DocumentEmbedding;
        Insert: Omit<DocumentEmbedding, "id" | "created_at">;
        Update: Partial<Omit<DocumentEmbedding, "id" | "created_at">>;
      };
    };
    Functions: {
      match_documents: {
        Args: {
          query_embedding: number[];
          match_count?: number;
          filter_machine_id?: string | null;
        };
        Returns: MatchDocumentResult[];
      };
    };
  };
}
