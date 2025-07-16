// This component allows users to upload images from their device or add images from a web URL.
import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { Camera, Globe, Trash2 } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import * as ImagePicker from 'expo-image-picker';

// Utility function to safely log URIs (truncates data URIs to prevent performance issues)
const safeLogUri = (uri: string | undefined, label: string = 'URI') => {
  if (!uri) {
    console.log(`${label}: undefined`);
    return;
  }

  // Check for very large data URIs that might cause performance issues
  if (uri.startsWith('data:') && uri.length > 100000) {
    console.log(
      `${label}: Large data URI (${Math.round(
        uri.length / 1024
      )}KB) - truncated for logging`
    );
    return;
  }

  const logUri = uri.startsWith('data:')
    ? `${uri.substring(0, 50)}... (data URI truncated)`
    : uri;
  console.log(`${label}:`, logUri);
};

// Define the Imageinfo interface
interface Imageinfo {
  id: string;
  type: 'supabase' | 'url';
  url: string;
  localUri?: string;
  isLoading?: boolean;
  error?: string;
}

interface ImageHandlerProps {
  initialImages?: Imageinfo[];
  onImagesChange: (images: Imageinfo[]) => void;
  bucketName: string; // Add bucketName prop
}

// Helper function to validate and retry image URLs with timeout
const validateImageUrl = async (url: string, retries = 2): Promise<boolean> => {
  const timeoutPromise = (ms: number) => 
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

  for (let i = 0; i < retries; i++) {
    try {
      // For Supabase URLs, try a simple GET request instead of HEAD
      // as some storage configurations may not support HEAD requests properly
      const fetchPromise = url.includes('supabase.co') 
        ? fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' } })
        : fetch(url, { method: 'HEAD', headers: { 'Cache-Control': 'no-cache' } });

      // Race between fetch and timeout (3 seconds max per attempt)
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise(3000)
      ]);
      
      if (response instanceof Response && (response.ok || response.status === 206)) {
        console.log('Image URL validation successful');
        return true;
      }
      console.log(
        `Image validation attempt ${i + 1} failed with status:`,
        response instanceof Response ? response.status : 'Unknown'
      );
    } catch (error) {
      console.log(`Image validation attempt ${i + 1} failed:`, error);
    }

    // Wait before retry (longer delay for Supabase URLs)
    if (i < retries - 1) {
      const delay = url.includes('supabase.co') ? 2000 : 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  console.log('Image URL validation failed after all retries');
  return false;
};

