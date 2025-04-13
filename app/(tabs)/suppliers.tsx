import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Plus, ExternalLink, MapPinHouse, Phone, House, Mail, Globe } from 'lucide-react-native';
import { Link } from 'expo-router';

type Supplier = {
  id: string;
  name: string;
  description: string;
  webaddress: string;
  email: string;
  phone: string;
  address: string;
  specialties: string[];
  rating: number;
  imageUrl: string;
  featuredSeeds: {
    name: string;
    imageUrl: string;
  }[];
};

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Baker Creek Heirloom Seeds',
    description: 'Specializing in rare and heirloom varieties, offering one of the largest selections of seeds from the 19th century.',
    webaddress: 'rareseeds.com',
    email: 'support@rareseeds.com',
    phone: '(417) 924-8917',
    address: 'Mansfield, MO 65704',
    specialties: ['Heirloom Vegetables', 'Rare Varieties', 'Organic Seeds', 'Historic Varieties'],
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop',
    featuredSeeds: [
      { name: 'Purple Dragon Carrot', imageUrl: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=800&auto=format&fit=crop' },
      { name: 'Glass Gem Corn', imageUrl: 'https://images.unsplash.com/photo-1601517742387-6ea4b8465222?w=800&auto=format&fit=crop' }
    ]
  },
  {
    id: '2',
    name: 'Johnny\'s Selected Seeds',
    description: 'Employee-owned company providing quality vegetable, herb, and flower seeds to growers and gardeners.',
    webaddress: 'johnnyseeds.com',
    email: 'support@johnnyseeds.com',
    phone: '(877) 564-6697',
    address: 'Winslow, ME 04901',
    specialties: ['Vegetables', 'Flowers', 'Herbs', 'Tools', 'Organic'],
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=800&auto=format&fit=crop',
    featuredSeeds: [
      { name: 'Sungold Tomato', imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop' },
      { name: 'Buttercrunch Lettuce', imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&auto=format&fit=crop' }
    ]
  },
];

export default function SuppliersScreen() {
  const [suppliers] = useState<Supplier[]>(mockSuppliers);

  const renderSupplierItem = ({ item }: { item: Supplier }) => (
    <Pressable style={styles.supplierCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.supplierImage} />
      <View style={styles.supplierContent}>
        <View style={styles.supplierHeader}>
          <View style={styles.nameSection}>
            <Text style={styles.supplierName}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{item.rating.toFixed(1)} ★</Text>
            </View>
          </View>
          <Pressable style={styles.webaddressButton}>
            <Globe size={16} color="#2d7a3a" />
            <Text style={styles.webaddressText}>{item.webaddress}</Text>
          </Pressable>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <House size={16} color="#666666" />
            <Text style={styles.contactText}>{item.address}</Text>
          </View>
          <View style={styles.contactItem}>
            <Phone size={16} color="#666666" />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Mail size={16} color="#666666" />
            <Text style={styles.contactText}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.specialtiesContainer}>
          {item.specialties.map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>

        <View style={styles.featuredSection}>
          <Text style={styles.featuredTitle}>Featured Seeds</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
            {item.featuredSeeds.map((seed, index) => (
              <View key={index} style={styles.featuredSeed}>
                <Image source={{ uri: seed.seed_image }} style={styles.seedImage} />
                <Text style={styles.seedName}>{seed.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seed Suppliers</Text>
        <Link href="/add-supplier" asChild>
          <Pressable style={styles.iconButton}>
            <Plus size={24} color="#ffffff" />
          </Pressable>
        </Link>
      </View>
      <FlashList
        data={suppliers}
        renderItem={renderSupplierItem}
        estimatedItemSize={400}
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
  iconButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  list: {
    padding: 16,
  },
  supplierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supplierImage: {
    width: '100%',
    height: 200,
  },
  supplierContent: {
    padding: 16,
  },
  supplierHeader: {
    marginBottom: 12,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  supplierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a472a',
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 16,
    color: '#856404',
    fontWeight: '600',
  },
  webaddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  webaddressText: {
    fontSize: 16,
    color: '#2d7a3a',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 16,
  },
  contactInfo: {
    backgroundColor: '#f8faf8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  specialtyTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  specialtyText: {
    fontSize: 14,
    color: '#2d7a3a',
    fontWeight: '500',
  },
  featuredSection: {
    marginTop: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a472a',
    marginBottom: 12,
  },
  featuredScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  featuredSeed: {
    marginRight: 12,
    width: 120,
  },
  seedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  seedName: {
    fontSize: 14,
    color: '#1a472a',
    textAlign: 'center',
  },
});