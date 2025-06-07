import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search, Plus, CreditCard as Edit2 } from 'lucide-react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/database';
import React from 'react';

export default function ManageSuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');

      if (supabaseError) throw supabaseError;
      setSuppliers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.supplier_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supplier.webaddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSupplierStatus = async (supplier: Supplier) => {
    try {
      const { error: supabaseError } = await supabase
        .from('suppliers')
        .update({ is_active: !supplier.is_active })
        .eq('id', supplier.id);

      if (supabaseError) throw supabaseError;

      setSuppliers(
        suppliers.map((s) =>
          s.id === supplier.id ? { ...s, is_active: !s.is_active } : s
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update supplier status'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#336633" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Suppliers</Text>
        <Link href="/add-supplier" asChild>
          <Pressable style={styles.addButton}>
            <Plus size={24} color="#ffffff" />
          </Pressable>
        </Link>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#666666" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search suppliers..."
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {filteredSuppliers.map((supplier) => (
          <View key={supplier.id} style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <View>
                <Text style={styles.supplierName}>
                  {supplier.supplier_name}
                </Text>
                {supplier.webaddress && (
                  <Text style={styles.webaddress}>{supplier.webaddress}</Text>
                )}
              </View>
              <View style={styles.statusContainer}>
                <Pressable
                  style={[
                    styles.statusBadge,
                    supplier.is_active
                      ? styles.activeBadge
                      : styles.inactiveBadge,
                  ]}
                  onPress={() => toggleSupplierStatus(supplier)}
                >
                  <Text style={styles.statusText}>
                    {supplier.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </Pressable>
                <Link
                  href={{
                    pathname: '/edit-supplier/[id]',
                    params: { id: supplier.id },
                  }}
                  asChild
                >
                  <Pressable style={styles.editButton}>
                    <Edit2 size={20} color="#336633" />
                  </Pressable>
                </Link>
              </View>
            </View>

            <View style={styles.supplierDetails}>
              {supplier.email && (
                <Text style={styles.detailText}>Email: {supplier.email}</Text>
              )}
              {supplier.phone && (
                <Text style={styles.detailText}>Phone: {supplier.phone}</Text>
              )}
              {supplier.address && (
                <Text style={styles.detailText}>
                  Address: {supplier.address}
                </Text>
              )}
              {/* {supplier.payment_terms && (
                <Text style={styles.detailText}>
                  Payment Terms: {supplier.payment_terms}
                </Text>
              )} */}
            </View>

            {supplier.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{supplier.notes}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#336633',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
  content: {
    flex: 1,
    padding: 16,
  },
  supplierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a472a',
  },
  contactPerson: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9f0',
  },
  supplierDetails: {
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8faf8',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a472a',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
});
