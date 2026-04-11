import {
  useRouter,
  useLocalSearchParams,
  useFocusEffect,
  useNavigation,
} from 'expo-router';
import React, {
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
  Alert,
  ActivityIndicator,
  Platform,
  BackHandler,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageHandler from '@/components/ImageHandler'; // Adjust path if needed
import { SupplierInput } from '@/components/SupplierInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import 'react-native-get-random-values'; // For uuidv4
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed
import BarcodeScannerModal, { type ScannedSeedData } from '@/components/BarcodeScannerModal';
import PremiumModal from '@/components/PremiumModal';
import { saveBarcodeMapping } from '@/utils/barcodeMemory';
// VoiceMicButton and parseVoiceCommand reserved for Voice & AI build

import type { Supplier, Seed } from '@/types/database'; // Assuming types are defined
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { useGuestLimits } from '@/hooks/useGuestLimits';
import GuestStatusBanner from '@/components/GuestStatusBanner';
import { useAuth } from '@/lib/auth';
import { guestDataManager } from '@/utils/guestDataManager';
import { addDays } from 'date-fns';

// Utility function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid);
};
const parseSeedDays = (days: string | number | undefined): number => {
  if (!days) return 0;
  const str = String(days).trim();
  if (str.includes('-')) {
    const [a, b] = str.split('-');
    const min = parseInt(a, 10), max = parseInt(b, 10);
    if (!isNaN(min) && !isNaN(max)) return Math.round((min + max) / 2);
  }
  const n = parseInt(str, 10);
  return isNaN(n) ? 0 : n;
};

const stripNullCharacters = (value: string): string => value.replace(/\u0000/g, '');

const sanitizeForPostgres = <T,>(value: T): T => {
  if (typeof value === 'string') {
    return stripNullCharacters(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForPostgres(item)) as T;
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(
      ([key, entryValue]) => [key, sanitizeForPostgres(entryValue)]
    );
    return Object.fromEntries(sanitizedEntries) as T;
  }

  return value;
};


type SeedType = {
  label: string;
  value: string;
};

const seedTypes: SeedType[] = [
  { label: 'Vegetable', value: 'vegetable' },
  { label: 'Fruit', value: 'fruit' },
  { label: 'Flower', value: 'flower' },
  { label: 'Herb', value: 'herb' },
  { label: 'Grain', value: 'grain' },
  { label: 'Other', value: 'other' },
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

const ADD_SEED_DRAFT_STORAGE_KEY = 'add_seed_form_draft_v1';

// State for form data
// Using useState to manage form state

// Update your Seed interface for the form state if it's different from DB

export default function AddOrEditSeedScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme(); // Add theme colors
  const { user, isGuest } = useAuth(); // Add auth context
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoAddToCalendar] = useState(true); // New state for calendar toggle
  const { checkAndPromptForLimit, trackAction } = useGuestLimits();
  
  // Barcode scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [scannedBarcodeData, setScannedBarcodeData] = useState<{ barcode: string; barcodeType: string } | null>(null);

  // Voice input state
  // lastVoiceTranscript reserved for Voice & AI build

  const params = useLocalSearchParams<{
    returnTo: string;
    newSupplierID?: string;
    newSupplierName?: string;
    reloadSuppliers?: string;
    id?: string; // Seed ID for editing
    scannedData?: string; // JSON string of scanned barcode data
  }>();

  const isEditing = !!params.id;

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return () => {};
      }

      const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
        // Prevent accidental exits from emulator right-click and hardware back.
        // Navigation should happen only through explicit UI actions (back button/tab).
        return true;
      });

      return () => backSubscription.remove();
    }, [])
  );

