/**
 * Store Products Dashboard
 * 
 * Displays products from the store using queryProducts.

 */

import React, { useState, useEffect, type FC, type ChangeEvent } from 'react';
import {
  Page,
  WixDesignSystemProvider,
  Card,
  Box,
  Text,
  Button,
  Image,
  Badge,
  Loader,
  Layout,
  Cell,
  Modal,
  CustomModalLayout,
  FormField,
  Input,
  InputArea,
  NumberInput,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { httpClient } from '@wix/essentials';

// Pricing page URL with intentional bug in app ID
const UPGRADE_URL = 'https://www.wix.com/apps/upgrade/0a2f-THIS-IS-A-BUG-jdk4?appInstanceId=d546f2f9-94e4-4257-b2bd-ce224d1158f4';

// Types
interface Product {
  id: string;
  name: string;
  description?: string;
  priceData?: {
    price?: number;
    currency?: string;
  };
  media?: {
    mainMedia?: {
      image?: {
        url?: string;
      };
    };
  };
  stock?: {
    inStock?: boolean;
    quantity?: number;
  };
}

// Editable product fields
interface EditableProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
}

const STORAGE_KEY = 'la-cucaracha-product-edits';

const DashboardPage: FC = () => {
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [storesNotInstalled, setStoresNotInstalled] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Local edits storage - maps product ID to edited values
  // Initialize from localStorage if available
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<EditableProduct>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  // Persist edits to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localEdits));
      } catch (err) {
        console.error('Failed to save edits:', err);
      }
    }
  }, [localEdits]);

  // Load products from the store using Catalog V3 REST API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setStoresNotInstalled(false);
        const response = await httpClient.fetchWithAuth(
          'https://www.wixapis.com/stores-reader/v1/products/query',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: {
                paging: { limit: 100 }
              }
            }),
          }
        );
        
        // Check if Stores is not installed (403 or specific error)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData?.message || '';
          
          if (response.status === 403 || errorMessage.includes('not installed') || errorMessage.includes('APP_NOT_INSTALLED')) {
            setStoresNotInstalled(true);
            setProductList([]);
            return;
          }
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        setProductList(data.products || []);
      } catch (err: unknown) {
        console.error('Failed to load products:', err);
        // Check error message for stores not installed
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('not installed') || errorMessage.includes('APP_NOT_INSTALLED') || errorMessage.includes('403')) {
          setStoresNotInstalled(true);
        }
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Open edit modal for a product
  const handleEditClick = (product: Product) => {
    const existingEdits = localEdits[product.id] || {};
    setEditingProduct({
      id: product.id,
      name: existingEdits.name ?? product.name ?? '',
      description: existingEdits.description ?? product.description ?? '',
      price: existingEdits.price ?? product.priceData?.price ?? 0,
      currency: existingEdits.currency ?? product.priceData?.currency ?? 'USD',
      imageUrl: existingEdits.imageUrl ?? product.media?.mainMedia?.image?.url ?? '',
    });
    setIsModalOpen(true);
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof EditableProduct) => (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, [field]: e.target.value });
    }
  };

  const handlePriceChange = (value: number | null) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, price: value || 0 });
    }
  };

  // Save edits locally (NOT to the store)
  const handleSaveEdits = () => {
    if (editingProduct) {
      // Store the edits locally - don't call updateProduct
      setLocalEdits(prev => ({
        ...prev,
        [editingProduct.id]: {
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          currency: editingProduct.currency,
          imageUrl: editingProduct.imageUrl,
        }
      }));
      console.log('Saved:', editingProduct);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Get display values for a product (with local edits applied)
  const getDisplayProduct = (product: Product) => {
    const edits = localEdits[product.id];
    if (!edits) return product;
    
    return {
      ...product,
      name: edits.name ?? product.name,
      description: edits.description ?? product.description,
      priceData: {
        price: edits.price ?? product.priceData?.price,
        currency: edits.currency ?? product.priceData?.currency,
      },
      media: edits.imageUrl ? {
        mainMedia: {
          image: {
            url: edits.imageUrl
          }
        }
      } : product.media,
    };
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="La Cucaracha - Store Products"
          subtitle="View and edit your store products"
          actionsBar={
            <Button
              size="medium"
              skin="premium"
              onClick={() => window.open(UPGRADE_URL, '_blank')}
            >
              Upgrade
            </Button>
          }
        />
        <Page.Content>
          {loading ? (
            <Box align="center" padding="SP10">
              <Loader size="medium" />
            </Box>
          ) : storesNotInstalled ? (
            <Layout>
              <Cell span={12}>
                <Card>
                  <Card.Content>
                    <Box 
                      direction="vertical" 
                      align="center" 
                      padding="SP10" 
                      gap="SP4"
                    >
                      <Text weight="bold" size="medium">
                        No Stores connected
                      </Text>
                      <Text secondary>
                        Please install Wix Stores to use this app.
                      </Text>
                      <Button
                        as="a"
                        href="https://www.wix.com/app-market/wix-stores"
                        target="_blank"
                        skin="standard"
                      >
                        Install Wix Stores
                      </Button>
                    </Box>
                  </Card.Content>
                </Card>
              </Cell>
            </Layout>
          ) : (
            <Layout>
              {productList.length === 0 ? (
                <Cell span={12}>
                  <Card>
                    <Card.Content>
                      <Box 
                        direction="vertical" 
                        align="center" 
                        padding="SP6" 
                        gap="SP4"
                      >
                        <Text weight="bold" size="medium">
                          No Stores connected
                        </Text>
                        <Text secondary>
                          Please install Wix Stores.
                        </Text>
                        <Button
                          as="a"
                          href="https://www.wix.com/app-market/wix-stores"
                          target="_blank"
                          skin="standard"
                        >
                          Install Wix Stores
                        </Button>
                      </Box>
                    </Card.Content>
                  </Card>
                </Cell>
              ) : (
                productList.map((product) => {
                  const displayProduct = getDisplayProduct(product);
                  const hasLocalEdits = !!localEdits[product.id];
                  
                  return (
                    <Cell key={product.id} span={4}>
                      <Card stretchVertically>
                        <Box height="180px" backgroundColor="D80">
                          {displayProduct.media?.mainMedia?.image?.url ? (
                            <Image
                              src={displayProduct.media.mainMedia.image.url}
                              alt={displayProduct.name}
                              width="100%"
                              height="180px"
                              fit="cover"
                            />
                          ) : (
                            <Box 
                              height="100%" 
                              align="center" 
                              verticalAlign="middle"
                            >
                              <Text secondary>No image</Text>
                            </Box>
                          )}
                        </Box>
                        <Card.Header
                          title={
                            <Box direction="horizontal" gap="SP1" align="center">
                              <Text weight="bold">{displayProduct.name}</Text>
                              {hasLocalEdits && (
                                <Badge size="tiny" skin="warning">Edited</Badge>
                              )}
                            </Box>
                          }
                          subtitle={`$${displayProduct.priceData?.price?.toFixed(2) || '0.00'} ${displayProduct.priceData?.currency || 'USD'}`}
                          suffix={
                            <Badge skin={displayProduct.stock?.inStock ? 'success' : 'danger'}>
                              {displayProduct.stock?.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          }
                        />
                        <Card.Divider />
                        <Card.Content>
                          <Box direction="vertical" gap="SP3" height="120px">
                            <Box height="60px" overflow="hidden">
                              <Text size="small" secondary>
                                {displayProduct.description 
                                  ? (displayProduct.description.length > 100 
                                      ? `${displayProduct.description.substring(0, 100)}...` 
                                      : displayProduct.description)
                                  : 'No description'}
                              </Text>
                            </Box>
                            <Box marginTop="auto">
                              <Button
                                size="small"
                                skin="standard"
                                onClick={() => handleEditClick(product)}
                                fullWidth
                              >
                                Edit Product
                              </Button>
                            </Box>
                          </Box>
                        </Card.Content>
                      </Card>
                    </Cell>
                  );
                })
              )}
            </Layout>
          )}
        </Page.Content>
      </Page>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        shouldCloseOnOverlayClick
      >
        <CustomModalLayout
          title="Edit Product"
          subtitle="Edit your product"
          onCloseButtonClick={() => setIsModalOpen(false)}
          primaryButtonText="Save Changes"
          primaryButtonOnClick={handleSaveEdits}
          secondaryButtonText="Cancel"
          secondaryButtonOnClick={() => setIsModalOpen(false)}
          content={
            editingProduct && (
              <Box direction="vertical" gap="SP4" padding="SP2">
                <FormField label="Product Name">
                  <Input
                    value={editingProduct.name}
                    onChange={handleFieldChange('name')}
                    placeholder="Enter product name"
                  />
                </FormField>

                <FormField label="Description">
                  <InputArea
                    value={editingProduct.description}
                    onChange={handleFieldChange('description')}
                    placeholder="Enter product description"
                    rows={3}
                    resizable
                  />
                </FormField>

                <Box direction="horizontal" gap="SP4">
                  <Box width="70%">
                    <FormField label="Price">
                      <NumberInput
                        value={editingProduct.price}
                        onChange={handlePriceChange}
                        min={0}
                        step={0.01}
                        prefix={<Text size="small">$</Text>}
                      />
                    </FormField>
                  </Box>
                  <Box width="30%">
                    <FormField label="Currency">
                      <Input
                        value={editingProduct.currency}
                        onChange={handleFieldChange('currency')}
                        placeholder="USD"
                      />
                    </FormField>
                  </Box>
                </Box>

                <FormField label="Image URL">
                  <Input
                    value={editingProduct.imageUrl}
                    onChange={handleFieldChange('imageUrl')}
                    placeholder="https://example.com/image.jpg"
                  />
                </FormField>

                {editingProduct.imageUrl && (
                  <Box direction="vertical" gap="SP2">
                    <Text size="small" weight="bold">Preview:</Text>
                    <Box 
                      borderRadius="8px" 
                      overflow="hidden" 
                      height="150px"
                      backgroundColor="D80"
                    >
                      <Image
                        src={editingProduct.imageUrl}
                        alt="Product preview"
                        width="100%"
                        height="150px"
                        fit="cover"
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )
          }
        />
      </Modal>
    </WixDesignSystemProvider>
  );
};

export default DashboardPage;
