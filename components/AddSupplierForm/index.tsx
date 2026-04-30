import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
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
import { useTheme } from '@/lib/theme';

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
  const { colors } = useTheme();
  // Removed guest limits for suppliers - now unlimited
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

    // Guests can now add unlimited suppliers
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
        // No longer tracking supplier actions for guests
        onSuccess(createdSupplier);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier');
      Alert.alert('Error', err.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <>
      {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
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
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{imageError}</Text>
            </View>
          )}
          {/* Supplier Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Building2 size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Supplier Name *</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              placeholder="Enter Supplier Name"
              placeholderTextColor={colors.textSecondary}
              value={formData.supplier_name || ''}
              onChangeText={(text) => handleInputChange('supplier_name', text)}
              editable={!isSubmitting}
            />
          </View>
          {/* WebAddress */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MapPinHouse size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Web Address</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.webaddress || ''}
              onChangeText={(text) => handleInputChange('webaddress', text)}
              placeholder="Enter web address"
              placeholderTextColor={colors.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>
          {/* Email Address */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Mail size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder },
                !validateEmail(formData.email || '') &&
                  formData.email !== '' &&
                  { borderColor: colors.error },
              ]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {formData.email !== '' && !validateEmail(formData.email || '') && (
              <Text style={[styles.errorText, { color: colors.error }]}>Invalid email address</Text>
            )}
          </View>
          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Phone size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            </View>
            <View style={[styles.phoneInputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Text style={[styles.countryCode, { color: colors.inputText, borderRightColor: colors.inputBorder }]}>+1</Text>
              <TextInput
                style={[styles.phoneInput, { color: colors.inputText }]}
                value={formData.phone || ''}
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text);
                  setFormData({ ...formData, phone: formatted });
                }}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={14} // Limit to formatted US phone length
              />
            </View>
          </View>
          {/* Address */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <House size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter physical address"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
          {/* Additional Notes */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Additional Notes</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Enter any additional notes"
              placeholderTextColor={colors.textSecondary}
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
              { backgroundColor: colors.primary },
              (isSubmitting || supplierData.supplier_images.some(img => img.isLoading)) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || supplierData.supplier_images.some(img => img.isLoading)}
          >
            <Text style={[styles.submitButtonText, { color: colors.buttonText }]}>
              {isSubmitting 
                ? 'Adding Supplier...' 
                : supplierData.supplier_images.some(img => img.isLoading)
                ? 'Processing Images...'
                : 'Add Supplier'
              }
            </Text>
          </Pressable>
          {onCancel && (
            <Pressable style={[styles.submitButton, { backgroundColor: colors.textSecondary }]} onPress={onCancel}>
              <Text style={styles.submitButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>
    </>
  );

  return (
    <View style={embedded ? styles.embeddedContainer : [styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' ? (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {formContent}
        </ScrollView>
      ) : (
        <KeyboardAwareScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          {formContent}
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
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
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 16,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    paddingRight: 8,
    borderRightWidth: 1,
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  submitButton: {
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
  },
});
