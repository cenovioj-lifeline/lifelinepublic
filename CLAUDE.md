# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript application for managing and displaying lifelines (biographical timelines), profiles, collections, and mock elections. It uses Supabase as the backend with PostgreSQL database and edge functions. The project was originally created with Lovable and uses shadcn/ui for the component library.

## Common Commands

### Development
```bash
npm run dev          # Start development server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint on all files
```

### Supabase
The project uses Supabase with local migrations in `supabase/migrations/`. The project ID is configured in `supabase/config.toml`.

## Architecture Overview

### Dual Layout System
The application has two distinct layouts:
- **Admin Layout** (`src/components/AdminLayout.tsx`): Protected routes for content management at `/admin`, `/collections`, `/lifelines`, `/profiles`, `/elections`, `/tags`, `/media`, `/settings`
- **Public Layout** (`src/components/PublicLayout.tsx`): Public-facing routes at `/`, `/public/*` for browsing content

### Authentication & Authorization
- Uses Supabase Auth with session management via `src/lib/auth.tsx`
- Role-based access control with three roles: `admin`, `editor`, `viewer`
- `ProtectedRoute` component checks `user_roles` table to verify access
- Public users can contribute content (events/images) but must sign up first
- Admin authentication is separate at `/admin/login` with password reset support

### Data Model (Core Tables)
- **collections**: Top-level content groups with custom colors/themes
- **profiles**: People (real/fictional), entities, or organizations with slugs, bios, demographics
- **lifelines**: Timelines with type ('profile', 'list', 'event') linked to profiles or collections
- **lifeline_entries**: Individual timeline events with dates, sentiment, media, and contributions
- **media_assets**: Centralized media storage with credits and dimensions
- **tags**: Categorized tags for content organization
- **mock_elections**: Voting features with ballot items and options
- **user_roles**: Role assignments for admin access
- **fan_contributions**: User-submitted events and images pending review

### Key Patterns

#### Route Structure
Routes follow a pattern where admin routes are protected and public routes mirror the same content:
- Admin: `/lifelines/:id` (edit view)
- Public: `/public/lifelines/:slug` (detail view)
- Collection-scoped: `/public/collections/:slug/lifelines/:lifelineSlug`

#### Color Theming
Collections have customizable `primary_color` and `secondary_color` that cascade to lifelines and UI elements. The `useGlobalColors` hook applies these globally via CSS variables.

#### Slug-based URLs
All public content uses slugs for SEO-friendly URLs. Slugs are generated from titles/names and must be unique per table.

#### Media Handling
Media assets are stored in Supabase Storage and tracked via the `media_assets` table. The `ImageUpload` component handles uploads with credit/alt text. `ImagePositionPicker` allows focal point selection.

### State Management
- **React Query** (`@tanstack/react-query`) for server state and caching
- **Context API** for auth state (`AuthProvider`)
- Component-level state with `useState` for UI interactions
- No Redux or similar state libraries

### Forms & Validation
- **React Hook Form** with Zod resolvers for validation
- shadcn/ui form components with consistent error handling
- Custom hooks like `useCollectionQuote` for feature-specific logic

### Component Organization
- `/src/components/ui/`: shadcn/ui base components
- `/src/components/`: Feature components (layouts, dialogs, cards)
- `/src/components/lifeline/`: Lifeline-specific components like `LifelineViewer`
- `/src/pages/`: Route-level components
- `/src/pages/public/`: Public-facing pages
- `/src/pages/admin/`: Admin-only pages

### Supabase Integration
- Client setup: `src/integrations/supabase/client.ts`
- Generated types: `src/integrations/supabase/types.ts` (auto-generated from database schema)
- Edge function: `supabase/functions/load-lifelines-data/` for bulk imports from Excel

### TypeScript Configuration
- Path alias `@/*` maps to `./src/*`
- Relaxed settings: `noImplicitAny: false`, `strictNullChecks: false`
- Type generation comes from Supabase schema

## Important Patterns to Follow

### Accessing Protected Data
Always check user roles before showing admin features:
```typescript
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .in('role', ['admin', 'editor', 'viewer'])
  .single();
```

### Handling Contributions
Fan contributions go through a review process:
1. User submits via `ContributeEventDialog` or `ContributeImageDialog`
2. Data stored in `fan_contributions` table with `status: 'pending'`
3. Admin reviews in `/fan-contributions` page
4. Approved items create actual lifeline entries or media assets

### Working with Lifelines
Lifelines have entries that can be:
- Positive/negative/neutral sentiment (affects color coding)
- Linked to media assets
- Marked as featured (shown with star icon)
- User-contributed (tracks contributor)

The `LifelineViewer` component handles rendering with customizable selection styles and colors.

### Collection Context
When viewing content within a collection, colors and branding cascade from the collection settings. Always pass collection colors down to child components.

## Known Quirks

- The `lifeline_type` enum changed during development; some migrations reference old values ('profile', 'list', 'event') vs new ('person', 'list', 'voting')
- ESLint has `@typescript-eslint/no-unused-vars` disabled due to the relaxed TypeScript config
- The dev server uses IPv6 (`::`), not IPv4
- Some files show as modified in git status but are part of the Lovable workflow

## Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
