import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { AppText } from '@/components/ui/AppText';
import { SupplierCard, type Supplier } from '@/components/SupplierCard';

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
  supplier_image?: string;
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
    supplier_image:
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
    supplier_image:
      'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=800&auto=format&fit=crop',
  },
];

export default function SelectSupplierScreen() {
  const router = useRouter();
  const { colors } = useTheme();

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
    // Navigate back to add-seed with selected supplier data
    if (router.canGoBack()) {
      router.back();
      // Note: In a real app, you'd want to pass the selected supplier data back
      // This could be done through:
      // 1. URL params 
      // 2. Global state management (Redux, Zustand, etc.)
      // 3. Context API
      // 4. Event emitters
      // For now, we'll just navigate back
    }
  };

  const handleEditSupplier = (supplierId: string) => {
    router.push({ pathname: '/edit-supplier/[id]', params: { id: supplierId } });
  };

  const handleAddSupplier = () => {
    router.push('/manage-suppliers'); // Navigate to manage suppliers instead
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Add Button */}
      <Pressable onPress={handleAddSupplier} style={[styles.floatingAddButton, { backgroundColor: colors.primary }]}>
        <Plus size={28} color={colors.buttonText} />
      </Pressable>

      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
        placeholder="Search Suppliers..."
        placeholderTextColor={colors.textSecondary}
        value={searchTerm}
        onChangeText={setSearchTerm}
        clearButtonMode="while-editing"
      />

      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      )}

      {!loading && error && <AppText variant="body" color={colors.error} style={styles.centeredText}>{error}</AppText>}

      {!loading &&
        !error &&
        suppliers.length === 0 &&
        (hasFetchedUserData ? (
          <AppText variant="body" color={colors.textSecondary} style={styles.centeredText}>
            You haven&apos;t added any suppliers yet. Add one!
          </AppText>
        ) : (
          <AppText variant="body" color={colors.textSecondary} style={styles.centeredText}>Loading suppliers...</AppText>
        ))}

      {!loading && !error && suppliers.length > 0 && (
        <FlatList
          data={suppliers}
          renderItem={({ item }) => (
            <SupplierCard
              supplier={item}
              onSelect={() => handleSelectSupplier(item)}
              onEdit={() => handleEditSupplier(item.id)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
    padding: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  loader: {
    marginTop: 30,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
});
