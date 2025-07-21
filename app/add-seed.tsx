import {
  useRouter,
  useLocalSearchParams,
} from 'expo-router';
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'; // Added useCallback
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Droplets,
  Sun,
  Ruler,
  Clock,
  Sprout,
  Mountain,
  FlaskRound as Flask,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import ImageHandler from '@/components/ImageHandler'; // Adjust path if needed
import { SupplierSelect } from '@/components/SupplierSelect';
import DateTimePicker from '@react-native-community/datetimepicker';
import 'react-native-get-random-values'; // For uuidv4
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed

import type { Supplier, Seed } from '@/types/database'; // Assuming types are defined
import { supabase } from '@/lib/supabase';

type SeedType = {
  label: string;
  value: string;
};

const seedTypes: SeedType[] = [
  { label: 'Vegetable', value: 'vegetable' },
  { label: 'Fruit', value: 'Fruit' },
  { label: 'Flower', value: 'Flower' },
  { label: 'Herb', value: 'Herb' },
  { label: 'Grain', value: 'Grain' },
  { label: 'Other', value: 'Other' },
];

// Define the structure for an image in our form state
interface Imageinfo {
  id: string; // Client-side unique ID
  type: 'supabase' | 'url';
  url: string; // Final URL (Supabase public URL or external web URL)
  localUri?: string; // Temporary local URI for preview & upload source (for 'supabase' type)
  isLoading?: boolean; // For 'supabase' type during upload
  error?: string; // For 'supabase' type if upload fails
}

// State for form data
// Using useState to manage form state

// Update your Seed interface for the form state if it's different from DB

