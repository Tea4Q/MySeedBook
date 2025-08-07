import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Search, PlusCircle, Pencil, Trash2, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import type { Supplier } from '@/types/database';
import AddSupplierForm from '@/components/AddSupplierForm';

export default function ManageSuppliersScreen() {
  const { colors } = useTheme();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    visible: boolean;
    supplier: Supplier | null;
  }>({ visible: false, supplier: null });
  const [showAddSupplierModal, setShowAddSupplierModal] = React.useState(false);

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    // Handle cases where hex might not be a proper hex color
    if (!hex || !hex.startsWith('#') || hex.length !== 7) {
      return `rgba(255, 255, 255, ${alpha})`; // fallback
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  React.useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      // Try to load suppliers with soft delete filter first
      let { data, error: supabaseError } = await supabase
        .from('suppliers')
        .select('*')
        .is('deleted_at', null) // Only load non-deleted suppliers
        .order('supplier_name');

      // If the query fails (possibly because deleted_at column doesn't exist),
      // fall back to loading all suppliers without the deleted_at filter
      if (supabaseError && supabaseError.message.includes('deleted_at')) {
        const fallbackResult = await supabase
          .from('suppliers')
          .select('*')
          .order('supplier_name');

        data = fallbackResult.data;
        supabaseError = fallbackResult.error;
      }

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

  const handleSupplierAdded = async (newSupplier: Supplier) => {
    setShowAddSupplierModal(false);
    await loadSuppliers(); // Refresh the suppliers list
  };

  const deleteSupplier = async (supplier: Supplier) => {
    // For web and other platforms, use custom modal
    if (Platform.OS === 'web') {
      setDeleteConfirmation({ visible: true, supplier });
      return;
    }

    // For native platforms, use native Alert
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${supplier.supplier_name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => performDelete(supplier),
        },
      ]
    );
  };

  const performDelete = async (supplier: Supplier) => {
    try {
      // Check if there are any active (non-soft-deleted) seeds referencing this supplier
      const { data: activeSeeds, error: seedCheckError } = await supabase
        .from('seeds')
        .select('id, seed_name')
        .eq('supplier_id', supplier.id)
        .is('deleted_at', null); // Only check for non-deleted seeds

      if (seedCheckError) {
        console.error('Error checking seeds:', seedCheckError);
        throw new Error('Failed to check associated seeds');
      }

      if (activeSeeds && activeSeeds.length > 0) {
        throw new Error(
          `Cannot delete supplier: There are ${activeSeeds.length} active seed(s) associated with this supplier. Please delete or reassign these seeds first.`
        );
      }

      // Try soft delete first (if deleted_at column exists)
      let { error: supabaseError } = await supabase
        .from('suppliers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', supplier.id);

      // If soft delete fails (column doesn't exist), fall back to hard delete
      if (supabaseError && supabaseError.message.includes('deleted_at')) {
        const hardDeleteResult = await supabase
          .from('suppliers')
          .delete()
          .eq('id', supplier.id);

        supabaseError = hardDeleteResult.error;
      }

      if (supabaseError) {
        console.error('Supabase delete error:', supabaseError);
        // Provide more specific error messages
        if (supabaseError.code === 'PGRST116') {
          throw new Error('You can only delete suppliers that you created.');
        } else if (supabaseError.message.includes('foreign key')) {
          throw new Error(
            'Cannot delete supplier: There are seeds associated with this supplier. Please remove or reassign the seeds first.'
          );
        } else {
          throw new Error(`Delete failed: ${supabaseError.message}`);
        }
      }

      // Remove supplier from local state (since we only show non-deleted suppliers)
      setSuppliers(suppliers.filter((s) => s.id !== supplier.id));

      // Clear any existing errors
      setError(null);

      // Close confirmation modal
      setDeleteConfirmation({ visible: false, supplier: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete supplier';
      setError(errorMessage);
      setDeleteConfirmation({ visible: false, supplier: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ visible: false, supplier: null });
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Add Button */}
      <Pressable
        style={[styles.floatingAddButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddSupplierModal(true)}
      >
        <PlusCircle size={28} color={colors.primaryText} />
      </Pressable>

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.inputText }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search suppliers..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {error && (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: hexToRgba(colors.error, 0.1),
              borderColor: hexToRgba(colors.error, 0.3),
            },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      )}

      <KeyboardAwareScrollView 
        style={styles.content}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        {filteredSuppliers.map((supplier) => (
          <View
            key={supplier.id}
            style={[
              styles.supplierCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.supplierHeader}>
              <View style={styles.supplierInfo}>
                <Text style={[styles.supplierName, { color: colors.text }]}>
                  {supplier.supplier_name}
                </Text>
                {supplier.webaddress && (
                  <Text
                    style={[styles.webaddress, { color: colors.textSecondary }]}
                  >
                    {supplier.webaddress}
                  </Text>
                )}
              </View>
              <View style={styles.statusContainer}>
                <Pressable
                  style={[
                    styles.statusBadge,
                    supplier.is_active
                      ? [
                          styles.activeBadge,
                          { backgroundColor: hexToRgba(colors.success, 0.2) },
                        ]
                      : [
                          styles.inactiveBadge,
                          { backgroundColor: hexToRgba(colors.error, 0.2) },
                        ],
                  ]}
                  onPress={() => toggleSupplierStatus(supplier)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: supplier.is_active
                          ? colors.success
                          : colors.error,
                      },
                    ]}
                  >
                    {supplier.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.editButton,
                    {
                      backgroundColor: colors.surface,
                      marginLeft: 8,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/edit-supplier/[id]',
                      params: { id: supplier.id },
                    })
                  }
                >
                  <Pencil size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                  style={[
                    styles.deleteButton,
                    {
                      backgroundColor: hexToRgba(colors.error, 0.1),
                      marginLeft: 8,
                    },
                  ]}
                  onPress={() => deleteSupplier(supplier)}
                >
                  <Trash2 size={20} color={colors.error} />
                </Pressable>
              </View>
            </View>

            <View style={styles.supplierDetails}>
              {supplier.email && (
                <Text
                  style={[
                    styles.detailText,
                    { color: colors.textSecondary, marginBottom: 8 },
                  ]}
                >
                  Email: {supplier.email}
                </Text>
              )}
              {supplier.phone && (
                <Text
                  style={[
                    styles.detailText,
                    { color: colors.textSecondary, marginBottom: 8 },
                  ]}
                >
                  Phone: {supplier.phone}
                </Text>
              )}
              {supplier.address && (
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  Address: {supplier.address}
                </Text>
              )}
            </View>

            {supplier.notes && (
              <View
                style={[
                  styles.notesContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text style={[styles.notesLabel, { color: colors.text }]}>
                  Notes:
                </Text>
                <Text
                  style={[styles.notesText, { color: colors.textSecondary }]}
                >
                  {supplier.notes}
                </Text>
              </View>
            )}
          </View>
        ))}
      </KeyboardAwareScrollView>

      {/* Custom Confirmation Modal for Web */}
      <Modal
        visible={deleteConfirmation.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: hexToRgba(colors.background, 0.8) },
          ]}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Delete Supplier
              </Text>
              <TouchableOpacity
                onPress={cancelDelete}
                style={styles.modalCloseButton}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalMessage, { color: colors.text }]}>
              Are you sure you want to delete &ldquo;
              {deleteConfirmation.supplier?.supplier_name}&rdquo;? This action
              cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: hexToRgba(colors.text, 0.1) },
                ]}
                onPress={cancelDelete}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalDeleteButton,
                  { marginLeft: 12 },
                ]}
                onPress={() =>
                  deleteConfirmation.supplier &&
                  performDelete(deleteConfirmation.supplier)
                }
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        visible={showAddSupplierModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSupplierModal(false)}
      >
        <View style={styles.addSupplierModalContainer}>
          <View style={styles.addSupplierModalContent}>
            <View style={styles.addSupplierModalHeader}>
              <Text style={styles.addSupplierModalTitle}>Add New Supplier</Text>
              <Pressable
                style={styles.addSupplierModalClose}
                onPress={() => setShowAddSupplierModal(false)}
              >
                <X size={24} color="#666666" />
              </Pressable>
            </View>
            <AddSupplierForm
              initialSupplierName=""
              onSuccess={handleSupplierAdded}
              onCancel={() => setShowAddSupplierModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
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
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 12,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  supplierCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  supplierInfo: {
    flex: 1,
    marginRight: 8,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  webaddress: {
    fontSize: 14,
    marginTop: 4,
  },
  contactPerson: {
    fontSize: 14,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    // gap: 8, // Removed gap property - not supported in React Native Web
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {},
  inactiveBadge: {},
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  supplierDetails: {
    // gap: 8, // Removed gap property - not supported in React Native Web
  },
  detailText: {
    fontSize: 14,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // gap: 12, // Removed gap property - not supported in React Native Web
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    // Additional styling handled inline
  },
  modalDeleteButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Add Supplier Modal styles
  addSupplierModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addSupplierModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    flex: 1,
    marginTop: '10%',
  },
  addSupplierModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  addSupplierModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  addSupplierModalClose: {
    padding: 8,
  },
});
