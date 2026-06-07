import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_PLATFORMS, CONTENT_STATUSES, type ContentPost, logActivity } from "@/lib/queries";

export function ContentDialog({ trigger, post }: { trigger: ReactNode; post?: ContentPost }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<string>(post?.platform ?? "LinkedIn");
  const [topic, setTopic] = useState(post?.topic ?? "");
  const [format, setFormat] = useState(post?.format ?? "");
  const [status, setStatus] = useState<string>(post?.status ?? "Idea");
  const [date, setDate] = useState(post?.publish_date ?? "");
  const [reach, setReach] = useState(post?.reach == null ? "" : String(post.reach));
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        platform, topic, format: format || null, status,
        publish_date: date || null, reach: reach ? Number(reach) : 0,
      };
      const { error } = post
        ? await supabase.from("content_posts").update(payload).eq("id", post.id)
        : await supabase.from("content_posts").insert(payload);
      if (error) throw error;
      logActivity("Content", !post ? "Posted content" : "Updated content", topic);
    },
    onSuccess: () => {
      toast.success(post ? "Post updated" : "Post added");
      qc.invalidateQueries({ queryKey: ["content_posts"] });
      qc.invalidateQueries({ queryKey: ["activity_log"] });
      setOpen(false);
      if (!post) setPlatform("LinkedIn"); setTopic(""); setFormat(""); setStatus("Idea"); setDate(""); setReach("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Content Post" : "New Content Post"}</DialogTitle>
          <DialogDescription>{post ? "Update status or metrics." : "Plan or log a piece of content."}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!topic.trim()) return; mut.mutate(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctopic">Topic *</Label>
            <Textarea id="ctopic" rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cfmt">Format</Label>
              <Input id="cfmt" placeholder="Post / Reel / Article" value={format} onChange={(e) => setFormat(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cdate">Publish</Label>
              <Input id="cdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creach">Reach</Label>
              <Input id="creach" type="number" min={0} value={reach} onChange={(e) => setReach(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !topic.trim()}>{mut.isPending ? "Saving…" : post ? "Save" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