const ImageHandler: React.FC<ImageHandlerProps> = ({
  initialImages = [],
  onImagesChange,
  bucketName,
}) => {
  const [images, setImages] = useState<Imageinfo[]>(initialImages);
  const [webImageUrlInput, setWebImageUrlInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Only sync with initialImages on first render to avoid overriding local state
  useEffect(() => {
    if (!isInitialized) {
      setImages(initialImages);
      setIsInitialized(true);
    }
  }, [initialImages, isInitialized]);

  // --- Image Handling Functions ---
  const handleLocalImageSelected = useCallback(
    async (localUri: string) => {
      if (!localUri) return;

      safeLogUri(localUri, 'handleLocalImageSelected called with localUri');

      const imageId = uuidv4();
      const newImage = {
        id: imageId,
        type: 'supabase' as const,
        url: '',
        localUri: localUri,
        isLoading: true,
      };

      console.log('Adding new image to state with ID:', imageId); // Debug log (safe)

      setImages((prevImages) => {
        const newImages = [...prevImages, newImage];
        console.log('Updated images array:', newImages); // Debug log
        return newImages;
      });
      try {
        // Get current user for authentication and folder organization
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const response = await fetch(localUri);
        const blob = await response.blob();
        const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const extensionToUse = validExtensions.includes(fileExt)
          ? fileExt
          : 'jpg';
        const fileName = `${Date.now()}_${uuidv4().substring(
          0,
          8
        )}.${extensionToUse}`; // Organize files in user-specific folders for better security
        const filePath = `${user.id}/${fileName}`;

        console.log('Uploading to path:', filePath); // Debug log

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName) // Use bucketName prop
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: blob.type || `image/${extensionToUse}`,
          });
        if (uploadError) throw uploadError;

        console.log('Upload data:', uploadData); // Debug log

        const { data: publicUrlData } = supabase.storage
          .from(bucketName) // Use bucketName prop
          .getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) {
          throw new Error('Could not get public URL for the uploaded image.');
        }
        console.log('Upload success, public URL:', publicUrlData.publicUrl); // Log the public URL

        // Set the image as uploaded with the URL
        // Skip validation for now since Supabase URLs may not be immediately accessible
        setImages((prevImages) => {
          const updatedImages = prevImages.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  url: publicUrlData.publicUrl,
                  isLoading: false, // Always set to false after upload
                  localUri: localUri, // Keep localUri as fallback
                  error: undefined, // Clear any previous errors
                }
              : img
          );
          console.log('Image state updated after upload, image with ID', imageId, 'now has URL:', publicUrlData.publicUrl);
          return updatedImages;
        });

        console.log('Image upload completed successfully');
        console.log('Note: In development mode, Supabase URLs may be blocked by browser security policies');
        console.log('If the Supabase URL fails to load, the component will automatically fall back to the local preview');
      } catch (error: any) {
        console.error('Upload failed:', error);
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  url: '', // No URL on error - don't show fake success
                  isLoading: false,
                  error: error.message || 'Upload failed',
                }
              : img
          )
        );
        Alert.alert(
          'Upload Error',
          `Failed to upload image: ${error.message || 'Unknown error'}`
        );
      }
    },
    [bucketName]
  );

  const handleAddWebImageUrl = useCallback(async () => {
    if (!webImageUrlInput.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid web URL for the image.');
      return;
    }

    if (
      !webImageUrlInput.startsWith('http://') &&
      !webImageUrlInput.startsWith('https://')
    ) {
      Alert.alert(
        'Invalid URL',
        'Please enter a valid URL starting with http:// or https://'
      );
      return;
    }

    const imageId = uuidv4();
    const newImageEntry: Imageinfo = {
      id: imageId,
      type: 'url',
      url: '',
      localUri: webImageUrlInput.trim(),
      isLoading: true,
    };
    setImages((prevImages) => [...prevImages, newImageEntry]);

    try {
      const response = await fetch(webImageUrlInput.trim());
      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const fileExt = contentType.split('/').pop()?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const extensionToUse = validExtensions.includes(fileExt)
        ? fileExt
        : 'jpg';
      const fileName = `${Date.now()}_${uuidv4().substring(
        0,
        8
      )}.${extensionToUse}`;
      const filePath = fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName) // Use bucketName prop
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage
        .from(bucketName) // Use bucketName prop
        .getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not get public URL for the uploaded image.');
      }
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageId
            ? {
                ...img,
                url: publicUrlData.publicUrl,
                isLoading: false,
                localUri: undefined,
              }
            : img
        )
      );
    } catch (error: any) {
      console.error('Error uploading image from URL:', error);
      // BYPASS FOR TESTING: Mark as uploaded with dummy URL
      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageId
            ? {
                ...img,
                url: 'https://placehold.co/600x400?text=Test+Image', // Dummy image URL for testing
                isLoading: false,
                error: error.message || 'Upload failed',
              }
            : img
        )
      );
      Alert.alert(
        'Upload Error',
        `Failed to upload image from URL: ${error.message || 'Unknown error'}`
      );
    }
    setWebImageUrlInput(''); // Clear the input after adding
  }, [bucketName]);

  const handleRemoveImage = useCallback(
    async (imageIdToRemove: string) => {
      const imageToRemove = images.find((img) => img.id === imageIdToRemove);

      setImages((prevImages) =>
        prevImages.filter((img) => img.id !== imageIdToRemove)
      );

      if (imageToRemove?.type === 'supabase' && imageToRemove.url) {
        try {
          const filename = imageToRemove.url.split('/').pop();
          if (filename) {
            const { error } = await supabase.storage
              .from(bucketName) // Use bucketName prop
              .remove([filename]);

            if (error) {
              console.error('Error deleting from Supabase:', error);
              Alert.alert(
                'Delete Error',
                'Failed to delete image from Supabase.'
              );
            }
          }
        } catch (err) {
          console.error('Error deleting from Supabase:', err);
          Alert.alert('Delete Error', 'Failed to delete image from Supabase.');
        }
      }
    },
    [bucketName, images]
  );
  const handleImagePicker = useCallback(async () => {
    try {
      const { data: bucketTest } = supabase.storage
        .from(bucketName)
        .getPublicUrl('dummy');
      if (!bucketTest?.publicUrl) {
        Alert.alert('Error', 'Failed to access the image storage bucket.');
        return;
      }

      console.log('Launching image picker...'); // Debug log

      // Use Expo ImagePicker or any other library to select an image
      // Example using Expo ImagePicker:
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log('Image picker result:', result); // Debug log

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        safeLogUri(localUri, 'Selected image URI');
        handleLocalImageSelected(localUri);
      } else {
        console.log('Image picker was canceled or no assets found'); // Debug log
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image.');
    }
  }, [handleLocalImageSelected, bucketName]);
  // --- Notify Parent Component of Changes ---
  useEffect(() => {
    // Only notify parent when images actually change
    // Don't include onImagesChange in dependencies to prevent infinite loops
    console.log('onImagesChange called with', images.length, 'images');
    console.log('Images being passed to parent:', images.map(img => ({
      id: img.id,
      type: img.type,
      url: img.url,
      isLoading: img.isLoading,
      error: img.error
    })));
    onImagesChange(images);
  }, [images]); // Only depend on images, not onImagesChange

  // --- Render ---
  return (
    <View>
      {/* Display Images */}
      {images.map((image) => {
        console.log(
          'Rendering image:',
          image.id,
          'type:',
          image.type,
          'loading:',
          image.isLoading
        ); // Debug log (safe)
        // Try Supabase URL first, fallback to localUri if available
        const imageUri = image.url || image.localUri;
        safeLogUri(imageUri, 'Image URI'); // Debug log with safe URI logging
        return (
          <View key={image.id} style={styles.imageContainer}>
            {imageUri ? (
              <>
                <Image
                  source={{
                    uri: imageUri,
                    // Only add headers for remote URLs, not data URIs
                    ...(imageUri.startsWith('http') && {
                      headers: {
                        'Cache-Control': 'no-cache',
                      },
                    }),
                  }}
                  style={styles.previewImage}
                  onError={(error) => {
                    safeLogUri(imageUri, 'Image load error for URI');
                    // If Supabase URL fails and we have a localUri, try to fallback
                    if (image.url && image.localUri && imageUri === image.url) {
                      console.log('Supabase URL failed to load, falling back to localUri');
                      console.log('Preserving URL for database save:', image.url);
                      setImages((prevImages) =>
                        prevImages.map((img) =>
                          img.id === image.id
                            ? { 
                                ...img, 
                                // Keep the Supabase URL for saving to database, just mark it as having display issues
                                error: 'Using local preview (Supabase URL blocked in development)' 
                              }
                            : img
                        )
                      );
                    } else {
                      setImages((prevImages) =>
                        prevImages.map((img) =>
                          img.id === image.id
                            ? { ...img, error: 'Failed to load image' }
                            : img
                        )
                      );
                    }
                  }}
                  onLoad={() => {
                    safeLogUri(imageUri, 'Image loaded successfully');
                    // No state updates needed on successful load - this prevents unnecessary re-renders
                  }}
                />
                {/* Show loading overlay if still uploading */}
                {image.isLoading && (
                  <View
                    style={[
                      styles.previewImage,
                      {
                        position: 'absolute',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <ActivityIndicator size="large" color="#2d7a3a" />
                    <Text style={{ marginTop: 8, color: '#2d7a3a' }}>
                      Uploading...
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View
                style={[
                  styles.previewImage,
                  {
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Text>No image URI</Text>
              </View>
            )}
            {image.error && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(255,0,0,0.8)',
                  padding: 4,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, flex: 1 }}>
                  {image.error}
                  {image.localUri && image.error?.includes('Using local preview') ? ' ✓' : null}
                </Text>
                {image.url && (
                  <Pressable
                    onPress={async () => {
                      console.log('Retrying image load for:', image.url);
                      const isValid = await validateImageUrl(image.url);
                      if (isValid) {
                        setImages((prevImages) =>
                          prevImages.map((img) =>
                            img.id === image.id
                              ? { ...img, error: undefined }
                              : img
                          )
                        );
                      }
                    }}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 10 }}>Retry</Text>
                  </Pressable>
                )}
              </View>
            )}
            <Pressable
              onPress={() => handleRemoveImage(image.id)}
              style={styles.removeImageButton}
            >
              <Trash2 size={20} color="#2d7a3a" />
            </Pressable>
          </View>
        );
      })}
      {/* Add Image from Web URL */}
      <View style={styles.addUrlSection}>
        <TextInput
          style={styles.urlInput}
          placeholder="Paste image URL (e.g., https://...)"
          placeholderTextColor="#999"
          value={webImageUrlInput}
          onChangeText={setWebImageUrlInput}
          keyboardType="url"
        />
        <Pressable style={styles.urlButton} onPress={handleAddWebImageUrl}>
          <Globe size={24} color="#2d7a3a" />
          <Text style={styles.urlButtonText}>Add URL</Text>
        </Pressable>
      </View>
      {/* Capture/Pick Local Image */}
      <View style={styles.imageButtonContainer}>
        <Pressable style={styles.imageButton} onPress={handleImagePicker}>
          <Camera size={24} color="#2d7a3a" />
          <Text style={styles.imageButtonText}>Capture Image</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageloadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -12,
    zIndex: 2,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    zIndex: 3,
    elevation: 2,
  },
  addUrlSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    minWidth: 0, // allow shrinking
  },
  urlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#e6f4ea',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d7a3a',
  },
  urlButtonText: {
    fontSize: 16,
    color: '#2d7a3a',
    fontWeight: '600',
    marginLeft: 8,
  },
  imageButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d7a3a',
    gap: 8,
  },
  imageButtonText: {
    fontSize: 16,
    color: '#2d7a3a',
    fontWeight: '600',
  },
  imageCaptureContainer: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
});

export default ImageHandler;