export default function AddOrEditSeedScreen() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoAddToCalendar] = useState(true); // New state for calendar toggle

  const params = useLocalSearchParams<{
    returnTo: string;
    newSupplierID?: string;
    newSupplierName?: string;
    reloadSuppliers?: string;
    seed?: string; // JSON string of seed data for editing
  }>();

  const isEditing = !!params.seed; // Check if we're editing
  // Add this before useEffect (e.g., after other useState hooks)
  const [reloadSuppliers, setReloadSuppliers] = useState(false);

  useEffect(() => {
    if (params.newSupplierID && params.newSupplierName) {
      // If a new supplier ID is provided, set it as the selected supplier
      setSeedPackage((prev) => ({
        ...prev,
        supplier_id: params.newSupplierID, // Set the supplier_id to the newSupplierID
      }));
      // Fetch the full supplier object from the database to satisfy the Supplier type
      (async () => {
        try {
          const { data: supplier, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', params.newSupplierID)
            .single();
          if (error) {
            console.error('Error fetching supplier:', error);
            setSelectedSupplier(null);
          } else {
            setSelectedSupplier(supplier as Supplier);
          }
        } catch (error) {
          console.error('Error fetching supplier:', error);
          setSelectedSupplier(null);
        }
      })();
    }
    if (params.reloadSuppliers === 'true') {
      setReloadSuppliers(true); // Set reloadSuppliers to true if specified;
    }
  }, [params.newSupplierID, params.newSupplierName, params.reloadSuppliers]);

  // Parse editingSeed data safely
  const editingSeed = useMemo(() => {
    if (!params.seed) return null;
    try {
      const parsed = JSON.parse(params.seed as string) as Seed; // Adjust type as needed
      //Convert date strings to Date objects
      let initialImagesData: { type: 'supabase' | 'url'; url: string }[] = [];
      if (parsed.seed_images && Array.isArray(parsed.seed_images)) {
        // New structure: { images: [{ type, url }, ...] }
        initialImagesData = parsed.seed_images as {
          type: 'supabase' | 'url';
          url: string;
        }[]; // Ensure it's an array of objects with type and url
      } else if (parsed.seed_images) {
        // Old structure: { seed_image: "some_url" } - assume it's an external URL
        initialImagesData = [
          {
            type: 'url',
            url: (parsed.seed_images as string) ?? '',
          },
        ];
      }
      if (parsed.date_purchased) {
        parsed.date_purchased = new Date(parsed.date_purchased);
      }
      // Transform old seed_image or existing images array into Imageinfo[]
      const initialImages: Imageinfo[] = initialImagesData.map((img) => ({
        id: uuidv4(), // Assign new client ID
        type: img.type,
        url: img.url ?? '', // Ensure url is always a string
        localUri: undefined, // Use the url as the localUri for preview
        isLoading: false, // Not loading since it's already uploaded
        error: undefined, // No error initially
      }));
      return { ...parsed, seed_images: initialImages } as Seed & {
        seed_images: Imageinfo[];
      };
    } catch (error) {
      console.error('Error parsing seed data for editing:', error);
      Alert.alert('Error', 'Could not load seed data for editing.');
      return null;
    }
  }, [params.seed]);

  // Initialize form state using the imported Seed type (Partial allows optional fields)
  const [seedPackage, setSeedPackage] = useState<Seed>(
    isEditing && editingSeed
      ? editingSeed
      : ({
          id: 'uuid',
          user_id: '',
          seed_images: [],
          seed_name: '',
          type: '',
          description: '',
          quantity: 0,
          quantity_unit: 'seeds',
          supplier_id: '',
          date_purchased: undefined,
          seed_price: 0.0,
          planting_depth: '',
          spacing: '',
          watering_requirements: '',
          sunlight_requirements: '',
          soil_type: '',
          storage_location: '',
          storage_requirements: '',
          germination_rate: 0,
          fertilizer_requirements: '',
          days_to_germinate: '',
          days_to_harvest: '',
          planting_season: '',
          harvest_season: '',
          notes: '',
        } as Seed) // Explicitly cast as Seed to satisfy TypeScript
  );

  const handleImagesChange = useCallback((newImages: Imageinfo[]) => {
   
    setSeedPackage((prev) => ({ ...prev, seed_images: newImages }));
  }, []);

  const clearForm = () => {
    setSeedPackage({
      id: 'uuid', // Add missing id property
      user_id: '', // Add missing user_id property
      seed_images: [],
      seed_name: '',
      type: '',
      description: '',
      quantity: 0,
      quantity_unit: 'seeds',
      supplier_id: '',
      date_purchased: undefined,
      seed_price: 0.0,
      planting_depth: '',
      spacing: '',
      watering_requirements: '',
      sunlight_requirements: '',
      soil_type: '',
      storage_location: '',
      storage_requirements: '',
      germination_rate: 0,
      fertilizer_requirements: '',
      days_to_germinate: '', // Use string for range input
      days_to_harvest: 0,
      planting_season: '',
      harvest_season: '',
      notes: '',
    } as Seed); // Reset to initial state
    setErrors({});
    setSelectedSupplier(null);
    setPriceInput(''); // Reset price input display
  };

  const router = useRouter();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );

  // --- Navigation State and Ref ---
  // NavigationTarget is a string (route) or null
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null); // Use string | null for navigation target
  const routerReadyRef = useRef(false); // Track router readiness

  // --- Set routerReadyRef to true after component mounts ---
  useEffect(() => {
    routerReadyRef.current = true;
  }, []);

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({}); // Clear previous submit errors    
    
    // Prepare images array for saving (strip client-only fields and only include successfully uploaded images)
    const imageArray = Array.isArray(seedPackage.seed_images) ? seedPackage.seed_images as Imageinfo[] : [];
    
    const imagesToSave = imageArray
      .filter((img) => {
        // Include images that have a URL (successful upload) and are not currently loading
        // Allow images with development-related errors since they were uploaded successfully
        const hasValidUrl = !!(img.url && img.url.trim() !== '');
        const notLoading = !img.isLoading;
        const isUploadError = img.error && !img.error.includes('Using local preview');
        
        return hasValidUrl && notLoading && !isUploadError;
      })
      .map((img) => ({
        type: img.type,
        url: img.url,
      }));

    // Prepare payload, ensuring correct types for DB
    const payload: any = {
      // Use 'any' for flexibility, or define a specific type
      ...seedPackage,
      seed_images: imagesToSave.length > 0 ? imagesToSave : null,
      quantity: Number(seedPackage.quantity) || 0,
      seed_price: Number(seedPackage.seed_price) || 0,
      germination_rate: Number(seedPackage.germination_rate) || 0,
      // Ensure date_purchased is in ISO string format or null for Supabase
      date_purchased: seedPackage.date_purchased
        ? seedPackage.date_purchased.toISOString()
        : null,
      supplier_id: seedPackage.supplier_id || null, // Ensure null if empty
    };

    // Remove client-side only fields or fields not directly in 'seeds' table
    delete payload.suppliers; // Remove joined supplier data - not a column in seeds table

    if (!isEditing) {
      delete payload.id; // Remove ID for new seed creation
    }

    try {
      let responseError = null;
      let savedSeedId: string | null = null;
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user && !isEditing)
        throw new Error('User not authenticated for new seed.');

      if (isEditing && editingSeed && editingSeed.id) {
        // Update existing seed
        const { error } = await supabase
          .from('seeds')
          .update(payload) // Pass prepared payload
          .eq('id', editingSeed.id); // Use the ID from the original seedPackage state
        responseError = error;
        savedSeedId = editingSeed.id;
      } else {
        // Add a new seed
        const { data: newSeedData, error } = await supabase.from('seeds').insert({
          ...payload,
          user_id: user?.id, // Add user_id for new seeds
        }).select('id').single();
        responseError = error;
        if (newSeedData) {
          savedSeedId = newSeedData.id;
        }
      }

      if (responseError) throw responseError;

      // Automatically add purchase date to calendar if date is provided and user wants it
      if (autoAddToCalendar && savedSeedId && seedPackage.date_purchased && seedPackage.seed_name) {
        try {
          await supabase
            .from('calendar_events')
            .insert({
              seed_id: savedSeedId,
              seed_name: seedPackage.seed_name,
              event_date: seedPackage.date_purchased.toISOString(),
              category: 'purchase',
              notes: `Purchased ${seedPackage.seed_name}${selectedSupplier ? ` from ${selectedSupplier.supplier_name}` : ''}`,
              user_id: user?.id, // Add user_id for RLS
            });
        } catch (calendarError) {
          console.error('Error adding purchase date to calendar:', calendarError);
          // Don't fail the seed creation if calendar addition fails
        }
      }

      // Reset form state
      setShowSuccess(true);
      if (!isEditing) clearForm(); // Clear form only if adding new seed
      setNavigationTarget(params.returnTo || '/(tabs)'); // Set navigation target
    } catch (error: any) {
      console.error('Error saving seed:', error);
      setErrors({ submit: `Failed to save seed. ${error.message || ''}` });
      setShowSuccess(false); // Hide success message on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper function to format price with dollar sign
  const formatPriceForDisplay = useCallback((price: number | string): string => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return '';
    if (numericPrice === 0) return ''; // Keep empty for zero to match current UX
    return `$${numericPrice.toFixed(2)}`;
  }, []);

  const [priceInput, setPriceInput] = useState<string>(
    formatPriceForDisplay(editingSeed?.seed_price ?? seedPackage.seed_price ?? 0)
  );
  // --- Supplier Fetching Logic ---

  useEffect(() => {
    if (params.newSupplierID) {
      const fetchNewSupplier = async () => {
        try {
          const { data: supplier, error } = await supabase
            .from('suppliers')
            .select('*') // Fetch all fields for Supplier
            .eq('id', params.newSupplierID)
            .single();

          if (error) {
            console.error('Error fetching new supplier:', error);
            Alert.alert(
              'Error',
              'Failed to load new supplier details. Please try again.'
            );
          } else if (supplier) {
            setSeedPackage((prev) => ({
              ...prev,
              supplier_id: supplier.id,
            }));
            setSelectedSupplier(supplier as Supplier); // Update selectedSupplier
          }
        } catch (error: any) {
          console.error('Error fetching new supplier:', error);
          Alert.alert(
            'Error',
            `Failed to load supplier details: ${error.message || error}`
          );
        }
      };
      fetchNewSupplier();
    }
    if (params.reloadSuppliers === 'true') {
      setReloadSuppliers(true);
    }
  }, [params.newSupplierID, params.reloadSuppliers]);

  // Fetch supplier details when seedPackage.supplier_id changes
  useEffect(() => {
    const fetchSupplierDetails = async () => {
      if (!seedPackage.supplier_id) {
        setSelectedSupplier(null);
        return;
      }
      try {
        const { data: supplier, error } = await supabase
          .from('suppliers') // Ensure this matches your table name
          .select('*') // Fetch all fields for Supplier
          .eq('id', seedPackage.supplier_id) //Filter for the current supplier_id
          .single(); // Expect a single object, not an array
        // Check for errors
        if (error) throw error;
        if (supplier) {
          // Ensure supplier is an object with expected properties
          if (
            typeof supplier === 'object' &&
            supplier !== null &&
            'id' in supplier &&
            'supplier_name' in supplier
          ) {
            // Check if supplier has the expected properties
            setSelectedSupplier(supplier as Supplier); // Cast to Supplier type
          } else {
            console.error('Invalid supplier data:', supplier);
            Alert.alert(
              'Error',
              'Failed to load supplier data. The data received is invalid.'
            );
            setSelectedSupplier(null);
          }
        } else {
          setSelectedSupplier(null); // Reset if no supplier found
        }
      } catch (error: any) {
        console.error('Error fetching supplier details:', error);
        Alert.alert(
          'Error',
          `Failed to load supplier details: ${error.message || error}`
        );
        setSelectedSupplier(null); // Reset if error occurs
      }
    };
    fetchSupplierDetails();
  }, [seedPackage.supplier_id]);

  // Add useEffect to sync input state if seedPackage.seed_price changes externally
  // (Important for initial load when editing)
  useEffect(() => {
    const formattedPrice = formatPriceForDisplay(seedPackage.seed_price ?? 0);
    // Update input only if it's different to avoid potential loops
    // and ensure it reflects the underlying numeric state initially or if reset
    if (
      priceInput !== formattedPrice &&
      parseFloat(priceInput.replace('$', '')) !== seedPackage.seed_price
    ) {
      setPriceInput(formattedPrice);
    }
    // Dependency array ensures this runs when the numeric value changes
  }, [seedPackage.seed_price, priceInput, formatPriceForDisplay]);

  // --- Navigation useEffect ---
  useEffect(() => {
    if (navigationTarget && routerReadyRef.current) {
      // Navigate only if router is ready and there's a target
      router.replace(navigationTarget as any); // Navigate
      setNavigationTarget(null); // Clear target after navigation
    }
  }, [navigationTarget, router]);

  // --- Validation ---
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!seedPackage.seed_name?.trim()) errors.name = 'Seed name is required';
    if (!seedPackage.quantity || seedPackage.quantity <= 0)
      errors.quantity = 'Quantity must be greater than 0';
    if (!seedPackage.type) errors.type = 'Seed type is required';
    if (!seedPackage.supplier_id) errors.supplier = 'Supplier is required';
    
    // Check if any images are still loading
    const imageArray = Array.isArray(seedPackage.seed_images) ? seedPackage.seed_images as Imageinfo[] : [];
    const loadingImages = imageArray.filter(img => img.isLoading);
    if (loadingImages.length > 0) {
      errors.images = `Please wait for ${loadingImages.length} image(s) to finish uploading`;
    }
    
    // Add more validation rules as needed
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Supplier Select Handler ---
  const handleSupplierSelect = (supplier: Supplier | null) => {
    setSeedPackage((prev) => ({
      ...prev,
      supplier_id: supplier?.id || undefined,
    }));
    setSelectedSupplier(supplier);
  };

  // --- Date Change Handler - Make sure to handle both web and mobile date pickers ---
  const handleDateChange = (date: Date) => {
    setSeedPackage((prev: Seed) => ({
      ...prev,
      date_purchased: date,
    }));
    setShowDatePicker(false);
  };

  // --- Render the component ---
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.title}>
          {isEditing ? 'Edit Seed' : 'Add New Seed'}
        </Text>
      </View>
      {/* Success/Error Messages */}
      {showSuccess && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>
            {isEditing
              ? 'Seed updated successfully'
              : `Seed added successfully!${autoAddToCalendar && seedPackage.date_purchased ? ' Purchase date added to calendar.' : ''}`}
          </Text>
        </View>
      )}
      {errors.submit && (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color="#dc2626" />
          <Text style={styles.errorBannerText}>{errors.submit}</Text>
        </View>
      )}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <ImageHandler
            initialImages={seedPackage.seed_images as Imageinfo[]}
            onImagesChange={handleImagesChange}
            bucketName="seed-images"
          />
          {/* Show image loading error if any */}
          {errors.images && (
            <Text style={styles.errorText}>{errors.images}</Text>
          )}
        </View>
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Seed Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seed Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={seedPackage.seed_name || ''} // Handle potential null/undefined
              onChangeText={(text: string) =>
                setSeedPackage((prev) => ({ ...prev, seed_name: text }))
              }
              placeholder="e.g., Brandywine Tomato"
              placeholderTextColor="#999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Seed Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seed Type *</Text>
            <View style={styles.typeContainer}>
              {seedTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.typeButton,
                    seedPackage.type === type.value && styles.selectedType,
                  ]}
                  onPress={() =>
                    setSeedPackage((prev) => ({ ...prev, type: type.value }))
                  }
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      seedPackage.type === type.value &&
                        styles.selectedTypeText,
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={seedPackage.description || ''}
              onChangeText={(text: string) =>
                setSeedPackage((prev) => ({ ...prev, description: text }))
              }
              placeholder="Describe your seeds..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Quantity and Price Row */}
          <View style={styles.quantityPriceRow}>
            {/* Quantity Input */}
            <View style={[styles.inputGroup, styles.quantityInput]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                value={String(seedPackage.quantity || '')} // Ensure string value
                onChangeText={(text: string) => {
                  const num = parseInt(text, 10);
                  setSeedPackage((prev) => ({
                    ...prev,
                    quantity: isNaN(num) ? 0 : num,
                  }));
                }}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {errors.quantity && (
                <Text style={styles.errorText}>{errors.quantity}</Text>
              )}
            </View>

            {/* Price Input */}
            <View style={[styles.inputGroup, styles.priceInput]}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                value={priceInput}
                onChangeText={(text: string) => {
                  // Remove dollar sign and all non-numeric characters except dot
                  let cleaned = text.replace(/[^\d.]/g, '');
                  // Only allow one decimal point
                  const parts = cleaned.split('.');
                  if (parts.length > 2) {
                    cleaned = parts[0] + '.' + parts.slice(1).join('');
                  }
                  // Limit to two decimal places
                  if (cleaned.includes('.')) {
                    const [intPart, decPart] = cleaned.split('.');
                    cleaned =
                      intPart + '.' + (decPart ? decPart.slice(0, 2) : '');
                  }
                  
                  // Store numeric value in state
                  const numericValue = parseFloat(cleaned) || 0;
                  setSeedPackage((prev) => ({
                    ...prev,
                    seed_price: numericValue,
                  }));
                  
                  // Format for display with dollar sign (only if there's a value)
                  const formatted = cleaned === '' ? '' : `$${cleaned}`;
                  setPriceInput(formatted);
                }}
                placeholder="$3.50"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Date Purchased Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purchase Date</Text>
            <Text style={styles.helpText}>
              💡 Purchase date will be automatically added to your calendar
            </Text>
            {/* Web Date Picker */}
            {Platform.OS === 'web' ? (
              <input
                type="date"
                className="date-input"
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: '#333',
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  height: 56,
                  boxSizing: 'border-box',
                  width: '100%',
                } as any}
                value={
                  seedPackage.date_purchased
                    ? seedPackage.date_purchased.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e: any) => {
                  const date = new Date(e.target.value + 'T00:00:00');
                  if (!isNaN(date.getTime())) handleDateChange(date);
                }}
                placeholder="Select a date"
                title="Select event date"
              />
            ) : (
              <>
                <Pressable
                  style={styles.datePickerContainer}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {seedPackage.date_purchased
                      ? seedPackage.date_purchased.toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )
                      : 'Select a date'}
                  </Text>
                  <Calendar size={20} color="#2d7a3a" />
                  {showDatePicker && (
                    <DateTimePicker
                      value={seedPackage.date_purchased || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event: any, selectedDate?: Date) => {
                        if (selectedDate) {
                          handleDateChange(selectedDate);
                        }
                        setShowDatePicker(false);
                      }}
                    ></DateTimePicker>
                  )}
                </Pressable>
              </>
            )}
          </View>

          {/* Supplier Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier</Text>
            {/* Use SupplierSelect component for supplier selection */}
            <SupplierSelect
              onSelect={handleSupplierSelect}
              selectedSupplierId={seedPackage.supplier_id || undefined}
              initialSearchQuery={''}
              // Optionally, add a key to force remount on reloadSuppliers
              key={reloadSuppliers ? 'reload' : 'normal'}
            />
            {/* Show selected supplier name if available */}
            {selectedSupplier && (
              <Text style={styles.selectedSupplierText}>
                Selected: {selectedSupplier.supplier_name}
              </Text>
            )}
            {/* Show error if no supplier selected and form submitted */}
            {errors.supplier && (
              <Text style={styles.errorText}>{errors.supplier}</Text>
            )}
          </View>

          {/* Growth Timeline Section */}
          <View style={styles.timingSection}>
            <Text style={styles.sectionTitle}>Growth Timeline</Text>
            <View style={styles.timelineRow}>
              <View style={styles.timelineItem}>
                <Sprout size={24} color="#2d7a3a" />
                <Text style={styles.timelineLabel}>Days to Germinate</Text>
                <TextInput
                  style={styles.timelineInput}
                  value={
                    seedPackage.days_to_germinate
                      ? String(seedPackage.days_to_germinate)
                      : ''
                  }
                  onChangeText={(text: string) => {
                    setSeedPackage((prev) => ({
                      ...prev,
                      // Accept string for range (e.g., '7-10')
                      days_to_germinate: text,
                    }));
                  }}
                  placeholder="e.g., 7-10"
                  placeholderTextColor="#999"
                  keyboardType="default" // Allow any input, not just numbers
                />
              </View>
              <View style={styles.timelineItem}>
                <Clock size={24} color="#2d7a3a" />
                <Text style={styles.timelineLabel}>Days to Harvest</Text>
                <TextInput
                  style={styles.timelineInput}
                  value={
                    seedPackage.days_to_harvest
                      ? String(seedPackage.days_to_harvest)
                      : ''
                  } // Ensure string value
                  onChangeText={(text: string) => {
                    setSeedPackage((prev) => ({
                      ...prev,
                      //Accepting string for range (eg., '21 - 120')
                      days_to_harvest: text,
                    }));
                  }}
                  placeholder="e.g., 60-80"
                  placeholderTextColor="#999"
                  keyboardType="numeric" // Allow numeric input
                />
              </View>
            </View>
          </View>

          {/* Planting Instructions Section */}
          <View style={styles.plantingSection}>
            <Text style={styles.sectionTitle}>Planting Instructions</Text>
            <View style={styles.instructionRow}>
              <View style={styles.instructionItem}>
                <Ruler size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Planting Depth</Text>
                <TextInput
                  style={styles.instructionInput}
                  value={seedPackage.planting_depth || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      planting_depth: text,
                    }))
                  }
                  placeholder="e.g., 1/4 inch"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.instructionItem}>
                <Ruler
                  style={{ transform: [{ rotate: '90deg' }] }}
                  size={24}
                  color="#2d7a3a"
                />
                <Text style={styles.instructionLabel}>Spacing</Text>
                <TextInput
                  style={styles.instructionInput}
                  value={seedPackage.spacing || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({ ...prev, spacing: text }))
                  }
                  placeholder="e.g., 12 inches"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.instructionItem}>
                <Droplets size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Watering</Text>
                <TextInput
                  style={styles.instructionInput}
                  value={seedPackage.watering_requirements || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      watering_requirements: text,
                    }))
                  }
                  placeholder="e.g., Keep moist"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.instructionItem}>
                <Sun size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Sunlight</Text>
                <TextInput
                  style={styles.instructionInput}
                  value={seedPackage.sunlight_requirements || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      sunlight_requirements: text,
                    }))
                  }
                  placeholder="e.g., Full sun"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Soil & Nutrients Section */}
          <View style={styles.soilSection}>
            <Text style={styles.sectionTitle}>Soil & Nutrients</Text>
            <View style={styles.soilRow}>
              <View style={styles.soilItem}>
                <Mountain size={24} color="#2d7a3a" />
                <Text style={styles.soilLabel}>Soil Type</Text>
                <TextInput
                  style={styles.soilInput}
                  value={seedPackage.soil_type || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({ ...prev, soil_type: text }))
                  }
                  placeholder="e.g., Well-draining"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.soilItem}>
                <Flask size={24} color="#2d7a3a" />
                <Text style={styles.soilLabel}>Fertilizer</Text>
                <TextInput
                  style={styles.soilInput}
                  value={seedPackage.fertilizer_requirements || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      fertilizer_requirements: text,
                    }))
                  }
                  placeholder="e.g., Balanced NPK"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          {/* Planting/Harvest Season Row */}
          <View style={styles.seasonRow}>
            <View style={[styles.inputGroup, styles.seasonInput]}>
              <Text style={styles.label}>Planting Season</Text>
              <TextInput
                style={styles.input}
                value={seedPackage.planting_season || ''}
                onChangeText={(text: string) =>
                  setSeedPackage((prev) => ({ ...prev, planting_season: text }))
                }
                placeholder="e.g., Spring"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, styles.seasonInput]}>
              <Text style={styles.label}>Harvest Season</Text>
              <TextInput
                style={styles.input}
                value={seedPackage.harvest_season || ''}
                onChangeText={(text: string) =>
                  setSeedPackage((prev) => ({ ...prev, harvest_season: text }))
                }
                placeholder="e.g., Summer/Fall"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={seedPackage.notes || ''}
              onChangeText={(text: string) =>
                setSeedPackage((prev) => ({ ...prev, notes: text }))
              }
              placeholder="Any additional notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
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

        {/* End of formSection View */}
      </ScrollView>
      {/* End of ScrollView */}
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
  },
  imageContainer: {
    marginBottom: 16,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: 120, // Ensure minimum height for ImageHandler
    maxHeight: 280, // Reduced from 400 to prevent overflow
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 1, // Ensure it doesn't overlay modals
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#336633',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  // Header elements
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  imageSection: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewImagePlaceholder: {
    width: '100%',
    height: 200,
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
    fontSize: 16,
    color: '#666666',
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
  helpText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  inputError: {
    borderColor: '#dc2626',
  },

  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },

  datePicker: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calendarIcon: {
    marginLeft: 8,
    color: '#2d7a3a',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12, // More padding at top for better text spacing
    paddingBottom: 12,
    paddingHorizontal: 16, // Keep horizontal padding consistent
    lineHeight: 22, // Better line spacing for readability
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2d7a3a',
  },
  selectedType: {
    backgroundColor: '#2d7a3a',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#2d7a3a',
    fontWeight: '600',
  },
  selectedTypeText: {
    color: '#ffffff',
  },
  timingSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  timelineInput: {
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  plantingSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a472a',
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  instructionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  instructionLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  instructionInput: {
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  soilSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  soilRow: {
    flexDirection: 'row',
    gap: 16,
  },
  soilItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  soilLabel: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  soilInput: {
    backgroundColor: '#f8faf8',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  selectedSupplierText: {
    // Add style for displaying selected supplier
    fontSize: 16,
    color: '#555',
    marginTop: 4,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  // New styles for better mobile layout
  quantityPriceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quantityInput: {
    flex: 1,
    minWidth: 100, // Ensure minimum width on mobile
  },
  priceInput: {
    flex: 1,
    minWidth: 120, // Slightly wider for price formatting
  },
  seasonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  seasonInput: {
    flex: 1,
    minWidth: 140, // Ensure adequate space for season names
  },
});
