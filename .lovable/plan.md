
## Fix Entry Save - Remove Non-Existent `slug` Column

### Root Cause
The `Build.tsx` code tries to insert a `slug` field into the `entries` table, but **the `entries` table has no `slug` column**. This causes the insert to fail with a database error.

### Evidence
- Database schema query confirms `entries` table columns: `lifeline_id`, `title`, `summary`, `score`, `occurred_on`, `order_index` (no `slug`)
- The error toast "Failed to save entry" appears because line 295 catches the database error

### The Fix
Remove the `slug` field from the entries insert operation in `Build.tsx`.

### Code Change

**File:** `src/pages/social/Build.tsx`

**Current code (lines 281-292):**
```typescript
const { data, error } = await supabase
  .from("entries")
  .insert({
    lifeline_id: lifelineId,
    title: entryForm.title,
    slug: slug,
    summary: entryForm.description,
    score: entryForm.score,
    occurred_on: occurredOn,
    order_index: orderIndex
  })
```

**Fixed code:**
```typescript
const { data, error } = await supabase
  .from("entries")
  .insert({
    lifeline_id: lifelineId,
    title: entryForm.title,
    summary: entryForm.description,
    score: entryForm.score,
    occurred_on: occurredOn,
    order_index: orderIndex
  })
```

Also remove the unused `slug` variable generation on line 275:
```typescript
// Remove this line:
const slug = generateSlug(entryForm.title);
```

### What This Fixes
After this change, clicking "Add Entry" will successfully save entries to the database for collection owners.

### Note for Claude Code
This was **not an RLS issue** - the "Creators can claim ownership" policy was correctly applied. The problem was a schema mismatch: the code tried to write to a column (`slug`) that doesn't exist in the `entries` table.
