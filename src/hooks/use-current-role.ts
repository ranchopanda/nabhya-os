import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (mounted) { setRole(null); setLoading(false); } return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!mounted) return;
      // Prefer highest privilege
      const roles = (data ?? []).map((r) => r.role as string);
      const top = roles.includes("founder") ? "founder" : roles.includes("team") ? "team" : roles[0] ?? "investor";
      setRole(top);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { role, canEdit: role === "founder" || role === "team", isFounder: role === "founder", loading };
}
