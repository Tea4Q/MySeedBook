import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Upload,
  Droplets,
  Sun,
  Ruler,
  Clock,
  Sprout,
  Mountain,
  FlaskRound as Flask,
  CircleAlert as AlertCircle,
} from 'lucide-react-native';
import ImageCapture from '@/components/ImageCapture';
import { SupplierSelect } from '@/components/SupplierSelect';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import type { Supplier } from '@/types/database';
import { supabase } from '@/lib/supabase';

const uploadImage = async (file: File) => {
  try {
    const fileName = `${Date.now()}-${file.name}`; // Unique file name
    const { data, error } = await supabase.storage
      .from('images') // Replace 'images' with your bucket name
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    console.log('Image uploaded successfully:', data);
    return data.path; // Returns the file path
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

type SeedType = {
  label: string;
  value: string;
};

const seedTypes: SeedType[] = [
  { label: 'Vegetable', value: 'vegetable' },
  { label: 'Herb', value: 'herb' },
  { label: 'Flower', value: 'flower' },
  { label: 'Fruit', value: 'fruit' },
];

interface FormData {
  seedImage: uri | null;
  name: string;
  type: string;
  description: string;
  quantity: string;
  quantity_unit: 'seeds';
  supplier_name?: string;
  date_purchased: Date | null;
  storage_location?: string;
  storage_requirements?: string;
  germination_rate?: string;
  planting_depth?: string;
  spacing?: string;
  watering_requirements?: string;
  sunlight_requirements?: string;
  soil_type?: string;
  fertilizer_requirements?: string;
  days_to_germinate?: string;
  days_to_harvest?: string;
  planting_season?: string;
  harvest_season?: string;
  notes?: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function AddSeedScreen() {
  const [formData, setFormData] = useState({
    seedImage: '',
    name: '',
    type: '',
    description: '',
    quantity: '',
    quantity_unit: 'seeds',
    supplier_name: '',
    date_purchased: null,
    storage_location: '',
    planting_depth: '',
    spacing: '',
    watering_requirements: '',
    sunlight_requirements: '',
    soil_type: '',
    fertilizer_requirements: '',
    days_to_germinate: '',
    days_to_harvest: '',
    planting_season: '',
    harvest_season: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [isImageUploaded, setIsImageUploaded] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Seed name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Seed type is required';
    }

    if (!formData.quantity || isNaN(Number(formData.quantity))) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (!formData.date_purchased) {
      newErrors.date_purchased = 'Purchase date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: seedData, error: seedError } = await supabase
        .from('seeds')
        .insert([
          {
            seedImage: formData.seedImage,
            name: formData.name,
            type: formData.type,
            description: formData.description,
            quantity: Number(formData.quantity),
            quantity_unit: formData.quantity_unit,
            supplier_id: formData.supplier_name,
            date_purchased: formData.date_purchased
              ? formData.date_purchased.toISOString()
              : null,
            storage_location: formData.storage_location,
            storage_requirements: formData.storage_requirements,
            germination_rate: formData.germination_rate
              ? Number(formData.germination_rate)
              : null,
            planting_depth: formData.planting_depth, // Individual column
            spacing: formData.spacing, // Individual column
            watering_requirements: formData.watering_requirements, // Individual column
            sunlight_requirements: formData.sunlight_requirements, // Individual column
            soil_type: formData.soil_type, // Individual column
            fertilizer_requirements: formData.fertilizer_requirements, // Individual column
            days_to_germinate: formData.days_to_germinate, // Individual column
            days_to_harvest: formData.days_to_harvest, // Individual column
            planting_season: formData.planting_season, // Individual column
            harvest_season: formData.harvest_season, // Individual column
            notes: formData.notes,
          },
        ])
        .select()
        .single();

      if (seedError) throw seedError;

      setShowSuccess(true);
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)',
          params: { highlight: seedData.id },
        });
      }, 1500);
    } catch (error) {
      console.error('Error adding seed:', error);
      setErrors({
        submit: 'Failed to add seed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageCaptured = (uri: string | null) => {
    if (uri) {
      setFormData((prev) => ({ ...prev, seedImage: uri }));
    }
    setShowImageCapture(false);
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData((prev) => ({
      ...prev,
      supplier_name: supplier.name,
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.title}>Add New Seed</Text>
      </View>

      {showSuccess && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>Seed added successfully!</Text>
        </View>
      )}

      {errors.submit && (
        <View style={styles.errorBanner}>
          <AlertCircle size={20} color="#dc2626" />
          <Text style={styles.errorBannerText}>{errors.submit}</Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {formData.seedImage ? (
            <Image
              source={{ uri: formData.seedImage }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.previewImagePlaceholder}>
              <Text style={styles.previewImagePlaceholderText}>
                No image selected
              </Text>
            </View>
          )}
          {!isImageUploaded && (
            <View style={styles.imageButtons}>
              <Pressable
                style={styles.imageButton}
                onPress={() => setShowImageCapture(true)}
              >
                <Camera size={24} color="#2d7a3a" />
                <Text style={styles.imageButtonText}>Capture Image</Text>
              </Pressable>
            </View>
          )}
        </View>
        {showImageCapture && (
          <ImageCapture onImageCaptured={handleImageCaptured} />
        )}

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seed Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
              placeholder="e.g., Brandywine Tomato"
              placeholderTextColor="#999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seed Type *</Text>
            <View style={styles.typeContainer}>
              {seedTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.typeButton,
                    formData.type === type.value && styles.selectedType,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, type: type.value }))
                  }
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === type.value && styles.selectedTypeText,
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
              placeholder="Describe your seeds..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                value={formData.quantity}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, quantity: text }))
                }
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {errors.quantity && (
                <Text style={styles.errorText}>{errors.quantity}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 2, marginLeft: 12 }]}>
              <Text style={styles.label}>Purchase Date</Text>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.date_purchased}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, date_purchased: date }))
                  }
                  renderInput={({ inputRef, inputProps, InputProps }) => (
                    <View style={styles.datePickerContainer}>
                      <TextInput
                        ref={inputRef}
                        style={[
                          styles.input,
                          errors.date_purchased && styles.inputError,
                        ]}
                        {...inputProps}
                        placeholder="Select a date"
                        placeholderTextColor="#999"
                      />
                      <Pressable onPress={InputProps?.onClick}>
                        <CalendarTodayIcon style={styles.calendarIcon} />
                      </Pressable>
                    </View>
                  )}
                />
              </LocalizationProvider>
              {errors.date_purchased && (
                <Text style={styles.errorText}>{errors.date_purchased}</Text>
              )}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier</Text>
            <SupplierSelect
              onSelect={handleSupplierSelect}
              selectedSupplierId={formData.supplier_id}
            />
          </View>

          <View style={styles.timingSection}>
            <Text style={styles.sectionTitle}>Growth Timeline</Text>

            <View style={styles.timelineRow}>
              <View style={styles.timelineItem}>
                <Sprout size={24} color="#2d7a3a" />
                <Text style={styles.timelineLabel}>Days to Germinate</Text>
                <TextInput
                  style={styles.timelineInput}
                  value={formData.days_to_germinate}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      days_to_germinate: text,
                    }))
                  }
                  placeholder="e.g., 7-10 days"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.timelineItem}>
                <Clock size={24} color="#2d7a3a" />
                <Text style={styles.timelineLabel}>Days to Harvest</Text>
                <TextInput
                  style={styles.timelineInput}
                  value={formData.days_to_harvest}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, days_to_harvest: text }))
                  }
                  placeholder="e.g., 60-80 days"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.plantingSection}>
            <Text style={styles.sectionTitle}>Planting Instructions</Text>

            <View style={styles.instructionRow}>
              <View style={styles.instructionItem}>
                <Ruler size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Planting Depth</Text>
                <TextInput
                  style={styles.instructionInput}
                  value={formData.planting_depth}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, planting_depth: text }))
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
                  value={formData.spacing}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, spacing: text }))
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
                  value={formData.watering_requirements}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      watering_requirements: text,
                    }))
                  }
                  placeholder="e.g., Keep soil moist"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.instructionItem}>
                <Sun size={24} color="#2d7a3a" />
                <Text style={styles.instructionLabel}>Sunlight</Text>
                <TextInput
                  style={styles.instructionInput}
                  value={formData.sunlight_requirements}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
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

          <View style={styles.soilSection}>
            <Text style={styles.sectionTitle}>Soil & Nutrients</Text>

            <View style={styles.soilRow}>
              <View style={styles.soilItem}>
                <Mountain size={24} color="#2d7a3a" />
                <Text style={styles.soilLabel}>Soil Type</Text>
                <TextInput
                  style={styles.soilInput}
                  value={formData.soil_type}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, soil_type: text }))
                  }
                  placeholder="e.g., Well-draining loam"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.soilItem}>
                <Flask size={24} color="#2d7a3a" />
                <Text style={styles.soilLabel}>Fertilizer</Text>
                <TextInput
                  style={styles.soilInput}
                  value={formData.fertilizer_requirements}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      fertilizer_requirements: text,
                    }))
                  }
                  placeholder="e.g., 5-10-5 NPK"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Planting Season</Text>
              <TextInput
                style={styles.input}
                value={formData.planting_season}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, planting_season: text }))
                }
                placeholder="e.g., Early Spring"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Harvest Season</Text>
              <TextInput
                style={styles.input}
                value={formData.harvest_season}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, harvest_season: text }))
                }
                placeholder="e.g., Late Summer"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <Pressable
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Adding to Inventory...' : 'Add to Inventory'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
  },
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
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  row: {
    flexDirection: 'row',
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
});
