import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Plus, Filter, Calendar } from 'lucide-react-native';
import { Link, router } from 'expo-router';

type Seed = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  supplier: string;
  plantingSeason: string;
  harvestSeason: string;
  imageUrl: string;
  description: string;
};

const mockSeeds: Seed[] = [
  {
    id: '1',
    name: 'Brandywine Tomato',
    type: 'Heirloom Tomato',
    quantity: 50,
    supplier: 'Baker Creek Seeds',
    plantingSeason: 'Early Spring',
    harvestSeason: 'Late Summer',
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop',
    description: 'Large, pink beefsteak tomatoes with rich, intense flavor.',
  },
  {
    id: '2',
    name: 'Sugar Snap Peas',
    type: 'Pea',
    quantity: 100,
    supplier: 'Johnny\'s Selected Seeds',
    plantingSeason: 'Early Spring',
    harvestSeason: 'Early Summer',
    imageUrl: 'https://images.unsplash.com/photo-1587049693270-c7560da11218?w=800&auto=format&fit=crop',
    description: 'Sweet, crisp peas perfect for fresh eating or cooking.',
  },
];

export default function InventoryScreen() {
  const [seeds] = useState<Seed[]>(mockSeeds);

  const handleAddEvent = (seed: Seed) => {
    router.push({
      pathname: '/calendar',
      params: { seedId: seed.id, seedName: seed.name }
    });
  };

  const renderSeedItem = ({ item }: { item: Seed }) => (
    <Pressable style={styles.seedItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.seedImage} />
      <View style={styles.seedContent}>
        <View style={styles.seedHeader}>
          <Text style={styles.seedName}>{item.name}</Text>
          <View style={styles.seedTypeContainer}>
            <Text style={styles.seedType}>{item.type}</Text>
          </View>
        </View>
        <Text style={styles.seedDescription}>{item.description}</Text>
        <View style={styles.seedDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Supplier</Text>
            <Text style={styles.detailValue}>{item.supplier}</Text>
          </View>
          <View style={styles.seasonContainer}>
            <View style={[styles.seasonTag, styles.plantTag]}>
              <Text style={styles.seasonText}>Plant: {item.plantingSeason}</Text>
            </View>
            <View style={[styles.seasonTag, styles.harvestTag]}>
              <Text style={styles.seasonText}>Harvest: {item.harvestSeason}</Text>
            </View>
          </View>
          <Pressable 
            style={styles.addEventButton}
            onPress={() => handleAddEvent(item)}
          >
            <Calendar size={20} color="#ffffff" />
            <Text style={styles.addEventText}>Schedule Event</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

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
      <FlashList
        data={seeds}
        renderItem={renderSeedItem}
        estimatedItemSize={250}
        contentContainerStyle={styles.list}
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
