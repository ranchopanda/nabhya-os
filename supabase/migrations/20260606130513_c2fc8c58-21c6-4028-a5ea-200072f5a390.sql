ALTER TABLE public.proof_documents
  ADD COLUMN IF NOT EXISTS file_size bigint,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'vault';

CREATE INDEX IF NOT EXISTS proof_documents_kind_idx ON public.proof_documents (kind);

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS tasks_status_position_idx ON public.tasks (status, position);