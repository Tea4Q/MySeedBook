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
import { Tabs } from 'expo-router';

const mockSeeds: Seed[] = [
  {
    id: '1',
    name: 'Brandywine Tomato',
    type: 'Heirloom Tomato',
    quantity: 50,
    supplier_id: 'Baker Creek Seeds',
    planting_season: 'Early Spring',
    harvest_season: 'Late Summer',
    seedImage:
      'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop',
    description: 'Large, pink beefsteak tomatoes with rich, intense flavor.',
  },
  {
    id: '2',
    name: 'Sugar Snap Peas',
    type: 'Pea',
    quantity: 100,
    supplier_id: "Johnny's Selected Seeds",
    planting_season: 'Early Spring',
    harvest_season: 'Early Summer',
    seedImage:
      'https://images.unsplash.com/photo-1587049693270-c7560da11218?w=800&auto=format&fit=crop',
    description: 'Sweet, crisp peas perfect for fresh eating or cooking.',
  },
];

export default function InventoryScreen() {
  const [seeds, setSeeds] = useState<Seed[]>(mockSeeds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { highlight } = useLocalSearchParams();
  const isValidHighlight = seeds.some((seed) => seed.id === highlight);

  const loadNewSeeds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase;
      if (error) throw error;
      setSeeds(data || []);
    } catch (error) {
      console.error('Error fetching seeds:', error);
      setError('Failed to load seeds.');
    } finally {
      setIsLoading(false);
    }
  };

  {
    error && (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const plantingInstructions = (() => {
    try {
      return JSON.parse(seeds.planting_instructions) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    const subscription = supabase.channel('seeds').on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seeds',
      },
        (payload) =>
        {
        const newSeed = payload.new;
        setSeeds((prevSeeds) => [...prevSeeds, newSeed]);
      }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (highlight && isValidHighlight) {
      loadNewSeeds();
    }
  }, [highlight]);

  const handleAddEvent = (seed: Seed) => {
    if (!seed.id || !seed.name) {
      console.error('Invalid seed data: for scheduling event.');
      return;
    }
    router.push({
      pathname: '/calendar',
      params: { seedId: seed.id, seedName: seed.name },
    });
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

  const renderSeedItem = ({ item: seed }: { item: Seed }) => {
    const isHighlighted = highlight === seed.id;

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: withTiming(isHighlighted ? 1.05 : 1, { duration: 300 }),
          },
        ],
        opacity: withTiming(isHighlighted ? 0.9 : 1, { duration: 300 }),
      };
    });
    return (
      <Pressable style={styles.seedItem}>
        <Animated.View style={animatedStyle}>
          <Image
            source={{
              uri:
                typeof seed.seedImage === 'string'
                  ? seed.seedImage
                  : 'https://via.placeholder.com/150',
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
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>
                  {seed.quantity} {seed.quantity_unit}
                </Text>
              </View>
              {seed.supplier_id && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Supplier</Text>
                  <Text style={styles.detailValue}>{seed.supplier_id}</Text>
                </View>
              )}
              <View style={styles.seasonContainer}>
                {seed.planting_instructions && (
                  <>
                    <View style={[styles.seasonTag, styles.plantTag]}>
                      <Text style={styles.seasonText}>
                        Plant:
                        {plantingInstructions.planting_season ||
                          'Not specified'}
                      </Text>
                    </View>
                    <View style={[styles.seasonTag, styles.harvestTag]}>
                      <Text style={styles.seasonText}>
                        Harvest:
                        {plantingInstructions.harvest_season || 'Not specified'}
                      </Text>
                    </View>
                  </>
                )}
              </View>
              <Pressable
                style={styles.addEventButton}
                onPress={() => handleAddEvent(seed)}
              >
                <Calendar size={20} color="#ffffff" />
                <Text style={styles.addEventText}>Schedule Event</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
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

      {isLoading ? (
        <Text style={styles.loadingText}>Loading new seeds...</Text>
      ) : (
        <FlashList
          data={seeds}
          renderItem={renderSeedItem}
          estimatedItemSize={250}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={loadNewSeeds}
        />
      )}
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
  loadingText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
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
