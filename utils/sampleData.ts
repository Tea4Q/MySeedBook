// Sample data for guest users to immediately see app functionality
import { Seed } from '@/types/database';

export interface SampleSeed {
  id: string;
  seed_name: string;
  type: string;
  supplier_id: string;
  supplier_name: string;
  date_purchased: string;
  notes: string;
  seed_images?: string;
  isDemo: true;
  isSample: true;
}

export interface SampleSupplier {
  id: string;
  supplier_name: string;
  webaddress?: string;
  notes: string;
  isDemo: true;
  isSample: true;
}

export const SAMPLE_SUPPLIERS: SampleSupplier[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    supplier_name: 'Burpee Seeds',
    webaddress: 'https://www.burpee.com',
    notes: 'America\'s most trusted seed company since 1876. Wide variety of vegetables, flowers, and herbs.',
    isDemo: true,
    isSample: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002', 
    supplier_name: 'Johnny\'s Selected Seeds',
    webaddress: 'https://www.johnnyseeds.com',
    notes: 'Premium seeds for commercial growers and serious gardeners. Excellent germination rates.',
    isDemo: true,
    isSample: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    supplier_name: 'Local Garden Center',
    webaddress: undefined,
    notes: 'Your neighborhood garden center. Great for last-minute supplies and local varieties.',
    isDemo: true,
    isSample: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    supplier_name: 'Seed Savers Exchange',
    webaddress: 'https://www.seedsavers.org',
    notes: 'Heirloom and open-pollinated seeds. Preserving garden heritage for future generations.',
    isDemo: true,
    isSample: true,
  },
];

export const SAMPLE_SEEDS: SampleSeed[] = [
  {
    id: 'sample-seed-1',
    seed_name: 'Cherokee Purple Tomato',
    type: 'Heirloom Tomato',
    supplier_id: '550e8400-e29b-41d4-a716-446655440001',
    supplier_name: 'Burpee Seeds',
    date_purchased: '2025-03-01',
    notes: 'Heirloom variety with rich, smoky flavor. Perfect for slicing. Plant after last frost.',
    seed_images: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=300&fit=crop',
    isDemo: true,
    isSample: true,
  },
  {
    id: 'sample-seed-2',
    seed_name: 'Buttercrunch Lettuce',
    type: 'Lettuce',
    supplier_id: '550e8400-e29b-41d4-a716-446655440002',
    supplier_name: 'Johnny\'s Selected Seeds',
    date_purchased: '2025-03-15',
    notes: 'Crisp, sweet lettuce perfect for salads. Cool weather crop - plant early spring.',
    seed_images: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    isDemo: true,
    isSample: true,
  },
  {
    id: 'sample-seed-3',
    seed_name: 'Genovese Basil',
    type: 'Herb',
    supplier_id: '550e8400-e29b-41d4-a716-446655440003',
    supplier_name: 'Local Garden Center',
    date_purchased: '2025-04-01',
    notes: 'Classic Italian basil for pesto and cooking. Pinch flowers to keep leaves tender.',
    seed_images: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=400&h=300&fit=crop',
    isDemo: true,
    isSample: true,
  },
  {
    id: 'sample-seed-4',
    seed_name: 'Scarlet Nantes Carrots',
    type: 'Root Vegetable',
    supplier_id: '550e8400-e29b-41d4-a716-446655440004',
    supplier_name: 'Seed Savers Exchange',
    date_purchased: '2025-03-20',
    notes: 'Sweet, crisp carrots perfect for fresh eating. Succession plant every 2 weeks.',
    seed_images: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop',
    isDemo: true,
    isSample: true,
  },
  {
    id: 'sample-seed-5',
    seed_name: 'Mammoth Russian Sunflower',
    type: 'Flower',
    supplier_id: '550e8400-e29b-41d4-a716-446655440001',
    supplier_name: 'Burpee Seeds',
    date_purchased: '2025-04-15',
    notes: 'Giant sunflowers up to 12 feet tall! Great for birds and kids love them.',
    seed_images: 'https://images.unsplash.com/photo-1597848212624-e6fd31f576cb?w=400&h=300&fit=crop',
    isDemo: true,
    isSample: true,
  },
];

export class SampleDataManager {
  private static instance: SampleDataManager;
  
  static getInstance(): SampleDataManager {
    if (!SampleDataManager.instance) {
      SampleDataManager.instance = new SampleDataManager();
    }
    return SampleDataManager.instance;
  }

  getSampleSeeds(): SampleSeed[] {
    return [...SAMPLE_SEEDS];
  }

  getSampleSuppliers(): SampleSupplier[] {
    return [...SAMPLE_SUPPLIERS];
  }

  // Convert sample seed to regular seed format for display
  convertSampleSeedToSeed(sampleSeed: SampleSeed): Seed {
    return {
      id: sampleSeed.id,
      seed_name: sampleSeed.seed_name,
      type: sampleSeed.type,
      quantity: 1,
      supplier_id: sampleSeed.supplier_id,
      date_purchased: new Date(sampleSeed.date_purchased),
      notes: sampleSeed.notes,
      seed_images: sampleSeed.seed_images || '',
      user_id: 'sample-user',
    };
  }
}

export const sampleDataManager = SampleDataManager.getInstance();
