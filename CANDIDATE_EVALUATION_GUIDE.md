# 📋 Candidate Evaluation Guide

## Buggy Store Dashboard - Technical Evaluation

### Overview

This guide provides detailed information for evaluators on the 9 intentional bugs in the Store Dashboard widget, expected solutions, and a scoring rubric.

---

## Scoring Summary

| Category | Points | Bugs |
|----------|--------|------|
| 🖥️ Console Bugs | 30 | #1, #2, #3 |
| 🌐 Network Bugs | 45 | #4, #5, #6, #7 |
| 👁️ Visual Bugs | 25 | #8, #9 |
| **Total** | **100** | |

---

## Detailed Bug Descriptions

### 🖥️ Console Bugs (30 points)

#### Bug #1: Uncaught Promise - Empty Products (10 points)

**Trigger:** Load the widget on a store with no products

**Error Seen:**
```
Uncaught TypeError: Cannot read properties of undefined (reading 'name')
```

**Root Cause:**
```typescript
const firstProduct = result.items[0];
console.log('Featured product:', firstProduct.name); // Crashes when items is empty!
```

**Expected Fix:**
```typescript
if (result.items.length > 0) {
  const firstProduct = result.items[0];
  console.log('Featured product:', firstProduct.name);
}
```

**Documentation:**
- [Query Products API](https://dev.wix.com/docs/sdk/backend-modules/stores/products/query-products)

**Scoring:**
- Identifies the bug: 3 points
- Explains root cause: 3 points
- Proposes correct fix: 4 points

---

#### Bug #2: Invalid Ricos Document (10 points)

**Trigger:** Click "Create Blog Post" button

**Error Seen:**
```
Error: INVALID_ARGUMENT: Invalid Ricos document structure. richContent must have a "nodes" array.
```

**Root Cause:**
```typescript
await mockWixSDK.blog.createDraftPost({
  title: 'New Product Announcement',
  richContent: {
    content: 'Check out our new products!' // Wrong! Missing nodes array
  }
});
```

**Expected Fix:**
```typescript
await wixBlog.createDraftPost({
  title: 'New Product Announcement',
  richContent: {
    nodes: [
      {
        type: 'PARAGRAPH',
        nodes: [
          {
            type: 'TEXT',
            textData: { text: 'Check out our new products!' }
          }
        ]
      }
    ]
  }
});
```

**Documentation:**
- [Working with Ricos](https://dev.wix.com/docs/sdk/articles/working-with-ricos)
- [Create Draft Post](https://dev.wix.com/docs/sdk/backend-modules/blog/draft-posts/create-draft-post)

**Scoring:**
- Identifies the bug: 3 points
- Explains Ricos structure: 3 points
- Proposes correct document format: 4 points

---

#### Bug #3: Deprecated API Warning (10 points)

**Trigger:** Click "Search (V1 API)" button

**Warning Seen:**
```
[DEPRECATION WARNING] stores.searchProducts is deprecated. Use stores.products.queryProducts() with filters instead.
```

**Root Cause:**
```typescript
// Using deprecated V1 API
const results = await mockWixSDK.stores.searchProducts('shirt');
```

**Expected Fix:**
```typescript
// Use modern queryProducts with filter
const results = await wixStores.products.queryProducts()
  .contains('name', 'shirt')
  .find();
```

**Documentation:**
- [Query Products](https://dev.wix.com/docs/sdk/backend-modules/stores/products/query-products)
- [Migration Guide](https://dev.wix.com/docs/sdk/articles/migration-guides/stores-v3-migration)

**Scoring:**
- Identifies the deprecation: 3 points
- Understands why deprecated: 3 points
- Proposes modern API usage: 4 points

---

### 🌐 Network Bugs (45 points)

#### Bug #4: Missing Elevated Permissions (12 points)

**Trigger:** Click "Add New Product" button

**Error Seen (Network tab):**
```
403 Forbidden
Error: FORBIDDEN: This action requires elevated permissions. Missing: STORES.PRODUCTS.CREATE
```

**Root Cause:**
```typescript
// Client-side code trying to create product
await mockWixSDK.stores.products.createProduct({
  name: 'New T-Shirt',
  price: { price: 29.99, currency: 'USD' }
});
```

**Expected Fix:**
Create a backend function with elevated permissions:

```typescript
// backend/products.ts
import { products } from '@wix/stores';
import { Permissions, webMethod } from '@wix/web-methods';

export const createProductElevated = webMethod(
  Permissions.Admin,
  async (productData) => {
    return products.createProduct(productData);
  }
);
```

**Documentation:**
- [Elevated Permissions](https://dev.wix.com/docs/sdk/articles/about-permissions)
- [Web Methods](https://dev.wix.com/docs/sdk/articles/web-methods)

**Scoring:**
- Identifies permission issue: 4 points
- Understands client vs backend: 4 points
- Proposes backend solution: 4 points

---

#### Bug #5: Media Import Not Awaited (11 points)

**Trigger:** Click "Import Image" button

**Issue Seen (Console):**
```
Import result: Promise { <pending> }
```

**Root Cause:**
```typescript
// Not awaiting the async import
const importResult = mockWixSDK.media.importFile(externalImageUrl);
console.log('Import result:', importResult); // Logs Promise, not result!
setImportedImageUrl(importResult?.file?.url); // undefined!
```

**Expected Fix:**
```typescript
// Await the import result
const importResult = await wixMedia.importFile(externalImageUrl);
console.log('Import result:', importResult);
setImportedImageUrl(importResult.file.url);
```

**Documentation:**
- [Media Manager](https://dev.wix.com/docs/sdk/backend-modules/media/media-manager)
- [Import File](https://dev.wix.com/docs/sdk/backend-modules/media/media-manager/import-file)

**Scoring:**
- Identifies missing await: 4 points
- Understands async/await: 3 points
- Proposes correct fix: 4 points

---

#### Bug #6: Visitor Accessing Member-Only Data (11 points)

**Trigger:** Load the widget as a visitor (not logged in)

**Error Seen (Network tab):**
```
403 Forbidden
Error: FORBIDDEN: This action requires member authentication. Current user is a visitor.
```

**Root Cause:**
```typescript
useEffect(() => {
  const loadMemberInfo = async () => {
    // No check for authentication status
    const member = await mockWixSDK.members.getCurrentMember();
    setMemberInfo(member);
  };
  loadMemberInfo(); // Fails for visitors!
}, []);
```

**Expected Fix:**
```typescript
useEffect(() => {
  const loadMemberInfo = async () => {
    try {
      // Check if user is logged in first
      const isLoggedIn = await wixAuth.loggedIn();
      if (isLoggedIn) {
        const member = await wixMembers.getCurrentMember();
        setMemberInfo(member);
      }
    } catch (err) {
      console.log('User is not logged in');
    }
  };
  loadMemberInfo();
}, []);
```

**Documentation:**
- [Current Member](https://dev.wix.com/docs/sdk/backend-modules/members/current-member)
- [Authentication](https://dev.wix.com/docs/sdk/backend-modules/members/authentication)

**Scoring:**
- Identifies auth issue: 4 points
- Understands visitor vs member: 3 points
- Proposes auth check solution: 4 points

---

#### Bug #7: Variant ID vs Product ID (11 points)

**Trigger:** Click "Update Stock" on any product

**Error Seen (Network tab):**
```
400 Bad Request
Error: INVALID_ARGUMENT: Inventory item not found for id: prod-1. Use variant ID instead of product ID.
```

**Root Cause:**
```typescript
const handleUpdateStock = async (product: Product) => {
  await mockWixSDK.stores.products.updateInventory(
    product._id, // Wrong! This is product ID
    100
  );
};
```

**Expected Fix:**
```typescript
const handleUpdateStock = async (product: Product, variantId: string) => {
  // Use variant ID for inventory updates
  await wixStores.inventory.updateInventoryVariants([
    {
      variantId: variantId, // Correct! Use variant ID
      incrementBy: 100
    }
  ]);
};
```

**Documentation:**
- [Inventory API](https://dev.wix.com/docs/sdk/backend-modules/stores/inventory)
- [Update Inventory Variants](https://dev.wix.com/docs/sdk/backend-modules/stores/inventory/update-inventory-variants)

**Scoring:**
- Identifies wrong ID type: 4 points
- Understands product vs variant: 3 points
- Proposes correct API usage: 4 points

---

### 👁️ Visual Bugs (25 points)

#### Bug #8: Missing Product Images (12 points)

**Trigger:** View product cards in the widget

**Issue:** Product images show as broken/missing icons

**Root Cause:**
```typescript
<img 
  src={product.media?.mainMedia?.image?.url} // Can be undefined!
  alt={product.name}
/>
```

When `media`, `mainMedia`, or `image` is undefined, the `src` becomes `undefined`, resulting in a broken image.

**Expected Fix:**
```typescript
const DEFAULT_IMAGE = 'https://static.wixstatic.com/media/placeholder.png';

<img 
  src={product.media?.mainMedia?.image?.url || DEFAULT_IMAGE}
  alt={product.name}
  onError={(e) => {
    e.currentTarget.src = DEFAULT_IMAGE;
  }}
/>
```

**Documentation:**
- [Product Media](https://dev.wix.com/docs/sdk/backend-modules/stores/products)

**Scoring:**
- Identifies the visual issue: 4 points
- Explains null/undefined chain: 4 points
- Proposes fallback solution: 4 points

---

#### Bug #9: Variant Stock "undefined" (13 points)

**Trigger:** View products with variants (sizes, colors)

**Issue:** Stock badge shows "Stock: undefined" for some variants

**Root Cause:**
```typescript
{product.variants.map((variant) => (
  <span>Stock: {variant.stock?.quantity}</span> // Shows "undefined"!
))}
```

When `variant.stock` doesn't exist or `quantity` is undefined, it renders "undefined".

**Expected Fix:**
```typescript
{product.variants.map((variant) => (
  <span>
    Stock: {variant.stock?.quantity ?? 'N/A'}
    {/* Or show "Out of Stock" when quantity is 0 */}
  </span>
))}
```

**Alternative Fix:**
```typescript
const getStockDisplay = (variant: ProductVariant) => {
  if (!variant.stock) return 'Not tracked';
  if (variant.stock.quantity === undefined) return 'N/A';
  if (variant.stock.quantity === 0) return 'Out of Stock';
  return variant.stock.quantity.toString();
};

<span>Stock: {getStockDisplay(variant)}</span>
```

**Documentation:**
- [Product Variants](https://dev.wix.com/docs/sdk/backend-modules/stores/products)
- [Variant Stock](https://dev.wix.com/docs/sdk/backend-modules/stores/inventory)

**Scoring:**
- Identifies the visual issue: 4 points
- Explains why undefined renders: 4 points
- Proposes graceful handling: 5 points

---

## Evaluation Rubric

### Grading Scale

| Score | Rating | Description |
|-------|--------|-------------|
| 90-100 | Excellent | Found all bugs, deep understanding, perfect solutions |
| 75-89 | Good | Found most bugs, solid understanding, working solutions |
| 60-74 | Satisfactory | Found key bugs, basic understanding, partial solutions |
| 45-59 | Needs Improvement | Found some bugs, limited understanding |
| < 45 | Unsatisfactory | Struggled to find bugs or propose solutions |

### Bonus Points (Up to 10)

Award bonus points for:
- **+2:** Using Wix documentation proactively
- **+2:** Explaining edge cases
- **+3:** Suggesting preventive measures (TypeScript strict mode, ESLint rules)
- **+3:** Proposing comprehensive error handling strategies

### Time Guidelines

- **Expected time:** 45-60 minutes
- **Junior candidates:** May need hints after 30 minutes
- **Senior candidates:** Should complete independently

---

## Interview Tips

### Good Signs
- Opens DevTools immediately
- Systematically checks Console, Network, then Visual
- References Wix documentation
- Explains the "why" not just the "what"
- Considers edge cases in fixes

### Red Flags
- Ignores error messages
- Proposes fixes without understanding root cause
- Doesn't know about async/await
- Can't navigate Wix documentation
- Unable to distinguish client vs backend code

---

## Quick Reference

| Bug | Location in Code | File |
|-----|-----------------|------|
| #1 | `loadProducts()` useEffect | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #2 | `handleCreateBlogPost()` | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #3 | `handleSearchV1()` | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #4 | `handleAddProduct()` | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #5 | `handleImportImage()` | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #6 | `loadMemberInfo()` useEffect | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #7 | `handleUpdateStock()` | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #8 | Product card `<Image>` | `src/extensions/dashboard/pages/my-page/my-page.tsx` |
| #9 | Variant stock Badge | `src/extensions/dashboard/pages/my-page/my-page.tsx` |

All bugs are in the dashboard page component file.

---

*For internal use - Wix Technical Evaluation Team*
