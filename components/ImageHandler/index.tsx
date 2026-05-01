import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Platform,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { Camera, Globe, Images, Trash2 } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';

// Define the Imageinfo interface
interface Imageinfo {
  id: string;
  type: 'supabase' | 'url';
  url: string;
  previewUrl?: string;
  localUri?: string;
  isLoading?: boolean;
  error?: string;
}

interface ImageHandlerProps {
  initialImages?: Imageinfo[];
  onImagesChange: (images: Imageinfo[]) => void;
  bucketName: string; // Add bucketName prop
  /** Maximum images allowed. Guest/free = 3, premium = 6. Defaults to 3. */
  maxImages?: number;
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
        return true;
      }
    } catch {
      // Silent failure, will retry
    }

    // Wait before retry (longer delay for Supabase URLs)
    if (i < retries - 1) {
      const delay = url.includes('supabase.co') ? 2000 : 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
};

const ImageHandler: React.FC<ImageHandlerProps> = ({
  initialImages = [],
  onImagesChange,
  bucketName,
  maxImages = 3,
}) => {
  const { colors } = useTheme();
  const { isGuest } = useAuth();
  const [images, setImages] = useState<Imageinfo[]>(initialImages);
  const [webImageUrlInput, setWebImageUrlInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);

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

      if (images.length >= maxImages) {
        Alert.alert(
          'Image Limit Reached',
          `You can add up to ${maxImages} image${maxImages === 1 ? '' : 's'} per seed.${maxImages < 6 ? ' Upgrade to a premium plan to add up to 6.' : ''}`
        );
        return;
      }

      const imageId = uuidv4();
      const newImage = {
        id: imageId,
        type: 'supabase' as const,
        url: '',
        localUri: localUri,
        isLoading: true,
      };

      setImages((prevImages) => {
        // Only replace all if every existing image is a known stock/placeholder URL
        const isPlaceholder = (img: Imageinfo) =>
          !!img.url && (
            img.url.includes('unsplash.com') ||
            img.url.includes('pexels.com') ||
            img.url.includes('pixabay.com') ||
            img.url.includes('butterfly-pea-blue')
          );
        const shouldReplaceAll = prevImages.length > 0 && prevImages.every(isPlaceholder);
        return shouldReplaceAll ? [newImage] : [...prevImages, newImage];
      });
      try {
        // Get current user for authentication and folder organization
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        
        if (isGuest) {
          throw new Error('Create a free account to upload photos from your device.');
        }
        if (authError || !user) {
          console.error('Authentication error during upload:', authError);
          throw new Error('You must be logged in to upload images. Please sign in and try again.');
        }

        // Determine file extension first
        const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
        const extensionToUse = validExtensions.includes(fileExt)
          ? fileExt
          : 'jpg';

        // Use supabase's decode option for uploading file URIs directly
        const fileName = `${Date.now()}_${uuidv4().substring(
          0,
          8
        )}.${extensionToUse}`;        
        // Organize files in user-specific folders for better security
        const filePath = `${user.id}/${fileName}`;

        // On web, expo-file-system's File class is not supported — use fetch/blob instead
        let fileToUpload: any;
        let contentType = `image/${extensionToUse}`;
        if (Platform.OS === 'web') {
          const fetchResult = await fetch(localUri);
          fileToUpload = await fetchResult.blob();
          if (fileToUpload.type?.startsWith('image/')) {
            contentType = fileToUpload.type;
          }
        } else {
          fileToUpload = new File(localUri);
        }

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            contentType,
          });
        if (uploadError) throw uploadError;

        // Signed URLs remain viewable even if bucket public read is restricted.
        const { data: signedUrlData } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 60 * 60);

        const { data: publicUrlData } = supabase.storage
          .from(bucketName) // Use bucketName prop
          .getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) {
          throw new Error('Could not get public URL for the uploaded image.');
        }

        // Set the image as uploaded with the URL
        // Skip validation for now since Supabase URLs may not be immediately accessible
        const remoteUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
        setImages((prevImages) => {
          const updatedImages = prevImages.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  url: remoteUrl,
                  previewUrl: signedUrlData?.signedUrl,
                  isLoading: false, // Always set to false after upload
                  localUri: localUri, // Keep localUri as fallback
                  error: undefined, // Clear any previous errors
                }
              : img
          );
          return updatedImages;
        });

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
    [bucketName, isGuest, images.length, maxImages]
  );

  const handleAddWebImageUrl = useCallback(async () => {
    const raw = webImageUrlInput.trim();
    console.log('[ImageHandler] Add URL pressed, value:', raw || '(empty)');

    if (!raw) {
      Alert.alert('Invalid URL', 'Please enter a valid web URL for the image.');
      return;
    }

    // Support multiple URLs separated by newlines or commas
    const urlLines = raw
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (images.length >= maxImages) {
      Alert.alert(
        'Image Limit Reached',
        `You can add up to ${maxImages} image${maxImages === 1 ? '' : 's'} per seed.${maxImages < 6 ? ' Upgrade to a premium plan to add up to 6.' : ''}`
      );
      return;
    }

    const urlsToProcess = urlLines.slice(0, maxImages - images.length);
    setWebImageUrlInput('');

    for (const trimmedUrl of urlsToProcess) {
      // Local device URIs (file://, content://) — route through the upload flow
      if (trimmedUrl.startsWith('file://') || trimmedUrl.startsWith('content://')) {
        await handleLocalImageSelected(trimmedUrl);
        continue;
      }

      if (
        !trimmedUrl.startsWith('http://') &&
        !trimmedUrl.startsWith('https://')
      ) {
        Alert.alert(
          'Invalid URL',
          `Skipped "${trimmedUrl}" — URLs must start with http:// or https://`
        );
        continue;
      }

      const imageId = uuidv4();
      const newImageEntry: Imageinfo = {
        id: imageId,
        type: 'url',
        url: '',
        localUri: trimmedUrl,
        isLoading: true,
      };

      setImages((prevImages) => {
        // Only replace all if every existing image is a known stock/placeholder URL
        const isPlaceholder = (img: Imageinfo) =>
          !!img.url && (
            img.url.includes('unsplash.com') ||
            img.url.includes('pexels.com') ||
            img.url.includes('pixabay.com') ||
            img.url.includes('butterfly-pea-blue')
          );
        const shouldReplaceAll = prevImages.length > 0 && prevImages.every(isPlaceholder);
        return shouldReplaceAll ? [newImageEntry] : [...prevImages, newImageEntry];
      });

      setImages((prevImages) =>
        prevImages.map((img) =>
          img.id === imageId
            ? {
                ...img,
                url: trimmedUrl,
                type: 'url',
                isLoading: false,
                localUri: undefined,
              }
            : img
        )
      );
    }
  }, [webImageUrlInput, handleLocalImageSelected, images.length, maxImages]);

  const handleRemoveImage = useCallback(
    async (imageIdToRemove: string) => {
      const imageToRemove = images.find((img) => img.id === imageIdToRemove);

      setImages((prevImages) =>
        prevImages.filter((img) => img.id !== imageIdToRemove)
      );

      if (imageToRemove?.type === 'supabase' && imageToRemove.url) {
        try {
          // Extract the storage path: URLs are formatted as
          // .../storage/v1/object/public/{bucket}/{userId}/{filename}
          // We need everything after the bucket name as the file path.
          const urlObj = new URL(imageToRemove.url.split('?')[0]);
          const pathParts = urlObj.pathname.split('/');
          const bucketIdx = pathParts.indexOf(bucketName);
          const filePath = bucketIdx !== -1
            ? pathParts.slice(bucketIdx + 1).join('/')
            : pathParts[pathParts.length - 1]; // fallback: filename only

          if (filePath) {
            const { error } = await supabase.storage
              .from(bucketName)
              .remove([filePath]);

            if (error) {
              console.error('Error deleting from Supabase:', error);
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
      // First, check if user is authenticated before trying to access storage
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      
      if (isGuest) {
        Alert.alert(
          'Account Required',
          'Create a free account to upload photos from your device. You can still add images by URL.'
        );
        return;
      }
      if (authError || !user) {
        Alert.alert(
          'Authentication Required', 
          'You must be logged in to upload images. Please sign in and try again.'
        );
        return;
      }

      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to upload images!'
        );
        return;
      }

      // Test bucket access
      const { data: bucketTest } = supabase.storage
        .from(bucketName)
        .getPublicUrl('dummy');
      if (!bucketTest?.publicUrl) {
        Alert.alert('Error', 'Failed to access the image storage bucket.');
        return;
      }

      // Launch library picker with multi-select enabled
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const remaining = maxImages - images.length;
        if (remaining <= 0) {
          Alert.alert(
            'Image Limit Reached',
            `You can add up to ${maxImages} image${maxImages === 1 ? '' : 's'} per seed.${
              maxImages < 6 ? ' Upgrade to a premium plan to add up to 6.' : ''
            }`
          );
          return;
        }
        const assetsToProcess = result.assets.slice(0, remaining);
        if (assetsToProcess.length < result.assets.length) {
          Alert.alert(
            'Partial Import',
            `Only ${assetsToProcess.length} of ${result.assets.length} photos will be added — you have ${remaining} slot${remaining === 1 ? '' : 's'} remaining.`
          );
        }
        for (const asset of assetsToProcess) {
          await handleLocalImageSelected(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image.');
    }
  }, [handleLocalImageSelected, bucketName, images.length, maxImages, isGuest]);

  const handleCameraCapture = useCallback(async () => {
    if (isGuest) {
      Alert.alert(
        'Account Required',
        'Create a free account to upload photos from your device. You can still add images by URL.'
      );
      return;
    }
    if (images.length >= maxImages) {
      Alert.alert(
        'Image Limit Reached',
        `You can add up to ${maxImages} image${maxImages === 1 ? '' : 's'} per seed.${
          maxImages < 6 ? ' Upgrade to a premium plan to add up to 6.' : ''
        }`
      );
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleLocalImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  }, [isGuest, images.length, maxImages, handleLocalImageSelected]);

  // Directly add an image from a URL string (used by paste handler for URL-type clipboard content)
  const handlePastedImageUrl = useCallback((url: string) => {
    if (images.length >= maxImages) {
      Alert.alert(
        'Image Limit Reached',
        `You can add up to ${maxImages} image${maxImages === 1 ? '' : 's'} per seed.${maxImages < 6 ? ' Upgrade to a premium plan to add up to 6.' : ''}`
      );
      return;
    }
    const imageId = uuidv4();
    const newImageEntry: Imageinfo = {
      id: imageId,
      type: 'url',
      url: url,
      isLoading: false,
    };
    setImages((prev) => [...prev, newImageEntry]);
    onImagesChange([...images, newImageEntry]);
  }, [images, maxImages, onImagesChange]);

  const handleWebFileSelected = useCallback(
    (file: globalThis.File) => {
      if (images.length >= maxImages) {
        Alert.alert(
          'Image Limit Reached',
          `You can add up to ${maxImages} image${maxImages === 1 ? '' : 's'} per seed.${maxImages < 6 ? ' Upgrade to a premium plan to add up to 6.' : ''}`
        );
        return;
      }

      const allowedTypes = new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
      ]);

      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']);

      if (!allowedTypes.has(file.type) && !allowedExtensions.has(extension)) {
        Alert.alert(
          'Unsupported Image Format',
          'Supported formats: JPG, PNG, GIF, WEBP, AVIF.'
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (result) {
          handleLocalImageSelected(result);
        }
      };
      reader.onerror = () => {
        Alert.alert('File Read Error', 'Could not read the selected image file.');
      };
      reader.readAsDataURL(file);
    },
    [handleLocalImageSelected, images.length, maxImages]
  );

  const triggerWebFilePicker = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      handleImagePicker();
      return;
    }

    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/gif,image/webp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.avif';
      input.style.display = 'none';
      input.multiple = true;
      input.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        if (files && files.length > 0) {
          const remaining = maxImages - images.length;
          Array.from(files).slice(0, Math.max(0, remaining)).forEach((file) =>
            handleWebFileSelected(file)
          );
        }
        target.value = '';
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    fileInputRef.current.click();
  }, [handleImagePicker, handleWebFileSelected, images.length, maxImages]);

  const handleWebDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      setIsGlobalDragOver(false);
      dragDepthRef.current = 0;

      const fileList = event?.dataTransfer?.files;
      if (fileList && fileList.length > 0) {
        const remaining = maxImages - images.length;
        Array.from(fileList).slice(0, Math.max(0, remaining)).forEach((file) =>
          handleWebFileSelected(file as globalThis.File)
        );
      }
    },
    [handleWebFileSelected, images.length, maxImages]
  );

  const handleWebDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver]);

  const handleWebDragLeave = useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const hasImageFiles = useCallback((dt: DataTransfer | null | undefined): boolean => {
    if (!dt) return false;
    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i += 1) {
        if (dt.items[i].type?.startsWith('image/')) return true;
      }
    }
    if (dt.files && dt.files.length > 0) return true;
    return false;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onPaste = (event: ClipboardEvent) => {
      const cd = event.clipboardData;
      if (!cd) return;

      // 1. Check items for binary images (most browsers: "Copy Image") — collect all
      const items = cd.items;
      if (items) {
        const imageFiles: globalThis.File[] = [];
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }
        if (imageFiles.length > 0) {
          event.preventDefault();
          const remaining = maxImages - images.length;
          imageFiles.slice(0, Math.max(0, remaining)).forEach((file) =>
            handleWebFileSelected(file)
          );
          return;
        }
      }

      // 2. Check files array (Edge / some Chromium builds put images here)
      if (cd.files && cd.files.length > 0) {
        const imageFiles = Array.from(cd.files).filter((f) =>
          f.type.startsWith('image/')
        );
        if (imageFiles.length > 0) {
          event.preventDefault();
          const remaining = maxImages - images.length;
          imageFiles.slice(0, Math.max(0, remaining)).forEach((file) =>
            handleWebFileSelected(file)
          );
          return;
        }
      }

      // 3. Check for a plain-text URL that looks like an image (Ctrl+V of image URL)
      const plainText = cd.getData('text/plain');
      if (plainText) {
        const trimmed = plainText.trim();
        if (
          (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
          /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?[^"'\s]*)?$/i.test(trimmed)
        ) {
          event.preventDefault();
          handlePastedImageUrl(trimmed);
          return;
        }
      }

      // 4. Extract src from HTML img tag (e.g. copied rich-text from a web page)
      const html = cd.getData('text/html');
      if (html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match?.[1] && (match[1].startsWith('http://') || match[1].startsWith('https://'))) {
          event.preventDefault();
          handlePastedImageUrl(match[1]);
          return;
        }
      }
    };

    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('paste', onPaste);
    };
  }, [handleWebFileSelected, handlePastedImageUrl, images.length, maxImages]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onDragEnter = (event: DragEvent) => {
      if (!hasImageFiles(event.dataTransfer)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsGlobalDragOver(true);
    };

    const onDragOver = (event: DragEvent) => {
      if (!hasImageFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (!isGlobalDragOver) setIsGlobalDragOver(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!hasImageFiles(event.dataTransfer)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsGlobalDragOver(false);
      }
    };

    const onDrop = (event: DragEvent) => {
      if (!hasImageFiles(event.dataTransfer)) return;
      if (event.defaultPrevented) {
        setIsGlobalDragOver(false);
        dragDepthRef.current = 0;
        return;
      }

      event.preventDefault();
      setIsGlobalDragOver(false);
      dragDepthRef.current = 0;

      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        const remaining = maxImages - images.length;
        Array.from(files).slice(0, Math.max(0, remaining)).forEach((file) =>
          handleWebFileSelected(file as globalThis.File)
        );
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleWebFileSelected, hasImageFiles, isGlobalDragOver, images.length, maxImages]);

  useEffect(() => {
    return () => {
      if (fileInputRef.current && typeof document !== 'undefined') {
        fileInputRef.current.remove();
        fileInputRef.current = null;
      }
    };
  }, []);
  // --- Notify Parent Component of Changes ---
  useEffect(() => {
    // Only notify parent when images actually change
    onImagesChange(images);
  }, [images, onImagesChange]);

  // --- Render ---
  return (
    <View>
      {Platform.OS === 'web' && (
        <Modal transparent visible={isGlobalDragOver} animationType="fade">
          <View style={styles.globalDropOverlay}>
            <View style={[styles.globalDropCard, { borderColor: colors.primary }]}> 
              <Text style={[styles.globalDropTitle, { color: colors.primary }]}>Drop to upload</Text>
              <Text style={[styles.globalDropSubtitle, { color: colors.textSecondary }]}>Release anywhere to add your image</Text>
            </View>
          </View>
        </Modal>
      )}
      {/* Display Images - Limit to first 3 images to prevent excessive scrolling */}
      <View
        style={[
          styles.dropZone,
          { borderColor: isDragOver ? colors.primary : colors.inputBorder },
          isDragOver && { backgroundColor: colors.primary + '12' },
        ]}
        {...(Platform.OS === 'web'
          ? ({
              onDrop: handleWebDrop,
              onDragOver: handleWebDragOver,
              onDragLeave: handleWebDragLeave,
            } as any)
          : {})}
      >
      <View style={images.length > 1 ? styles.multipleImagesContainer : styles.singleImageContainer}>
        {images.slice(0, maxImages).map((image) => {
          // Prefer signed URL previews for storage compatibility, then public URL.
          const imageUri = image.previewUrl || image.url || image.localUri;
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
                  style={[
                    styles.previewImage,
                    // Make images smaller when there are multiple
                    images.length > 1 && styles.previewImageSmall
                  ]}
                  onError={() => {
                    // Verify remote URL before surfacing an error; some devices fail first render while URL is still propagating.
                    if (image.url && image.localUri) {
                      (async () => {
                        const remoteReachable = await validateImageUrl(image.url);
                        setImages((prevImages) =>
                          prevImages.map((img) =>
                            img.id === image.id
                              ? {
                                  ...img,
                                  previewUrl: undefined,
                                  error: remoteReachable
                                    ? undefined
                                    : 'Uploaded successfully. Using local preview while remote image becomes available.',
                                }
                              : img
                          )
                        );
                      })();
                      return;
                    }

                    setImages((prevImages) =>
                      prevImages.map((img) =>
                        img.id === image.id
                          ? { ...img, error: 'Failed to load image' }
                          : img
                      )
                    );
                  }}
                  onLoad={() => {
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
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 8, color: colors.primary }}>
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
              <Trash2 size={20} color={colors.primary} />
            </Pressable>
          </View>
        );
      })}
      {/* Show notification if there are more than 3 images */}
      {images.length > maxImages && (
        <View style={{ 
          backgroundColor: colors.surface, 
          padding: 8, 
          borderRadius: 8, 
          marginBottom: 12,
          alignItems: 'center' 
        }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            {images.length - maxImages} more image(s) not shown. First {maxImages} displayed for performance.
          </Text>
        </View>
      )}
      </View>
      {Platform.OS === 'web' && (
        <Text style={[styles.dropZoneHint, { color: colors.textSecondary }]}>
          Drag and drop an image file here
        </Text>
      )}
      </View>
      {/* Add Image from Web URL */}
      <View style={styles.addUrlSection}>
        <TextInput
          style={[styles.urlInput, { 
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.inputText,
          }]}
          placeholder="Paste one or more image URLs (one per line)"
          placeholderTextColor={colors.textSecondary}
          value={webImageUrlInput}
          onChangeText={setWebImageUrlInput}
          keyboardType="url"
          multiline
          numberOfLines={2}
        />
        <Pressable style={[styles.urlButton, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]} onPress={handleAddWebImageUrl}>
          <Globe size={24} color={colors.primary} />
          <Text style={[styles.urlButtonText, { color: colors.primary }]}>Add URL</Text>
        </Pressable>
      </View>
      {Platform.OS === 'web' && (
        <Text style={[styles.webHint, { color: colors.textSecondary }]}>Tip: paste images with Ctrl+V, drag-and-drop multiple files, or paste multiple URLs (one per line).</Text>
      )}
      {/* Capture/Pick Local Image */}
      <View style={styles.imageButtonContainer}>
        {Platform.OS === 'web' ? (
          <Pressable
            style={[styles.imageButton, { borderColor: colors.primary }]}
            onPress={triggerWebFilePicker}
          >
            <Images size={24} color={colors.primary} />
            <Text style={[styles.imageButtonText, { color: colors.primary }]}>
              Upload Photos
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={[styles.imageButton, { borderColor: colors.primary }]}
              onPress={handleCameraCapture}
            >
              <Camera size={24} color={colors.primary} />
              <Text style={[styles.imageButtonText, { color: colors.primary }]}>
                Take Photo
              </Text>
            </Pressable>
            <Pressable
              style={[styles.imageButton, { borderColor: colors.primary }]}
              onPress={handleImagePicker}
            >
              <Images size={24} color={colors.primary} />
              <Text style={[styles.imageButtonText, { color: colors.primary }]}>
                Pick Photos
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  multipleImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  singleImageContainer: {
    flexDirection: 'column',
  },
  imageContainer: {
    marginBottom: 12, // Reduced from 16
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 150, // Reduced from 250 to make images smaller
    flex: 1, // Allow flexible sizing in row layout
    minWidth: '45%', // Ensure minimum width when in horizontal layout
  },
  dropZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  dropZoneHint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
  },
  webHint: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  urlInput: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
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
    borderRadius: 8,
    borderWidth: 1,
  },
  urlButtonText: {
    fontSize: 16,
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
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageCaptureContainer: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 120, // Reduced from 200 to make images more compact
    borderRadius: 12,
    marginBottom: 8, // Reduced from 12
  },
  previewImageSmall: {
    height: 80, // Even smaller for multiple images
  },
  globalDropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  globalDropCard: {
    minWidth: 260,
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  globalDropTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  globalDropSubtitle: {
    fontSize: 14,
    marginTop: 6,
  },
});

export default ImageHandler;
