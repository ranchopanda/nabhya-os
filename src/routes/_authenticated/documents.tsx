import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState, useMemo } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDialog } from "@/components/UploadDialog";
import { proofDocsQuery } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { supabase } from "@/integrations/supabase/client";
import { Search, Upload, FileText, Download, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { DeleteButton } from "@/components/DeleteButton";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Document Hub · Nabhya OS" },
      { name: "description", content: "Central storage for business and research docs." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(proofDocsQuery("document"));
  },
  component: DocsPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="p-10 text-sm text-destructive">Failed: {error.message}</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10">Not found</div>
    </AppShell>
  ),
});

async function downloadFile(path: string) {
  const { data, error } = await supabase.storage.from("proof-vault").createSignedUrl(path, 60);
  if (error || !data) {
    toast.error(error?.message ?? "Failed");
    return;
  }
  window.open(data.signedUrl, "_blank");
}

function DocsPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 9"
          title="Document Hub"
          description="One place. Searchable. Always current."
          action={
            canEdit ? (
              <UploadDialog
                kind="document"
                trigger={
                  <Button size="sm">
                    <Upload className="h-4 w-4" /> Upload Document
                  </Button>
                }
              />
            ) : undefined
          }
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <DocsBody />
        </Suspense>
      </div>
    </AppShell>
  );
}

function DocsBody() {
  const { data: docs } = useSuspenseQuery(proofDocsQuery("document"));
  const { canEdit, isFounder } = useCurrentRole();
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<{
    path: string;
    title: string;
    mime?: string | null;
  } | null>(null);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return docs;
    return docs.filter((d) =>
      [d.title, d.description, d.category]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(n)),
    );
  }, [docs, q]);
  return (
    <>
      <Card className="p-4 mb-6 flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents…"
          className="border-0 focus-visible:ring-0 shadow-none"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Card>
      <Card>
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No documents yet.
          </div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="px-5 py-4 border-b last:border-0 flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-4 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity disabled:cursor-default"
                onClick={() =>
                  d.file_path &&
                  setPreview({ path: d.file_path, title: d.title, mime: d.mime_type })
                }
                disabled={!d.file_path}
              >
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.title}</div>
                  {d.description && (
                    <div className="text-sm text-muted-foreground truncate">{d.description}</div>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-2">
                {d.file_path && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setPreview({ path: d.file_path!, title: d.title, mime: d.mime_type })
                    }
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {d.file_path && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => downloadFile(d.file_path!)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                {canEdit && (
                  <UploadDialog
                    kind="document"
                    doc={d}
                    trigger={
                      <Button size="icon" variant="ghost">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                )}
                {isFounder && (
                  <DeleteButton
                    table="proof_documents"
                    id={d.id}
                    queryKey={["proof_documents", "document"]}
                    label="document"
                    filePath={d.file_path}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </Card>
      <FilePreviewDialog
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        filePath={preview?.path ?? null}
        title={preview?.title ?? ""}
        mimeType={preview?.mime ?? null}
      />
    </>
  );
}
