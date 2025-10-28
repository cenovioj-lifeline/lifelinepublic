import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function useSuperFan() {
  const { user } = useAuth();
  const [isSuperFan, setIsSuperFan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperFan = async () => {
      if (!user) {
        setIsSuperFan(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_super_fan', {
        check_user_id: user.id
      });

      if (!error && data !== null) {
        setIsSuperFan(data);
      }
      setLoading(false);
    };

    checkSuperFan();
  }, [user]);

  return { isSuperFan, loading };
}
