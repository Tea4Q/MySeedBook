import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Plus, Search, X, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import debouce from 'lodash.debounce';

interface Supplier {
  id: string;
  name: string;
}

interface SupplierSelectProps {
  onSelect: (supplier: { id: string; name: string }) => void;
  selectedSupplierId?: string;
  suppliers: { id: string; name: string }[]; //List of suppliers
}

const SupplierSelect: React.FC<SupplierSelectProps> = ({
  onSelect,
  selectedSupplierId,
}) => {
  const router = useRouter(); // Router instance for navigation
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suppliers from the database
  useEffect(() => {
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

    loadSuppliers();
  }, []);

  const filterSuppliers = useCallback(
    debouce((query: string) => {
      const filtered = suppliers.filter((supplier) =>
        supplier.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }, 300),
    [suppliers]
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterSuppliers(text);
  };

  const handleAddNewSupplier = () => {
    // Navigate to the add-supplier screen
    router.push('/add-supplier');
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    onSelect(supplier); //Pass the selected supplier backto the parent component
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Supplier</Text>
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
          <ActivityIndicator size="large" color="#2d7a3a" />
        </View>
      ) : (
        <ScrollView style={styles.supplierList}>
          {filteredSuppliers.map((supplier) => (
            <Pressable
              key={supplier.id}
              style={[
                styles.supplierItem,
                selectedSupplierId === supplier.id && styles.selectedItem,
              ]}
              onPress={() => handleSelectSupplier(supplier)}
            >
              <Text style={styles.supplierName}>{supplier.name}</Text>
              {selectedSupplierId === supplier.id && (
                <Check size={20} color="#2d7a3a" />
              )}
            </Pressable>
          ))}

          <Pressable style={styles.addNewButton} onPress={handleAddNewSupplier}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addNewButtonText}>Add New Supplier</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
};

export default SupplierSelect;

const styles = StyleSheet.create({
  container: {
    width: '100%',
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
