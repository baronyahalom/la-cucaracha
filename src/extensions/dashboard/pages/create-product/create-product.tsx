/**
 * 🐛 CREATE PRODUCT PAGE
 * 
 * This page contains the SAME BUG as the "Add New Product" button
 * on the main dashboard (Bug #4: Missing Elevated Permissions).
 * 
 * The form looks complete and professional, but submitting it will fail
 * because createProduct requires elevated permissions that can only be
 * granted in backend code.
 */

import React, { useState, type FC, type ChangeEvent, type FormEvent } from 'react';
import {
  Page,
  WixDesignSystemProvider,
  Card,
  Box,
  Text,
  Button,
  FormField,
  Input,
  InputArea,
  NumberInput,
  Dropdown,
  ImageViewer,
  Divider,
  Heading,
  Cell,
  Layout,
  SectionHelper,
  ToggleSwitch,
  AddItem,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';

// Pricing page URL with intentional bug in app ID
const UPGRADE_URL = 'https://www.wix.com/apps/upgrade/0a2f-THIS-IS-A-BUG-jdk4?appInstanceId=d546f2f9-94e4-4257-b2bd-ce224d1158f4';

// Types for product form
interface ProductFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  weight: number;
  weightUnit: string;
  imageUrl: string;
  manageInventory: boolean;
  stockQuantity: number;
  trackInventory: boolean;
  productType: string;
  ribbon: string;
}

// Simulated Wix SDK (same mock as main dashboard)
const mockWixSDK = {
  stores: {
    products: {
      createProduct: async (_productData: unknown) => {
        // Simulates creating a product - will fail without elevated permissions
        throw new Error('FORBIDDEN: This action requires permission. Missing: STORES.PRODUCTS.CREATE');
      }
    },
    // BUG #3: Deprecated Catalog V1 API - will show error in console
    searchProducts: async (_query: string) => {
      console.error('[ERROR] stores.searchProducts (Catalog V1) is deprecated and no longer supported. Use stores.products.queryProducts() (Catalog V3) instead.');
      // Returns empty array because V1 API is deprecated
      return { items: [] };
    }
  },
  media: {
    importFile: async (_url: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ file: { _id: 'file-123', url: 'https://static.wixstatic.com/imported-file.jpg' } });
        }, 2000);
      });
    }
  }
};

// Related product type
interface RelatedProduct {
  _id: string;
  name: string;
  price?: { price: number; currency: string };
}

// Currency options
const currencyOptions = [
  { id: 'USD', value: 'USD - US Dollar' },
  { id: 'EUR', value: 'EUR - Euro' },
  { id: 'GBP', value: 'GBP - British Pound' },
  { id: 'ILS', value: 'ILS - Israeli Shekel' },
  { id: 'JPY', value: 'JPY - Japanese Yen' },
];

// Weight unit options
const weightUnitOptions = [
  { id: 'kg', value: 'Kilograms (kg)' },
  { id: 'lb', value: 'Pounds (lb)' },
  { id: 'oz', value: 'Ounces (oz)' },
  { id: 'g', value: 'Grams (g)' },
];

// Product type options
const productTypeOptions = [
  { id: 'physical', value: 'Physical Product' },
  { id: 'digital', value: 'Digital Product' },
  { id: 'service', value: 'Service' },
];

