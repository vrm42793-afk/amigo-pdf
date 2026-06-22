-- Migration: 00000000000004_signature_system.sql
-- Create signature templates, signed documents, and signature audit logs tables with RLS and indices.

-- 1. Signature Templates Table
CREATE TABLE IF NOT EXISTS public.signature_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Signature',
  image_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Signed Documents Table
CREATE TABLE IF NOT EXISTS public.signed_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  signed_url TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  signature_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Signature Audit Logs Table
CREATE TABLE IF NOT EXISTS public.signature_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.signed_documents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  page_number INTEGER,
  signature_x NUMERIC,
  signature_y NUMERIC,
  signature_width NUMERIC,
  signature_height NUMERIC,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.signature_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for signature_templates
CREATE POLICY "Users can view their own signature templates"
  ON public.signature_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signature templates"
  ON public.signature_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signature templates"
  ON public.signature_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signature templates"
  ON public.signature_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies for signed_documents
CREATE POLICY "Users can view their own signed documents"
  ON public.signed_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signed documents"
  ON public.signed_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signed documents"
  ON public.signed_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS Policies for signature_audit_logs
CREATE POLICY "Users can view audit logs for their signed documents"
  ON public.signature_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.signed_documents
      WHERE public.signed_documents.id = public.signature_audit_logs.document_id
        AND public.signed_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert audit logs for their signed documents"
  ON public.signature_audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.signed_documents
      WHERE public.signed_documents.id = public.signature_audit_logs.document_id
        AND public.signed_documents.user_id = auth.uid()
    )
  );

-- 8. Performance Indices
CREATE INDEX IF NOT EXISTS idx_signature_templates_user ON public.signature_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_signed_documents_user ON public.signed_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_signed_documents_file ON public.signed_documents(file_id);
CREATE INDEX IF NOT EXISTS idx_signature_audit_logs_document ON public.signature_audit_logs(document_id);
