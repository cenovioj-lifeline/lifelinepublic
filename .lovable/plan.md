
## Change Home Page Hero from 4:1 to 6:1 Aspect Ratio

### Overview
The home page currently uses a 4:1 aspect ratio for its hero banner, which takes up more vertical space than needed for text-only content. This change will make it 6:1 (narrower), reducing wasted space while keeping collection pages at 4:1.

### What Will Change

**Home Page (Public)** - `src/pages/public/Home.tsx`
- Hero container: `aspect-[4/1]` becomes `aspect-[6/1]`
- Loading skeleton: `aspect-[4/1]` becomes `aspect-[6/1]`

**Home Manager (Admin)** - `src/pages/HomeManager.tsx`
- Label text: "Hero Image (4:1)" becomes "Hero Image (6:1)"
- Guidance text: "3840×960 or similar 4:1 ratio" becomes "3840×640 or similar 6:1 ratio"
- Preview container: `aspect-[4/1]` becomes `aspect-[6/1]`
- CropBoxPicker aspectRatio prop: `4` becomes `6`

### What Will NOT Change
- Collection pages (`PublicCollectionDetail.tsx`) - stays 4:1
- Collection editor (`CollectionEdit.tsx`) - stays 4:1
- `DirectImageUpload` component "banner" type - stays 4:1 (only used by collection editor now)

### Visual Comparison
```text
Current 4:1 ratio (example at 1200px width):
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    Hero Content                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
Height: 300px

New 6:1 ratio (example at 1200px width):
┌─────────────────────────────────────────────────────────┐
│                    Hero Content                         │
└─────────────────────────────────────────────────────────┘
Height: 200px
```

The 6:1 ratio reduces vertical space by 33% while maintaining the same full-width appearance.

### Technical Details

**Files to modify:**

1. `src/pages/public/Home.tsx`
   - Line 124: Skeleton `aspect-[4/1]` -> `aspect-[6/1]`
   - Line 218: Hero container `aspect-[4/1]` -> `aspect-[6/1]`

2. `src/pages/HomeManager.tsx`
   - Line 118: Label "Hero Image (4:1)" -> "Hero Image (6:1)"
   - Line 120: Guidance "3840×960 or similar 4:1" -> "3840×640 or similar 6:1"
   - Line 125: Preview container `aspect-[4/1]` -> `aspect-[6/1]`
   - Line 214: CropBoxPicker `aspectRatio={4}` -> `aspectRatio={6}`

**No database changes required** - the hero image URL and position are stored the same way; only the display ratio changes.

### Mobile Considerations
On mobile (e.g., 375px width):
- 4:1 = ~94px tall
- 6:1 = ~63px tall

The 6:1 ratio remains readable on mobile for text content but will be quite narrow. This is acceptable since you mentioned it's "just words" - the reduced height is the goal.
