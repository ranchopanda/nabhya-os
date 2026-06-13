import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDialog } from "@/components/UploadDialog";
import { proofDocsQuery, PROOF_CATEGORIES } from "@/lib/queries";
import { useCurrentRole } from "@/hooks/use-current-role";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Download, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { DeleteButton } from "@/components/DeleteButton";
import { FilePreviewDialog } from "@/components/FilePreviewDialog";

export const Route = createFileRoute("/_authenticated/proof")({
  head: () => ({
    meta: [
      { title: "Proof Vault · Nabhya OS" },
      { name: "description", content: "Validation, awards, competitions, and media." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(proofDocsQuery("vault"));
  },
  component: ProofPage,
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

function ProofPage() {
  const { canEdit } = useCurrentRole();
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
        <PageHeader
          eyebrow="Module 4"
          title="Proof Vault"
          description="The receipts — every piece of evidence that Nabhya works."
          action={
            canEdit ? (
              <UploadDialog
                kind="vault"
                trigger={
                  <Button size="sm">
                    <Upload className="h-4 w-4" /> Upload Proof
                  </Button>
                }
              />
            ) : undefined
          }
        />
        <Suspense fallback={<Skeleton className="h-96" />}>
          <ProofBody />
        </Suspense>
      </div>
    </AppShell>
  );
}

function ProofBody() {
  const { data: docs } = useSuspenseQuery(proofDocsQuery("vault"));
  const { canEdit, isFounder } = useCurrentRole();
  const [filter, setFilter] = useState<string>("All");
  const [preview, setPreview] = useState<{
    path: string;
    title: string;
    mime?: string | null;
  } | null>(null);
  const filtered = filter === "All" ? docs : docs.filter((d) => d.category === filter);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {["All", ...PROOF_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === c ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}
          >
            {c}{" "}
            {c !== "All" && (
              <span className="opacity-60 ml-1">{docs.filter((d) => d.category === c).length}</span>
            )}
          </button>
        ))}
      </div>
      <Card>
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No proof uploaded yet.
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
                    kind="vault"
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
                    queryKey={["proof_documents", "vault"]}
                    label="proof"
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
