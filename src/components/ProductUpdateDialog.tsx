import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type ProductUpdate, logActivity } from "@/lib/queries";

export function ProductUpdateDialog({ trigger, update }: { trigger: ReactNode; update?: ProductUpdate }) {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState(update?.feature ?? "");
  const [description, setDescription] = useState(update?.description ?? "");
  const [problem, setProblem] = useState(update?.problem_solved ?? "");
  const [impact, setImpact] = useState(update?.impact ?? "");
  const [category, setCategory] = useState(update?.category ?? "");
  const [owner, setOwner] = useState(update?.owner_name ?? "");
  const [date, setDate] = useState(update?.occurred_on ?? new Date().toISOString().slice(0, 10));
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        feature, description: description || null, problem_solved: problem || null,
        impact: impact || null, category: category || null, owner_name: owner || null, occurred_on: date,
      };
      const { error } = update
        ? await supabase.from("product_updates").update(payload).eq("id", update.id)
        : await supabase.from("product_updates").insert(payload);
      if (error) throw error;
      logActivity("Product", !update ? "Logged product update" : "Edited product update", feature);
    },
    onSuccess: () => {
      toast.success(update ? "Update saved" : "Update logged");
      qc.invalidateQueries({ queryKey: ["product_updates"] });
      qc.invalidateQueries({ queryKey: ["activity_log"] });
      setOpen(false);
      if (!update) setFeature(""); setDescription(""); setProblem(""); setImpact(""); setCategory(""); setOwner("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{update ? "Edit Product Update" : "Log Product Update"}</DialogTitle>
          <DialogDescription>{update ? "Update what shipped and why it matters." : "What did we ship and why does it matter?"}</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!feature.trim()) return; mut.mutate(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="pfeat">Feature *</Label>
            <Input id="pfeat" value={feature} onChange={(e) => setFeature(e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pcat">Category</Label>
              <Input id="pcat" placeholder="AI / Backend / Mobile" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pown">Owner</Label>
              <Input id="pown" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdate">Date</Label>
              <Input id="pdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdesc">Description</Label>
            <Textarea id="pdesc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pprob">Problem solved</Label>
            <Input id="pprob" value={problem} onChange={(e) => setProblem(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pimp">Impact</Label>
            <Input id="pimp" placeholder="+9% accuracy" value={impact} onChange={(e) => setImpact(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !feature.trim()}>{mut.isPending ? "Saving…" : update ? "Save" : "Log"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
