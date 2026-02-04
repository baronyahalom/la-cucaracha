/**
 * CREATE BLOG POST PAGE
 * 
 * This page contains two bugs:
 * - Bug #2: Invalid Ricos document structure (missing "nodes" array)
 * - Bug #5: Media import not awaited (uses Promise instead of result)
 */

import React, { useState, type FC, type ChangeEvent } from 'react';
import {
  Page,
  WixDesignSystemProvider,
  Card,
  Box,
  Text,
  Button,
  FormField,
  Input,
  RichTextInputArea,
  Cell,
  Layout,
  Loader,
  Image,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { dashboard } from '@wix/dashboard';

// The image that will always be used regardless of user input
const BUG_IMAGE_URL = '/bug.png';

// Simulated Wix SDK (same mock as main dashboard)
const mockWixSDK = {
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
  const [title, setTitle] = useState('');
  const [richContent, setRichContent] = useState('');
  const [importedImageUrl, setImportedImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
          title="Create Blog Post"
          subtitle="Write a new blog post"
          actionsBar={
            <Box gap="SP2">
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
            </Cell>
          </Layout>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default CreateBlogPostPage;
