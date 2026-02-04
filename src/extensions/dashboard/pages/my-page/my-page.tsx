/**
 * 🐛 BUGGY STORE DASHBOARD
 * 
 * This dashboard page contains 9 INTENTIONAL BUGS for candidate technical evaluation.
 * 
 * Bug Categories:
 * - 🖥️ Console Bugs (1-3): Errors visible in browser DevTools Console
 * - 🌐 Network Bugs (4-7): Failed API requests visible in Network tab
 * - 👁️ Visual Bugs (8-9): UI issues visible on the page
 * 
 * DO NOT FIX THESE BUGS - They are the evaluation content!
 */

import React, { useState, useEffect, type FC } from 'react';
import {
  Page,
  WixDesignSystemProvider,
  Card,
  Box,
  Text,
  Button,
  Image,
  Badge,
  Divider,
  Loader,
  Layout,
  Cell,
  Heading,
  TextButton,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';

// Types
interface Product {
  _id: string;
  name: string;
  description?: string;
  price?: {
    price: number;
    currency: string;
  };
  media?: {
    mainMedia?: {
      image?: {
        url: string;
      };
    };
  };
  variants?: ProductVariant[];
  stock?: {
    quantity?: number;
    inStock?: boolean;
  };
}

interface ProductVariant {
  _id: string;
  choices?: Record<string, string>;
  stock?: {
    quantity?: number;
    inStock?: boolean;
  };
}

// Simulated Wix SDK imports (these would be real in production)
// In a real Wix app, these would be: import { products } from '@wix/stores';
const mockWixSDK = {
  stores: {
    products: {
      queryProducts: async () => {
        // Simulates returning products from the store
        return {
          items: [] as Product[], // Empty array simulates store with no products
          totalCount: 0
        };
      },
      createProduct: async (_productData: unknown) => {
        // Simulates creating a product - will fail without elevated permissions
        throw new Error('FORBIDDEN: This action requires elevated permissions. Missing: STORES.PRODUCTS.CREATE');
      },
      updateInventory: async (productId: string, _quantity: number) => {
        // Simulates inventory update - expects variant ID, not product ID
        throw new Error(`INVALID_ARGUMENT: Inventory item not found for id: ${productId}. Use variant ID instead of product ID.`);
      }
    },
    // Deprecated V1 API - will show deprecation warning
    searchProducts: async (_query: string) => {
      console.warn('[DEPRECATION WARNING] stores.searchProducts is deprecated. Use stores.products.queryProducts() with filters instead. See: https://dev.wix.com/docs/sdk/backend-modules/stores/products/query-products');
      return { items: [] };
    }
  },
  blog: {
    createDraftPost: async (post: { title: string; richContent?: unknown }) => {
      // Validates Ricos document structure
      const richContent = post.richContent as { nodes?: unknown[] } | undefined;
      if (!richContent?.nodes || !Array.isArray(richContent.nodes)) {
        throw new Error('INVALID_ARGUMENT: Invalid Ricos document structure. richContent must have a "nodes" array. See: https://dev.wix.com/docs/sdk/articles/working-with-ricos');
      }
      return { draftPost: { _id: 'draft-123' } };
    }
  },
  members: {
    getCurrentMember: async () => {
      // Simulates member-only data access - fails for visitors
      throw new Error('FORBIDDEN: This action requires member authentication. Current user is a visitor.');
    }
  },
  media: {
    importFile: async (_url: string) => {
      // Returns a promise that resolves after a delay (simulating async upload)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ file: { _id: 'file-123', url: 'https://static.wixstatic.com/imported-file.jpg' } });
        }, 2000);
      });
    }
  }
};

// ============================================================
// THE DASHBOARD PAGE COMPONENT WITH 9 INTENTIONAL BUGS
// ============================================================

