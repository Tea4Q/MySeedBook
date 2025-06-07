import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
}

export default function AddSupplierForm({
  initialSupplierName = '',
  onSuccess,
  onCancel,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

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
  }, []);

  const validateForm = () => {
    if (!formData.supplier_name?.trim()) {
      Alert.alert('Validation Error', 'Supplier name is required.');
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
      const imagesToSave = supplierData.supplier_images.map((img) => img.url);
      const supplierDataToSave = {
        ...formData,
        user_id: user.id,
        supplier_images: imagesToSave,
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
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          {Array.isArray(supplierData.supplier_images) && supplierData.supplier_images.length > 0 && (
            <View style={styles.thumbnailRow}>
              {supplierData.supplier_images.map((img) => (
                <Pressable
                  key={img.id}
                  onPress={() => {
                    setSelectedImageUrl(img.url);
                    setModalVisible(true);
                  }}
                  style={styles.thumbnailWrapper}
                >
                  <Image
                    source={{ uri: img.url }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>
          )}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <Pressable
                style={styles.modalCloseArea}
                onPress={() => setModalVisible(false)}
              />
              <View style={styles.modalContent}>
                {selectedImageUrl && (
                  <Image
                    source={{ uri: selectedImageUrl }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
          </Modal>
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
              editable={!loading}
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
              editable={!loading && !isSubmitting}
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
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
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
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Adding Supplier...' : 'Add Supplier'}
            </Text>
          </Pressable>
          {onCancel && (
            <Pressable style={[styles.submitButton, { backgroundColor: '#aaa' }]} onPress={onCancel}>
              <Text style={styles.submitButtonText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
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
  thumbnailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  thumbnailWrapper: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '90%',
    maxHeight: '80%',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  fullImage: {
    width: 320,
    height: 320,
    borderRadius: 12,
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
});
