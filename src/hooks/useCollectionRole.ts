import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export type CollectionRoleType = 'owner' | 'editor' | 'contributor' | null;

export interface CollectionRoleResult {
  role: CollectionRoleType;
  isOwner: boolean;
  isEditor: boolean;
  isContributor: boolean;
  canEdit: boolean;
  canManageRoles: boolean;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to check user's role in a specific collection
 * @param collectionId - The collection UUID to check
 * @returns CollectionRoleResult with role info and permissions
 */
export function useCollectionRole(collectionId: string | undefined): CollectionRoleResult {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<CollectionRoleType>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      // Wait for auth to complete
      if (authLoading) return;

      // No user = no role
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // No collection = no role
      if (!collectionId) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // First check if user is site admin (they can edit everything)
        const { data: adminData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (adminData) {
          // Site admins have owner-level access to all collections
          setRole('owner');
          setLoading(false);
          return;
        }

        // Check collection-specific role
        const { data, error: queryError } = await supabase
          .from('collection_roles')
          .select('role')
          .eq('collection_id', collectionId)
          .eq('user_id', user.id)
          .single();

        if (queryError && queryError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is fine (user has no role)
          throw queryError;
        }

        setRole(data?.role as CollectionRoleType || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check collection role'));
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user, authLoading, collectionId]);

  // Compute derived permissions
  const isOwner = role === 'owner';
  const isEditor = role === 'editor';
  const isContributor = role === 'contributor';
  const canEdit = isOwner || isEditor;
  const canManageRoles = isOwner;

  return {
    role,
    isOwner,
    isEditor,
    isContributor,
    canEdit,
    canManageRoles,
    loading,
    error,
  };
}
