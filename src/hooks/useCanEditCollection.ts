import { useCollectionRole } from "./useCollectionRole";

/**
 * Simple hook to check if user can edit a collection
 * Wrapper around useCollectionRole for simple boolean checks
 * 
 * @param collectionId - The collection UUID to check
 * @returns { canEdit: boolean, loading: boolean }
 */
export function useCanEditCollection(collectionId: string | undefined) {
  const { canEdit, loading } = useCollectionRole(collectionId);
  
  return { canEdit, loading };
}
