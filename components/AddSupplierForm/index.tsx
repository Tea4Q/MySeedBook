import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  Building2,
  Mail,
  Phone,
  MapPinHouse,
  House,
  FileText,
} from 'lucide-react-native';
import ImageHandler from '@/components/ImageHandler';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/database';

interface Imageinfo {
  id: string;
  type: 'supabase' | 'url';
  url: string;
  localUri?: string;
  isLoading?: boolean;
  error?: string;
}

interface AddSupplierFormProps {
  initialSupplierName?: string;
  onSuccess?: (supplier: Supplier) => void;
  onCancel?: () => void;
  embedded?: boolean; // New prop to indicate if form is embedded in another modal
}

export default function AddSupplierForm({
  initialSupplierName = '',
  onSuccess,
  onCancel,
  embedded = false,
}: AddSupplierFormProps) {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    supplier_name: initialSupplierName,
    webaddress: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    is_active: true,
  });
  const [supplierData, setSupplierData] = useState<{ supplier_images: Imageinfo[] }>({ supplier_images: [] });
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Phone formatting helper function
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/[^\d]/g, '');
    
    // Apply formatting based on length
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else {
      // Handle longer numbers (like international)
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  useEffect(() => {
    setFormData((prev) => ({ ...prev, supplier_name: initialSupplierName }));
  }, [initialSupplierName]);

  const handleInputChange = (field: keyof Supplier, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleImagesChange = useCallback((newImages: Imageinfo[]) => {
    setSupplierData((prev) => ({ ...prev, supplier_images: newImages }));
    
    // Check for image errors
    const hasErrors = newImages.some(img => img.error);
    if (hasErrors) {
      const errorMessages = newImages
        .filter(img => img.error)
        .map(img => img.error)
        .join(', ');
      setImageError(`Image errors: ${errorMessages}`);
    } else {
      setImageError(null);
    }
  }, []);

  const validateForm = () => {
    if (!formData.supplier_name?.trim()) {
      Alert.alert('Validation Error', 'Supplier name is required.');
      return false;
    }
    
    // Check if any images are still loading
    const hasLoadingImages = supplierData.supplier_images.some(img => img.isLoading);
    if (hasLoadingImages) {
      Alert.alert('Please Wait', 'Images are still uploading. Please wait for them to finish.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Supplier name is required');
      return;
    }
    if (formData.email && !validateEmail(formData.email)) {
      setError('Invalid email address');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error(userError?.message || 'User not authenticated');
      // Save full image objects, not just URLs
      const imagesToSave = supplierData.supplier_images.map((img) => ({ type: img.type, url: img.url }));
      const supplierDataToSave = {
        ...formData,
        user_id: user.id,
        supplier_images: imagesToSave, // Save as array of objects
        updated_at: new Date().toISOString(),
      };
      const { data: createdSupplier, error: insertError } = await supabase
        .from('suppliers')
        .insert([
          supplierDataToSave
        ])
        .select()
        .single();
      if (insertError) {
        setError(insertError.message || 'Failed to save supplier');
        Alert.alert('Error', insertError.message || 'Failed to save supplier');
        setIsSubmitting(false);
        return;
      }
      if (onSuccess && createdSupplier) {
        onSuccess(createdSupplier);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier');
      Alert.alert('Error', err.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={embedded ? styles.embeddedContainer : styles.container}>
      <KeyboardAwareScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <View style={styles.formSection}>
          <ImageHandler
            initialImages={supplierData.supplier_images}
            onImagesChange={handleImagesChange}
            bucketName="supplier-images"
          />
          {/* Show image loading error if any */}
          {imageError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{imageError}</Text>
            </View>
          )}
          {/* Supplier Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Building2 size={20} color="#336633" />
              <Text style={styles.label}>Supplier Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter Supplier Name"
              value={formData.supplier_name || ''}
              onChangeText={(text) => handleInputChange('supplier_name', text)}
              editable={!isSubmitting}
            />
          </View>
          {/* WebAddress */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MapPinHouse size={20} color="#336633" />
              <Text style={styles.label}>Web Address</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.webaddress || ''}
              onChangeText={(text) => handleInputChange('webaddress', text)}
              placeholder="Enter web address"
              keyboardType="url"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>
          {/* Email Address */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Mail size={20} color="#336633" />
              <Text style={styles.label}>Email Address</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                !validateEmail(formData.email || '') &&
                  formData.email !== '' &&
                  styles.inputError,
              ]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {formData.email !== '' && !validateEmail(formData.email || '') && (
              <Text style={styles.errorText}>Invalid email address</Text>
            )}
          </View>
          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Phone size={20} color="#336633" />
              <Text style={styles.label}>Phone Number</Text>
            </View>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+1</Text>
              <TextInput
                style={styles.phoneInput}
                value={formData.phone || ''}
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text);
                  setFormData({ ...formData, phone: formatted });
                }}
                placeholder="(555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={14} // Limit to formatted US phone length
              />
            </View>
          </View>
          {/* Address */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <House size={20} color="#336633" />
              <Text style={styles.label}>Address</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter physical address"
              multiline
              numberOfLines={3}
            />
          </View>
          {/* Additional Notes */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <FileText size={20} color="#336633" />
              <Text style={styles.label}>Additional Notes</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Enter any additional notes"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        {/* Submit/Cancel Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
          <Pressable
            style={[
              styles.submitButton, 
              (isSubmitting || supplierData.supplier_images.some(img => img.isLoading)) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || supplierData.supplier_images.some(img => img.isLoading)}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting 
                ? 'Adding Supplier...' 
                : supplierData.supplier_images.some(img => img.isLoading)
                ? 'Processing Images...'
                : 'Add Supplier'
              }
            </Text>
          </Pressable>
          {onCancel && (
            <Pressable style={[styles.submitButton, { backgroundColor: '#aaa' }]} onPress={onCancel}>
              <Text style={styles.submitButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
  },
  embeddedContainer: {
    backgroundColor: 'transparent', // No background when embedded
    minHeight: 400, // Ensure minimum height
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingLeft: 16,
  },
  countryCode: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333333',
  },
  submitButton: {
    backgroundColor: '#336633',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    minWidth: 120,
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
