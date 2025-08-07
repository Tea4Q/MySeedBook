import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPinHouse,
  House,
  CreditCard,
  FileText,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';

export default function EditSupplierScreen() {
  const { id } = useLocalSearchParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    id: id as string,
    supplier_name: '',
    webaddress: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) throw supabaseError;
      if (data) {
        setSupplier(data);
        setFormData({
          id: data.id,
          supplier_name: data.supplier_name,
          webaddress: data.webaddress || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          notes: data.notes || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load supplier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.supplier_name.trim()) {
      setError('Supplier name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from('suppliers')
        .update(formData)
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update supplier'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#336633" />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Supplier not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.title}>Edit Supplier</Text>
      </View>

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
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Building2 size={20} color="#336633" />
              <Text style={styles.label}>Supplier Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.supplier_name}
              onChangeText={(text) =>
                setFormData({ ...formData, supplier_name: text })
              }
              placeholder="Enter supplier name"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MapPinHouse size={20} color="#336633" />
              <Text style={styles.label}>Web Address</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.webaddress}
              onChangeText={(text) =>
                setFormData({ ...formData, webaddress: text })
              }
              placeholder="Enter web address"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Mail size={20} color="#336633" />
              <Text style={styles.label}>Email Address</Text>
            </View>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

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

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <House size={20} color="#336633" />
              <Text style={styles.label}>Address</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              placeholder="Enter physical address"
              multiline
              numberOfLines={3}
            />
          </View>

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

        <Pressable
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Updating Supplier...' : 'Update Supplier'}
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#336633',
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
