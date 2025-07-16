import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Image,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  Search,
  Plus,
  X,
  Check,
  Building2,
  Globe,
  Mail,
  Phone,
} from 'lucide-react-native';
import { Link, router, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';
import { debounce } from '@/utils/debounce';
import { useFocusEffect } from '@react-navigation/native'; // Or your navigation library's equivalent
import AddSupplierForm from '../AddSupplierForm/index'; // Fix import to point to the file, not the directory

interface SupplierSelectProps {
  onSelect: (supplier: Supplier) => void;
  selectedSupplierId?: string;
  initialSearchQuery?: string;
}

export function SupplierSelect({
  onSelect,
  selectedSupplierId,
  initialSearchQuery = '',
}: SupplierSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [pendingSupplierName, setPendingSupplierName] = useState<string | null>(
    null
  );

  const [reloadSuppliers, setReloadSuppliers] = useState(false);

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

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('supplier_name');

      if (supabaseError) throw supabaseError;

      setSuppliers(data || []);
      setFilteredSuppliers(data || []);
    } catch (err) {
      setError('Failed to load suppliers');
      console.error('Error loading suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSuppliers(); // Reload suppliers when the screen comes into focus
      setReloadSuppliers(false); // Reset the reload flag
    }, [loadSuppliers])
  );

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
            supplier.supplier_name?.toLowerCase().includes(term) ||
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

  const pathname = usePathname();

  const handleAddNewSupplier = () => {
    setIsOpen(false); // Close the select supplier modal first
    setPendingSupplierName(searchQuery); // Pass the current search query
    setShowAddSupplierModal(true); // Open the add supplier modal
  };

  // Handler for when a new supplier is added from the inline modal
  const handleSupplierAdded = async (newSupplier: Supplier) => {
    setShowAddSupplierModal(false);
    setIsOpen(false); // Close the supplier select modal
    await loadSuppliers(); // Refresh suppliers list
    setSelectedSupplier(newSupplier);
    onSelect(newSupplier);
    setSearchQuery('');
  };

  const renderSupplierItem = ({ item: supplier }: { item: Supplier }) => (
    <Pressable
      style={[
        styles.supplierItem,
        selectedSupplier?.id === supplier.id && styles.selectedItem,
      ]}
      onPress={() => handleSelectSupplier(supplier)}
    >
      {/* Avatar/Icon on the left */}
      <View style={styles.supplierAvatarContainer}>
        {/* If you have supplier.image_url, use <Image> here, else fallback to icon */}
        <View style={styles.supplierAvatarBg}>
          <Building2 size={24} color="#2d7a3a" />
        </View>
      </View>
      {/* Info in the middle */}
      <View style={styles.supplierInfoBetter}>
        <Text
          style={styles.supplierNameBetter}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {supplier.supplier_name}
        </Text>
        {supplier.webaddress && (
          <View style={styles.contactRowBetter}>
            <Globe size={16} color="#666666" />
            <Text
              style={styles.contactTextBetter}
              numberOfLines={1}
              ellipsizeMode="tail"            >
              {supplier.webaddress}
            </Text>
          </View>
        )}
        {supplier.email && (
          <View style={styles.contactRowBetter}>
            <Mail size={16} color="#666666" />
            <Text
              style={styles.contactTextBetter}
              numberOfLines={1}
              ellipsizeMode="tail"            >
              {supplier.email}
            </Text>
          </View>
        )}
        {supplier.phone && (
          <View style={styles.contactRowBetter}>
            <Phone size={16} color="#666666" />
            <Text
              style={styles.contactTextBetter}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {supplier.phone}
            </Text>
          </View>
        )}
      </View>
      {/* Checkmark on the right if selected */}
      {selectedSupplier?.id === supplier.id && (
        <View style={styles.checkmarkBetter}>
          <Check size={20} color="#2d7a3a" />
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.selectButton} onPress={() => setIsOpen(true)}>
        <Text>{selectedSupplier?.supplier_name || 'Select supplier'}</Text>
      </Pressable>

      {/* Add Supplier Modal (inline, not navigation) */}
      <Modal
        visible={showAddSupplierModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSupplierModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AddSupplierForm
              initialSupplierName={pendingSupplierName || ''}
              onSuccess={handleSupplierAdded}
              onCancel={() => setShowAddSupplierModal(false)}
            />
          </View>
        </View>
      </Modal>

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
                autoFocus
              />
            </View>

            {error && (              <View style={styles.errorContainer}>
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
                          ? `No suppliers found matching "${searchQuery}"`
                          : 'No suppliers available'}
                      </Text>
                      {searchQuery && (
                        <Pressable
                          style={styles.addNewButton}
                          onPress={handleAddNewSupplier}
                        >
                          <Plus size={20} color="#ffffff" />
                          <Text style={styles.addNewButtonText}>
                            Add "{searchQuery}" as New Supplier
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  }
                />

                {!searchQuery && (
                  <Pressable
                    style={styles.addNewButton}
                    onPress={handleAddNewSupplier}
                  >
                    <Plus size={20} color="#ffffff" />
                    <Text style={styles.addNewButtonText}>
                      Add New Supplier
                    </Text>
                  </Pressable>
                )}
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

  supplierImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  selectedSupplierWebaddress: {
    fontSize: 14,
    color: '#666',
  },

  placeholderText: {
    fontSize: 16,
    color: '#999',
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
  supplierAvatarContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplierAvatarBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f3e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplierInfoBetter: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2,
  },
  supplierNameBetter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
    maxWidth: '100%',
  },
  contactRowBetter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  contactTextBetter: {
    fontSize: 14,
    color: '#666666',
    maxWidth: '90%',
  },
  checkmarkBetter: {
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
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
