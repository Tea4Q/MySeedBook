import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { Search, Plus, X, Check, Building2, Globe, Mail, Phone } from 'lucide-react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';
import { debounce } from '@/utils/debounce';

interface SupplierSelectProps {
  onSelect: (supplier: Supplier) => void;
  selectedSupplierId?: string;
}

export function SupplierSelect({ onSelect, selectedSupplierId }: SupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

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
        .eq('is_active', true)
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
      if (!query.trim()) {
        setFilteredSuppliers(suppliers);
        return;
      }

      const searchTerms = query.toLowerCase().split(' ');
      const filtered = suppliers.filter((supplier) =>
        searchTerms.every(
          (term) =>
            supplier.name.toLowerCase().includes(term) ||
            supplier.webaddress?.toLowerCase().includes(term) ||
            supplier.email?.toLowerCase().includes(term)
        )
      );
      setFilteredSuppliers(filtered);
    }, 300),
    [suppliers]
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterSuppliers(text);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    onSelect(supplier);
    setIsOpen(false);
    setSearchQuery('');
  };

  const renderSupplierItem = ({ item: supplier }: { item: Supplier }) => (
    <Pressable
      style={[styles.supplierItem, selectedSupplier?.id === supplier.id && styles.selectedItem]}
      onPress={() => handleSelectSupplier(supplier)}>
      <View style={styles.supplierIcon}>
        <Building2 size={24} color="#2d7a3a" />
      </View>
      <View style={styles.supplierInfo}>
        <Text style={styles.supplierName}>{supplier.name}</Text>
        {supplier.webaddress && (
          <View style={styles.contactRow}>
            <Globe size={16} color="#666666" />
            <Text style={styles.contactText}>{supplier.webaddress}</Text>
          </View>
        )}
        {supplier.email && (
          <View style={styles.contactRow}>
            <Mail size={16} color="#666666" />
            <Text style={styles.contactText}>{supplier.email}</Text>
          </View>
        )}
        {supplier.phone && (
          <View style={styles.contactRow}>
            <Phone size={16} color="#666666" />
            <Text style={styles.contactText}>{supplier.phone}</Text>
          </View>
        )}
      </View>
      {selectedSupplier?.id === supplier.id && (
        <View style={styles.checkmark}>
          <Check size={20} color="#2d7a3a" />
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.selectButton}
        onPress={() => setIsOpen(true)}>
        {selectedSupplier ? (
          <View style={styles.selectedSupplierPreview}>
            <Text style={styles.selectedSupplierName}>{selectedSupplier.name}</Text>
            {selectedSupplier.webaddress && (
              <Text style={styles.selectedSupplierwebaddress}>{selectedSupplier.webaddress}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.selectButtonText}>Select Supplier</Text>
        )}
      </Pressable>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <Pressable style={styles.closeButton} onPress={() => setIsOpen(false)}>
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
                autoFocus
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
              <>
                <FlatList
                  data={filteredSuppliers}
                  renderItem={renderSupplierItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.supplierList}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        {searchQuery
                          ? 'No suppliers found matching your search'
                          : 'No suppliers available'}
                      </Text>
                    </View>
                  }
                />

                <Link href="/add-supplier" asChild>
                  <Pressable style={styles.addNewButton}>
                    <Plus size={20} color="#ffffff" />
                    <Text style={styles.addNewButtonText}>Add New Supplier</Text>
                  </Pressable>
                </Link>
              </>
            )}
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
  selectedSupplierPreview: {
    gap: 4,
  },
  selectedSupplierName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  selectedSupplierwebaddress: {
    fontSize: 14,
    color: '#666666',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#999999',
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
    alignItems: 'flex-start',
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
  supplierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f3e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supplierInfo: {
    flex: 1,
    gap: 4,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
  },
  checkmark: {
    marginLeft: 12,
    alignSelf: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d7a3a',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  addNewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});