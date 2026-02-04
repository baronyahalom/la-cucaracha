# 🐛 Buggy Store Dashboard

A Wix CLI app intentionally built with **9 bugs** for candidate technical evaluation.

## Purpose

This app is designed to evaluate candidates' ability to:
1. **Identify bugs** through Console, Network tab, and Visual inspection
2. **Research** Wix documentation to understand root causes
3. **Propose solutions** based on Wix best practices

## Installation

### Prerequisites
- Node.js 18+
- Wix CLI installed: `npm install -g @wix/cli`

### Setup

```bash
# Clone or navigate to this directory
cd la-cucarachl

# Install dependencies
npm install

# Login to Wix
wix login

# Start development server
npm run dev
```

### Deploy for Candidates

```bash
# Build and create a version
npm run release

# Get the share link from the Wix Dev Center
# Share this link with candidates to install the dashboard
```

## The 9 Intentional Bugs

| # | Bug | Category | Trigger |
|---|-----|----------|---------|
| 1 | Uncaught Promise - Empty Products | 🖥️ Console | Load dashboard with no products |
| 2 | Invalid Ricos Document | 🖥️ Console | Click "Create Blog Post" button |
| 3 | Deprecated API Warning | 🖥️ Console | Click "Search (V1 API)" button |
| 4 | Missing Elevated Permissions | 🌐 Network | Click "Add New Product" button |
| 5 | Media Import Not Awaited | 🌐 Network | Click "Import Image" button |
| 6 | Visitor Accessing Member-Only Data | 🌐 Network | Load dashboard (check console) |
| 7 | Variant ID vs Product ID | 🌐 Network | Click "Update Stock" on any product |
| 8 | Missing Product Images | 👁️ Visual | View any product card |
| 9 | Variant Stock "undefined" | 👁️ Visual | View products with size/color options |

## File Structure

```
la-cucarachl/
├── package.json
├── wix.config.json
├── tsconfig.json
├── astro.config.mjs
├── README.md
├── CANDIDATE_EVALUATION_GUIDE.md    # Full evaluation rubric
├── public/
│   └── main-widget-thumbnail.png
└── src/
    ├── extensions.ts                # Extension registry
    └── extensions/
        ├── dashboard/
        │   └── pages/
        │       └── my-page/         # 🐛 Buggy dashboard with 9 bugs
        │           ├── my-page.tsx
        │           └── my-page.extension.ts
        └── site/
            └── widgets/
                └── main-widget/     # Default widget template
```

## For Evaluators

See `CANDIDATE_EVALUATION_GUIDE.md` for:
- Detailed bug descriptions
- Expected solutions
- Documentation links
- Scoring rubric (100 points total)

## Bug Locations in Code

Each bug is clearly marked in `my-page.tsx` with:
- Line number
- Bug description
- What the fix should be
- Documentation reference

Example:
```typescript
// ============================================================
// BUG #1: UNCAUGHT PROMISE - EMPTY PRODUCTS
// ============================================================
// This code doesn't handle the case when the store has no products.
// ...
```

## Testing the Bugs

### Console Bugs (1-3)
1. Open browser DevTools → Console tab
2. Trigger the actions listed in the table above
3. Look for errors and warnings

### Network Bugs (4-7)
1. Open browser DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Trigger the actions and look for failed requests (4xx, 5xx)

### Visual Bugs (8-9)
1. Load the dashboard
2. Observe broken images and "undefined" stock values in product cards

## CLI Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build the app |
| `npm run preview` | Create preview deployment |
| `npm run release` | Release new version |
| `npm run generate` | Generate new extension |

## Do Not Fix

⚠️ **These bugs are intentional.** Do not fix them - they are the evaluation content.

If you need to update the app for other reasons, preserve the bugs as documented.

---

*For internal use - Wix Technical Evaluation Team*
