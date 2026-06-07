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
import { PILOT_STATUSES, type Pilot } from "@/lib/queries";

export function PilotDialog({ trigger, pilot }: { trigger: ReactNode; pilot?: Pilot }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(pilot?.name ?? "");
  const [organization, setOrg] = useState(pilot?.organization ?? "");
  const [status, setStatus] = useState<string>(pilot?.status ?? "Proposed");
  const [endDate, setEndDate] = useState(pilot?.end_date ?? "");
  const [progress, setProgress] = useState(String(pilot?.progress ?? 0));
  const [objectives, setObjectives] = useState(pilot?.objectives ?? "");
  const [kpis, setKpis] = useState(pilot?.kpis ?? "");

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name, organization: organization || null, status,
        end_date: endDate || null,
        progress: Math.max(0, Math.min(100, Number(progress) || 0)),
        objectives: objectives || null, kpis: kpis || null,
      };
      const { error } = pilot
        ? await supabase.from("pilots").update(payload).eq("id", pilot.id)
        : await supabase.from("pilots").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(pilot ? "Pilot updated" : "Pilot added");
      qc.invalidateQueries({ queryKey: ["pilots"] });
      setOpen(false);
      if (!pilot) setName(""); setOrg(""); setStatus("Proposed"); setEndDate(""); setProgress("0"); setObjectives(""); setKpis("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pilot ? "Edit Pilot" : "New Pilot"}</DialogTitle>
          <DialogDescription>{pilot ? "Update progress, status, or field notes." : "Capture a new field deployment or trial."}</DialogDescription>
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
              {mut.isPending ? "Saving…" : pilot ? "Save" : "Add Pilot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
