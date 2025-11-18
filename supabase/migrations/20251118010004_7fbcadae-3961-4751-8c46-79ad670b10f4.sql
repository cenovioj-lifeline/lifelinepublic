-- Recreate entity_registry view with security_invoker to respect RLS policies
DROP VIEW IF EXISTS entity_registry;

CREATE VIEW entity_registry
WITH (security_invoker=on)
AS
SELECT 
    e.entity_id,
    e.entity_type,
    e.primary_name,
    e.alternate_names,
    e.canonical_slug,
    e.metadata,
    array_agg(
        json_build_object(
            'appearance_type', ea.appearance_type,
            'profile_id', ea.profile_id,
            'lifeline_id', ea.lifeline_id,
            'entry_id', ea.entry_id,
            'collection_id', ea.collection_id
        )
    ) FILTER (WHERE ea.id IS NOT NULL) as appearances
FROM entities e
LEFT JOIN entity_appearances ea ON e.entity_id = ea.entity_id
GROUP BY e.entity_id, e.entity_type, e.primary_name, 
         e.alternate_names, e.canonical_slug, e.metadata;