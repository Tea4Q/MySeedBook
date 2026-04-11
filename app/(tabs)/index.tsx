import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { SmartImage } from '@/components/SmartImage'; // Import SmartImage
import { Seed, Supplier } from '@/types/database'; // Adjust path if needed
import { useFocusEffect, useRouter, useNavigation } from 'expo-router';
import { useTheme } from '@/lib/theme';
import { SeedCard } from '@/components/SeedCard';
import {
  PlusCircle,
  Search,
  XCircle,
  ChevronRight,
  Edit3,
  Tally4,
  Trash2,
  Archive,
  Truck,
  Leaf,
  Flower2,
  Wheat,
  Carrot,
  Apple,
  Cherry,
} from 'lucide-react-native';

import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '@/lib/auth'; // Assuming you have an auth context
import { useResponsive } from '@/utils/responsive';
import GuestStatusBanner from '@/components/GuestStatusBanner';
import { guestDataManager } from '@/utils/guestDataManager';
import BarcodeScannerModal, { type ScannedSeedData } from '@/components/BarcodeScannerModal';
import PremiumModal from '@/components/PremiumModal';
import { useGlobalSubscription } from '@/lib/globalSubscriptionManager';

export default function InventoryScreen() {
  const { session } = useAuth(); // Get user session
  const { isPremium, isLoading: isSubscriptionLoading } = useGlobalSubscription();
  // Removed guest limits for views - now unlimited
  const { colors } = useTheme(); // Get theme colors
  const responsive = useResponsive(); // Get responsive configuration
  const router = useRouter();
  const navigation = useNavigation();
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedSeedId, setHighlightedSeedId] = useState<string | null>(
    null
  );
  const [deletingSeedId, setDeletingSeedId] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const flatListRef = useRef<FlatList<Seed>>(null);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const isMounted = useRef(true);
  const lastPressTimestamps = useRef<Record<string, number>>({});

  // Update header title with seed count
  useEffect(() => {
    const canShowSeedCount = isPremium && !isSubscriptionLoading;

    navigation.setOptions({
      title: canShowSeedCount
        ? `My Seed Inventory (${seeds.length})`
        : 'My Seed Inventory',
    });
  }, [isPremium, isSubscriptionLoading, seeds.length, navigation]);

  // --- 2. Modify Data Loading Logic ---
  const loadSeeds = useCallback(
    async (isRefresh = false) => {
      if (!session?.user) {
        // Guest user - load sample data
        if (!isRefresh && !searchTerm) setLoading(true);
        setError(null);
        
        try {
          const allSeeds = await guestDataManager.getAllSeeds();
          
          // Apply search filter if there's a search term
          let filteredSeeds = allSeeds;
          if (searchTerm) {
            filteredSeeds = allSeeds.filter((seed: Seed) => 
              seed.seed_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              seed.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (seed.description && seed.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
          }
          
          setSeeds(filteredSeeds);
        } catch (e: any) {
          console.error('Error loading sample seeds:', e);
          setError('Failed to load sample seeds');
          setSeeds([]);
        } finally {
          if (!isRefresh) setLoading(false);
          if (isRefresh) setRefreshing(false);
        }
        return;
      }

      if (!isRefresh && !searchTerm) setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('seeds')
          .select('*')
          .eq('user_id', session.user.id)
          .is('deleted_at', null) // Exclude soft-deleted seeds
          .order('seed_name', { ascending: true });

        if (searchTerm) {
          // Only search on columns in the seeds table
          query = query.or(
            `seed_name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        const { data: seedData, error: seedError } = await query;

        if (seedError) throw seedError;

        const supplierIds = Array.from(
          new Set((seedData ?? []).map((seed: Seed) => seed.supplier_id).filter(Boolean))
        ) as string[];

        let supplierMap = new Map<string, Supplier>();
        if (supplierIds.length > 0) {
          const { data: supplierData, error: supplierError } = await supabase
            .from('suppliers')
            .select('*')
            .in('id', supplierIds)
            .is('deleted_at', null);

          if (supplierError) throw supplierError;

          supplierMap = new Map((supplierData ?? []).map((supplier: Supplier) => [supplier.id, supplier]));
        }

        const enrichedSeeds = (seedData ?? []).map((seed: Seed) => ({
          ...seed,
          suppliers: seed.supplier_id ? supplierMap.get(seed.supplier_id) ?? undefined : undefined,
        }));

        setSeeds(enrichedSeeds as Seed[]);
      } catch (e: any) {
        console.error('Error loading seeds:', e);
        setError(
          e.message || 'An unexpected error occurred while fetching seeds.'
        );
        setSeeds([]);
      } finally {
        if (!isRefresh) setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [session, searchTerm] // Removed supabase from dependencies
  );

  // Initial load and re-load on focus
  useFocusEffect(
    useCallback(() => {
      // Only reload if not already loaded or if we need to refresh
      if (seeds.length === 0 || !searchTerm) {
        loadSeeds();
      }
      // No longer tracking view actions for guests - unlimited access
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Empty dependency array - only run on focus
  );

  // Handle highlighted seed scrolling separately
  useEffect(() => {
    if (highlightedSeedId && seeds.length > 0) {
      // Delay to let the FlatList finish its initial render before scrolling.
      // Recompute index at execution time to avoid stale-index crashes.
      const scrollTimer = setTimeout(() => {
        const currentIndex = seeds.findIndex((s) => s.id === highlightedSeedId);
        if (!flatListRef.current || currentIndex < 0 || currentIndex >= seeds.length) {
          return;
        }

        try {
          flatListRef.current.scrollToIndex({ animated: true, index: currentIndex });
        } catch {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }, 300);

      return () => clearTimeout(scrollTimer);
    }
  }, [highlightedSeedId, seeds]);

  // Auto-clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedSeedId) {
      const clearHighlight = setTimeout(() => {
        setHighlightedSeedId(null);
      }, 3000);
      
      return () => clearTimeout(clearHighlight);
    }
  }, [highlightedSeedId]);

  // Handle search term changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadSeeds();
    }, 300); // Debounce search
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // Only reload when search term changes

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchTerm(''); // Optionally clear search on pull-to-refresh
    loadSeeds(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSeed = () => {
    router.push('/add-seed');
  };

  const handleBarcodeScan = (data: ScannedSeedData) => {
    // Navigate to add-seed with scanned data
    router.push({
      pathname: '/add-seed',
      params: {
        scannedData: JSON.stringify({
          seed_name: data.seedName,
          type: data.type,
          description: data.description,
          supplier: data.supplier,
          barcode: data.barcode,
        }),
      },
    });
    setShowBarcodeScanner(false);
  };

  const handleUpgradeRequired = () => {
    setShowPremiumModal(true);
  };

  const handleEdit = (seed: Seed) => {
    closeAllSwipeables();
    setHighlightedSeedId(seed.id); // Set for potential highlight on return

    router.push({
      pathname: '/add-seed',
      params: { id: seed.id, returnTo: '/(tabs)/' },
    });
  };

  const confirmDelete = (seedId: string) => {
    closeAllSwipeables();
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      if (
        window.confirm(
          'Are you sure you want to delete this seed? This action cannot be undone.'
        )
      ) {
        handleDelete(seedId);
      }
    } else {
      Alert.alert(
        'Delete Seed',
        'Are you sure you want to delete this seed? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDelete(seedId),
          },
        ]
      );
    }
  };

  const handleDelete = async (seedId: string) => {
    setDeletingSeedId(seedId);
    try {
      const deletedAt = new Date().toISOString();
      const { error: updateError } = await (supabase
        .from('seeds') as any)
        .update({ deleted_at: deletedAt })
        .eq('id', seedId);
      if (updateError) throw updateError;
      if (isMounted.current) {
        setSeeds((prev) => prev.filter((seed) => seed.id !== seedId));
        Alert.alert('Success', 'Seed deleted successfully.');
      }
    } catch (e: any) {
      console.error('Error deleting seed:', e);
      if (isMounted.current) {
        Alert.alert(
          'Error',
          e.message || 'Failed to delete seed. Please try again.'
        );
      }
    } finally {
      if (isMounted.current) setDeletingSeedId(null);
    }
  };

  const closeAllSwipeables = () => {
    // Only close swipeables on mobile platforms
    if (Platform.OS !== 'web') {
      Object.values(swipeableRefs.current).forEach((ref) => ref?.close());
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    item: Seed
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-150, 0],
      outputRange: [0, 150],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View
        style={{ flexDirection: 'row', transform: [{ translateX: trans }] }}
      >
        <Pressable
          style={[styles.rightAction, { backgroundColor: colors.warning }]}
          onPress={() => handleEdit(item)}
          disabled={deletingSeedId === item.id}
        >
          <Edit3 size={24} color="#fff" />
          <Text style={[styles.actionText, { color: '#fff' }]}>Edit</Text>
        </Pressable>
        <Pressable
          style={[
            styles.rightAction,
            {
              backgroundColor: colors.error,
              opacity: deletingSeedId === item.id ? 0.6 : 1,
            },
          ]}
          onPress={() => {
            if (deletingSeedId === item.id) return; // Prevent double tap
            confirmDelete(item.id);
          }}
        >
          <View pointerEvents="box-none">
            {deletingSeedId === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash2 size={24} color="#fff" />
            )}
          </View>
          <Text style={[styles.actionText, { color: '#fff' }]}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const getSeedTypeIcon = (type: string): React.ReactNode => {
    // ... (your existing getSeedTypeIcon function)
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('vegetable'))
      return <Carrot size={16} color="#4CAF50" />;
    if (normalizedType.includes('fruit'))
      return <Apple size={16} color="#FF9800" />;
    if (normalizedType.includes('flower'))
      return <Flower2 size={16} color="#E91E63" />;
    if (normalizedType.includes('herb'))
      return <Leaf size={16} color="#8BC34A" />;
    if (normalizedType.includes('grain'))
      return <Wheat size={16} color="#FFEB3B" />;
    if (normalizedType.includes('cherry'))
      return <Cherry size={16} color="#FF5722" />;
    // if (normalizedType.includes('pepper'))
    //   return <Droplets size={20} color="#FF5722" />;
    // if (normalizedType.includes('cucumber'))
    //   return <Wind size={20} color="#4CAF50" />;
    // if (normalizedType.includes('squash'))
    //   return <GanttChartSquare size={20} color="#FF9800" />;
    // if (normalizedType.includes('melon'))
    //   return <Globe size={20} color="#FF9800" />;
    // if (normalizedType.includes('berry'))
    //   return <Grape size={20} color="#FF4081" />;
    // if (normalizedType.includes('nut'))
    //   return <Nut size={20} color="#795548" />;
    // if (normalizedType.includes('pea'))
    //   return <Bean size={20} color="#795548" />;
    // return <Sprout size={20} color="#795548" />;
  };

  // Helper to handle double press on a seed item
  const handleSeedDoublePress = useCallback((seed: Seed) => {
    // Navigate to calendar with params to open add event modal and pre-fill seed name
    router.push({
      pathname: '/calendar',
      params: {
        openAddEvent: 'true',
        seedName: seed.seed_name,
        seedId: seed.id,
      },
    });
  }, [router]);

  const renderSeedItem = useCallback(({ item: seed }: { item: Seed }) => {
    const handlePress = () => {
      const now = Date.now();
      const lastPress = lastPressTimestamps.current[seed.id] || 0;
      if (now - lastPress < 350) {
        handleSeedDoublePress(seed);
      }
      lastPressTimestamps.current[seed.id] = now;
    };

    const card = (
      <SeedCard
        seed={seed}
        onPress={handlePress}
        onEdit={() => handleEdit(seed)}
        onDelete={() => confirmDelete(seed.id)}
        isHighlighted={seed.id === highlightedSeedId}
        isDeleting={deletingSeedId === seed.id}
        cardWidth={responsive.gridColumns > 1 ? responsive.cardWidth : undefined}
        isTablet={responsive.isTablet}
      />
    );

    if (Platform.OS === 'web') {
      return card;
    }

    return (
      <Swipeable
        ref={(ref) => {
          swipeableRefs.current[seed.id] = ref;
        }}
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, seed)
        }
        onSwipeableWillOpen={() => {
          Object.entries(swipeableRefs.current).forEach(([key, ref]) => {
            if (key !== seed.id && ref) {
              ref.close();
            }
          });
        }}
      >
        {card}
      </Swipeable>
    );
  }, [highlightedSeedId, deletingSeedId, responsive.gridColumns, responsive.cardWidth, responsive.isTablet]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && seeds.length === 0 && !searchTerm) {
    // Show full screen loader only on very first load when no seeds (mock or real) are set yet
    // and not during a search.
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your garden...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Guest Status Banner */}
      <GuestStatusBanner />
      
      {/* Floating Add Button */}
      <Pressable onPress={handleAddSeed} style={[styles.floatingAddButton, { backgroundColor: colors.primary }]}>
        <PlusCircle size={24} color={colors.warning} />
      </Pressable>

      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.inputText }]}
          placeholder="Search seeds, type, supplier..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={colors.textSecondary}
        />
        {searchTerm ? (
          <Pressable onPress={() => setSearchTerm('')}>
            <XCircle size={20} color={colors.textSecondary} style={styles.clearSearchIcon} />
          </Pressable>
        ) : null}
      </View>

      {error &&
        !loading && ( // Show error only if not loading
          <View style={styles.centered}>
            <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
            <Pressable 
              onPress={() => loadSeeds()} 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Try Again</Text>
            </Pressable>
          </View>
        )}

      {!loading &&
        seeds.length === 0 &&
        !error && ( // Message for no seeds (could be no search results or truly empty)
          <View style={styles.centered}>
            <Archive size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchTerm
                ? 'No seeds match your search.'
                : 'Your garden is empty! Add some seeds to get started.'}
            </Text>
            {!searchTerm && (
              <Pressable
                onPress={handleAddSeed}
                style={[styles.addFirstSeedButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.addFirstSeedButtonText, { color: colors.primaryText }]}>
                  Add First Seed
                </Text>
              </Pressable>
            )}
          </View>
        )}

      {seeds.length > 0 && (
        <FlatList
          ref={flatListRef}
          data={seeds}
          renderItem={renderSeedItem}
          keyExtractor={(item) => item.id.toString()} // Ensure ID is a string
          numColumns={responsive.gridColumns}
          key={`${responsive.gridColumns}-${responsive.isLandscape}-${responsive.screenWidth}`} // Force re-render when layout changes
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            // Fallback: scroll to approximate offset then retry
            const safeIndex = Math.max(0, Math.min(index, seeds.length - 1));
            flatListRef.current?.scrollToOffset({
              offset: safeIndex * averageItemLength,
              animated: true,
            });
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
        onUpgradeRequired={handleUpgradeRequired}
      />

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  iconButton: {
    padding: 12,
    borderRadius: 12,
    // backgroundColor removed - will be applied dynamically
  },
  iconsView: {
    alignItems: 'center',
    borderWidth: 5,
    // backgroundColor removed - will be applied dynamically
    borderColor: '#4db6ac',
    borderRadius: 50,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e4053',
    marginRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // elevation: 2,
    padding: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  clearSearchIcon: {
    marginLeft: 10,
  },
  listContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  seedItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 680, // Increased height significantly for more content space
  },
  seedImage: {
    width: '100%',
    height: 200,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  seedContent: {
    padding: 16,
    flex: 1,
    flexDirection: 'column',
  },
  seedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Changed from 'center' to allow multi-line names
    marginBottom: 12, // Increased margin for better spacing
    flexWrap: 'wrap', // Allow wrapping if needed
  },
  seedName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 8, // Add margin to prevent overlap with type container
  },

  seedTypeContainer: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start', // Prevent stretching and allow proper positioning
  },
  seedType: {
    fontSize: 14,
    fontWeight: '600',
  },
  seedDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
    flex: 1,
    maxHeight: 200, // Much larger height to show ~9 lines (22px line height * 9)
    minHeight: 180, // Ensure minimum space for at least 8+ lines
  },
  seedDescriptionScrollable: {
    fontSize: 16,
    lineHeight: 22,
  },
  seedDescriptionContent: {
    padding: 8,
    minHeight: 200, // Ensure minimum content height for scrolling
  },
  seedDetails: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  seasonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  seasonTag: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  plantTag: {
    // backgroundColor removed - will be applied dynamically
  },
  harvestTag: {
    // backgroundColor removed - will be applied dynamically
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevronIcon: {
    marginLeft: 'auto', // Pushes chevron to the far right
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    // backgroundColor removed - will be applied dynamically
    borderRadius: 8,
    borderWidth: 1,
    // borderColor removed - will be applied dynamically
  },
  errorText: {
    fontSize: 14,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  addFirstSeedButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  addFirstSeedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 75,
    height: '90%',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  // Web-specific action button styles
  webActionButtons: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 400,
    alignSelf: 'center',
  },
  webHint: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  webButtonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  webActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 1,
    borderRadius: 6,
    gap: 4,
    minWidth: 80,
    alignContent: 'center',
    justifyContent: 'center',
  },
  editButton: {
    // backgroundColor removed - will be applied dynamically
    
  },
  deleteButton: {
   
    // backgroundColor removed - will be applied dynamically
  },
  webButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBottom: {
    marginTop: 8,
    paddingBottom: 16, // Add bottom padding to ensure content doesn't get cut off
  },
});
