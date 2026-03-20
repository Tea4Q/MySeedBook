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
import { useTheme } from '@/lib/theme';
// VoiceMicButton and parseVoiceCommand are reserved for the v1.3.1 Voice & AI build

export default function EditSupplierScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Supplier not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Back Button */}
      <Pressable onPress={() => router.back()} style={[styles.floatingBackButton, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
        <ArrowLeft size={24} color={colors.text} />
      </Pressable>

      <KeyboardAwareScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Building2 size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Supplier Name *</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.supplier_name}
              onChangeText={(text) =>
                setFormData({ ...formData, supplier_name: text })
              }
              placeholder="Enter supplier name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <MapPinHouse size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Web Address</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.webaddress}
              onChangeText={(text) =>
                setFormData({ ...formData, webaddress: text })
              }
              placeholder="Enter web address"
              placeholderTextColor={colors.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Mail size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Phone size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <House size={20} color={colors.primary} />
              <Text style={[styles.label, { color: colors.text }]}>Address</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.inputText, borderColor: colors.inputBorder }]}
              value={formData.address}
              onChangeText={(text) =>
                setFormData({ ...formData, address: text })
              }
              placeholder="Enter physical address"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

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

        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={[styles.submitButtonText, { color: colors.buttonText }]}>
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
  floatingBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingTop: 60, // Space for floating back button
  },
  errorBanner: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
