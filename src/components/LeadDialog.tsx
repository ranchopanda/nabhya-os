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
import { LEAD_STATUSES, logActivity, type Lead } from "@/lib/queries";
import { LeadActivityPanel } from "./LeadActivityPanel";

export function LeadDialog({ trigger, lead }: { trigger: ReactNode; lead?: Lead }) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState(lead?.company ?? "");
  const [contact, setContact] = useState(lead?.contact_name ?? "");
  const [designation, setDesignation] = useState(lead?.designation ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const [category, setCategory] = useState(lead?.category ?? "");
  const [status, setStatus] = useState<string>(lead?.status ?? "Cold");
  const [nextAction, setNextAction] = useState(lead?.next_action ?? "");
  const [followUp, setFollowUp] = useState(lead?.follow_up_date ?? "");
  const [notes, setNotes] = useState(lead?.notes ?? "");

  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        company, contact_name: contact || null, email: email || null,
        designation: designation || null, phone: phone || null, category: category || null,
        status, next_action: nextAction || null, notes: notes || null, follow_up_date: followUp || null,
        created_by: user?.id ?? null,
      };
      const { error } = lead
        ? await supabase.from("leads").update(payload).eq("id", lead.id)
        : await supabase.from("leads").insert(payload).select().single();
      
      if (error) throw error;

      // Log activity
      const leadId = lead ? lead.id : (error as any)?.data?.id; // If insert returns id
      if (leadId || lead) {
        const actualLeadId = lead ? lead.id : leadId;
        const actionText = !lead ? "Created lead" : (lead.status !== status ? `Changed status to ${status}` : "Updated lead details");
        // Internal lead activity
        supabase.from("lead_activities" as any).insert({
          lead_id: actualLeadId,
          actor_name: user?.email?.split("@")[0] ?? "System",
          action: actionText
        }).then();
      }
      
      logActivity("CRM", !lead ? "Created lead" : "Updated lead", company);
    },
    onSuccess: () => {
      toast.success(lead ? "Lead updated" : "Lead added");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead_activities"] });
      qc.invalidateQueries({ queryKey: ["activity_log"] });
      setOpen(false);
      if (!lead) {
        setCompany(""); setContact(""); setEmail(""); setStatus("Cold"); setNextAction(""); setNotes("");
        setDesignation(""); setPhone(""); setCategory(""); setFollowUp("");
      }
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
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["Agri", "Food Tech", "Research", "Government", "NGO", "Corporate", "Other"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="next">Next action</Label>
              <Input id="next" value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="followUp">Follow-up date</Label>
              <Input id="followUp" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending || !company.trim()}>
              {mut.isPending ? "Saving…" : lead ? "Save" : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
        {lead && <LeadActivityPanel leadId={lead.id} />}
      </DialogContent>
    </Dialog>
  );
}
