import {
  Link,
  useRouter,
  // router, // router is already available via useRouter()
  useLocalSearchParams,
  useFocusEffect,
} from 'expo-router';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  FlatList, // Keep FlatList if you plan to use it for images
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Camera,
  Upload, // This icon might be for the "Add URL" button now
  Trash2, // For removing images
  Globe, // For URL input
  // ... other icons ...
} from 'lucide-react-native';
import ImageCapture from '@/components/ImageCapture';
import DateTimePicker from '@react-native-community/datetimepicker';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

import type { Supplier, Seed as SeedTypeFromDB } from '@/types/database'; // Renamed to avoid conflict
import { supabase } from '@/lib/supabase';

// Define the structure for an image in our form state
interface ImageInfo {
  id: string; // Client-side unique ID
  type: 'supabase' | 'url';
  url?: string; // Final URL (Supabase public URL or external web URL)
  localUri?: string; // Temporary local URI for preview & upload source (for 'supabase' type)
  isLoading?: boolean; // For 'supabase' type during upload
  error?: string; // For 'supabase' type if upload fails
}

// Update your Seed interface for the form state if it's different from DB
// For this example, we'll assume SeedTypeFromDB is the source and we adapt
interface SeedFormData
  extends Omit<Partial<SeedTypeFromDB>, 'seed_image' | 'images'> {
  images?: ImageInfo[]; // Replaces single seed_image
  // Add other fields if your form state differs from DB type
}

// ... (seedTypes array remains the same) ...