const CreateProductPage: FC = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    sku: '',
    weight: 0,
    weightUnit: 'kg',
    imageUrl: '',
    manageInventory: true,
    stockQuantity: 0,
    trackInventory: true,
    productType: 'physical',
    ribbon: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Related products state
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [selectedRelatedProducts, setSelectedRelatedProducts] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);

  // ============================================================
  // BUG #3: DEPRECATED API ERROR
  // ============================================================
  // Uses the deprecated V1 searchProducts API instead of the
  // current queryProducts with filters.
  // 
  // FIX: Use products.queryProducts() with filter instead
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/stores/products/query-products
  // ============================================================
  const loadRelatedProducts = async () => {
    setIsLoadingProducts(true);
    
    // BUG #3: Using deprecated API - shows ERROR in console
    const results = await mockWixSDK.stores.searchProducts('all');
    setRelatedProducts(results.items);
    
    setIsLoadingProducts(false);
    setHasLoadedProducts(true);
  };

  const handleRelatedProductSelect = (option: { id: string | number }) => {
    const productId = String(option.id);
    if (!selectedRelatedProducts.includes(productId)) {
      setSelectedRelatedProducts(prev => [...prev, productId]);
    }
  };

  const handleRemoveRelatedProduct = (productId: string) => {
    setSelectedRelatedProducts(prev => prev.filter(id => id !== productId));
  };

  // Handle form field changes
  const handleInputChange = (field: keyof ProductFormData) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setErrorMessage(null);
  };

  const handleNumberChange = (field: keyof ProductFormData) => (value: number | null) => {
    setFormData(prev => ({ ...prev, [field]: value || 0 }));
    setErrorMessage(null);
  };

  const handleDropdownChange = (field: keyof ProductFormData) => (option: { id: string | number }) => {
    setFormData(prev => ({ ...prev, [field]: String(option.id) }));
  };

  const handleToggleChange = (field: keyof ProductFormData) => () => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ============================================================
  // BUG #4 (SAME AS MAIN DASHBOARD): MISSING ELEVATED PERMISSIONS
  // ============================================================
  // This form submits product data but fails because createProduct
  // requires elevated permissions that only backend code can have.
  // 
  // FIX: Move to backend function with elevated permissions
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/stores/products/create-product
  // ============================================================
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Product name is required');
      }
      if (formData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Build the product data structure
      const productData = {
        name: formData.name,
        description: formData.description,
        priceData: {
          price: formData.price,
          currency: formData.currency,
        },
        sku: formData.sku,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
        productType: formData.productType,
        ribbon: formData.ribbon,
        manageVariants: false,
        ...(formData.imageUrl && {
          media: {
            items: [{
              image: {
                url: formData.imageUrl,
                altText: formData.name,
              }
            }]
          }
        }),
        ...(formData.manageInventory && {
          stock: {
            trackInventory: formData.trackInventory,
            quantity: formData.stockQuantity,
          }
        })
      };

      console.log('Attempting to create product with data:', productData);

      // BUG #4: Creating product without elevated permissions
      // This will FAIL because client-side code cannot create products
      await mockWixSDK.stores.products.createProduct(productData);

      // This alert will never be reached due to the bug
      alert('Product created successfully!');
      
    } catch (err) {
      const error = err as Error;
      console.error('Failed to create product:', error);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Create New Product"
          subtitle="Add a new product to your store"
          actionsBar={
            <Box gap="SP2">
              <Button
                skin="premium"
                size="medium"
                onClick={() => window.open(UPGRADE_URL, '_blank')}
              >
                Upgrade
              </Button>
              <Button
                skin="inverted"
                size="medium"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                skin="standard"
                size="medium"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </Box>
          }
        />
        <Page.Content>
          <form onSubmit={handleSubmit}>
            <Layout>              

             

              {/* Basic Info Card */}
              <Cell span={8}>
                <Card>
                  <Card.Header title="Basic Information" />
                  <Card.Divider />
                  <Card.Content>
                    <Box direction="vertical" gap="SP4">
                      <FormField label="Product Name" required>
                        <Input
                          value={formData.name}
                          onChange={handleInputChange('name')}
                          placeholder="Enter product name"
                          status={!formData.name.trim() && errorMessage ? 'error' : undefined}
                        />
                      </FormField>

                      <FormField label="Description">
                        <InputArea
                          value={formData.description}
                          onChange={handleInputChange('description')}
                          placeholder="Describe your product..."
                          rows={4}
                          resizable
                        />
                      </FormField>

                      <FormField label="Ribbon (Badge)">
                        <Input
                          value={formData.ribbon}
                          onChange={handleInputChange('ribbon')}
                          placeholder="e.g., Sale, New, Best Seller"
                        />
                      </FormField>
                    </Box>
                  </Card.Content>
                </Card>

                {/* Pricing Card */}
                <Box marginTop="SP4">
                  <Card>
                    <Card.Header title="Pricing" />
                    <Card.Divider />
                    <Card.Content>
                      <Box direction="vertical" gap="SP4">
                        <Box direction="horizontal" gap="SP4">
                          <Box width="60%">
                            <FormField label="Price" required>
                              <NumberInput
                                value={formData.price}
                                onChange={handleNumberChange('price')}
                                min={0}
                                step={0.01}
                                prefix={
                                  <Text size="small" secondary>
                                    {formData.currency === 'USD' ? '$' : 
                                     formData.currency === 'EUR' ? '€' : 
                                     formData.currency === 'GBP' ? '£' : 
                                     formData.currency === 'ILS' ? '₪' : '¥'}
                                  </Text>
                                }
                              />
                            </FormField>
                          </Box>
                          <Box width="40%">
                            <FormField label="Currency">
                              <Dropdown
                                selectedId={formData.currency}
                                onSelect={handleDropdownChange('currency')}
                                options={currencyOptions}
                              />
                            </FormField>
                          </Box>
                        </Box>

                        <FormField label="SKU (Stock Keeping Unit)">
                          <Input
                            value={formData.sku}
                            onChange={handleInputChange('sku')}
                            placeholder="e.g., TSHIRT-BLU-M"
                          />
                        </FormField>
                      </Box>
                    </Card.Content>
                  </Card>
                </Box>
              </Cell>

              {/* Side Column */}
              <Cell span={4}>
                {/* Product Type Card */}
                <Card>
                  <Card.Header title="Product Type" />
                  <Card.Divider />
                  <Card.Content>
                    <FormField label="Type">
                      <Dropdown
                        selectedId={formData.productType}
                        onSelect={handleDropdownChange('productType')}
                        options={productTypeOptions}
                      />
                    </FormField>
                  </Card.Content>
                </Card>
                {/* Product Image Card */}
                <Box marginTop="SP4">
                  <Card>
                    <Card.Header title="Product Image" />
                    <Card.Divider />
                    <Card.Content>
                      <Box direction="vertical" gap="SP4">
                        {formData.imageUrl ? (
                          <Box direction="vertical" gap="SP2">
                            <ImageViewer
                              imageUrl={formData.imageUrl}
                              width="100%"
                              height={200}
                              onRemoveImage={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                            />
                          </Box>
                        ) : (
                          <AddItem
                            theme="image"
                            size="large"
                            onClick={() => {
                              const url = prompt('Enter image URL:');
                              if (url) {
                                setFormData(prev => ({ ...prev, imageUrl: url }));
                              }
                            }}
                          >
                            Add Image
                          </AddItem>
                        )}

                        <FormField label="Or enter image URL">
                          <Input
                            value={formData.imageUrl}
                            onChange={handleInputChange('imageUrl')}
                            placeholder="https://example.com/image.jpg"
                          />
                        </FormField>
                      </Box>
                    </Card.Content>
                  </Card>
                </Box>

                {/* Related Products Card - BUG #3 */}
                <Box marginTop="SP4">
                  <Card>
                    <Card.Header 
                      title="Related Products" 
                      subtitle="Link products that go well together"
                    />
                    <Card.Divider />
                    <Card.Content>
                      <Box direction="vertical" gap="SP4">
                        <Button
                          size="small"
                          skin="inverted"
                          onClick={loadRelatedProducts}
                          disabled={isLoadingProducts}
                        >
                          {isLoadingProducts ? 'Loading...' : 'Load Products'}
                        </Button>

                        {relatedProducts.length > 0 ? (
                          <FormField label="Select Related Product">
                            <Dropdown
                              placeholder="Choose a product..."
                              onSelect={handleRelatedProductSelect}
                              options={relatedProducts.map(p => ({
                                id: p._id,
                                value: `${p.name} - $${p.price?.price?.toFixed(2) || '0.00'}`
                              }))}
                            />
                          </FormField>
                        ) : hasLoadedProducts && !isLoadingProducts && (
                          <Text size="small" secondary>No products found</Text>
                        )}

                        {selectedRelatedProducts.length > 0 && (
                          <Box direction="vertical" gap="SP2">
                            <Text size="small" weight="bold">Selected Products:</Text>
                            {selectedRelatedProducts.map(productId => {
                              const product = relatedProducts.find(p => p._id === productId);
                              return (
                                <Box 
                                  key={productId} 
                                  direction="horizontal" 
                                  align="center" 
                                  gap="SP2"
                                  padding="SP1"
                                  backgroundColor="D80"
                                  borderRadius="6px"
                                >
                                  <Text size="small" style={{ flex: 1 }}>
                                    {product?.name || productId}
                                  </Text>
                                  <Button
                                    size="tiny"
                                    skin="destructive"
                                    onClick={() => handleRemoveRelatedProduct(productId)}
                                  >
                                    ✕
                                  </Button>
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    </Card.Content>
                  </Card>
                </Box>
              </Cell>



            </Layout>
          </form>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default CreateProductPage;
