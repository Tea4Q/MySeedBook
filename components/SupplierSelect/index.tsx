import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, MapPin, Pressable, Modal, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Plus, Search, X, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';
import { debounce } from '@/utils/debounce';

interface SupplierSelectProps {
  onSelect: (supplier: Supplier) => void;
  selectedSupplierId?: string;
}

export function SupplierSelect({
  onSelect,
  selectedSupplierId,
}: SupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showAddNew, setShowAddNew] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for new supplier
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    web_address: '',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      if (supplier) {
        setSelectedSupplier(supplier);
      }
    }
  }, [selectedSupplierId, suppliers]);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (supabaseError) throw supabaseError;

      setSuppliers(data || []);
      setFilteredSuppliers(data || []);
    } catch (err) {
      setError('Failed to load suppliers');
      console.error('Error loading suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSuppliers = useCallback(
    debounce((query: string) => {
      const filtered = suppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(query.toLowerCase()) ||
          supplier.web_address?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowAddNew(query.length > 0 && filtered.length === 0);
    }, 300),
    [suppliers]
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterSuppliers(text);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newSupplier.name.trim()) {
      errors.name = 'Company name is required';
    }

    if (!newSupplier.webb_address.trim()) {
      errors.web_address = 'Web Address os reqiored';
    }

    if (!newSupplier.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSupplier.email)) {
      errors.email = 'Invalid email format';
    }

    if (!newSupplier.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(newSupplier.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSupplier = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('suppliers')
        .insert([
          {
            ...newSupplier,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      await loadSuppliers();
      if (data) {
        setSelectedSupplier(data);
        onSelect(data);
      }

      setIsAddModalOpen(false);
      setNewSupplier({
        name: '',
        web_address: '',
        email: '',
        phone: '',
      });
    } catch (err) {
      setError('Failed to add supplier');
      console.error('Error adding supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    onSelect(supplier);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.selectButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.selectButtonText}>
          {selectedSupplier ? selectedSupplier.name : 'Select Supplier'}
        </Text>
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <X size={24} color="#666666" />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color="#666666" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search suppliers..."
                placeholderTextColor="#999999"
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2d7a3a" />
              </View>
            ) : (
              <ScrollView style={styles.supplierList}>
                {filteredSuppliers.map((supplier) => (
                  <Pressable
                    key={supplier.id}
                    style={[
                      styles.supplierItem,
                      selectedSupplier?.id === supplier.id &&
                        styles.selectedItem,
                    ]}
                    onPress={() => handleSelectSupplier(supplier)}
                  >
                    <View>
                      <Text style={styles.supplierName}>{supplier.name}</Text>
                      {supplier.contact_person && (
                        <Text style={styles.contactPerson}>
                          {supplier.web_address}
                        </Text>
                      )}
                    </View>
                    {selectedSupplier?.id === supplier.id && (
                      <Check size={20} color="#2d7a3a" />
                    )}
                  </Pressable>
                ))}

                {showAddNew && (
                  <Pressable
                    style={styles.addNewButton}
                    onPress={() => {
                      setIsAddModalOpen(true);
                      setNewSupplier({ ...newSupplier, name: searchQuery });
                    }}
                  >
                    <Plus size={20} color="#ffffff" />
                    <Text style={styles.addNewButtonText}>
                      Add New Supplier
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Supplier</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setIsAddModalOpen(false)}
              >
                <X size={24} color="#666666" />
              </Pressable>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput
                  style={[styles.input, formErrors.name && styles.inputError]}
                  value={newSupplier.name}
                  onChangeText={(text) =>
                    setNewSupplier({ ...newSupplier, name: text })
                  }
                  placeholder="Enter company name"
                />
                {formErrors.name && (
                  <Text style={styles.errorText}>{formErrors.name}</Text>
                )}
              </View>

             <View style={styles.inputGroup}>
               <Text style={styles.label}>Web Address *</Text>
              <TextInput
                  style={[
                    styles.input,
                    formErrors.web_address && styles.inputError,
                  ]}
                  value={newSupplier.web_address}
                  onChangeText={(text) =>
                    setNewSupplier({ ...newSupplier, web_address: text })
                  }
                  placeholder="Enter web address"
                  keyboardType="url"
                  autoCapitalize="none"
                />
                {formErrors.web_address && (
                  <Text style={styles.errorText}>{formErrors.web_address}</Text>
                )}
</View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={[styles.input, formErrors.email && styles.inputError]}
                  value={newSupplier.email}
                  onChangeText={(text) =>
                    setNewSupplier({ ...newSupplier, email: text })
                  }
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {formErrors.email && (
                  <Text style={styles.errorText}>{formErrors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={[styles.input, formErrors.phone && styles.inputError]}
                  value={newSupplier.phone}
                  onChangeText={(text) =>
                    setNewSupplier({ ...newSupplier, phone: text })
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
                {formErrors.phone && (
                  <Text style={styles.errorText}>{formErrors.phone}</Text>
                )}
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleAddSupplier}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Supplier</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  supplierList: {
    padding: 16,
  },
  supplierItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedItem: {
    backgroundColor: '#e6f3e6',
    borderColor: '#2d7a3a',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  contactPerson: {
    fontSize: 14,
    color: '#666666',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d7a3a',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addNewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
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
  submitButton: {
    backgroundColor: '#2d7a3a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