export default function AddOrEditSeedScreen() {
  const params = useLocalSearchParams<{ seed?: string; returnTo?: string }>();
  const router = useRouter();
  const isEditing = !!params.seed;

  const editingSeedData = useMemo(() => {
    if (!params.seed) return null;
    try {
      const parsed = JSON.parse(params.seed as string) as SeedTypeFromDB;
      // Convert date strings to Date objects
      if (
        parsed.date_purchased &&
        typeof parsed.date_purchased === 'string'
      ) {
        parsed.date_purchased = new Date(parsed.date_purchased);
      }
      // Transform old seed_image or existing images array into ImageInfo[]
      let initialImages: ImageInfo[] = [];
      if (parsed.seed_images && Array.isArray(parsed.seed_images)) {
        // New structure: { images: [{ type, url }, ...] }
        initialImages = (
          parsed.seed_images as Array<{ type: 'supabase' | 'url'; url: string }>
        ).map((img, index) => ({
          id: uuidv4(), // Assign new client ID
          type: img.type,
          url: img.url,
        }));
      } else if (parsed.seed_images) {
        // Old structure: { seed_image: "some_url" } - assume it's an external URL
        initialImages = [
          { id: uuidv4(), type: 'url', url: parsed.seed_images as string },
        ];
      }
      return { ...parsed, images: initialImages } as SeedTypeFromDB & {
        images: ImageInfo[];
      };
    } catch (error) {
      console.error('Error parsing seed data for editing:', error);
      Alert.alert('Error', 'Could not load seed data for editing.');
      return null;
    }
  }, [params.seed]);

  const [seedPackage, setSeedPackage] = useState<SeedFormData>(
    isEditing && editingSeedData
      ? editingSeedData
      : {
          id: uuidv4(), // Generate a new ID for new seeds
          images: [], // Initialize with an empty array for images
          seed_name: '',
          type: '',
          description: '',
          quantity: 0,
          quantity_unit: 'seeds',
          supplier_id: '',
          date_purchased: undefined,
          seed_price: 0.0,
          // ... other initial fields ...
        }
  );

  const [webImageUrlInput, setWebImageUrlInput] = useState(''); // For the URL input field
  const [errors, setErrors] = useState<{ [key: string]: string }>({}); // For form validation errors
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null); // Add this line
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state
  const [showSuccess, setShowSuccess] = useState(false); // Track success message
  const [showImageCapture, setShowImageCapture] = useState(false); // Track image capture modal
  // ... (other state variables: errors, isSubmitting, showSuccess, showImageCapture, etc.)
  // Remove: previewImage, isImageUploaded (these are now part of ImageInfo)

  const clearForm = () => {
    setSeedPackage({
      id: 'uuid', // Reset ID for new seed
      seed_images: [], // Clear images
      seed_name: '',
      type: '',
      description: '',
      quantity: 0,
      quantity_unit: 'seeds',
      supplier_id: '',
      date_purchased: undefined,
      seed_price: 0.0,
      // ... reset other fields ...
    });
    setErrors({});
    setSelectedSupplier(null);
    setWebImageUrlInput('');
  };

  // --- Image Handling ---

  // For local image capture/selection (uploads to Supabase)
  const handleLocalImageSelected = async (localUri: string | null) => {
    setShowImageCapture(false);
    if (!localUri) return;

    const imageId = uuidv4();
    const newImageEntry: ImageInfo = {
      id: imageId,
      type: 'supabase',
      localUri: localUri,
      isLoading: true,
    };

    setSeedPackage((prev) => ({
      ...prev,
      images: [...(prev.images || []), newImageEntry],
    }));

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
      const filePath = fileName; // Or a path like `user_id/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('seed-images') // YOUR BUCKET NAME
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || `image/${extensionToUse}`,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('seed-images') // YOUR BUCKET NAME
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Could not get public URL for the uploaded image.');
      }

      setSeedPackage((prev) => ({
        ...prev,
        images: (prev.images || []).map((img) =>
          img.id === imageId
            ? {
                ...img,
                url: publicUrlData.publicUrl,
                isLoading: false,
                localUri: undefined,
              }
            : img
        ),
      }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setSeedPackage((prev) => ({
        ...prev,
        images: (prev.images || []).map((img) =>
          img.id === imageId
            ? {
                ...img,
                isLoading: false,
                error: error.message || 'Upload failed',
              }
            : img
        ),
      }));
      Alert.alert(
        'Upload Error',
        `Failed to upload image: ${error.message || 'Unknown error'}`
      );
    }
  };

  // For adding an image via a web URL
  const handleAddWebImageUrl = () => {
    if (!webImageUrlInput.trim()) {
      Alert.alert('Invalid URL', 'Please enter a valid web URL for the image.');
      return;
    }
    // Basic URL validation (you might want a more robust one)
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

    const newImageEntry: ImageInfo = {
      id: uuidv4(),
      type: 'url',
      url: webImageUrlInput.trim(),
    };
    setSeedPackage((prev) => ({
      ...prev,
      images: [...(prev.images || []), newImageEntry],
    }));
    setWebImageUrlInput(''); // Clear the input field
  };

  const handleRemoveImage = (imageIdToRemove: string) => {
    // Optional: If type is 'supabase' and image has a URL, delete from Supabase Storage
    const imageToRemove = seedPackage.images?.find(
      (img) => img.id === imageIdToRemove
    );
    if (imageToRemove?.type === 'supabase' && imageToRemove.url) {
      const filePath = imageToRemove.url.substring(
        imageToRemove.url.lastIndexOf('/') + 1
      ); // Basic path extraction
      // supabase.storage.from('seed-images').remove([filePath]).then(...);
      // console.log(`Placeholder: Would attempt to delete ${filePath} from Supabase Storage.`);
    }

    setSeedPackage((prev) => ({
      ...prev,
      images: (prev.images || []).filter((img) => img.id !== imageIdToRemove),
    }));
  };

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateForm(seedPackage, setErrors)) return; // Pass state and setter

    setIsSubmitting(true);
    setErrors({});

    // Prepare images for database: only type and final URL, and only if not errored/still loading
    const imagesToSave = (seedPackage.images || [])
      .filter((img) => img.url && !img.isLoading && !img.error)
      .map((img) => ({ type: img.type, url: img.url }));

    const payload: any = {
      // Use 'any' for payload temporarily, or create a specific DB payload type
      ...seedPackage,
      images: imagesToSave, // This will be saved to the JSONB column
      quantity: Number(seedPackage.quantity) || 0,
      seed_price: Number(seedPackage.seed_price) || 0,
      // ... (other type conversions and null checks from your existing handleSubmit)
      date_purchased: seedPackage.date_purchased
        ? seedPackage.date_purchased.toISOString()
        : null,
      supplier_id: seedPackage.supplier_id || null,
    };

    // Remove client-side only fields or fields not directly in 'seeds' table
    delete payload.suppliers; // If 'suppliers' object was part of seedPackage from join
    // delete payload.seed_image; // If old field still exists in state type by mistake

    if (!isEditing) {
      delete payload.id; // Remove ID if inserting a new seed
    }

    try {
      let responseError = null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user && !isEditing)
        throw new Error('User not authenticated for new seed.');

      if (isEditing && editingSeedData?.id) {
        const { error } = await supabase
          .from('seeds')
          .update(payload)
          .eq('id', editingSeedData.id);
        responseError = error;
      } else {
        const { error } = await supabase.from('seeds').insert({
          ...payload,
          user_id: user?.id, // Add user_id for new seeds
        });
        responseError = error;
      }

      if (responseError) throw responseError;

      setShowSuccess(true);
      if (!isEditing) clearForm();

      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace((params.returnTo || '/(tabs)') as any);
        }
        setShowSuccess(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving seed:', error);
      setErrors({ submit: `Failed to save seed. ${error.message || ''}` });
      setShowSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (useEffect for supplier details, priceInput, validateForm, handleSupplierSelect, handleDateChange remain similar)

  // --- JSX ---
  return (
    <View style={styles.imagePreviewContainer}>
      {/* Header, Success/Error Messages ... */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.title}>
          {isEditing ? 'Edit Seed' : 'Add New Seed'}
        </Text>
      </View>
      {/* ... (Success/Error Messages) ... */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* --- Images Section --- */}
        <View style={styles.section}>
          <Text style={styles.label}>Images</Text>
          {/* Display existing/uploaded images */}
          {(seedPackage.images || []).map((imageInfo) => (
            <View key={imageInfo.id} style={styles.imagePreviewContainer}>
              <Image
                source={{
                  uri: imageInfo.isLoading
                    ? imageInfo.localUri
                    : imageInfo.url || imageInfo.localUri,
                }}
                style={styles.previewImageItem}
              />
              {imageInfo.isLoading && (
                <ActivityIndicator style={styles.imageLoadingIndicator} />
              )}
              {imageInfo.error && (
                <Text style={styles.errorText}>{imageInfo.error}</Text>
              )}
              {!imageInfo.isLoading && (
                <Pressable
                  onPress={() => handleRemoveImage(imageInfo.id)}
                  style={styles.removeImageButton}
                >
                  <Trash2 size={20} color="#dc2626" />
                </Pressable>
              )}
            </View>
          ))}
          {(!seedPackage.images || seedPackage.images.length === 0) && (
            <View style={styles.previewImagePlaceholder}>
              <Text style={styles.previewImagePlaceholderText}>
                No images added yet
              </Text>
            </View>
          )}

          {/* Add Image from Web URL */}
          <View style={styles.addUrlSection}>
            <TextInput
              style={styles.input}
              placeholder="Paste image URL (e.g., https://...)"
              placeholderTextColor="#999"
              value={webImageUrlInput}
              onChangeText={setWebImageUrlInput}
              keyboardType="url"
            />
            <Pressable
              style={styles.imageButton}
              onPress={handleAddWebImageUrl}
            >
              <Globe size={20} color="#2d7a3a" />
              <Text style={styles.imageButtonText}>Add URL</Text>
            </Pressable>
          </View>

          {/* Capture/Pick Local Image */}
          <Pressable
            style={styles.imageButton}
            onPress={() => setShowImageCapture(true)}
          >
            <Camera size={24} color="#2d7a3a" />
            <Text style={styles.imageButtonText}>Capture/Pick Image</Text>
          </Pressable>
        </View>

        {showImageCapture && (
          <ImageCapture onImageCaptured={handleLocalImageSelected} />
        )}

        {/* ... (Rest of your form sections: Seed Name, Type, Description, etc.) ... */}
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Seed Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seed Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={seedPackage.seed_name || ''} // Handle potential null/undefined
              onChangeText={(text) =>
                setSeedPackage((prev) => ({ ...prev, seed_name: text }))
              }
              placeholder="e.g., Brandywine Tomato"
              placeholderTextColor="#999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          {/* ... (all other form fields as before) ... */}
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? 'Save Changes' : 'Add Seed'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // ... (Your existing styles: container, header, backButton, title, content, messages, formSection, inputGroup, label, input, etc.)
  section: {
    // General section styling
    marginBottom: 24,
    gap: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 5,
  },
  previewImageItem: {
    width: '100%',
    height: 180, // Adjust as needed
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imageLoadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }], // Center indicator
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 6,
    borderRadius: 15,
  },
  addUrlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  // Re-use or adapt existing styles for image buttons, inputs, etc.
  // Ensure styles for previewImagePlaceholder, imageButton, imageButtonText are suitable
  previewImagePlaceholder: {
    // Copied from your existing styles
    width: '100%',
    height: 150, // Adjusted height
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  previewImagePlaceholderText: {
    // Copied
    fontSize: 16,
    color: '#666666',
  },
  imageButton: {
    // Copied and slightly adapted
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d7a3a',
    gap: 8,
    // flex: 1, // Remove if buttons shouldn't take full width in a row
  },
  imageButtonText: {
    // Copied
    fontSize: 16,
    color: '#2d7a3a',
    fontWeight: '600',
  },
  // ... (Rest of your styles)
  input: {
    // Ensure input style is generic enough for URL input too
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 1, // Make URL input take available space in its row
  },
  errorText: {
    // Copied
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
  },
  // ... (all other styles from your original file)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#336633',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  successMessage: {
    backgroundColor: '#dcfce7',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    color: '#dc2626',
    fontSize: 16,
    flex: 1,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a472a',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2d7a3a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
function setShowImageCapture(arg0: boolean)
{
  throw new Error('Function not implemented.');
}

function validateForm(seedPackage: SeedFormData, setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>) {
  // Example validation: check if seed_name is present
  let valid = true;
  const newErrors: { [key: string]: string } = {};

  if (!seedPackage.seed_name || seedPackage.seed_name.trim() === '') {
    newErrors.name = 'Seed name is required.';
    valid = false;
  }
  // Add more validation as needed...

  setErrors(newErrors);
  return valid;
}

