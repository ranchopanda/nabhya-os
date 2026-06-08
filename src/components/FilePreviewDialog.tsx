import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
  title: string;
  mimeType?: string | null;
};

function extOf(path: string) {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  return m?.[1] ?? "";
}

type Kind = "image" | "pdf" | "video" | "audio" | "text" | "office" | "other";

function kindFor(path: string, mime?: string | null): Kind {
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m.startsWith("text/") || m.includes("json") || m.includes("xml") || m.includes("csv")) return "text";

  const e = extOf(path);
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(e)) return "image";
  if (e === "pdf") return "pdf";
  if (["mp4", "webm", "mov", "m4v"].includes(e)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(e)) return "audio";
  if (["txt", "md", "json", "csv", "log", "yml", "yaml", "xml", "html", "css", "js", "ts", "tsx", "jsx", "py"].includes(e)) return "text";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(e)) return "office";
  return "other";
}

export function FilePreviewDialog({ open, onOpenChange, filePath, title, mimeType }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const kind = filePath ? kindFor(filePath, mimeType) : "other";

  useEffect(() => {
    if (!open || !filePath) return;
    let cancelled = false;
    setLoading(true);
    setUrl(null);
    setTextContent(null);
    (async () => {
      const { data, error } = await supabase.storage.from("proof-vault").createSignedUrl(filePath, 3600);
      if (cancelled) return;
      if (error || !data) {
        toast.error(error?.message ?? "Failed to load file");
        setLoading(false);
        return;
      }
      setUrl(data.signedUrl);
      if (kind === "text") {
        try {
          const res = await fetch(data.signedUrl);
          const txt = await res.text();
          if (!cancelled) setTextContent(txt.slice(0, 200_000));
        } catch (e) {
          if (!cancelled) toast.error("Failed to load text");
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, filePath, kind]);

  const download = () => { if (url) window.open(url, "_blank"); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="truncate text-base">{title}</DialogTitle>
          <div className="flex items-center gap-2 pr-8">
            {url && (
              <>
                <Button size="sm" variant="ghost" onClick={() => window.open(url, "_blank")}>
                  <ExternalLink className="h-4 w-4" /> Open
                </Button>
                <Button size="sm" variant="ghost" onClick={download}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              </>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/30">
          {loading && <div className="p-6"><Skeleton className="h-full min-h-[400px] w-full" /></div>}
          {!loading && url && (
            <>
              {kind === "image" && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={url} alt={title} className="max-w-full max-h-full object-contain" />
                </div>
              )}
              {kind === "pdf" && (
                <iframe src={url} title={title} className="w-full h-full border-0" />
              )}
              {kind === "video" && (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <video src={url} controls className="max-w-full max-h-full" />
                </div>
              )}
              {kind === "audio" && (
                <div className="w-full h-full flex items-center justify-center p-6">
                  <audio src={url} controls className="w-full max-w-xl" />
                </div>
              )}
              {kind === "text" && (
                <pre className="text-xs p-5 whitespace-pre-wrap break-words font-mono">
                  {textContent ?? ""}
                </pre>
              )}
              {kind === "office" && (
                <iframe
                  src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
                  title={title}
                  className="w-full h-full border-0"
                />
              )}
              {kind === "other" && (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  Preview not available for this file type.
                  <div className="mt-4">
                    <Button size="sm" onClick={download}><Download className="h-4 w-4" /> Download</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
