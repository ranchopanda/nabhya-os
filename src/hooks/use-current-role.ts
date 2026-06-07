import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ensureCurrentMember } from "@/lib/member.functions";

export function useCurrentRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const ensureMember = useServerFn(ensureCurrentMember);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (mounted) { setRole(null); setLoading(false); } return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!mounted) return;
      if ((data ?? []).length === 0) {
        try {
          const repaired = await ensureMember();
          if (mounted) setRole(repaired.role);
        } finally {
          if (mounted) setLoading(false);
        }
        return;
      }
      // Prefer highest privilege
      const roles = (data ?? []).map((r) => r.role as string);
      const top = roles.includes("founder") ? "founder" : roles.includes("team") ? "team" : roles[0] ?? "investor";
      setRole(top);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [ensureMember]);

  return { role, canEdit: role === "founder" || role === "team", isFounder: role === "founder", loading };
}
