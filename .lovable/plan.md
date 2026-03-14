

## Plan: Run `base_palette` Migration on `color_schemes` Table

### What this does

The uploaded SQL file performs two operations:

1. **Schema change** — Adds a new `base_palette` JSONB column to the existing `color_schemes` table.
2. **Data backfill** — Updates 11 existing color schemes with reverse-engineered base palette values (matched by `name`).

### Execution steps

1. **Run the schema migration** using the database migration tool:
   ```sql
   ALTER TABLE color_schemes ADD COLUMN IF NOT EXISTS base_palette JSONB;
   ```

2. **Run the data backfill** using the insert tool (since these are UPDATE statements on existing rows). Each of the 11 `UPDATE` statements will set `base_palette` for a specific named scheme (Default Theme, Mad Men, Stranger Things, etc.).

### Notes

- No code changes are needed — the `SmartPaletteEditor` and `ColorSchemeEditorFull` components likely already reference `base_palette` or will in a future step.
- The `IF NOT EXISTS` guard makes the ALTER safe to re-run.
- The backfill matches by `name`, so it will only update rows with those exact names.

### Build errors

There are 3 pre-existing build errors (`NodeJS` namespace and `process` references) unrelated to this migration. I can fix those separately if you'd like.

No questions — ready to execute when you approve.

