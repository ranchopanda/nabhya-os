import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function LinkedInDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [followers, setFollowers] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        follower_count: parseInt(followers, 10),
        occurred_on: date,
      };
      // Uses "as any" since linkedin_snapshots may not be in DB schema typing yet
      const { error } = await supabase.from("linkedin_snapshots" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Follower count logged");
      qc.invalidateQueries({ queryKey: ["linkedin_snapshots"] });
      setOpen(false);
      setFollowers("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log LinkedIn Followers</DialogTitle>
          <DialogDescription>Track company follower growth over time.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!followers) return; mut.mutate(); }}>
          <div className="space-y-1.5">
            <Label htmlFor="lifollowers">Follower Count *</Label>
            <Input id="lifollowers" type="number" min="0" value={followers} onChange={(e) => setFollowers(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lidate">Date</Label>
            <Input id="lidate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !followers}>{mut.isPending ? "Saving…" : "Log Followers"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
