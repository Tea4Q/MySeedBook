import { sampleDataManager } from '@/utils/sampleData';
import { guestTracker } from '@/utils/guestTracker';
import { Seed, Supplier } from '@/types/database';

export class GuestDataManager {
  private static instance: GuestDataManager;
  
  static getInstance(): GuestDataManager {
    if (!GuestDataManager.instance) {
      GuestDataManager.instance = new GuestDataManager();
    }
    return GuestDataManager.instance;
  }

  // Combine sample data with user's demo data
  async getAllSeeds(): Promise<Seed[]> {
    const sampleSeeds = sampleDataManager.getSampleSeeds();
    const sampleSuppliers = sampleDataManager.getSampleSuppliers();
    const demoSeeds = await guestTracker.loadDemoSeeds();
    
    // Convert sample seeds to Seed format with supplier information
    const convertedSampleSeeds = sampleSeeds.map(sample => {
      const supplier = sampleSuppliers.find(s => s.id === sample.supplier_id);
      const convertedSeed = sampleDataManager.convertSampleSeedToSeed(sample);
      
      // Add supplier information as expected by the UI
      return {
        ...convertedSeed,
        description: sample.notes, // Use notes as description
        suppliers: supplier ? {
          id: supplier.id,
          supplier_name: supplier.supplier_name,
          webaddress: supplier.webaddress || null,
          notes: supplier.notes,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          user_id: 'sample-user',
          supplier_image: '',
        } : null,
      };
    });
    
    return [...convertedSampleSeeds, ...demoSeeds];
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    const sampleSuppliers = sampleDataManager.getSampleSuppliers();
    const demoSuppliers = await guestTracker.loadDemoSuppliers();
    
    // Convert sample suppliers to Supplier format
    const convertedSampleSuppliers = sampleSuppliers.map(sample => ({
      id: sample.id,
      supplier_name: sample.supplier_name,
      webaddress: sample.webaddress || null,
      notes: sample.notes,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: 'sample-user',
      supplier_image: '',
    }));
    
    return [...convertedSampleSuppliers, ...demoSuppliers];
  }

  async addDemoSeed(seed: Partial<Seed>): Promise<Seed> {
    const newSeed: Seed = {
      id: `demo-seed-${Date.now()}`,
      seed_name: seed.seed_name || 'New Seed',
      type: seed.type || 'Unknown',
      quantity: seed.quantity || 1,
      supplier_id: seed.supplier_id,
      date_purchased: seed.date_purchased || new Date(),
      notes: seed.notes || '',
      seed_images: seed.seed_images || '',
      user_id: 'demo-user',
      ...seed,
    };

    // Save to demo storage
    const existingSeeds = await guestTracker.loadDemoSeeds();
    const updatedSeeds = [...existingSeeds, newSeed];
    await guestTracker.saveDemoSeeds(updatedSeeds);
    
    // Track the addition
    await guestTracker.addDemoSeed(newSeed.id);
    
    return newSeed;
  }

  async addDemoSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
    const newSupplier: Supplier = {
      id: `demo-supplier-${Date.now()}`,
      supplier_name: supplier.supplier_name || 'New Supplier',
      webaddress: supplier.webaddress,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes || '',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      user_id: 'demo-user',
      supplier_image: supplier.supplier_image || '',
      ...supplier,
    };

    // Save to demo storage
    const existingSuppliers = await guestTracker.loadDemoSuppliers();
    const updatedSuppliers = [...existingSuppliers, newSupplier];
    await guestTracker.saveDemoSuppliers(updatedSuppliers);
    
    // Track the addition
    await guestTracker.addDemoSupplier(newSupplier.id);
    
    return newSupplier;
  }

  async updateDemoSeed(seedId: string, updates: Partial<Seed>): Promise<Seed | null> {
    const existingSeeds = await guestTracker.loadDemoSeeds();
    const seedIndex = existingSeeds.findIndex(s => s.id === seedId);
    
    if (seedIndex === -1) return null;
    
    const updatedSeed = { ...existingSeeds[seedIndex], ...updates };
    existingSeeds[seedIndex] = updatedSeed;
    
    await guestTracker.saveDemoSeeds(existingSeeds);
    return updatedSeed;
  }

  async updateDemoSupplier(supplierId: string, updates: Partial<Supplier>): Promise<Supplier | null> {
    const existingSuppliers = await guestTracker.loadDemoSuppliers();
    const supplierIndex = existingSuppliers.findIndex(s => s.id === supplierId);
    
    if (supplierIndex === -1) return null;
    
    const updatedSupplier = { ...existingSuppliers[supplierIndex], ...updates };
    existingSuppliers[supplierIndex] = updatedSupplier;
    
    await guestTracker.saveDemoSuppliers(existingSuppliers);
    return updatedSupplier;
  }

  async deleteDemoSeed(seedId: string): Promise<boolean> {
    const existingSeeds = await guestTracker.loadDemoSeeds();
    const filteredSeeds = existingSeeds.filter(s => s.id !== seedId);
    
    if (filteredSeeds.length === existingSeeds.length) return false;
    
    await guestTracker.saveDemoSeeds(filteredSeeds);
    return true;
  }

  async deleteDemoSupplier(supplierId: string): Promise<boolean> {
    const existingSuppliers = await guestTracker.loadDemoSuppliers();
    const filteredSuppliers = existingSuppliers.filter(s => s.id !== supplierId);
    
    if (filteredSuppliers.length === existingSuppliers.length) return false;
    
    await guestTracker.saveDemoSuppliers(filteredSuppliers);
    return true;
  }

  // Check if an item is demo data (vs sample data)
  isDemoSeed(seedId: string): boolean {
    return seedId.startsWith('demo-seed-');
  }

  isDemoSupplier(supplierId: string): boolean {
    return supplierId.startsWith('demo-supplier-');
  }

  isSampleSeed(seedId: string): boolean {
    return seedId.startsWith('sample-seed-');
  }

  isSampleSupplier(supplierId: string): boolean {
    return supplierId.startsWith('sample-supplier-');
  }

  // Clear all demo data (but keep sample data)
  async clearDemoData(): Promise<void> {
    await guestTracker.clearDemoData();
  }

  // Get statistics for display
  async getStats(): Promise<{
    sampleSeeds: number;
    demoSeeds: number;
    sampleSuppliers: number;
    demoSuppliers: number;
  }> {
    const sampleSeeds = sampleDataManager.getSampleSeeds().length;
    const demoSeeds = (await guestTracker.loadDemoSeeds()).length;
    const sampleSuppliers = sampleDataManager.getSampleSuppliers().length;
    const demoSuppliers = (await guestTracker.loadDemoSuppliers()).length;

    return {
      sampleSeeds,
      demoSeeds,
      sampleSuppliers,
      demoSuppliers,
    };
  }
}

export const guestDataManager = GuestDataManager.getInstance();
