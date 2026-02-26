/**
 * CREATE BLOG POST PAGE
 * 
 * This page contains two bugs:
 * - Bug #2: Invalid Ricos document structure (missing "nodes" array)
 * - Bug #5: Media import not awaited (uses Promise instead of result)
 */

import React, { useState, useEffect, type FC, type ChangeEvent } from 'react';
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
  RichTextInputArea,
  Cell,
  Layout,
  Loader,
  Image,
  Modal,
  CustomModalLayout,
  Divider,
  Heading,
  Dropdown,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { dashboard } from '@wix/dashboard';
import { httpClient } from '@wix/essentials';

// Pricing page URL with intentional bug in app ID
const UPGRADE_URL = 'https://www.wix.com/apps/upgrade/0a2f-THIS-IS-A-BUG-jdk4?appInstanceId=d546f2f9-94e4-4257-b2bd-ce224d1158f4';

// La Cucaracha audio file
const LA_CUCARACHA_AUDIO = '/la-cucaracha.mp4';

// Audio instance (kept outside component to persist across renders)
let audioInstance: HTMLAudioElement | null = null;

// The image that will always be used regardless of user input
const BUG_IMAGE_URL = '/bug.png';

// Blog post type
interface BlogPost {
  id: string;
  title: string;
  content: string;
  featuredImage: string;
}

// Product type for related products
interface Product {
  id: string;
  name: string;
  media?: {
    mainMedia?: {
      image?: {
        url?: string;
      };
    };
  };
}

// Initial example blog posts
const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Why Our New Vessels Are Perfect for Your Home',
    content: 'Transform your living space with our stunning new collection of handcrafted vessels. Each piece is designed to blend seamlessly with any interior style, from minimalist modern to cozy bohemian. Our ceramic vases, planters, and decorative bowls are made from premium materials that ensure durability while adding an elegant touch to your shelves, tables, and windowsills. Whether you\'re looking for a statement centerpiece or subtle accents, our vessels bring warmth and character to every room. Shop our latest arrivals and discover the perfect piece to complement your home décor.',
    featuredImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop',
  },
  {
    id: 'blog-2',
    title: 'Need New Apparel? Here\'s What\'s Trending This Season',
    content: 'Refresh your wardrobe with our latest apparel collection! This season, we\'re all about comfort meeting style. From breathable cotton tees perfect for everyday wear to cozy hoodies that transition effortlessly from morning coffee runs to evening hangouts, we\'ve got you covered. Our new arrivals feature versatile pieces in earth tones and bold prints that mix and match beautifully. Plus, every item is crafted with sustainable fabrics because looking good should feel good too. Browse our collection and find your new favorite outfit today.',
    featuredImage: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop',
  },
];

const STORAGE_KEY = 'la-cucaracha-blog-edits';

// Simulated Wix SDK (same mock as main dashboard)
const mockWixSDK = {
  blog: {
    createDraftPost: async (post: { title: string; richContent?: unknown }) => {
      // Validates Ricos document structure
      const richContent = post.richContent as { nodes?: unknown[] } | undefined;
      if (!richContent?.nodes || !Array.isArray(richContent.nodes)) {
        throw new Error('INVALID_ARGUMENT: Invalid Ricos document structure. richContent must have a "nodes" array. See: https://dev.wix.com/docs/sdk/backend-modules/blog/draft-posts/create-draft-post');
      }
      return { draftPost: { _id: 'draft-123' } };
    }
  },
  media: {
    importFile: async (_url: string) => {
      // Returns a promise that resolves after a delay (simulating async upload)
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ file: { _id: 'file-123', url: BUG_IMAGE_URL } });
        }, 1000);
      });
    }
  }
};

