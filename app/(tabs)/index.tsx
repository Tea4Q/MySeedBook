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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase'; // Adjust path if needed
import { SmartImage } from '@/components/SmartImage'; // Import SmartImage
import { Seed } from '@/types/database'; // Adjust path if needed
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';
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
  Nut,
  Grape,
  Bean,
  MoreHorizontal,
} from 'lucide-react-native';

import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '@/lib/auth'; // Assuming you have an auth context
import { useResponsive } from '@/utils/responsive';

export default function InventoryScreen() {
  const { session } = useAuth(); // Get user session
  const { colors } = useTheme(); // Get theme colors
  const responsive = useResponsive(); // Get responsive configuration
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedSeedId, setHighlightedSeedId] = useState<string | null>(
    null
  );
  const [deletingSeedId, setDeletingSeedId] = useState<string | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList<Seed>>(null);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const isMounted = useRef(true);
  const lastPressTimestamps = useRef<Record<string, number>>({});

  // --- 2. Modify Data Loading Logic ---
  const loadSeeds = useCallback(
    async (isRefresh = false) => {
      if (!session?.user) {
        setLoading(false);
        setRefreshing(false);
        setSeeds([]); // Don't load mock data, just show empty state
        return;
      }

      if (!isRefresh && !searchTerm) setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('seeds')
          .select('*, suppliers(*)')
          .eq('user_id', session.user.id)
          .is('deleted_at', null) // Exclude soft-deleted seeds
          .order('seed_name', { ascending: true });

        if (searchTerm) {
          // Supabase/PostgREST does not support nested filters like suppliers(supplier_name.ilike...) in .or()
          // Only search on columns in the seeds table
          query = query.or(
            `seed_name.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        const { data: seedData, error: seedError } = await query;

        if (seedError) throw seedError;

        if (seedData) {
          setSeeds(seedData);
        } else {
          setSeeds([]);
        }
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
      loadSeeds();
    }, [loadSeeds]) // Include loadSeeds dependency to ensure fresh data on focus
  );

  // Handle highlighted seed scrolling separately
  useEffect(() => {
    if (highlightedSeedId && seeds.length > 0) {
      const index = seeds.findIndex((s) => s.id === highlightedSeedId);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ animated: true, index });
      }
    }
  }, [highlightedSeedId, seeds.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchTerm(''); // Optionally clear search on pull-to-refresh
    loadSeeds(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddSeed = () => {
    router.push('/add-seed');
  };

  const handleEdit = (seed: Seed) => {
    closeAllSwipeables();
    setHighlightedSeedId(seed.id); // Set for potential highlight on return
    
    // Pass the full seed as JSON for editing
    router.push({
      pathname: '/add-seed',
      params: { seed: JSON.stringify(seed), returnTo: '/(tabs)/' },
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
      const { error: updateError } = await supabase
        .from('seeds')
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
    const isHighlighted = seed.id === highlightedSeedId;
    const highlightStyle = isHighlighted ? { backgroundColor: colors.success } : {};

    // Determine the image URI with better error handling
    function getSeedImageUri(seed: Seed): string {
      // Helper function to construct proper Supabase URL
      const constructSupabaseUrl = (path: string): string => {
        const supabaseUrl = 'https://fodtwysfcqltykejkffn.supabase.co';
        const bucketName = 'seed-images';
        
        // If it's already a full URL, return as-is
        if (path.startsWith('http')) {
          return path;
        }
        
        // If it starts with /storage, prepend the domain
        if (path.startsWith('/storage')) {
          return `${supabaseUrl}${path}`;
        }
        
        // If it's just a path, construct the full URL
        return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}`;
      };
      
      if (seed.seed_images) {
        if (Array.isArray(seed.seed_images) && seed.seed_images.length > 0) {
          const firstImage = seed.seed_images[0];
          if (firstImage && typeof firstImage === 'object' && firstImage.url && typeof firstImage.url === 'string') {
            return constructSupabaseUrl(firstImage.url);
          }
        } else if (typeof seed.seed_images === 'string' && seed.seed_images.trim()) {
          // Handle case where seed_images is a string URL
          return constructSupabaseUrl(seed.seed_images);
        }
      }
      
      // Return a varied garden-themed placeholder based on seed type
      const type = (seed.type || '').toLowerCase();
      if (type.includes('tomato')) {
        return 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else if (type.includes('pea')) {
        return 'https://images.unsplash.com/photo-1587049693270-c7560da11218?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else if (type.includes('herb')) {
        return 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else if (type.includes('flower')) {
        return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      } else {
        // Default garden/seeds image
        return 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop&crop=center&auto=format&q=60';
      }
    }

    const imageUri = getSeedImageUri(seed);

    // Double press handler using lastPressTimestamps ref in parent
    const handlePress = () => {
      const now = Date.now();
      const lastPress = lastPressTimestamps.current[seed.id] || 0;
      if (now - lastPress < 350) {
        handleSeedDoublePress(seed);
      }
      lastPressTimestamps.current[seed.id] = now;
    };

    // Main content component that will be conditionally wrapped
    const seedItemContent = (
      <Pressable
        style={[
          styles.seedItem, 
          highlightStyle,
          { 
            backgroundColor: colors.card,
            shadowColor: colors.shadowColor,
            width: responsive.gridColumns > 1 ? responsive.cardWidth : undefined,
            marginHorizontal: responsive.gridColumns > 1 ? 8 : 10,
          }
        ]}
        onPress={handlePress}
      >
        <View style={styles.imageContainer}>
          <SmartImage
            uri={imageUri}
            style={styles.seedImage}
            resizeMode="cover"
            fallbackUri="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=center&auto=format&q=60"
          />
        </View>
        <View style={styles.seedContent}>
          <View style={styles.seedHeader}>
            <Text style={[styles.seedName, { color: colors.text }]}>{seed.seed_name}</Text>
            <View
              style={[
                styles.seedTypeContainer,
                { 
                  backgroundColor: colors.surface,
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 6,
                },
              ]}
            >
              {getSeedTypeIcon(seed.type)}
              <Text style={[styles.seedType, { color: colors.primary }]}>{seed.type}</Text>
            </View>
          </View>
          <ScrollView 
            style={[styles.seedDescription, { backgroundColor: colors.surface, borderRadius: 8 }]}
            contentContainerStyle={styles.seedDescriptionContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceVertical={false}
          >
            <Text style={[styles.seedDescriptionScrollable, { color: colors.textSecondary }]}>
              {seed.description || 'No description available. This is a placeholder text to show how the scrollable description area works. You can add detailed information about your seeds here, including growing instructions, harvest times, special care notes, and any other relevant details about the variety. Add more content here to test scrolling functionality. This should be long enough to require scrolling when displayed in the description area of the seed card.'}
            </Text>
          </ScrollView>
        </View>
        
        {/* Move seed details and web actions to bottom */}
        <View style={styles.cardBottom}>
          <View style={[styles.seedDetails, { backgroundColor: colors.surface }]}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                <Tally4 style={styles.iconsView} /> Quantity:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {seed.quantity} {seed.quantity_unit}
              </Text>
            </View>
            {/* Accessing seed.suppliers safely */}
            {seed.suppliers && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  <Truck style={styles.iconsView} /> Supplier:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {seed.suppliers.supplier_name}
                </Text>
              </View>
            )}
            {/*Fallback for when suppliers is not loaded as an object or is null */}
            {!seed.suppliers && seed.supplier_id && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  <Truck style={styles.iconsView} />
                  Supplier ID:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  (Details not loaded) {seed.supplier_id}
                </Text>
              </View>
            )}
            <View style={styles.seasonContainer}>
              <View style={[styles.seasonTag, styles.plantTag, { backgroundColor: colors.success }]}>
                <Text style={[styles.seasonText, { color: colors.text }]}>
                  Plant: {seed.planting_season}
                </Text>
              </View>
              <View style={[styles.seasonTag, styles.harvestTag, { backgroundColor: colors.warning }]}>
                <Text style={[styles.seasonText, { color: colors.text }]}>
                  Harvest: {seed.harvest_season}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Show action buttons on web only, hint about double-click */}
          {Platform.OS === 'web' && (
            <View style={[
              styles.webActionButtons,
              { 
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }
            ]}>
              <Text style={[styles.webHint, { color: colors.textSecondary }]}>Double-click for calendar • Buttons below for edit/delete</Text>
              <View style={styles.webButtonRow}>
                <Pressable
                  style={[styles.webActionButton, styles.editButton, { backgroundColor: colors.warning }]}
                  onPress={() => handleEdit(seed)}
                >
                  <Edit3 size={16} color="#fff" />
                  <Text style={[styles.webButtonText, { color: '#fff' }]}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.webActionButton, styles.deleteButton, { backgroundColor: colors.error }]}
                  onPress={() => confirmDelete(seed.id)}
                  disabled={deletingSeedId === seed.id}
                >
                  {deletingSeedId === seed.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Trash2 size={16} color="#fff" />
                  )}
                  <Text style={[styles.webButtonText, { color: '#fff' }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
        
        {/* Show chevron only on mobile (where swipe is available) and not on tablets */}
        {Platform.OS !== 'web' && !responsive.isTablet && (
          <ChevronRight size={24} color={colors.textSecondary} style={styles.chevronIcon} />
        )}
      </Pressable>
    );

    // Conditionally wrap with Swipeable only on mobile platforms
    if (Platform.OS === 'web') {
      return seedItemContent;
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
          // Close other swipeables when one opens
          Object.entries(swipeableRefs.current).forEach(([key, ref]) => {
            if (key !== seed.id && ref) {
              ref.close();
            }
          });
        }}
      >
        {seedItemContent}
      </Swipeable>
    );
  }, [highlightedSeedId, colors, deletingSeedId, responsive.gridColumns, responsive.cardWidth, responsive.isTablet]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Floating Add Button */}
      <Pressable onPress={handleAddSeed} style={[styles.floatingAddButton, { backgroundColor: colors.primary }]}>
        <PlusCircle size={28} color={colors.primaryText} />
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
