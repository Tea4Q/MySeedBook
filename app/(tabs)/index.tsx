import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Plus, Filter, Calendar } from 'lucide-react-native';
import { Link, useRouter, router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Seed } from '@/types/database';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';



interface AddSeedResult {
  success: boolean;
  error?: string;
  seedId?: string;
}

export async function addSeedToInventory(
  seedData: Partial<Seed>
): Promise<AddSeedResult> {
  try {
    // Validate required fields
    if (!seedData.name || !seedData.type || !seedData.quantity) {
      return {
        success: false,
        error: 'Missing required fields: name, type, or quantity',
      };
    }

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    // Add the seed to the database
    const { data: newSeed, error: seedError } = await supabase
      .from('seeds')
      .insert([
        {
          ...seedData,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (seedError) throw seedError;

    // Add to inventory history
    const { error: historyError } = await supabase
      .from('seed_inventory_history')
      .insert([
        {
          seed_id: newSeed.id,
          action: 'add',
          quantity_change: seedData.quantity,
          previous_quantity: 0,
          new_quantity: seedData.quantity,
          date: new Date().toISOString(),
          notes: 'Initial inventory addition',
          user_id: user.id,
        },
      ]);

    if (historyError) throw historyError;

    return {
      success: true,
      seedId: newSeed.id,
    };
  } catch (error) {
    console.error('Error adding seed to inventory:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to add seed to inventory',
    };
  }
}

export default function InventoryScreen() {
  const { highlight } = useLocalSearchParams();
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeeds();
  }, []);

  const loadSeeds = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data: seedData, error: seedError } = await supabase
        .from('seeds')
        .select('*, suppliers(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (seedError) throw seedError;
      setSeeds(seedData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seeds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = (seed: Seed) => {
    router.push({
      pathname: '/calendar',
      params: { seedId: seed.id, seedName: seed.name },
    });
  };


  const handleEditSeed = (seed: Seed) => {
    setEditingSeed(seed);
    setIsEditFormVisible(true);
  };

  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const handleCloseEditForm = () => {
    setIsEditFormVisible(false);
    setEditingSeed(null);
  };

  // Animated style for highlight
  const highlightStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(highlight ? 1.05 : 1, { duration: 300 }),
        },
      ],
      opacity: withTiming(highlight ? 0.9 : 1, { duration: 300 }),
    };
  });

  const renderSeedItem = ({ item: seed }: { item: Seed }) =>
  {
    const isHighlighted = highlight === seed.id;

    return (
      <Pressable style={styles.seedItem}>
        <Animated.View style={[highlightStyle]}>
          <Image
            source={{
              uri: seed.seed_image,
            }}
            style={styles.seedImage}
          />
          <View style={styles.seedContent}>
            <View style={styles.seedHeader}>
              <Text style={styles.seedName}>{seed.name}</Text>
              <View style={styles.seedTypeContainer}>
                <Text style={styles.seedType}>{seed.type}</Text>
              </View>
            </View>
            <Text style={styles.seedDescription}>{seed.description}</Text>
            <View style={styles.seedDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>
                  {seed.quantity} {seed.quantity_unit}
                </Text>
              </View>
              {seed.supplier_id && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Supplier:</Text>
                  <Text style={styles.detailValue}>{seed.suppliers.name}</Text>
                </View>
              )}
              <View style={styles.seasonContainer}>
                <View style={[styles.seasonTag, styles.plantTag]}>
                  <Text style={styles.seasonText}>
                    Plant: {seed.planting_season}
                  </Text>
                </View>
                <View style={[styles.seasonTag, styles.harvestTag]}>
                  <Text style={styles.seasonText}>
                    Harvest: {seed.harvest_season}
                  </Text>
                </View>
              </View>
              {/* Add Edit Button */}
              <Pressable
                style={styles.seedItem}>
                <View style={styles.seedContent}>
                  <Text style={styles.seedName}>{seed.name}</Text>
                    <Pressable
                     style={styles.editButton}
                      onPress={() => handleEditSeed(seed)}>
                        <Text style={styles.editButtonText}>Edit</Text>
                    </Pressable>
                </View>
              </Pressable>
              <Pressable style={styles.addEventButton}
                onPress={() => handleAddEvent(seed)}>
                <Calendar size={20} color="#ffffff" />
                <Text style={styles.addEventText}>Schedule Event</Text>
              </Pressable>
            </View >
        </Animated.View >
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seed Inventory</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.iconButton}>
            <Filter size={24} color="#ffffff" />
          </Pressable>
          <Link href="/add-seed" asChild>
            <Pressable style={styles.iconButton}>
              <Plus size={24} color="#ffffff" />
            </Pressable>
          </Link>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlashList
        data={seeds}
        renderItem={renderSeedItem}
        estimatedItemSize={250}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={loadSeeds}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#336633',
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
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  list: {
    padding: 16,
  },
  seedItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seedImage: {
    width: '100%',
    height: 200,
  },
  seedContent: {
    padding: 16,
  },
  seedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seedName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a472a',
    flex: 1,
  },
  seedTypeContainer: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seedType: {
    fontSize: 14,
    color: '#2d7a3a',
    fontWeight: '600',
  },
  seedDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 22,
  },
  seedDetails: {
    backgroundColor: '#f8faf8',
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
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a472a',
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
    backgroundColor: '#c8e6c9',
  },
  harvestTag: {
    backgroundColor: '#ffecb3',
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a472a',
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d7a3a',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  addEventText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