const DashboardPage: FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [_memberInfo, setMemberInfo] = useState<unknown>(null);
  const [importedImageUrl, setImportedImageUrl] = useState<string>('');

  // ============================================================
  // BUG #1: UNCAUGHT PROMISE - EMPTY PRODUCTS
  // ============================================================
  // This code doesn't handle the case when the store has no products.
  // When products array is empty, accessing products[0].name throws.
  // 
  // FIX: Check if products.length > 0 before accessing products[0]
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/stores/products/query-products
  // ============================================================
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await mockWixSDK.stores.products.queryProducts();
        setProducts(result.items);
        
        // BUG #1: Accessing first product without checking if array is empty
        const firstProduct = result.items[0];
        console.log('Featured product:', firstProduct.name); // 💥 CRASHES when no products!
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load products:', err);
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // ============================================================
  // BUG #6: VISITOR ACCESSING MEMBER-ONLY DATA
  // ============================================================
  // This code tries to fetch member data on page load, but visitors
  // (non-logged-in users) cannot access member data.
  // 
  // FIX: Check authentication status before calling getCurrentMember()
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/members/current-member
  // ============================================================
  useEffect(() => {
    const loadMemberInfo = async () => {
      // BUG #6: No check for whether user is logged in
      const member = await mockWixSDK.members.getCurrentMember();
      setMemberInfo(member);
    };
    loadMemberInfo(); // 💥 FAILS for visitors!
  }, []);

  // ============================================================
  // BUG #2: INVALID RICOS DOCUMENT
  // ============================================================
  // Creates a blog post with invalid Ricos document structure.
  // The richContent object is missing the required "nodes" array.
  // 
  // FIX: Provide valid Ricos document with nodes array
  // DOCS: https://dev.wix.com/docs/sdk/articles/working-with-ricos
  // ============================================================
  const handleCreateBlogPost = async () => {
    try {
      // BUG #2: Invalid Ricos document structure
      await mockWixSDK.blog.createDraftPost({
        title: 'New Product Announcement',
        richContent: {
          // Missing "nodes" array - this is invalid!
          content: 'Check out our new products!' // 💥 Wrong structure!
        }
      });
      alert('Blog post created!');
    } catch (err) {
      console.error('Failed to create blog post:', err);
    }
  };

  // ============================================================
  // BUG #3: DEPRECATED API WARNING
  // ============================================================
  // Uses the deprecated V1 searchProducts API instead of the
  // current queryProducts with filters.
  // 
  // FIX: Use products.queryProducts() with filter instead
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/stores/products/query-products
  // ============================================================
  const handleSearchV1 = async () => {
    // BUG #3: Using deprecated API - shows warning in console
    const results = await mockWixSDK.stores.searchProducts('shirt');
    console.log('Search results:', results);
  };

  // ============================================================
  // BUG #4: MISSING ELEVATED PERMISSIONS
  // ============================================================
  // Tries to create a product from client-side code without
  // elevated permissions. Write operations require backend code
  // with suppressAuth or proper permissions.
  // 
  // FIX: Move to backend function with elevated permissions
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/stores/products/create-product
  // ============================================================
  const handleAddProduct = async () => {
    try {
      // BUG #4: Creating product without elevated permissions
      await mockWixSDK.stores.products.createProduct({
        name: 'New T-Shirt',
        price: { price: 29.99, currency: 'USD' }
      }); // 💥 FAILS without elevated permissions!
      alert('Product created!');
    } catch (err) {
      console.error('Failed to create product:', err);
    }
  };

  // ============================================================
  // BUG #5: MEDIA IMPORT NOT AWAITED
  // ============================================================
  // Starts media import but doesn't await the result.
  // The URL is used before the import completes.
  // 
  // FIX: Await the importFile promise before using the URL
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/media/media-manager
  // ============================================================
  const handleImportImage = async () => {
    const externalImageUrl = 'https://example.com/product-photo.jpg';
    
    // BUG #5: Not awaiting the import - uses undefined URL
    const importResult = mockWixSDK.media.importFile(externalImageUrl);
    
    // This runs immediately, before import completes!
    // importResult is a Promise, not the actual result
    console.log('Import result:', importResult); // 💥 Logs Promise, not result!
    
    // @ts-ignore - intentionally wrong to demonstrate the bug
    setImportedImageUrl(importResult?.file?.url || 'Import failed - URL undefined');
    
    alert('Image import started (but not completed - check console!)');
  };

  // ============================================================
  // BUG #7: VARIANT ID VS PRODUCT ID
  // ============================================================
  // Uses product ID instead of variant ID when updating inventory.
  // The inventory API requires the variant/inventory item ID.
  // 
  // FIX: Use variant._id or inventory item ID, not product._id
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/stores/inventory
  // ============================================================
  const handleUpdateStock = async (product: Product) => {
    try {
      // BUG #7: Using product ID instead of variant ID
      await mockWixSDK.stores.products.updateInventory(
        product._id, // 💥 Wrong! Should be variant ID
        100
      );
      alert('Stock updated!');
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  // Sample products for visual bug demonstration
  const sampleProducts: Product[] = [
    {
      _id: 'prod-1',
      name: 'Classic T-Shirt',
      description: 'A comfortable cotton t-shirt',
      price: { price: 29.99, currency: 'USD' },
      // BUG #8: Missing media/mainMedia - image will be broken
      media: undefined,
      variants: [
        { _id: 'var-1', choices: { Size: 'S', Color: 'Blue' }, stock: { quantity: 10, inStock: true } },
        { _id: 'var-2', choices: { Size: 'M', Color: 'Red' } }, // BUG #9: Missing stock object
        { _id: 'var-3', choices: { Size: 'L' }, stock: undefined }, // BUG #9: stock is undefined
      ]
    },
    {
      _id: 'prod-2',
      name: 'Hoodie Deluxe',
      description: 'Premium quality hoodie',
      price: { price: 59.99, currency: 'USD' },
      // BUG #8: mainMedia exists but image is undefined
      media: { mainMedia: { image: undefined } },
      variants: [
        { _id: 'var-4', choices: { Size: 'M' } }, // BUG #9: No stock at all
      ]
    },
    {
      _id: 'prod-3',
      name: 'Running Shoes',
      description: 'Lightweight running shoes',
      price: { price: 89.99, currency: 'USD' },
      media: { mainMedia: { image: { url: 'https://static.wixstatic.com/media/valid-image.jpg' } } },
      stock: { quantity: 25, inStock: true }
    }
  ];

  // ============================================================
  // RENDER - Contains Visual Bugs #8 and #9
  // ============================================================

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="🐛 Buggy Store Dashboard"
          subtitle="A dashboard with 9 intentional bugs for technical evaluation"
          actionsBar={
            <Box gap="SP2">
              <Button size="small" skin="inverted" onClick={handleCreateBlogPost}>
                📝 Create Blog Post
              </Button>
              <Button size="small" skin="inverted" onClick={handleSearchV1}>
                🔍 Search (V1 API)
              </Button>
              <Button size="small" skin="inverted" onClick={handleAddProduct}>
                ➕ Add New Product
              </Button>
              <Button size="small" skin="inverted" onClick={handleImportImage}>
                🖼️ Import Image
              </Button>
            </Box>
          }
        />
        <Page.Content>
          {loading ? (
            <Box align="center" padding="SP10">
              <Loader size="medium" />
            </Box>
          ) : (
            <Layout>
              {/* Bug Reference Card */}
              <Cell span={12}>
                <Card>
                  <Card.Header
                    title="Bug Reference Guide"
                    subtitle="Open DevTools to find these bugs"
                  />
                  <Card.Divider />
                  <Card.Content>
                    <Box direction="horizontal" gap="SP6">
                      <Box direction="vertical" gap="SP2">
                        <Text weight="bold">🖥️ Console Bugs (1-3)</Text>
                        <Text size="small" secondary>• Bug #1: Load page → undefined error</Text>
                        <Text size="small" secondary>• Bug #2: Click "Create Blog Post"</Text>
                        <Text size="small" secondary>• Bug #3: Click "Search (V1 API)"</Text>
                      </Box>
                      <Box direction="vertical" gap="SP2">
                        <Text weight="bold">🌐 Network Bugs (4-7)</Text>
                        <Text size="small" secondary>• Bug #4: Click "Add New Product"</Text>
                        <Text size="small" secondary>• Bug #5: Click "Import Image"</Text>
                        <Text size="small" secondary>• Bug #6: Check console on load</Text>
                        <Text size="small" secondary>• Bug #7: Click "Update Stock"</Text>
                      </Box>
                      <Box direction="vertical" gap="SP2">
                        <Text weight="bold">👁️ Visual Bugs (8-9)</Text>
                        <Text size="small" secondary>• Bug #8: Broken product images</Text>
                        <Text size="small" secondary>• Bug #9: "undefined" stock values</Text>
                      </Box>
                    </Box>
                  </Card.Content>
                </Card>
              </Cell>

              {/* Imported Image Result */}
              {importedImageUrl && (
                <Cell span={12}>
                  <Card>
                    <Card.Content>
                      <Text weight="bold">Imported Image URL: </Text>
                      <Text secondary>{importedImageUrl}</Text>
                    </Card.Content>
                  </Card>
                </Cell>
              )}

              {/* Section Title */}
              <Cell span={12}>
                <Box paddingTop="SP4">
                  <Heading size="small">Products</Heading>
                </Box>
              </Cell>

              {/* Product Cards - Show Visual Bugs */}
              {sampleProducts.map((product) => (
                <Cell key={product._id} span={4}>
                  <Card>
                    {/* ============================================================ */}
                    {/* BUG #8: MISSING PRODUCT IMAGES */}
                    {/* ============================================================ */}
                    {/* Directly accessing nested property without null checks */}
                    {/* Results in broken image when media is undefined */}
                    {/* */}
                    {/* FIX: Use optional chaining and provide fallback image */}
                    {/* ============================================================ */}
                    <Box height="150px" backgroundColor="D70">
                      <Image
                        src={product.media?.mainMedia?.image?.url} // 💥 Can be undefined!
                        alt={product.name}
                        width="100%"
                        height="150px"
                        fit="cover"
                      />
                    </Box>
                    <Card.Header
                      title={product.name}
                      subtitle={`$${product.price?.price?.toFixed(2)} ${product.price?.currency}`}
                      suffix={
                        <Badge skin="success">
                          {product.stock?.inStock ? 'In Stock' : 'Check Variants'}
                        </Badge>
                      }
                    />
                    <Card.Divider />
                    <Card.Content>
                      {/* ============================================================ */}
                      {/* BUG #9: VARIANT STOCK "undefined" */}
                      {/* ============================================================ */}
                      {/* Directly accessing variant.stock.quantity without checks */}
                      {/* Shows "undefined" when stock object is missing */}
                      {/* */}
                      {/* FIX: Check if stock exists before accessing quantity */}
                      {/* ============================================================ */}
                      {product.variants && product.variants.length > 0 && (
                        <Box direction="vertical" gap="SP2" marginBottom="SP3">
                          <Text size="small" weight="bold">Variants:</Text>
                          {product.variants.map((variant) => (
                            <Box key={variant._id} direction="horizontal" gap="SP2" align="center">
                              <Text size="tiny">
                                {Object.values(variant.choices || {}).join(' / ') || 'Default'}
                              </Text>
                              <Badge size="tiny" skin="danger">
                                {/* BUG #9: Shows "undefined" when stock is missing */}
                                Stock: {variant.stock?.quantity} {/* 💥 Shows "undefined"! */}
                              </Badge>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {product.stock && (
                        <Text size="small" secondary>
                          Total Stock: {product.stock.quantity} units
                        </Text>
                      )}
                      
                      <Divider />
                      
                      <Box paddingTop="SP2">
                        <TextButton
                          size="small"
                          onClick={() => handleUpdateStock(product)}
                        >
                          📦 Update Stock (Bug #7)
                        </TextButton>
                      </Box>
                    </Card.Content>
                  </Card>
                </Cell>
              ))}

              {/* Empty state when no real products */}
              {products.length === 0 && (
                <Cell span={12}>
                  <Card>
                    <Card.Content>
                      <Box align="center" padding="SP6">
                        <Text secondary>
                          No products loaded from store (Bug #1 triggered on load)
                        </Text>
                      </Box>
                    </Card.Content>
                  </Card>
                </Cell>
              )}
            </Layout>
          )}
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
