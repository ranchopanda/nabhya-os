import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Pin, PinOff, Plus, StickyNote, ListTodo, Star } from "lucide-react";
import {
  listNotes,
  upsertNote,
  deleteNote,
  listPersonalTasks,
  upsertPersonalTask,
  deletePersonalTask,
  listWatchlist,
  toggleWatch,
} from "@/lib/private-space.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/me")({
  component: MyPage,
});

function MyPage() {
  return (
    <AppShell>
      <div className="px-6 py-8 max-w-5xl mx-auto w-full">
        <PageHeader
          eyebrow="Private"
          title="My Space"
          description="Only you can see this. Founders can view for support."
        />
        <Tabs defaultValue="notes" className="w-full">
          <TabsList>
            <TabsTrigger value="notes"><StickyNote className="h-4 w-4 mr-1" /> Notes</TabsTrigger>
            <TabsTrigger value="tasks"><ListTodo className="h-4 w-4 mr-1" /> Personal Tasks</TabsTrigger>
            <TabsTrigger value="watch"><Star className="h-4 w-4 mr-1" /> Watchlist</TabsTrigger>
          </TabsList>
          <TabsContent value="notes"><NotesTab /></TabsContent>
          <TabsContent value="tasks"><TasksTab /></TabsContent>
          <TabsContent value="watch"><WatchTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function NotesTab() {
  const fetchFn = useServerFn(listNotes);
  const upsertFn = useServerFn(upsertNote);
  const deleteFn = useServerFn(deleteNote);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my_notes"], queryFn: () => fetchFn() });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const create = useMutation({
    mutationFn: (v: { title?: string; body: string }) => upsertFn({ data: v }),
    onSuccess: () => {
      setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["my_notes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_notes"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_notes"] }),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4 mt-6">
      <Card className="p-4 space-y-3">
        <div className="font-medium">New note</div>
        <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea placeholder="Markdown supported…" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
        <Button onClick={() => body.trim() && create.mutate({ title: title || undefined, body })} disabled={!body.trim() || create.isPending}>
          <Plus className="h-4 w-4" /> Save note
        </Button>
      </Card>
      <div className="space-y-3">
        {q.data?.length === 0 && <div className="text-sm text-muted-foreground p-4">No notes yet.</div>}
        {q.data?.map((n: any) => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {n.title && <div className="font-medium truncate">{n.title}</div>}
                <div className="text-sm whitespace-pre-wrap text-muted-foreground mt-1">{n.body}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => update.mutate({ id: n.id, pinned: !n.pinned })}>
                  {n.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(n.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {n.pinned && <Badge variant="secondary" className="mt-2 text-[10px]">Pinned</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function TasksTab() {
  const fetchFn = useServerFn(listPersonalTasks);
  const upsertFn = useServerFn(upsertPersonalTask);
  const deleteFn = useServerFn(deletePersonalTask);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my_tasks"], queryFn: () => fetchFn() });

  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const create = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => { setTitle(""); setDue(""); qc.invalidateQueries({ queryKey: ["my_tasks"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_tasks"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_tasks"] }),
  });

  return (
    <div className="mt-6 space-y-4">
      <Card className="p-3 flex flex-wrap gap-2">
        <Input placeholder="New personal task…" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 min-w-[200px]" />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-40" />
        <Button onClick={() => title.trim() && create.mutate({ title, due_date: due || null })} disabled={!title.trim()}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </Card>
      <div className="space-y-2">
        {q.data?.length === 0 && <div className="text-sm text-muted-foreground p-4">No personal tasks.</div>}
        {q.data?.map((t: any) => (
          <Card key={t.id} className="p-3 flex items-center gap-3">
            <Checkbox
              checked={t.status === "done"}
              onCheckedChange={(v) => update.mutate({ id: t.id, status: v ? "done" : "todo" })}
            />
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
              {t.due_date && <div className="text-xs text-muted-foreground">Due {t.due_date}</div>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WatchTab() {
  const fetchFn = useServerFn(listWatchlist);
  const toggleFn = useServerFn(toggleWatch);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my_watchlist"], queryFn: () => fetchFn() });

  const unwatch = useMutation({
    mutationFn: (v: any) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_watchlist"] }),
  });

  return (
    <div className="mt-6 space-y-4">
      <Card className="p-4">
        <div className="font-medium mb-2">Starred Leads</div>
        {(q.data?.leads ?? []).length === 0 && (
          <div className="text-sm text-muted-foreground">Star a lead from the CRM to track it here.</div>
        )}
        <div className="space-y-2">
          {q.data?.leads?.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{l.company}</div>
                <div className="text-xs text-muted-foreground">{l.status} • {l.next_action || "no next action"} {l.follow_up_date ? `• follow-up ${l.follow_up_date}` : ""}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => unwatch.mutate({ entity_type: "lead", entity_id: l.id })}>
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-4">
        <div className="font-medium mb-2">Starred Pilots</div>
        {(q.data?.pilots ?? []).length === 0 && (
          <div className="text-sm text-muted-foreground">Star a pilot from the Pilots page to track it here.</div>
        )}
        <div className="space-y-2">
          {q.data?.pilots?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.organization} • {p.status} • {p.progress}%</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => unwatch.mutate({ entity_type: "pilot", entity_id: p.id })}>
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
