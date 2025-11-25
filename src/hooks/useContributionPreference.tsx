import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function useContributionPreference() {
  const { user } = useAuth();
  const [hideButton, setHideButton] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreference = async () => {
      if (!user) {
        setHideButton(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('hide_contribution_button')
        .eq('user_id', user.id)
        .single();

      setHideButton(data?.hide_contribution_button ?? false);
      setLoading(false);
    };

    fetchPreference();
  }, [user]);

  const updatePreference = async (hide: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        { 
          user_id: user.id, 
          hide_contribution_button: hide 
        },
        { onConflict: 'user_id' }
      );

    if (!error) {
      setHideButton(hide);
    }
  };

  return { hideButton, loading, updatePreference };
}
