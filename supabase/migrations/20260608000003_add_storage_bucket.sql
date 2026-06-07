-- Create the proof-vault bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-vault', 'proof-vault', false)
ON CONFLICT (id) DO NOTHING;