// Handle scanned barcode data
useEffect(() => {
  if (params.scannedData) {
    try {
      const scanned = JSON.parse(params.scannedData) as ScannedSeedData;
      setScannedBarcodeData({
        barcode: scanned.barcode,
        barcodeType: scanned.barcodeType,
      });
      setSeedPackage((prev) => ({
        ...prev,
        seed_name: scanned.seedName || prev.seed_name,
        type: scanned.type || prev.type,
        description: scanned.description
          ? (prev.description ? `${prev.description}\n\n${scanned.description}` : scanned.description)
          : prev.description,
      }));
      Alert.alert(
        'Barcode Scanned!',
        'Seed information has been loaded. Please review and complete the details.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error parsing scanned data:', error);
      Alert.alert('Error', 'Could not read scanned barcode data.');
    }
  }
}, [params.scannedData]);


  // Parse a fetched Seed into form state
  const parseSeedIntoFormState = useCallback((parsed: Seed): Seed => {
    let initialImagesData: { type: 'supabase' | 'url'; url: string }[] = [];
    if (parsed.seed_images && Array.isArray(parsed.seed_images)) {
      initialImagesData = parsed.seed_images as { type: 'supabase' | 'url'; url: string }[];
    } else if (parsed.seed_images) {
      initialImagesData = [{ type: 'url', url: parsed.seed_images as string ?? '' }];
    }
    if (parsed.date_purchased) {
      parsed.date_purchased = new Date(parsed.date_purchased);
    }
    if (parsed.indoor_sow_date) {
      parsed.indoor_sow_date = new Date(parsed.indoor_sow_date);
    }
    if (parsed.transplant_date) {
      parsed.transplant_date = new Date(parsed.transplant_date);
    }
    if (parsed.supplier_id) {
      if (!isValidUUID(parsed.supplier_id) && !parsed.supplier_id.startsWith('sample-supplier-')) {
        parsed.supplier_id = undefined;
      }
    }
    const initialImages: Imageinfo[] = initialImagesData.map((img) => ({
      id: uuidv4(),
      type: img.type,
      url: img.url ?? '',
      localUri: undefined,
      isLoading: false,
      error: undefined,
    }));
    return { ...parsed, seed_images: initialImages };
  }, []);

  // Fetch seed by ID when editing
  const [isLoadingEdit, setIsLoadingEdit] = useState(isEditing);

  useEffect(() => {
    if (!params.id) return;
    const fetchSeed = async () => {
      try {
        let fetched: Seed | null = null;
        if (isGuest) {
          fetched = await guestDataManager.getSeedById(params.id!);
        } else {
          const { data, error } = await supabase
            .from('seeds')
            .select('*')
            .eq('id', params.id!)
            .single();
          if (error) throw error;

          let hydratedSeed = data as Seed;
          if (hydratedSeed?.supplier_id) {
            const { data: supplierData, error: supplierError } = await supabase
              .from('suppliers')
              .select('*')
              .eq('id', hydratedSeed.supplier_id)
              .maybeSingle();

            if (supplierError) throw supplierError;

            hydratedSeed = {
              ...hydratedSeed,
              suppliers: supplierData ?? undefined,
            } as Seed;
          }

          fetched = hydratedSeed;
        }
        if (!fetched) throw new Error('Seed not found');
        const parsed = parseSeedIntoFormState(fetched);
        setSeedPackage(parsed);
      } catch (err: any) {
        console.error('Error loading seed for editing:', err);
        Alert.alert('Error', 'Could not load seed data for editing.');
      } finally {
        setIsLoadingEdit(false);
      }
    };
    fetchSeed();
  }, [params.id, isGuest, parseSeedIntoFormState]);

  // Initialize form state using the imported Seed type (Partial allows optional fields)
  const [seedPackage, setSeedPackage] = useState<Seed>(
    {
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
      indoor_sow_date: undefined,
      transplant_date: undefined,
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
    } as Seed
  );

  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  const deserializeDraftSeed = useCallback((raw: any): Seed => {
    const toDateOrUndefined = (value: any) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const restoredImages: Imageinfo[] = Array.isArray(raw?.seed_images)
      ? raw.seed_images.map((img: any) => ({
          id: img?.id || uuidv4(),
          type: img?.type === 'supabase' ? 'supabase' : 'url',
          url: img?.url || '',
          localUri: img?.localUri,
          isLoading: false,
          error: undefined,
        }))
      : [];

    return {
      ...raw,
      seed_images: restoredImages,
      date_purchased: toDateOrUndefined(raw?.date_purchased),
      indoor_sow_date: toDateOrUndefined(raw?.indoor_sow_date),
      transplant_date: toDateOrUndefined(raw?.transplant_date),
    } as Seed;
  }, []);

  useEffect(() => {
    // Do not restore drafts when editing an existing seed.
    if (isEditing) {
      setHasRestoredDraft(true);
      return;
    }

    let isMounted = true;

    const restoreDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(ADD_SEED_DRAFT_STORAGE_KEY);
        if (!raw || !isMounted) {
          setHasRestoredDraft(true);
          return;
        }

        const parsed = JSON.parse(raw);
        const restoredSeed = deserializeDraftSeed(parsed?.seedPackage || parsed);

        if (isMounted) {
          setSeedPackage(restoredSeed);
          if (restoredSeed.seed_price) {
            const numericPrice = Number(restoredSeed.seed_price);
            setPriceInput(Number.isFinite(numericPrice) && numericPrice > 0 ? `$${numericPrice.toFixed(2)}` : '');
          }
        }
      } catch (error) {
        console.warn('Failed to restore Add Seed draft:', error);
      } finally {
        if (isMounted) setHasRestoredDraft(true);
      }
    };

    restoreDraft();
    return () => {
      isMounted = false;
    };
  }, [deserializeDraftSeed, isEditing]);

  const handleImagesChange = useCallback((newImages: Imageinfo[]) => {
   
    setSeedPackage((prev) => ({ ...prev, seed_images: newImages }));
  }, []);

  // handleVoiceTranscript — reserved for Voice & AI build

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
      indoor_sow_date: undefined,
      transplant_date: undefined,
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
    setScannedBarcodeData(null); // Clear scanned barcode data
    AsyncStorage.removeItem(ADD_SEED_DRAFT_STORAGE_KEY).catch(() => {
      // Non-fatal cleanup failure
    });
  };

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const allowExitRef = useRef(false);

  // Track one-way navigation after save to avoid accidental duplicate redirects.
  const hasNavigatedAfterSaveRef = useRef(false);

  const hasMeaningfulChanges = useCallback(() => {
    const hasImages = Array.isArray(seedPackage.seed_images) && seedPackage.seed_images.length > 0;
    return Boolean(
      seedPackage.seed_name?.trim() ||
      seedPackage.type?.trim() ||
      seedPackage.description?.trim() ||
      Number(seedPackage.quantity) > 0 ||
      Number(seedPackage.seed_price) > 0 ||
      seedPackage.supplier_id ||
      seedPackage.date_purchased ||
      seedPackage.indoor_sow_date ||
      seedPackage.transplant_date ||
      seedPackage.days_to_germinate ||
      seedPackage.days_to_harvest ||
      seedPackage.notes?.trim() ||
      hasImages ||
      selectedSupplier
    );
  }, [seedPackage, selectedSupplier]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (allowExitRef.current || !hasMeaningfulChanges()) {
        return;
      }

      event.preventDefault();
      Alert.alert(
        'Discard Changes?',
        'You have unsaved seed details. Stay here to keep editing, or discard and leave.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard & Leave',
            style: 'destructive',
            onPress: () => {
              allowExitRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [hasMeaningfulChanges, navigation]);

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    // Check guest limits for new seeds
    if (!isEditing) {
      const canProceed = await checkAndPromptForLimit('seed');
      if (!canProceed) {
        return;
      }
    }

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
      indoor_sow_date: seedPackage.indoor_sow_date
        ? seedPackage.indoor_sow_date.toISOString()
        : null,
      transplant_date: seedPackage.transplant_date
        ? seedPackage.transplant_date.toISOString()
        : null,
      // Validate supplier_id - allow sample IDs for guest users or valid UUIDs
      supplier_id: seedPackage.supplier_id && 
        (isValidUUID(seedPackage.supplier_id) || seedPackage.supplier_id.startsWith('sample-supplier-'))
        ? seedPackage.supplier_id 
        : null,
    };

    const sanitizedPayload = sanitizeForPostgres(payload);

    // Remove client-side only fields or fields not directly in 'seeds' table
    delete sanitizedPayload.suppliers; // Remove joined supplier data - not a column in seeds table

    if (!isEditing) {
      delete sanitizedPayload.id; // Remove ID for new seed creation
    }

    try {
      let responseError = null;
      let savedSeedId: string | null = null;
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        // Guest user - simulate successful save without hitting Supabase
        console.log('Guest mode: Simulating seed save', sanitizedPayload);
        savedSeedId = `guest-seed-${Date.now()}`;
        responseError = null;
      } else {
        // Authenticated user - save to Supabase
        if (isEditing && seedPackage.id && isValidUUID(seedPackage.id)) {
          // Update existing seed
          const { error } = await (supabase
            .from('seeds') as any)
            .update(sanitizedPayload)
            .eq('id', seedPackage.id);
          responseError = error;
          savedSeedId = seedPackage.id;
        } else {
          // Add a new seed
          const { data: newSeedData, error } = await (supabase.from('seeds') as any).insert({
            ...sanitizedPayload,
            user_id: user?.id, // Add user_id for new seeds
          }).select('id').single();
          responseError = error;
          if (newSeedData) {
            savedSeedId = (newSeedData as { id: string }).id;
          }
        }
      }

      if (responseError) throw responseError;

      const upsertAutoCalendarEvent = async (eventPayload: {
        seed_id: string | null;
        seed_name: string;
        event_date: string;
        category: 'purchase' | 'sow' | 'germination' | 'transplant' | 'harvest';
        notes: string;
        user_id: string;
      }) => {
        const cleanEventPayload = sanitizeForPostgres(eventPayload);

        const { data: existingRows, error: lookupError } = await (supabase
          .from('calendar_events') as any)
          .select('id')
          .eq('user_id', cleanEventPayload.user_id)
          .eq('seed_id', cleanEventPayload.seed_id)
          .eq('category', cleanEventPayload.category)
          .eq('notes', cleanEventPayload.notes);

        if (lookupError) {
          throw lookupError;
        }

        const existing = (existingRows || []) as { id: string }[];
        if (existing.length > 0) {
          const keepId = existing[0].id;
          const { error: updateError } = await (supabase
            .from('calendar_events') as any)
            .update(cleanEventPayload)
            .eq('id', keepId)
            .eq('user_id', cleanEventPayload.user_id);

          if (updateError) {
            throw updateError;
          }

          // If older duplicates already exist, remove extras and keep one canonical row.
          if (existing.length > 1) {
            const duplicateIds = existing.slice(1).map((row) => row.id);
            const { error: deleteDupesError } = await (supabase
              .from('calendar_events') as any)
              .delete()
              .in('id', duplicateIds)
              .eq('user_id', cleanEventPayload.user_id);

            if (deleteDupesError) {
              throw deleteDupesError;
            }
          }

          return;
        }

        const { error } = await (supabase
          .from('calendar_events') as any)
          .insert(cleanEventPayload);

        if (error) {
          throw error;
        }
      };

      // Automatically add purchase date to calendar if date is provided and user wants it
      if (autoAddToCalendar && savedSeedId && seedPackage.date_purchased && seedPackage.seed_name && user) {
        try {
          await upsertAutoCalendarEvent({
            seed_id: savedSeedId,
            seed_name: seedPackage.seed_name,
            event_date: seedPackage.date_purchased.toISOString(),
            category: 'purchase',
            notes: `Purchased ${seedPackage.seed_name}${selectedSupplier ? ` from ${selectedSupplier.supplier_name}` : ''}`,
            user_id: user.id,
          });
        } catch (calendarError) {
          console.error('Error adding purchase date to calendar:', calendarError);
          // Don't fail the seed creation if calendar addition fails
        }
      } else if (autoAddToCalendar && savedSeedId && seedPackage.date_purchased && seedPackage.seed_name && !user) {
        // Guest user - simulate calendar addition
        console.log('Guest mode: Simulating calendar event addition', {
          seed_id: savedSeedId,
          seed_name: seedPackage.seed_name,
          event_date: seedPackage.date_purchased.toISOString(),
          category: 'purchase',
          notes: `Purchased ${seedPackage.seed_name}${selectedSupplier ? ` from ${selectedSupplier.supplier_name}` : ''}`,
        });
      }

      // Auto-add sow indoors date + derived germination event
      if (autoAddToCalendar && savedSeedId && seedPackage.indoor_sow_date && seedPackage.seed_name && user) {
        try {
          const sowDate = seedPackage.indoor_sow_date instanceof Date
            ? seedPackage.indoor_sow_date
            : new Date(seedPackage.indoor_sow_date);
          await upsertAutoCalendarEvent({
            seed_id: savedSeedId,
            seed_name: seedPackage.seed_name,
            event_date: sowDate.toISOString(),
            category: 'sow',
            notes: `Sow indoors: ${seedPackage.seed_name}`,
            user_id: user.id,
          });
          const germDays = parseSeedDays(seedPackage.days_to_germinate);
          if (germDays > 0) {
            await upsertAutoCalendarEvent({
              seed_id: savedSeedId,
              seed_name: seedPackage.seed_name,
              event_date: addDays(sowDate, germDays).toISOString(),
              category: 'germination',
              notes: `Expected germination for ${seedPackage.seed_name}`,
              user_id: user.id,
            });
          }
        } catch (calendarError) {
          console.error('Error adding sow/germination dates to calendar:', calendarError);
        }
      }

      // Auto-add transplant date + derived harvest event
      if (autoAddToCalendar && savedSeedId && seedPackage.transplant_date && seedPackage.seed_name && user) {
        try {
          const transplantDate = seedPackage.transplant_date instanceof Date
            ? seedPackage.transplant_date
            : new Date(seedPackage.transplant_date);
          await upsertAutoCalendarEvent({
            seed_id: savedSeedId,
            seed_name: seedPackage.seed_name,
            event_date: transplantDate.toISOString(),
            category: 'transplant',
            notes: `Transplant outdoors: ${seedPackage.seed_name}`,
            user_id: user.id,
          });
          const harvestDays = parseSeedDays(seedPackage.days_to_harvest);
          if (harvestDays > 0) {
            await upsertAutoCalendarEvent({
              seed_id: savedSeedId,
              seed_name: seedPackage.seed_name,
              event_date: addDays(transplantDate, harvestDays).toISOString(),
              category: 'harvest',
              notes: `Estimated harvest for ${seedPackage.seed_name}`,
              user_id: user.id,
            });
          }
        } catch (calendarError) {
          console.error('Error adding transplant/harvest dates to calendar:', calendarError);
        }
      }

      // Save barcode mapping to memory if this seed was scanned
      if (scannedBarcodeData && seedPackage.seed_name) {
        await saveBarcodeMapping(
          scannedBarcodeData.barcode,
          scannedBarcodeData.barcodeType,
          {
            seedName: seedPackage.seed_name,
            type: seedPackage.type || undefined,
            description: seedPackage.description || undefined,
            supplier: selectedSupplier?.supplier_name || undefined,
          }
        );
        console.log(`💾 Learned barcode: ${scannedBarcodeData.barcode} -> ${seedPackage.seed_name}`);
      }

      // Reset form state
      setShowSuccess(true);
      
      // Track action for guest users
      if (!isEditing) {
        await trackAction('seed');
        clearForm(); // Clear form only if adding new seed
      }
      
      if (!hasNavigatedAfterSaveRef.current) {
        hasNavigatedAfterSaveRef.current = true;
        allowExitRef.current = true;
        await AsyncStorage.removeItem(ADD_SEED_DRAFT_STORAGE_KEY).catch(() => {
          // Ignore cleanup failures.
        });
        router.replace((params.returnTo || '/(tabs)') as any);
      }
    } catch (error: any) {
      console.error('Error saving seed:', error);
      
      // Provide more specific error messages for common issues
      let errorMessage = 'Failed to save seed.';
      if (error.message) {
        if (error.message.includes('invalid input syntax for type uuid')) {
          errorMessage = 'Invalid supplier selection. Please select a valid supplier and try again.';
          // Log the problematic data for debugging
          console.error('UUID validation error. Supplier ID:', seedPackage.supplier_id);
        } else if (error.code === '22P05' || error.message.includes('unsupported Unicode escape sequence')) {
          errorMessage = 'One of the text fields contains an unsupported control character. Please edit the text and try again.';
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'The selected supplier no longer exists. Please select a different supplier.';
        } else if (error.message.includes('violates not-null constraint')) {
          errorMessage = 'Required information is missing. Please check all required fields.';
        } else {
          errorMessage = `Failed to save seed. ${error.message}`;
        }
      }
      
      setErrors({ submit: errorMessage });
      setShowSuccess(false); // Hide success message on error
    } finally {
      hasNavigatedAfterSaveRef.current = false;
      setIsSubmitting(false);
    }
  };

  const [activeDateField, setActiveDateField] = useState<
    'date_purchased' | 'indoor_sow_date' | 'transplant_date' | null
  >(null);

  // Helper function to format price with dollar sign
  const formatPriceForDisplay = useCallback((price: number | string): string => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return '';
    if (numericPrice === 0) return ''; // Keep empty for zero to match current UX
    return `$${numericPrice.toFixed(2)}`;
  }, []);

  const [priceInput, setPriceInput] = useState<string>(
    formatPriceForDisplay(seedPackage.seed_price ?? 0)
  );

  useEffect(() => {
    // Persist in-progress form so browser/app tab switches do not lose work.
    if (isEditing || !hasRestoredDraft || isLoadingEdit) return;

    const timer = setTimeout(() => {
      const serializableSeed = {
        ...seedPackage,
        date_purchased: seedPackage.date_purchased
          ? seedPackage.date_purchased.toISOString()
          : null,
        indoor_sow_date: seedPackage.indoor_sow_date
          ? seedPackage.indoor_sow_date.toISOString()
          : null,
        transplant_date: seedPackage.transplant_date
          ? seedPackage.transplant_date.toISOString()
          : null,
      };

      AsyncStorage.setItem(
        ADD_SEED_DRAFT_STORAGE_KEY,
        JSON.stringify({ seedPackage: serializableSeed })
      ).catch((error) => {
        console.warn('Failed to persist Add Seed draft:', error);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [seedPackage, isEditing, hasRestoredDraft, isLoadingEdit]);
  // --- Supplier Fetching Logic ---

  useEffect(() => {
    if (params.newSupplierID) {
      const fetchNewSupplier = async () => {
        try {
          let supplier = null;
          
          if (user) {
            // Authenticated user - fetch from Supabase
            const { data, error } = await supabase
              .from('suppliers')
              .select('*')
              .eq('id', params.newSupplierID!)
              .single();

            if (error) {
              console.error('Error fetching new supplier:', error);
              Alert.alert(
                'Error',
                'Failed to load new supplier details. Please try again.'
              );
              return;
            }
            supplier = data;
          } else {
            // Guest user - get from sample data
            console.log('Guest mode: Loading supplier from sample data');
            const allSuppliers = await guestDataManager.getAllSuppliers();
            supplier = allSuppliers.find(s => s.id === params.newSupplierID);
            
            if (!supplier) {
              console.log('Supplier not found in guest data:', params.newSupplierID);
              Alert.alert(
                'Error',
                'Selected supplier not found. Please try selecting again.'
              );
              return;
            }
          }

          if (supplier) {
            setSeedPackage((prev) => ({
              ...prev,
              supplier_id: supplier.id,
            }));
            setSelectedSupplier(supplier as Supplier);
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
  }, [params.newSupplierID, params.reloadSuppliers, user]);

  // Fetch supplier details when seedPackage.supplier_id changes
  useEffect(() => {
    const fetchSupplierDetails = async () => {
      if (!seedPackage.supplier_id) {
        setSelectedSupplier(null);
        return;
      }
      
      try {
        let supplier = null;
        
        if (user) {
          // Authenticated user - fetch from Supabase
          const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', seedPackage.supplier_id)
            .single();
          
          if (error) throw error;
          supplier = data;
        } else {
          // Guest user - get from sample data
          console.log('Guest mode: Loading supplier details from sample data', seedPackage.supplier_id);
          const allSuppliers = await guestDataManager.getAllSuppliers();
          supplier = allSuppliers.find(s => s.id === seedPackage.supplier_id);
          
          if (!supplier) {
            console.log('Supplier not found in guest data:', seedPackage.supplier_id);
            setSelectedSupplier(null);
            return;
          }
        }

        if (supplier) {
          // Ensure supplier is an object with expected properties
          if (
            typeof supplier === 'object' &&
            supplier !== null &&
            'id' in supplier &&
            'supplier_name' in supplier
          ) {
            setSelectedSupplier(supplier as Supplier);
          } else {
            console.error('Invalid supplier data:', supplier);
            Alert.alert(
              'Error',
              'Failed to load supplier data. The data received is invalid.'
            );
            setSelectedSupplier(null);
          }
        } else {
          setSelectedSupplier(null);
        }
      } catch (error: any) {
        console.error('Error fetching supplier details:', error);
        if (user) {
          // Only show error for authenticated users making real requests
          Alert.alert(
            'Error',
            `Failed to load supplier details: ${error.message || error}`
          );
        }
        setSelectedSupplier(null);
      }
    };
    fetchSupplierDetails();
  }, [seedPackage.supplier_id, user]);

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

  // --- Validation ---
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!seedPackage.seed_name?.trim()) errors.name = 'Seed name is required';
    if (!seedPackage.quantity || seedPackage.quantity <= 0)
      errors.quantity = 'Quantity must be greater than 0';
    if (!seedPackage.type) errors.type = 'Seed type is required';
    if (!seedPackage.supplier_id) errors.supplier = 'Supplier is required';
    
    // Validate supplier_id format - allow sample IDs for guest users
    if (seedPackage.supplier_id) {
      const isSampleId = seedPackage.supplier_id.startsWith('sample-supplier-');
      const isValidFormat = isValidUUID(seedPackage.supplier_id) || isSampleId;
      
      if (!isValidFormat) {
        errors.supplier = 'Invalid supplier selection. Please select a valid supplier.';
      }
    }
    
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
  const handleSupplierSelect = (supplier: Supplier) => {
    setSeedPackage((prev) => ({
      ...prev,
      supplier_id: supplier.id,
    }));
    setSelectedSupplier(supplier);
  };

  // --- Date Change Handler - Make sure to handle both web and mobile date pickers ---
  const handleDateChange = (
    field: 'date_purchased' | 'indoor_sow_date' | 'transplant_date',
    date: Date
  ) => {
    setSeedPackage((prev: Seed) => ({
      ...prev,
      [field]: date,
    }));
    setActiveDateField(null);
  };

  // --- Barcode Scan Handlers ---
  const handleBarcodeScan = (data: ScannedSeedData) => {
    console.log('📦 Barcode scan data received:', JSON.stringify(data, null, 2));
    
    // Store barcode data for later saving to memory
    setScannedBarcodeData({
      barcode: data.barcode,
      barcodeType: data.barcodeType,
    });
    
    // Auto-fill form with scanned data
    setSeedPackage((prev) => {
      const updated = {
        ...prev,
        seed_name: data.seedName || prev.seed_name,
        type: data.type || prev.type,
        description: data.description || prev.description,
      };
      console.log('📦 Updated seed package:', JSON.stringify(updated, null, 2));
      return updated;
    });

    // Try to find matching supplier
    if (data.supplier) {
      // This would need to search through available suppliers
      // For now, just log it
      console.log('Scanned supplier:', data.supplier);
    }

    Alert.alert(
      'Barcode Scanned!',
      data.seedName 
        ? `Found: ${data.seedName}. Please review and complete the details.`
        : `Barcode captured (${data.barcode}). Please enter the seed name and details from your package.`,
      [{ text: 'OK' }]
    );
  };

  const handleUpgradeRequired = () => {
    setShowPremiumModal(true);
  };

  // --- Render the component ---
  if (isLoadingEdit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Guest Status Banner */}
      <GuestStatusBanner />
      
      {/* Back Button - Floating Style */}
      <Pressable onPress={() => {
        allowExitRef.current = true;
        router.back();
      }} style={[styles.floatingBackButton, { backgroundColor: colors.surface }]}>
        <ArrowLeft size={24} color={colors.text} />
      </Pressable>
      
      {/* Success/Error Messages */}
      {showSuccess && (
        <View style={[styles.successMessage, { backgroundColor: colors.success }]}>
          <Text style={[styles.successText, { color: colors.text }]}>
            {isEditing
              ? 'Seed updated successfully'
              : `Seed added successfully!${autoAddToCalendar && seedPackage.date_purchased ? ' Purchase date added to calendar.' : ''}`}
          </Text>
        </View>
      )}
      {errors.submit && (
        <View style={[styles.errorBanner, { backgroundColor: colors.error }]}>
          <AlertCircle size={20} color={colors.primaryText} />
          <Text style={[styles.errorBannerText, { color: colors.primaryText }]}>{errors.submit}</Text>
        </View>
      )}
      <KeyboardAwareScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Section */}
        <View style={[styles.imageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ImageHandler
            initialImages={seedPackage.seed_images as Imageinfo[]}
            onImagesChange={handleImagesChange}
            bucketName="seed-images"
          />
          {/* Show image loading error if any */}
          {errors.images && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.images}</Text>
          )}
        </View>
        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Voice Input Row — enabled in Voice & AI build */}

          {/* Seed Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Seed Name *</Text>
            <TextInput
              style={[
                styles.input, 
                errors.name && styles.inputError,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                }
              ]}
              value={seedPackage.seed_name || ''} // Handle potential null/undefined
              onChangeText={(text: string) =>
                setSeedPackage((prev) => ({ ...prev, seed_name: text }))
              }
              placeholder="e.g., Brandywine Tomato"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>}
          </View>

          {/* Seed Type */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Seed Type *</Text>
            <View style={styles.typeContainer}>
              {seedTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: seedPackage.type === type.value 
                        ? colors.primary 
                        : colors.background,
                      borderColor: seedPackage.type === type.value 
                        ? colors.primary 
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    setSeedPackage((prev) => ({ ...prev, type: type.value }))
                  }
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      {
                        color: seedPackage.type === type.value 
                          ? colors.background 
                          : colors.text,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.type && <Text style={[styles.errorText, { color: colors.error }]}>{errors.type}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText 
              }]}
              value={seedPackage.description || ''}
              onChangeText={(text: string) =>
                setSeedPackage((prev) => ({ ...prev, description: text }))
              }
              placeholder="Describe your seeds..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Quantity and Price Row */}
          <View style={styles.quantityPriceRow}>
            {/* Quantity Input */}
            <View style={[styles.inputGroup, styles.quantityInput]}>
              <Text style={[styles.label, { color: colors.text }]}>Quantity *</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText 
                }]}
                value={String(seedPackage.quantity || '')} // Ensure string value
                onChangeText={(text: string) => {
                  const num = parseInt(text, 10);
                  setSeedPackage((prev) => ({
                    ...prev,
                    quantity: isNaN(num) ? 0 : num,
                  }));
                }}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              {errors.quantity && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.quantity}</Text>
              )}
            </View>

            {/* Price Input */}
            <View style={[styles.inputGroup, styles.priceInput]}>
              <Text style={[styles.label, { color: colors.text }]}>Price</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText 
                }]}
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
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Seed Schedule Section */}
          <View style={[styles.scheduleSection, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Seed Schedule</Text>

            <View style={styles.scheduleRow}>
              <View style={[styles.inputGroup, styles.scheduleInput]}>
              <Text style={[styles.label, { color: colors.text }]}>Purchase Date</Text>
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                💡 Added to calendar
              </Text>
              {/* Web Date Picker */}
              {Platform.OS === 'web' ? (
                <>
                  <input
                    type="date"
                    className="date-input"
                    value={
                      seedPackage.date_purchased
                        ? seedPackage.date_purchased.toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e: any) => {
                      const date = new Date(e.target.value + 'T00:00:00');
                      if (!isNaN(date.getTime())) handleDateChange('date_purchased', date);
                    }}
                    placeholder="Select a date"
                    title="Select event date"
                  />
                </>
              ) : (
                <>
                  <Pressable
                    style={[
                      styles.datePickerContainer,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                      }
                    ]}
                    onPress={() => setActiveDateField('date_purchased')}
                  >
                    <Text style={[styles.dateText, { color: colors.inputText }]}>
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
                    <Calendar size={20} color={colors.primary} />
                    {activeDateField === 'date_purchased' && (
                      <DateTimePicker
                        value={seedPackage.date_purchased || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event: any, selectedDate?: Date) => {
                          if (selectedDate) {
                            handleDateChange('date_purchased', selectedDate);
                          }
                          setActiveDateField(null);
                        }}
                      ></DateTimePicker>
                    )}
                  </Pressable>
                </>
              )}
              </View>

              <View style={[styles.inputGroup, styles.scheduleInput]}>
                <Text style={[styles.label, { color: colors.text }]}>Sow Indoors</Text>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  💡 Planned indoor start date
                </Text>
                {Platform.OS === 'web' ? (
                  <>
                    <input
                      type="date"
                      className="date-input"
                      value={
                        seedPackage.indoor_sow_date
                          ? seedPackage.indoor_sow_date.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e: any) => {
                        const date = new Date(e.target.value + 'T00:00:00');
                        if (!isNaN(date.getTime())) handleDateChange('indoor_sow_date', date);
                      }}
                      placeholder="Select a date"
                      title="Select indoor sow date"
                    />
                  </>
                ) : (
                  <Pressable
                    style={[
                      styles.datePickerContainer,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                      }
                    ]}
                    onPress={() => setActiveDateField('indoor_sow_date')}
                  >
                    <Text style={[styles.dateText, { color: colors.inputText }]}> 
                      {seedPackage.indoor_sow_date
                        ? seedPackage.indoor_sow_date.toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )
                        : 'Select a date'}
                    </Text>
                    <Calendar size={20} color={colors.primary} />
                    {activeDateField === 'indoor_sow_date' && (
                      <DateTimePicker
                        value={seedPackage.indoor_sow_date || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event: any, selectedDate?: Date) => {
                          if (selectedDate) {
                            handleDateChange('indoor_sow_date', selectedDate);
                          }
                          setActiveDateField(null);
                        }}
                      ></DateTimePicker>
                    )}
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.scheduleRow}>
              <View style={[styles.inputGroup, styles.scheduleInput]}>
                <Text style={[styles.label, { color: colors.text }]}>Transplant Outdoors</Text>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  💡 Planned garden transplant date
                </Text>
                {Platform.OS === 'web' ? (
                  <>
                    <input
                      type="date"
                      className="date-input"
                      value={
                        seedPackage.transplant_date
                          ? seedPackage.transplant_date.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e: any) => {
                        const date = new Date(e.target.value + 'T00:00:00');
                        if (!isNaN(date.getTime())) handleDateChange('transplant_date', date);
                      }}
                      placeholder="Select a date"
                      title="Select transplant date"
                    />
                  </>
                ) : (
                  <Pressable
                    style={[
                      styles.datePickerContainer,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                      }
                    ]}
                    onPress={() => setActiveDateField('transplant_date')}
                  >
                    <Text style={[styles.dateText, { color: colors.inputText }]}> 
                      {seedPackage.transplant_date
                        ? seedPackage.transplant_date.toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )
                        : 'Select a date'}
                    </Text>
                    <Calendar size={20} color={colors.primary} />
                    {activeDateField === 'transplant_date' && (
                      <DateTimePicker
                        value={seedPackage.transplant_date || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event: any, selectedDate?: Date) => {
                          if (selectedDate) {
                            handleDateChange('transplant_date', selectedDate);
                          }
                          setActiveDateField(null);
                        }}
                      ></DateTimePicker>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* Supplier Row */}
          <View style={styles.dateSupplierRow}>

            {/* Supplier Selection */}
            <View style={[styles.inputGroup, styles.supplierInput]}>
              <Text style={[styles.label, { color: colors.text }]}>Supplier *</Text>
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                💡 Type to search or add new supplier
              </Text>
              <SupplierInput
                onSelect={handleSupplierSelect}
                selectedSupplier={selectedSupplier}
                placeholder="Type supplier name..."
              />
              {errors.supplier && <Text style={[styles.errorText, { color: colors.error }]}>{errors.supplier}</Text>}
            </View>
          </View>

          {/* Growth Timeline Section */}
          <View style={[styles.timingSection, { 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Growth Timeline</Text>
            <View style={styles.timelineRow}>
              <View style={styles.timelineItem}>
                <Sprout size={24} color={colors.primary} />
                <Text style={[styles.timelineLabel, { color: colors.text }]}>Days to Germinate</Text>
                <TextInput
                  style={[styles.timelineInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
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
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="default" // Allow any input, not just numbers
                />
              </View>
              <View style={styles.timelineItem}>
                <Clock size={24} color={colors.primary} />
                <Text style={[styles.timelineLabel, { color: colors.text }]}>Days to Harvest</Text>
                <TextInput
                  style={[styles.timelineInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
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
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric" // Allow numeric input
                />
              </View>
            </View>
          </View>

          {/* Planting Instructions Section */}
          <View style={[styles.plantingSection, { 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Planting Instructions</Text>
            <View style={styles.instructionRow}>
              <View style={styles.instructionItem}>
                <Ruler size={24} color={colors.primary} />
                <Text style={[styles.instructionLabel, { color: colors.text }]}>Planting Depth</Text>
                <TextInput
                  style={[styles.instructionInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
                  value={seedPackage.planting_depth || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      planting_depth: text,
                    }))
                  }
                  placeholder="e.g., 1/4 inch"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.instructionItem}>
                <Ruler
                  style={{ transform: [{ rotate: '90deg' }] }}
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.instructionLabel, { color: colors.text }]}>Spacing</Text>
                <TextInput
                  style={[styles.instructionInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
                  value={seedPackage.spacing || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({ ...prev, spacing: text }))
                  }
                  placeholder="e.g., 12 inches"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.instructionRow}>
              <View style={styles.instructionItem}>
                <Droplets size={24} color={colors.primary} />
                <Text style={[styles.instructionLabel, { color: colors.text }]}>Watering</Text>
                <TextInput
                  style={[styles.instructionInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
                  value={seedPackage.watering_requirements || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      watering_requirements: text,
                    }))
                  }
                  placeholder="e.g., Keep moist"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.instructionItem}>
                <Sun size={24} color={colors.primary} />
                <Text style={[styles.instructionLabel, { color: colors.text }]}>Sunlight</Text>
                <TextInput
                  style={[styles.instructionInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
                  value={seedPackage.sunlight_requirements || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      sunlight_requirements: text,
                    }))
                  }
                  placeholder="e.g., Full sun"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>

          {/* Soil & Nutrients Section */}
          <View style={[styles.soilSection, { 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Soil & Nutrients</Text>
            <View style={styles.soilRow}>
              <View style={styles.soilItem}>
                <Mountain size={24} color={colors.primary} />
                <Text style={[styles.soilLabel, { color: colors.text }]}>Soil Type</Text>
                <TextInput
                  style={[styles.soilInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
                  value={seedPackage.soil_type || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({ ...prev, soil_type: text }))
                  }
                  placeholder="e.g., Well-draining"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.soilItem}>
                <Flask size={24} color={colors.primary} />
                <Text style={[styles.soilLabel, { color: colors.text }]}>Fertilizer</Text>
                <TextInput
                  style={[styles.soilInput, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText 
                  }]}
                  value={seedPackage.fertilizer_requirements || ''}
                  onChangeText={(text: string) =>
                    setSeedPackage((prev) => ({
                      ...prev,
                      fertilizer_requirements: text,
                    }))
                  }
                  placeholder="e.g., Balanced NPK"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>

          {/* Planting/Harvest Season Row */}
          <View style={styles.seasonRow}>
            <View style={[styles.inputGroup, styles.seasonInput]}>
              <Text style={[styles.label, { color: colors.text }]}>Planting Season</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText 
                }]}
                value={seedPackage.planting_season || ''}
                onChangeText={(text: string) =>
                  setSeedPackage((prev) => ({ ...prev, planting_season: text }))
                }
                placeholder="e.g., Spring"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={[styles.inputGroup, styles.seasonInput]}>
              <Text style={[styles.label, { color: colors.text }]}>Harvest Season</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText 
                }]}
                value={seedPackage.harvest_season || ''}
                onChangeText={(text: string) =>
                  setSeedPackage((prev) => ({ ...prev, harvest_season: text }))
                }
                placeholder="e.g., Summer/Fall"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText 
              }]}
              value={seedPackage.notes || ''}
              onChangeText={(text: string) =>
                setSeedPackage((prev) => ({ ...prev, notes: text }))
              }
              placeholder="Any additional notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.primary,
            },
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.primaryText }]}>
              {isEditing ? 'Save Changes' : 'Add Seed'}
            </Text>
          )}
        </Pressable>

        {/* End of formSection View */}
      </KeyboardAwareScrollView>
      {/* End of KeyboardAwareScrollView */}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
        onUpgradeRequired={handleUpgradeRequired}
      />

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // Main container
  container: {
    marginTop:28,
    flex: 1,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    overflow: 'visible',
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
  iconLook: {
    marginRight: 3,
    fontSize: 16,
  },

  // Header
  floatingBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingTop: 60, // Space for floating back button
  },
  successMessage: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  previewImagePlaceholderText: {
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
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    gap: 8,
  },
  inputError: {
    borderColor: '#dc2626',
  },

  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },

  datePicker: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  calendarIcon: {
    marginLeft: 8,
  },
  errorText: {
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
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timingSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
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
    textAlign: 'center',
  },
  timelineInput: {
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    borderWidth: 1,
  },
  plantingSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    textAlign: 'center',
  },
  instructionInput: {
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    borderWidth: 1,
  },
  soilSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
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
    textAlign: 'center',
  },
  soilInput: {
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    borderWidth: 1,
  },
  submitButton: {
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
  },
  selectedSupplierText: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 8,
    padding: 10,
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
  scheduleSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scheduleInput: {
    flex: 1,
    minWidth: 150,
  },
  seasonInput: {
    flex: 1,
    minWidth: 140, // Ensure adequate space for season names
  },
  // New styles for date and supplier row layout
  dateSupplierRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    minWidth: 150, // Ensure adequate space for date
  },
  supplierInput: {
    flex: 1,
    minWidth: 150, // Ensure adequate space for supplier
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  voiceHint: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Barcode scanner button styles
  barcodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  barcodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
