import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAccess() {
  const { user, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return;
      
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'editor', 'viewer'])
        .single();

      setHasAccess(!!data);
      setLoading(false);
    };

    checkAccess();
  }, [user, authLoading]);

  return { hasAccess, loading };
}
