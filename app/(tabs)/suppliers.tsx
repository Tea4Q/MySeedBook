import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Plus, Edit } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase'; // Adjust the import path as necessary

type Supplier = {
  id: string;
  supplier_name: string;
  description?: string;
  webaddress?: string;
  email?: string;
  phone?: string;
  address?: string;
  specialties?: string[];
  rating?: number;
  supplier_images?: string;
  user_id?: string;
};

const mockSuppliers: Supplier[] = [
  {
    id: 'mock-1',
    supplier_name: 'Baker Creek Heirloom Seeds (Example)',
    description:
      'Specializing in rare and heirloom varieties, offering one of the largest selections of seeds from the 19th century.',
    webaddress: 'rareseeds.com',
    email: 'support@rareseeds.com',
    phone: '(417) 924-8917',
    address: 'Mansfield, MO 65704',
    specialties: [
      'Heirloom Vegetables',
      'Rare Varieties',
      'Organic Seeds',
      'Historic Varieties',
    ],
    rating: 4.8,
    supplier_images:
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop',
  },
  {
    id: 'mock-2',
    supplier_name: "Johnny's Selected Seeds (Example)",
    description:
      'Employee-owned company providing quality vegetable, herb, and flower seeds to growers and gardeners.',
    webaddress: 'johnnyseeds.com',
    email: 'support@johnnyseeds.com',
    phone: '(877) 564-6697',
    address: 'Winslow, ME 04901',
    specialties: ['Vegetables', 'Flowers', 'Herbs', 'Tools', 'Organic'],
    rating: 4.7,
    supplier_images:
      'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=800&auto=format&fit=crop',
  },
];

export default function SupplierListScreen() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hasFetchedUserData, setHasFetchedUserData] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError('Could not verify user session. Please try again.');
        setHasFetchedUserData(false);
        setSuppliers([]);
        setLoading(false);
        return;
      }
      if (!user) {
        setError('You are not logged in.');
        setSuppliers([]);
        setHasFetchedUserData(false);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('supplier_name', { ascending: true });

      if (searchTerm.trim()) {
        query = query.ilike('supplier_name', `%${searchTerm.trim()}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setSuppliers(data || []);
      setError(null);
      setHasFetchedUserData(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suppliers');
      setSuppliers([]);
      setHasFetchedUserData(false);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useFocusEffect(
    useCallback(() => {
      fetchSuppliers();
    }, [fetchSuppliers])
  );

  const handleSelectSupplier = (supplier: Supplier) => {
    console.log('Selected supplier:', supplier);
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleEditSupplier = (supplierId: string) => {
    router.push({ pathname: '/add-supplier', params: { supplierId } });
  };

  const handleAddSupplier = () => {
    router.push('/add-supplier'); // Navigate without supplierId
  };

  const renderItem = ({ item }: { item: Supplier }) => (
    <Pressable
      onPress={() => handleSelectSupplier(item)}
      style={styles.itemContainer}
    >
      {item.supplier_images && (
        <Image source={{ uri: item.supplier_images }} style={styles.itemImage} />
      )}
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemText}>{item.supplier_name}</Text>
        {item.description && (
          <Text style={styles.itemDescription}>
            {item.description.substring(0, 100)}...
          </Text>
        )}
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          handleEditSupplier(item.id);
        }}
        style={styles.iconButton}
      >
        <Edit size={20} color="#007AFF" />
      </Pressable>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <Pressable onPress={handleAddSupplier} style={styles.iconButton}>
          <Plus size={24} color="#007AFF" />
        </Pressable>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search Suppliers..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        clearButtonMode="while-editing"
      />

      {loading && (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      )}

      {!loading && error && <Text style={styles.errorText}>{error}</Text>}

      {!loading &&
        !error &&
        suppliers.length === 0 &&
        (hasFetchedUserData ? (
          <Text style={styles.emptyText}>
            You haven't added any suppliers yet. Add one!
          </Text>
        ) : (
          <Text style={styles.emptyText}>Loading suppliers...</Text>
        ))}

      {!loading && !error && suppliers.length > 0 && (
        <FlatList
          data={suppliers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchInput: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
  },
  loader: {
    marginTop: 30,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
  },
});
