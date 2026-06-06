import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PILOT_STATUSES } from "@/lib/queries";

export function PilotDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrg] = useState("");
  const [status, setStatus] = useState<string>("Proposed");
  const [endDate, setEndDate] = useState("");
  const [progress, setProgress] = useState("0");
  const [objectives, setObjectives] = useState("");
  const [kpis, setKpis] = useState("");

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pilots").insert({
        name, organization: organization || null, status,
        end_date: endDate || null,
        progress: Math.max(0, Math.min(100, Number(progress) || 0)),
        objectives: objectives || null, kpis: kpis || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pilot added");
      qc.invalidateQueries({ queryKey: ["pilots"] });
      setOpen(false);
      setName(""); setOrg(""); setStatus("Proposed"); setEndDate(""); setProgress("0"); setObjectives(""); setKpis("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Pilot</DialogTitle>
          <DialogDescription>Capture a new field deployment or trial.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; mut.mutate(); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pname">Name *</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="org">Organization</Label>
              <Input id="org" value={organization} onChange={(e) => setOrg(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PILOT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="end">End date</Label>
              <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog">Progress %</Label>
              <Input id="prog" type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obj">Objectives</Label>
            <Textarea id="obj" rows={2} value={objectives} onChange={(e) => setObjectives(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kpis">KPIs</Label>
            <Textarea id="kpis" rows={2} value={kpis} onChange={(e) => setKpis(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !name.trim()}>
              {mut.isPending ? "Saving…" : "Add Pilot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
