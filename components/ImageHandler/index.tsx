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

const ImageHandler: React.FC<ImageHandlerProps> = ({
  initialImages = [],
  onImagesChange,
  bucketName,
}) => {
  const [images, setImages] = useState<Imageinfo[]>(initialImages);
  const [webImageUrlInput, setWebImageUrlInput] = useState('');

  // --- Image Handling Functions ---

  const handleLocalImageSelected = useCallback(
    async (localUri: string) => {
      if (!localUri) return;
      const imageId = uuidv4();
      setImages((prevImages) => [
        ...prevImages,
        {
          id: imageId,
          type: 'supabase',
          url: '',
          localUri: localUri,
          isLoading: true,
        },
      ]);
      try {
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
        )}.${extensionToUse}`;
        const filePath = fileName;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName) // Use bucketName prop

          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: blob.type || `image/${extensionToUse}`,
          });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from(bucketName) // Use bucketName prop
          .getPublicUrl(filePath);
        if (!publicUrlData?.publicUrl) {
          throw new Error('Could not get public URL for the uploaded image.');
        }
        console.log('Upload success, public URL:', publicUrlData.publicUrl); // Log the public URL
        setImages((prevImages) =>
          prevImages.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  url: 'https://placehold.co/600x400?text=Test+Image', // Dummy image URL
                  isLoading: false,
                  localUri: undefined, // Clear localUri after upload
                  error: undefined, // Clear error for testing
                }
              : img
          )
        );
      } catch (error: any) {
        console.error('Upload failed:', error);
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

      // Use Expo ImagePicker or any other library to select an image
      // Example using Expo ImagePicker:
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        handleLocalImageSelected(localUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image.');
    }
  }, [handleLocalImageSelected, bucketName]);

  // --- Notify Parent Component of Changes ---
  useEffect(() => {
    // Only send images that are done loading and have a valid URL
    const readyImages = images.filter(
      (img) => img.url && !img.isLoading && !img.error
    );
    console.log('onImagesChange called with images:', readyImages);
    onImagesChange(readyImages);
  }, [images, onImagesChange]);

  // --- Render ---
  return (
    <View>
      {/* Display Images */}
      {images.map((image) => (
        <View key={image.id} style={styles.imageContainer}>
          {image.isLoading && (
            <ActivityIndicator style={styles.imageloadingIndicator} />
          )}
          {image.url ? (
            <Image source={{ uri: image.url }} style={styles.previewImage} />
          ) : (
            <Image
              source={{ uri: image.localUri }}
              style={styles.previewImage}
            />
          )}
          {image.error && <Text>{image.error}</Text>}
          <Pressable
            onPress={() => handleRemoveImage(image.id)}
            style={styles.removeImageButton}
          >
            <Trash2 style={styles.iconLook} />
          </Pressable>
        </View>
      ))}

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
  iconLook: {
    color: '#2d7a3a',
    marginRight: 3,
    fontSize: 16,
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
