-- ============================================================
-- KORN Maschinenakte - Database Schema
-- Supabase PostgreSQL with pgvector for RAG embeddings
-- ============================================================

-- Enable pgvector extension for document embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Machines table
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'maintenance', 'offline')),
  qr_code_hash TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Documents table (PDFs, photos, manuals)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('document', 'photo', 'manual', 'datasheet')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Maintenance logs
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Document embeddings for RAG chatbot
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Fast lookup by machine
CREATE INDEX idx_documents_machine_id ON documents(machine_id);
CREATE INDEX idx_maintenance_logs_machine_id ON maintenance_logs(machine_id);
CREATE INDEX idx_document_embeddings_machine_id ON document_embeddings(machine_id);
CREATE INDEX idx_document_embeddings_document_id ON document_embeddings(document_id);

-- QR code hash lookup
CREATE INDEX idx_machines_qr_code_hash ON machines(qr_code_hash);

-- Vector similarity search (cosine distance)
CREATE INDEX idx_document_embeddings_vector ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vector similarity search function (for RAG)
-- Searches by cosine similarity, optionally filtered to a single machine
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_count INTEGER DEFAULT 5,
  filter_machine_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  machine_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.machine_id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE (filter_machine_id IS NULL OR de.machine_id = filter_machine_id)
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Machines: authenticated users can read all, insert/update/delete own
CREATE POLICY "machines_select" ON machines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "machines_insert" ON machines
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "machines_update" ON machines
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "machines_delete" ON machines
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Documents: authenticated users can read all, insert/delete own
CREATE POLICY "documents_select" ON documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "documents_insert" ON documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "documents_delete" ON documents
  FOR DELETE TO authenticated USING (auth.uid() = uploaded_by);

-- Maintenance logs: authenticated users can read all, insert/delete own
CREATE POLICY "maintenance_logs_select" ON maintenance_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "maintenance_logs_insert" ON maintenance_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "maintenance_logs_delete" ON maintenance_logs
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Document embeddings: authenticated users can read all, service role manages
CREATE POLICY "embeddings_select" ON document_embeddings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "embeddings_insert" ON document_embeddings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "embeddings_delete" ON document_embeddings
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run in Supabase Dashboard > SQL Editor:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('machine-files', 'machine-files', true);
--
-- CREATE POLICY "machine_files_select" ON storage.objects
--   FOR SELECT TO authenticated USING (bucket_id = 'machine-files');
--
-- CREATE POLICY "machine_files_insert" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'machine-files');
--
-- CREATE POLICY "machine_files_delete" ON storage.objects
--   FOR DELETE TO authenticated USING (bucket_id = 'machine-files');
