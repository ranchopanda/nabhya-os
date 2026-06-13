import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PROOF_CATEGORIES, DOCUMENT_CATEGORIES, type ProofDoc } from "@/lib/queries";

export function UploadDialog({
  trigger,
  kind,
  doc,
}: {
  trigger: ReactNode;
  kind: "vault" | "document";
  doc?: ProofDoc;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(doc?.title ?? "");
  const categories = kind === "vault" ? PROOF_CATEGORIES : DOCUMENT_CATEGORIES;
  const [category, setCategory] = useState<string>(doc?.category ?? categories[0]);
  const [description, setDescription] = useState(doc?.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let file_path: string | null = null;
      let file_size: number | null = null;
      let mime_type: string | null = null;
      let file_type: string | null = null;
      if (file) {
        setUploading(true);
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${kind}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("proof-vault")
          .upload(path, file, { contentType: file.type, upsert: false });
        setUploading(false);
        if (upErr) throw upErr;
        file_path = path;
        file_size = file.size;
        mime_type = file.type || null;
        file_type = ext;
      }
      const payload = {
        title,
        category,
        description: description || null,
        kind,
        file_path,
        file_size,
        mime_type,
        file_type,
        uploaded_by: user?.id ?? null,
      };
      const updatePayload = file
        ? payload
        : { title, category, description: description || null, kind };
      const { error } = doc
        ? await supabase.from("proof_documents").update(updatePayload).eq("id", doc.id)
        : await supabase.from("proof_documents").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(doc ? "Entry updated" : file ? "File uploaded" : "Entry added");
      qc.invalidateQueries({ queryKey: ["proof_documents", kind] });
      setOpen(false);
      if (!doc) setTitle("");
      setCategory(categories[0]);
      setDescription("");
      setFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {doc ? "Edit Entry" : kind === "vault" ? "Upload Proof" : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            {kind === "vault"
              ? "Validation, awards, media — your receipts."
              : "Internal SOPs, decks, contracts."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            mut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="utitle">Title *</Label>
            <Input id="utitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ufile">File</Label>
            <Input id="ufile" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="udesc">Description</Label>
            <Textarea
              id="udesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending || !title.trim()}>
              {uploading ? "Uploading…" : mut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
