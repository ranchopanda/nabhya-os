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
import { LEAD_STATUSES, type Lead } from "@/lib/queries";

export function LeadDialog({ trigger, lead }: { trigger: ReactNode; lead?: Lead }) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState(lead?.company ?? "");
  const [contact, setContact] = useState(lead?.contact_name ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [status, setStatus] = useState<string>(lead?.status ?? "Cold");
  const [nextAction, setNextAction] = useState(lead?.next_action ?? "");
  const [notes, setNotes] = useState(lead?.notes ?? "");

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        company, contact_name: contact || null, email: email || null,
        status, next_action: nextAction || null, notes: notes || null,
        created_by: user?.id ?? null,
      };
      const { error } = lead
        ? await supabase.from("leads").update(payload).eq("id", lead.id)
        : await supabase.from("leads").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(lead ? "Lead updated" : "Lead added");
      qc.invalidateQueries({ queryKey: ["leads"] });
      setOpen(false);
      if (!lead) setCompany(""); setContact(""); setEmail(""); setStatus("Cold"); setNextAction(""); setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add Lead"}</DialogTitle>
          <DialogDescription>{lead ? "Update this conversation." : "Track a new conversation in the pipeline."}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => { e.preventDefault(); if (!company.trim()) return; mut.mutate(); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="company">Company *</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contact</Label>
              <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">Next action</Label>
              <Input id="next" value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !company.trim()}>
              {mut.isPending ? "Saving…" : lead ? "Save" : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
