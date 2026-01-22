# Action Card Implementation Guide

> **Purpose:** Hand this to Claude Code when implementing a new action card.
> **Location:** This file lives at `/docs/action-card-implementation-guide.md` on the website.

---

## Overview

Action cards are the buttons that appear on collection pages (and the home page). Each card has a `slug` that identifies it in code. When a user taps the card, the code looks up the slug and runs the appropriate behavior.

---

## Implementation Checklist

### 1. Create the Action Card in Admin

Go to `/admin/action-cards` → New Action Card

Fill in:
- **Name:** Display name (e.g., "Start")
- **Slug:** Code identifier (e.g., "start") - this is what you'll use in switch statements
- **Behavior Type:** 
  - `Static URL` - Just navigates to a URL, no code needed
  - `Context-Aware (Built-in)` - Needs code implementation
  - `Custom` - Needs code implementation
- **Include in Defaults:** Toggle ON if this should appear on all collections by default
- **Default Order:** Position in the row (1 = leftmost)

### 2. Implement the Handler (for Context-Aware/Custom)

The action card behavior is handled in the `handleActionCardClick` function. You need to add your slug to EVERY page that displays action cards.

**Files to modify:**

| File | Purpose |
|------|---------|
| `src/pages/public/Home.tsx` | Home page action cards |
| `src/pages/public/PublicCollectionDetail.tsx` | Collection page action cards |

**Pattern:**

```tsx
// 1. Add state for your modal/dialog (if needed)
const [myModalOpen, setMyModalOpen] = useState(false);

// 2. Add case to handleActionCardClick switch statement
const handleActionCardClick = (card: ActionCardData) => {
  switch (card.slug) {
    case "start":
      setStartModalOpen(true);
      break;
    case "share":
      setShareModalOpen(true);
      break;
    case "your-new-slug":  // <-- ADD YOUR CASE HERE
      setMyModalOpen(true);
      break;
    // ... other cases
    default:
      setConstructionAlertOpen(true);
      break;
  }
};

// 3. Import and render your modal component
import { MyModal } from "@/components/MyModal";

// In the return JSX:
<MyModal
  open={myModalOpen}
  onOpenChange={setMyModalOpen}
/>
```

### 3. Create the Modal/Component (if needed)

For cards that open a modal, create a component in `src/components/`.

**Standard modal pattern:**

```tsx
// src/components/MyFeatureModal.tsx
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

interface MyFeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyFeatureModal({ open, onOpenChange }: MyFeatureModalProps) {
  const isMobile = useIsMobile();

  // Mobile: use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>My Feature</DrawerTitle>
          </DrawerHeader>
          {/* Mobile content here */}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Feature</DialogTitle>
        </DialogHeader>
        {/* Desktop content here */}
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Create Database Table (if needed)

If your feature needs to store data:

1. Write SQL migration
2. Save to `~/Downloads/` for user to run via Lovable
3. User confirms tables exist
4. Then write the component code that queries the table

### 5. Create Admin Page (if needed)

If the feature needs admin management:

1. Create page at `src/pages/admin/MyFeature.tsx`
2. Add route in `src/App.tsx`
3. Add link in admin sidebar (`src/components/AdminLayout.tsx`)

### 6. Document in Admin

Go back to the action card in `/admin/action-cards` and fill in:

- **Implementation Status:** Toggle to "Implemented"
- **Implementation Details:** What the card does from user perspective
- **Technical Notes:** Component paths, data sources, related files

---

## Example: Start Button Implementation

**Action Card Settings:**
- Name: Start
- Slug: start
- Behavior: Context-Aware (Built-in)
- Default: Yes, Order: 1

**Implementation Details:**
> Opens StartButtonModal showing 9 categories explaining what Lifeline Public offers. Desktop: split-panel dialog (category nav on left, content on right). Mobile: bottom sheet with accordion - one category expanded at a time with scroll-into-view. Internal links close modal and navigate; external links open new tab.

**Technical Notes:**
> Component: src/components/StartButtonModal.tsx
> Pages: Home.tsx, PublicCollectionDetail.tsx
> Data source: start_button_categories table (9 rows)
> Admin: /admin/start-button
> Planning doc: docs/planning/start-button-experience.md

**Files created/modified:**
1. `src/components/StartButtonModal.tsx` - The modal component
2. `src/pages/public/Home.tsx` - Added case "start" + modal state + render
3. `src/pages/public/PublicCollectionDetail.tsx` - Same changes
4. `src/pages/admin/StartButton.tsx` - Admin page for managing categories
5. Database: `start_button_categories` table

---

## Quick Reference: Existing Action Cards

| Slug | Type | Component | Notes |
|------|------|-----------|-------|
| `start` | Context-Aware | StartButtonModal | 9-category explainer |
| `share` | Context-Aware | CollectionShareModal | Share current page |
| `members` | Context-Aware | JoinCommunityDialog | Join collection |
| `grow` | Context-Aware | GrowComingSoonDialog | Coming soon placeholder |
| `feed` | Context-Aware | Navigate | Goes to /feed route |
| `settings` | Context-Aware | Navigate | Goes to /settings route |

---

## Troubleshooting

**Card shows "Under Construction" alert:**
- The slug isn't handled in `handleActionCardClick`
- Check both Home.tsx AND PublicCollectionDetail.tsx

**Card works on Home but not Collection pages:**
- You only added the case to Home.tsx
- Add it to PublicCollectionDetail.tsx too

**Modal doesn't open:**
- Check that state variable is defined
- Check that component is imported and rendered
- Check browser console for errors

---

## Files to Know

| File | Purpose |
|------|---------|
| `src/pages/public/Home.tsx` | Home page with action cards |
| `src/pages/public/PublicCollectionDetail.tsx` | Collection pages with action cards |
| `src/pages/ActionCardEdit.tsx` | Admin form for editing cards |
| `src/pages/ActionCards.tsx` | Admin list of all cards |
| `src/components/` | Where modal components live |
