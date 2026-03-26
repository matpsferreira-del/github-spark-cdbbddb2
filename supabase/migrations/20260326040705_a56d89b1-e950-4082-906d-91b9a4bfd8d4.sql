
-- Create cv-documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-documents', 'cv-documents', false);

-- Allow authenticated users to upload to cv-documents bucket
CREATE POLICY "Users can upload cv documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cv-documents');

-- Allow authenticated users to read their own uploaded files
CREATE POLICY "Users can read cv documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cv-documents');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete cv documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cv-documents');

-- Expand cv_documents type constraint to include questionnaire
ALTER TABLE public.cv_documents
DROP CONSTRAINT IF EXISTS cv_documents_type_check;

ALTER TABLE public.cv_documents
ADD CONSTRAINT cv_documents_type_check
CHECK (type IN ('linkedin_pdf', 'personal_cv', 'questionnaire'));
