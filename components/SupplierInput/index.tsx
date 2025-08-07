import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  Plus,
  X,
  Check,
  Building2,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';
import { debounce } from '@/utils/debounce';
import AddSupplierForm from '../AddSupplierForm';

interface SupplierInputProps {
  onSelect: (supplier: Supplier) => void;
  selectedSupplier?: Supplier | null;
  placeholder?: string;
}

export function SupplierInput({
  onSelect,
  selectedSupplier,
  placeholder = 'Type supplier name...',
}: SupplierInputProps) {
  const [inputValue, setInputValue] = useState(selectedSupplier?.supplier_name || '');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const isSelectingRef = useRef(false);

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Update input when selectedSupplier changes
  useEffect(() => {
    const newValue = selectedSupplier?.supplier_name || '';
    setInputValue(newValue);
  }, [selectedSupplier]);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('supplier_name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error loading suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search function
  const filterSuppliers = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setFilteredSuppliers([]);
        setShowDropdown(false);
        return;
      }

      const searchTerms = query.toLowerCase().split(' ');
      const filtered = suppliers.filter((supplier) =>
        searchTerms.every((term) =>
          supplier.supplier_name?.toLowerCase().includes(term)
        )
      );
      
      setFilteredSuppliers(filtered);
      setShowDropdown(true);
    }, 300),
    [suppliers]
  );

  const handleInputChange = (text: string) => {
    setInputValue(text);
    filterSuppliers(text);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    // Update input value immediately
    setInputValue(supplier.supplier_name || '');
    setShowDropdown(false);
    
    // Call the onSelect callback
    onSelect(supplier);
    
    // Reset the flag after a delay to ensure everything completes
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 200);
  };

  const handleInputFocus = () => {
    if (inputValue.trim()) {
      filterSuppliers(inputValue);
    }
  };

  const handleInputBlur = () => {
    // Don't close dropdown on blur - let the user tap outside or select an item to close it
  };

  const handleAddNewSupplier = () => {
    setShowDropdown(false);
    setShowAddModal(true);
  };

  const handleSupplierAdded = async (newSupplier: Supplier) => {
    setShowAddModal(false);
    await loadSuppliers(); // Refresh the list
    handleSelectSupplier(newSupplier); // Auto-select the new supplier
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
  };

  const showAddNewOption = inputValue.trim() && 
    filteredSuppliers.length === 0 && 
    !isLoading &&
    showDropdown;

  return (
    <>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          blurOnSubmit={false}
        />

        {showDropdown && (
          <View 
            style={styles.dropdown}
            pointerEvents="box-none"
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2d7a3a" />
                <Text style={styles.loadingText}>Loading suppliers...</Text>
              </View>
            ) : (
              <View pointerEvents="auto">
                <ScrollView
                  style={styles.supplierList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredSuppliers.map((supplier) => (
                    <TouchableOpacity
                      key={supplier.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectSupplier(supplier)}
                      activeOpacity={0.7}
                    >
                      <Building2 size={20} color="#2d7a3a" />
                      <Text style={styles.supplierName}>{supplier.supplier_name}</Text>
                      <Check size={16} color="#2d7a3a" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                {showAddNewOption && (
                  <TouchableOpacity
                    style={styles.addNewItem}
                    onPress={handleAddNewSupplier}
                    activeOpacity={0.8}
                  >
                    <Plus size={20} color="#ffffff" />
                    <Text style={styles.addNewText}>
                      Add "{inputValue}" as new supplier
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Overlay to close dropdown when tapping outside */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        />
      )}

      {/* Add Supplier Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelAdd}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Supplier</Text>
              <Pressable style={styles.closeButton} onPress={handleCancelAdd}>
                <X size={24} color="#666666" />
              </Pressable>
            </View>
            <AddSupplierForm
              initialSupplierName={inputValue}
              onSuccess={handleSupplierAdded}
              onCancel={handleCancelAdd}
              embedded={true}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  supplierList: {
    maxHeight: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  supplierName: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  addNewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2d7a3a',
    gap: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  addNewText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '90%',
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});