const CreateBlogPostPage: FC = () => {
  // New post creation state
  const [title, setTitle] = useState('');
  const [richContent, setRichContent] = useState('');
  const [importedImageUrl, setImportedImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);

  // Toggle play/pause for La Cucaracha
  const toggleAudio = () => {
    if (isPlaying && audioInstance) {
      audioInstance.pause();
      setIsPlaying(false);
    } else {
      if (!audioInstance) {
        audioInstance = new Audio(LA_CUCARACHA_AUDIO);
        audioInstance.onended = () => setIsPlaying(false);
      }
      audioInstance.play().catch((err) => console.error('Failed to play audio:', err));
      setIsPlaying(true);
    }
  };

  // Related products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [userSelectedProduct, setUserSelectedProduct] = useState<Product | null>(null);
  const [buggyRandomProduct, setBuggyRandomProduct] = useState<Product | null>(null);

  // Blog posts list and editing state
  const [blogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Local edits stored in localStorage
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<BlogPost>>>(() => {
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

  // Save local edits to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localEdits));
      } catch (error) {
        console.error("Failed to save blog edits", error);
      }
    }
  }, [localEdits]);

  // Load products for related product dropdown
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
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
        const data = await response.json();
        setProducts(data.products || []);
      } catch (_err) {
        // Silent fail
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Handle related product selection - BUG: picks a random different product!
  const handleRelatedProductSelect = (option: { id: string | number } | null) => {
    if (!option || products.length === 0) {
      setUserSelectedProduct(null);
      setBuggyRandomProduct(null);
      return;
    }
    
    const selectedId = String(option.id);
    const selectedProduct = products.find(p => p.id === selectedId);
    
    if (selectedProduct) {
      setUserSelectedProduct(selectedProduct);
    }
    
    // BUG: Instead of using the selected product, pick a random DIFFERENT one
    const otherProducts = products.filter(p => p.id !== selectedId);
    
    if (otherProducts.length > 0) {
      // Pick a random product from the OTHER products
      const randomIndex = Math.floor(Math.random() * otherProducts.length);
      setBuggyRandomProduct(otherProducts[randomIndex]);
    } else if (products.length === 1) {
      // If only one product exists, use it anyway
      setBuggyRandomProduct(products[0]);
    }
  };


  // Get displayed post with local edits applied
  const getDisplayPost = (post: BlogPost): BlogPost => {
    const edits = localEdits[post.id];
    if (!edits) return post;
    return {
      ...post,
      title: edits.title ?? post.title,
      content: edits.content ?? post.content,
      featuredImage: edits.featuredImage ?? post.featuredImage,
    };
  };

  // Handle edit button click
  const handleEditClick = (post: BlogPost) => {
    const displayPost = getDisplayPost(post);
    setEditingPost({ ...displayPost });
    setIsEditModalOpen(true);
  };

  // Handle save edits
  const handleSaveEdits = () => {
    if (editingPost) {
      setLocalEdits(prev => ({
        ...prev,
        [editingPost.id]: {
          title: editingPost.title,
          content: editingPost.content,
          featuredImage: editingPost.featuredImage,
        }
      }));
      console.log('Saved blog post:', editingPost);
    }
    setIsEditModalOpen(false);
    setEditingPost(null);
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleRichContentChange = (value: string) => {
    setRichContent(value);
  };

  // ============================================================
  // BUG #5: MEDIA IMPORT NOT AWAITED
  // ============================================================
  // Opens Wix Media Manager, user selects an image, but we ignore
  // their selection and show bug.png instead.
  // 
  // FIX: Use the actual selected image URL from the media manager
  // DOCS: https://dev.wix.com/docs/sdk/backend-modules/media/media-manager
  // ============================================================
  const handleOpenMediaManager = async () => {
    try {
      setIsImporting(true);
      
      // Open Wix Media Manager
      const result = await dashboard.openMediaManager({
        multiSelect: false,
      });
      
      // User selected an image - log what they chose
      if (result && result.items && result.items.length > 0) {
        const selectedImage = result.items[0];
        console.log('User selected image:', selectedImage);
        console.log('Selected image URL:', selectedImage.url);
        
        // BUG #5: Ignore user's selection and use bug.png instead!
        // The import result is not being used correctly
        const importResult = mockWixSDK.media.importFile(selectedImage.url || '');
        
  
        
        // Regardless of what user selected, show bug.png
        setImportedImageUrl(BUG_IMAGE_URL);
      }
    } catch (err) {
      console.error('Media Manager error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  // ============================================================
  // BUG #2: INVALID RICOS DOCUMENT
  // ============================================================
  // Creates a blog post with invalid Ricos document structure.
  // The richContent object is missing the required "nodes" array.
  // 
  // FIX: Provide valid Ricos document with nodes array
  // DOCS: https://dev.wix.com/docs/sdk/articles/working-with-ricos
  // ============================================================
  const handleCreatePost = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSubmitting(true);

    // BUG #2: Invalid Ricos document structure - missing "nodes" array
    // The correct structure should be: { nodes: [{ type: 'PARAGRAPH', ... }] }
    const invalidRichContent = {
      // Missing "nodes" array - this is invalid!
      content: richContent, // Wrong structure!
      text: richContent,
      ...(importedImageUrl && {
        image: importedImageUrl
      })
    };

    try {
      await mockWixSDK.blog.createDraftPost({
        title: title,
        richContent: invalidRichContent
      });

      alert('Blog post created!');
    } catch (err) {
      console.error('Sending invalid richContent:', JSON.stringify(invalidRichContent, null, 2));
      console.error('Failed to Create Draft Post SDK:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Blog Posts"
          subtitle="Create and manage your blog posts"
          actionsBar={
            <Box gap="SP2">
              <Button
                skin="premium"
                size="medium"
                onClick={toggleAudio}
              >
                {isPlaying ? 'Pause' : 'Upgrade'}
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
                onClick={handleCreatePost}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Post'}
              </Button>
            </Box>
          }
        />
        <Page.Content>
          <Box direction="vertical" gap="SP6">
            {/* Create New Post Section - NOW AT TOP */}
            <Box direction="vertical" gap="SP4">
              <Heading size="small">Create New Post</Heading>
              <Layout>
                {/* Main Content */}
                <Cell span={8}>
                  <Card>
                    <Card.Header title="Post Content" />
                    <Card.Divider />
                    <Card.Content>
                      <Box direction="vertical" gap="SP4">
                        <FormField label="Title" required>
                          <Input
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Enter post title"
                          />
                        </FormField>

                        <FormField label="Content">
                          <RichTextInputArea
                            initialValue={richContent}
                            onChange={handleRichContentChange}
                            placeholder="Write your blog post content here..."
                          />
                        </FormField>
                      </Box>
                    </Card.Content>
                  </Card>
                </Cell>

                {/* Side Panel */}
                <Cell span={4}>
                  <Box direction="vertical" gap="SP4">
                    {/* Image Import Card */}
                    <Card>
                      <Card.Header title="Featured Image" />
                      <Card.Divider />
                      <Card.Content>
                        <Box direction="vertical" gap="SP4">
                          <Button
                            size="medium"
                            onClick={handleOpenMediaManager}
                            disabled={isImporting}
                            fullWidth
                          >
                            {isImporting ? (
                              <Box gap="SP2" align="center">
                                <Loader size="tiny" />
                              </Box>
                            ) : (
                              'Import Image'
                            )}
                          </Button>

                          {/* Image Preview */}
                          {importedImageUrl && (
                            <Box direction="vertical" gap="SP2">
                              <Text size="small" weight="bold">Preview:</Text>
                              <Box 
                                borderRadius="8px" 
                                overflow="hidden"
                                backgroundColor="D80"
                              >
                                <Image
                                  src={importedImageUrl}
                                  alt="Featured image preview"
                                  width="100%"
                                  height="200px"
                                  fit="cover"
                                />
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Card.Content>
                    </Card>

                    {/* Related Product Card */}
                    <Card>
                      <Card.Header title="Related Product" />
                      <Card.Divider />
                      <Card.Content>
                        <Box direction="vertical" gap="SP4">
                          {/* Show dropdown only if no products are selected */}
                          {!userSelectedProduct && !buggyRandomProduct ? (
                            <FormField label="Link a product to this post">
                              {loadingProducts ? (
                                <Box align="center" padding="SP2">
                                  <Loader size="tiny" />
                                </Box>
                              ) : products.length === 0 ? (
                                <Text size="small" secondary>No products available</Text>
                              ) : (
                                <Dropdown
                                  placeholder="Select a product"
                                  options={products.map(p => ({
                                    id: p.id,
                                    value: p.name,
                                  }))}
                                  onSelect={handleRelatedProductSelect}
                                />
                              )}
                            </FormField>
                          ) : (
                            /* Show products as cards when selected */
                            <Box 
                              direction="vertical" 
                              gap="SP3"
                              padding="SP3"
                              backgroundColor="D80"
                              borderRadius="8px"
                            >
                              {/* User's originally selected product */}
                              {userSelectedProduct && (
                                <Box direction="vertical" gap="SP2">
                                  <Box direction="horizontal" align="space-between" verticalAlign="middle">
                                    <Text size="small" weight="bold">Linked Product</Text>
                                    <Button
                                      size="tiny"
                                      skin="destructive"
                                      priority="secondary"
                                      onClick={() => setUserSelectedProduct(null)}
                                    >
                                      ✕
                                    </Button>
                                  </Box>
                                  <Card>
                                    <Box height="80px" backgroundColor="D70">
                                      {userSelectedProduct.media?.mainMedia?.image?.url ? (
                                        <Image
                                          src={userSelectedProduct.media.mainMedia.image.url}
                                          alt={userSelectedProduct.name}
                                          width="100%"
                                          height="80px"
                                          fit="cover"
                                        />
                                      ) : (
                                        <Box 
                                          height="100%" 
                                          align="center" 
                                          verticalAlign="middle"
                                        >
                                          <Text size="tiny" secondary>No image</Text>
                                        </Box>
                                      )}
                                    </Box>
                                    <Card.Content>
                                      <Text size="small" weight="bold">
                                        {userSelectedProduct.name}
                                      </Text>
                                    </Card.Content>
                                  </Card>
                                </Box>
                              )}

                              {/* Buggy random product (different from selected) */}
                              {buggyRandomProduct && (
                                <Box direction="vertical" gap="SP2">
                                  <Box direction="horizontal" align="space-between" verticalAlign="middle">
                                    <Text size="small" weight="bold">Linked Product</Text>
                                    <Button
                                      size="tiny"
                                      skin="destructive"
                                      priority="secondary"
                                      onClick={() => setBuggyRandomProduct(null)}
                                    >
                                      ✕
                                    </Button>
                                  </Box>
                                  <Card>
                                    <Box height="80px" backgroundColor="D70">
                                      {buggyRandomProduct.media?.mainMedia?.image?.url ? (
                                        <Image
                                          src={buggyRandomProduct.media.mainMedia.image.url}
                                          alt={buggyRandomProduct.name}
                                          width="100%"
                                          height="80px"
                                          fit="cover"
                                        />
                                      ) : (
                                        <Box 
                                          height="100%" 
                                          align="center" 
                                          verticalAlign="middle"
                                        >
                                          <Text size="tiny" secondary>No image</Text>
                                        </Box>
                                      )}
                                    </Box>
                                    <Card.Content>
                                      <Text size="small" weight="bold">
                                        {buggyRandomProduct.name}
                                      </Text>
                                    </Card.Content>
                                  </Card>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Card.Content>
                    </Card>
                  </Box>
                </Cell>
              </Layout>
            </Box>

            <Divider />

            {/* Your Blog Posts Section - NOW AT BOTTOM */}
            <Box direction="vertical" gap="SP4">
              <Heading size="small">Your Blog Posts</Heading>
              <Layout>
                {blogPosts.map((post) => {
                  const displayPost = getDisplayPost(post);
                  return (
                    <Cell key={post.id} span={6}>
                      <Card stretchVertically>
                        <Box height="200px" backgroundColor="D80">
                          {displayPost.featuredImage ? (
                            <Image
                              src={displayPost.featuredImage}
                              alt={displayPost.title}
                              width="100%"
                              height="200px"
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
                          title={displayPost.title}
                        />
                        <Card.Divider />
                        <Card.Content>
                          <Box direction="vertical" gap="SP3" height="140px">
                            <Box height="80px" overflow="hidden">
                              <Text size="small" secondary>
                                {displayPost.content.length > 150 
                                  ? `${displayPost.content.substring(0, 150)}...` 
                                  : displayPost.content}
                              </Text>
                            </Box>
                            <Box marginTop="auto">
                              <Button
                                size="small"
                                skin="standard"
                                onClick={() => handleEditClick(post)}
                                fullWidth
                              >
                                Edit Post
                              </Button>
                            </Box>
                          </Box>
                        </Card.Content>
                      </Card>
                    </Cell>
                  );
                })}
              </Layout>
            </Box>
          </Box>
        </Page.Content>
      </Page>

      {/* Edit Blog Post Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => setIsEditModalOpen(false)}
        shouldCloseOnOverlayClick
      >
        <CustomModalLayout
          title="Edit Blog Post"
          subtitle="Update your blog post details"
          onCloseButtonClick={() => setIsEditModalOpen(false)}
          primaryButtonText="Save Changes"
          primaryButtonOnClick={handleSaveEdits}
          secondaryButtonText="Cancel"
          secondaryButtonOnClick={() => setIsEditModalOpen(false)}
          width="600px"
          content={
            editingPost && (
              <Box direction="vertical" gap="SP4" padding="SP2">
                <FormField label="Title">
                  <Input
                    value={editingPost.title}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      setEditingPost({ ...editingPost, title: e.target.value })
                    }
                    placeholder="Enter post title"
                  />
                </FormField>

                <FormField label="Content">
                  <InputArea
                    value={editingPost.content}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                      setEditingPost({ ...editingPost, content: e.target.value })
                    }
                    placeholder="Write your blog post content..."
                    rows={6}
                    resizable
                  />
                </FormField>

                <FormField label="Featured Image URL">
                  <Input
                    value={editingPost.featuredImage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => 
                      setEditingPost({ ...editingPost, featuredImage: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </FormField>

                {editingPost.featuredImage && (
                  <Box direction="vertical" gap="SP2">
                    <Text size="small" weight="bold">Preview:</Text>
                    <Box 
                      borderRadius="8px" 
                      overflow="hidden" 
                      height="150px"
                      backgroundColor="D80"
                    >
                      <Image
                        src={editingPost.featuredImage}
                        alt="Post preview"
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

export default CreateBlogPostPage;
