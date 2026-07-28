import * as React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, XCircle, PlusCircle, Archive } from 'lucide-react-native';

import { supabase } from '@/lib/supabase';
import { Seed, Supplier } from '@/types/database';
import { useTheme } from '@/lib/theme';
import { SeedCard } from '@/components/SeedCard';
import GuestStatusBanner from '@/components/GuestStatusBanner';
import PremiumModal from '@/components/PremiumModal';
import { guestDataManager } from '@/utils/guestDataManager';
import { useAuth } from '@/lib/auth';
import { useResponsive } from '@/utils/responsive';
import { useGlobalSubscription } from '@/lib/globalSubscriptionManager';
import { useGuestLimits } from '@/hooks/useGuestLimits';
import { FREE_LIMITS } from '@/utils/premiumManager';
import {
  getCurrentSeason,
  getSeasonalPlantingRecommendations,
  recommendNextSeeds,
} from '@/lib/services/plantingIntelligence';

export default function InventoryScreen() {
  const { session, isGuest, refreshGuestUsage } = useAuth();
  const { isPremium, isLoading: isSubscriptionLoading } = useGlobalSubscription();
  const { checkAndPromptForLimit } = useGuestLimits();
  const { colors } = useTheme();
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedSeedId, setHighlightedSeedId] = useState<string | null>(null);
  const [deletingSeedId, setDeletingSeedId] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const isMultiColumn = Platform.OS === 'web' || responsive.gridColumns > 1;

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const canShowSeedCount = isPremium && !isSubscriptionLoading;

    navigation.setOptions({
      title: canShowSeedCount
        ? `My Seed Inventory (${seeds.length})`
        : 'My Seed Inventory',
    });
  }, [isPremium, isSubscriptionLoading, seeds.length, navigation]);

  const loadSeeds = useCallback(
    async (isRefresh = false) => {
      if (!session?.user) {
        if (!isRefresh && !searchTerm) setLoading(true);
        setError(null);

        try {
          const allSeeds = await guestDataManager.getAllSeeds();
          const filteredSeeds = searchTerm
            ? allSeeds.filter((seed: Seed) =>
                seed.seed_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                seed.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (seed.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
              )
            : allSeeds;

          if (isMounted.current) {
            setSeeds(filteredSeeds);
          }
        } catch (e: any) {
          console.error('Error loading sample seeds:', e);
          if (isMounted.current) {
            setError('Failed to load sample seeds');
            setSeeds([]);
          }
        } finally {
          if (isMounted.current) {
            if (!isRefresh) setLoading(false);
            if (isRefresh) setRefreshing(false);
          }
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
          .is('deleted_at', null)
          .order('seed_name', { ascending: true });

        if (searchTerm) {
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

        if (isMounted.current) {
          setSeeds(enrichedSeeds as Seed[]);
        }
      } catch (e: any) {
        console.error('Error loading seeds:', e);
        if (isMounted.current) {
          setError(e.message || 'An unexpected error occurred while fetching seeds.');
          setSeeds([]);
        }
      } finally {
        if (isMounted.current) {
          if (!isRefresh) setLoading(false);
          if (isRefresh) setRefreshing(false);
        }
      }
    },
    [session, searchTerm]
  );

  useFocusEffect(
    useCallback(() => {
      loadSeeds();
    }, [loadSeeds])
  );

  useEffect(() => {
    if (highlightedSeedId && seeds.length > 0) {
      const clearHighlight = setTimeout(() => setHighlightedSeedId(null), 3000);
      return () => clearTimeout(clearHighlight);
    }
  }, [highlightedSeedId, seeds.length]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadSeeds();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, loadSeeds]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchTerm('');
    loadSeeds(true);
  }, [loadSeeds]);

  const handleAddSeed = useCallback(async () => {
    if (isGuest) {
      const canProceed = await checkAndPromptForLimit('seed');
      if (!canProceed) return;
    }

    if (!isGuest && session?.user && !isPremium) {
      const { count } = await supabase
        .from('seeds')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .is('deleted_at', null);
      if ((count ?? 0) >= FREE_LIMITS.seeds) {
        setShowPremiumModal(true);
        return;
      }
    }

    router.push('/add-seed');
  }, [checkAndPromptForLimit, isGuest, isPremium, router, session?.user]);

  const handleEdit = useCallback(
    (seed: Seed) => {
      if (isGuest && seed.id.startsWith('sample-')) {
        Alert.alert('Demo Seed', 'Sample seeds cannot be edited. Add your own seeds to edit them.');
        return;
      }

      setHighlightedSeedId(seed.id);
      router.push({
        pathname: '/add-seed',
        params: { id: seed.id, returnTo: '/(tabs)/' },
      });
    },
    [isGuest, router]
  );

  const handleDelete = useCallback(
    async (seedId: string) => {
      setDeletingSeedId(seedId);
      try {
        if (isGuest) {
          if (!seedId.startsWith('sample-')) {
            await guestDataManager.deleteDemoSeed(seedId);
            if (isMounted.current) {
              setSeeds((prev) => prev.filter((seed) => seed.id !== seedId));
              await refreshGuestUsage();
            }
          }
          return;
        }

        const deletedAt = new Date().toISOString();
        const { error: updateError } = await (supabase.from('seeds') as any)
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
          Alert.alert('Error', e.message || 'Failed to delete seed. Please try again.');
        }
      } finally {
        if (isMounted.current) setDeletingSeedId(null);
      }
    },
    [isGuest, refreshGuestUsage]
  );

  const confirmDelete = useCallback(
    (seedId: string) => {
      if (isGuest && seedId.startsWith('sample-')) {
        Alert.alert('Demo Seed', 'Sample seeds cannot be deleted. Only seeds you added can be removed.');
        return;
      }

      if (Platform.OS === 'web') {
        if (
          typeof window !== 'undefined' &&
          window.confirm('Are you sure you want to delete this seed? This action cannot be undone.')
        ) {
          handleDelete(seedId);
        }
        return;
      }

      Alert.alert(
        'Delete Seed',
        'Are you sure you want to delete this seed? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(seedId) },
        ]
      );
    },
    [handleDelete, isGuest]
  );

  const openSeedDetail = useCallback(
    (seed: Seed) => {
      router.push({
        pathname: '/seed/[id]',
        params: { id: seed.id },
      });
    },
    [router]
  );

  const openCalendarReminder = useCallback(
    ({
      seedName,
      seedId,
      category,
      notes,
      dateISO,
    }: {
      seedName: string;
      seedId?: string;
      category: 'sow' | 'transplant';
      notes: string;
      dateISO: string;
    }) => {
      router.push({
        pathname: '/calendar',
        params: {
          openAddEvent: 'true',
          seedName,
          seedId,
          category,
          notes,
          suggestedDate: dateISO,
        },
      });
    },
    [router]
  );

  const seasonalRecommendations = useMemo(() => getSeasonalPlantingRecommendations(), []);
  const nextSeedRecommendations = useMemo(() => recommendNextSeeds(seeds), [seeds]);
  const currentSeasonLabel = useMemo(() => {
    const season = getCurrentSeason();
    return season.charAt(0).toUpperCase() + season.slice(1);
  }, []);

  const seedCards = (
    <View style={[styles.seedGrid,
      isMultiColumn ? styles.seedGridWeb : styles.seedGridMobile,]}>
      {seeds.map((seed) => (
        <View
          key={seed.id}
          style={[
            styles.seedCardWrap,
            isMultiColumn ? styles.seedCardWrapWeb : styles.seedCardWrapMobile,
          ]}
        >
          <SeedCard
            seed={seed}
            onPress={() => openSeedDetail(seed)}
            onEdit={() => handleEdit(seed)}
            onDelete={() => confirmDelete(seed.id)}
            isHighlighted={seed.id === highlightedSeedId}
            isDeleting={deletingSeedId === seed.id}
            cardWidth={Platform.OS === 'web' ? undefined : responsive.cardWidth}
            isTablet={responsive.isTablet}
          />
        </View>
      ))}
    </View>
  );

  if (loading && seeds.length === 0 && !searchTerm) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your garden...</Text>
      </View>
    );
  }

  const content = (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GuestStatusBanner />

      <Pressable
        onPress={handleAddSeed}
        style={[
          styles.floatingAddButton,
          { backgroundColor: colors.primary, bottom: 24 + insets.bottom },
        ]}
      >
        <PlusCircle size={24} color={colors.warning} />
      </Pressable>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
        ]}
      >
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

      {error && !loading ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
          <Pressable
            onPress={() => loadSeeds()}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.retryButtonText, { color: colors.primaryText }]}>Try Again</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && seeds.length === 0 && !error ? (
        <View style={styles.centered}>
          <Archive size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchTerm
              ? 'No seeds match your search.'
              : 'Your garden is empty! Add some seeds to get started.'}
          </Text>
          {!searchTerm ? (
            <Pressable
              onPress={handleAddSeed}
              style={[styles.addFirstSeedButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.addFirstSeedButtonText, { color: colors.primaryText }]}>Add First Seed</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {seeds.length > 0 ? seedCards : null}

      <View style={styles.recommendationStack}>
        <View
          style={[
            styles.recommendationSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Seasonal planting recommendations</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{currentSeasonLabel}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationRow}>
            {seasonalRecommendations.map((recommendation) => (
              <View
                key={recommendation.id}
                style={[
                  styles.recommendationCard,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.recommendationTitle, { color: colors.text }]}>{recommendation.title}</Text>
                <Text style={[styles.recommendationTiming, { color: colors.primary }]}>{recommendation.timing}</Text>
                <Text style={[styles.recommendationReason, { color: colors.textSecondary }]}>{recommendation.reason}</Text>
                <Pressable
                  style={[styles.recommendationButton, { backgroundColor: colors.primary }]}
                  onPress={() =>
                    openCalendarReminder({
                      seedName: recommendation.reminderSeedName,
                      category: recommendation.reminderCategory,
                      notes: recommendation.reminderNotes,
                      dateISO: recommendation.reminderDateISO,
                    })
                  }
                >
                  <Text style={[styles.recommendationButtonText, { color: colors.primaryText }]}>Create reminder</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        <View
          style={[
            styles.recommendationSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What to plant next from your cabinet</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Older packets and seasonal matches rise to the top</Text>
          </View>

          {nextSeedRecommendations.length > 0 ? (
            nextSeedRecommendations.map((recommendation) => (
              <View
                key={recommendation.seed.id}
                style={[
                  styles.inventoryRecommendationCard,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View style={styles.inventoryRecommendationHeader}>
                  <Text style={[styles.inventoryRecommendationTitle, { color: colors.text }]}>{recommendation.seed.seed_name}</Text>
                  <Text style={[styles.inventoryRecommendationTag, { color: colors.primary }]}>{recommendation.suggestedAction}</Text>
                </View>
                <Text style={[styles.recommendationReason, { color: colors.textSecondary }]}>{recommendation.reason}</Text>
                <View style={styles.inventoryRecommendationActions}>
                  <Pressable
                    style={[styles.secondaryRecommendationButton, { borderColor: colors.border }]}
                    onPress={() => openSeedDetail(recommendation.seed)}
                  >
                    <Text style={[styles.secondaryRecommendationButtonText, { color: colors.text }]}>View details</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.recommendationButton, { backgroundColor: colors.primary }]}
                    onPress={() =>
                      openCalendarReminder({
                        seedName: recommendation.seed.seed_name,
                        seedId: recommendation.seed.id,
                        category: recommendation.reminderCategory,
                        notes: recommendation.reminderNotes,
                        dateISO: recommendation.reminderDateISO,
                      })
                    }
                  >
                    <Text style={[styles.recommendationButtonText, { color: colors.primaryText }]}>Add reminder</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyRecommendationText, { color: colors.textSecondary }]}>Add a few seeds to unlock next-plant recommendations.</Text>
          )}
        </View>
      </View>

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </View>
  );

  return Platform.OS === 'web' ? (
    <ScrollView
      style={styles.webScroll}
      contentContainerStyle={styles.webScrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webScroll: {
    flex: 1,
  },
  webScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  floatingAddButton: {
    position: 'absolute',
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
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  clearSearchIcon: {
    marginLeft: 10,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  seedGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  seedGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  seedGridMobile: {
    flexDirection: 'column',
  },
  seedCardWrap: {
    marginBottom: 4,
  },
  seedCardWrapWeb: {
    width: '48%',
  },
  seedCardWrapMobile: {
    width: '100%',
  },
  recommendationStack: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  recommendationSection: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  recommendationRow: {
    gap: 12,
    paddingRight: 4,
  },
  recommendationCard: {
    width: 260,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  recommendationTiming: {
    fontSize: 13,
    fontWeight: '600',
  },
  recommendationReason: {
    fontSize: 13,
    lineHeight: 18,
  },
  recommendationButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  recommendationButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inventoryRecommendationCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  inventoryRecommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  inventoryRecommendationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  inventoryRecommendationTag: {
    fontSize: 12,
    fontWeight: '700',
  },
  inventoryRecommendationActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  secondaryRecommendationButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryRecommendationButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyRecommendationText: {
    fontSize: 13,
    lineHeight: 19,
  },
});