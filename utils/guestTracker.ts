import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web-compatible storage fallback
const WebStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

// Use AsyncStorage for native platforms, localStorage for web
const Storage = Platform.OS === 'web' ? WebStorage : AsyncStorage;

export interface GuestUsage {
  seedsAdded: number;
  suppliersAdded: number;
  hasCreatedAccount: boolean;
  demoSeedsCreated: string[]; // Store demo seed IDs
  demoSuppliersCreated: string[]; // Store demo supplier IDs
}

const GUEST_USAGE_KEY = '@guest_usage';
const DEMO_SEED_KEY = '@demo_seeds';
const DEMO_SUPPLIER_KEY = '@demo_suppliers';

export class GuestTracker {
  private static instance: GuestTracker;
  private usage: GuestUsage = {
    seedsAdded: 0,
    suppliersAdded: 0,
    hasCreatedAccount: false,
    demoSeedsCreated: [],
    demoSuppliersCreated: [],
  };

  private constructor() {}

  static getInstance(): GuestTracker {
    if (!GuestTracker.instance) {
      GuestTracker.instance = new GuestTracker();
    }
    return GuestTracker.instance;
  }

  async initialize(): Promise<void> {
    try {
      const stored = await Storage.getItem(GUEST_USAGE_KEY);
      if (stored) {
        this.usage = JSON.parse(stored);
        // Ensure new fields exist for backward compatibility
        if (!this.usage.demoSeedsCreated) this.usage.demoSeedsCreated = [];
        if (!this.usage.demoSuppliersCreated) this.usage.demoSuppliersCreated = [];
        if (!this.usage.suppliersAdded) this.usage.suppliersAdded = 0;
      }
    } catch (error) {
      console.warn('Failed to load guest usage data:', error);
    }
  }

  private async save(): Promise<void> {
    try {
      await Storage.setItem(GUEST_USAGE_KEY, JSON.stringify(this.usage));
    } catch (error) {
      console.warn('Failed to save guest usage data:', error);
    }
  }

  async getUsage(): Promise<GuestUsage> {
    await this.initialize();
    return { ...this.usage };
  }

  static readonly GUEST_SEED_LIMIT = 3;
  static readonly GUEST_SUPPLIER_LIMIT = 1;

  async canAddSeed(): Promise<boolean> {
    await this.initialize();
    return this.usage.demoSeedsCreated.length < GuestTracker.GUEST_SEED_LIMIT;
  }

  async getRemainingSeeds(): Promise<number> {
    await this.initialize();
    return Math.max(0, GuestTracker.GUEST_SEED_LIMIT - this.usage.demoSeedsCreated.length);
  }

  async canAddSupplier(): Promise<boolean> {
    await this.initialize();
    return this.usage.demoSuppliersCreated.length < GuestTracker.GUEST_SUPPLIER_LIMIT;
  }

  async getRemainingSuppliers(): Promise<number> {
    await this.initialize();
    return Math.max(0, GuestTracker.GUEST_SUPPLIER_LIMIT - this.usage.demoSuppliersCreated.length);
  }

  async trackSeedAdded(): Promise<void> {
    await this.initialize();
    this.usage.seedsAdded++;
    await this.save();
  }

  async addDemoSeed(seedId: string): Promise<void> {
    await this.initialize();
    if (!this.usage.demoSeedsCreated.includes(seedId)) {
      this.usage.demoSeedsCreated.push(seedId);
      this.usage.seedsAdded++;
      await this.save();
    }
  }

  async removeDemoSeed(seedId: string): Promise<void> {
    await this.initialize();
    const idx = this.usage.demoSeedsCreated.indexOf(seedId);
    if (idx !== -1) {
      this.usage.demoSeedsCreated.splice(idx, 1);
      this.usage.seedsAdded = Math.max(0, this.usage.seedsAdded - 1);
      await this.save();
    }
  }

  async addDemoSupplier(supplierId: string): Promise<void> {
    await this.initialize();
    if (!this.usage.demoSuppliersCreated.includes(supplierId)) {
      this.usage.demoSuppliersCreated.push(supplierId);
      this.usage.suppliersAdded++;
      await this.save();
    }
  }

  async getDemoSeeds(): Promise<string[]> {
    await this.initialize();
    return [...this.usage.demoSeedsCreated];
  }

  async getDemoSuppliers(): Promise<string[]> {
    await this.initialize();
    return [...this.usage.demoSuppliersCreated];
  }

  async markAccountCreated(): Promise<void> {
    await this.initialize();
    this.usage.hasCreatedAccount = true;
    await this.save();
  }

  async resetUsage(): Promise<void> {
    this.usage = {
      seedsAdded: 0,
      suppliersAdded: 0,
      hasCreatedAccount: false,
      demoSeedsCreated: [],
      demoSuppliersCreated: [],
    };
    await this.save();
  }

  async hasReachedLimit(): Promise<boolean> {
    // No more limits for demo experience
    return false;
  }

  getSeedLimit(): number {
    // Return unlimited indicator
    return 999;
  }

  // Store demo data locally
  async saveDemoSeeds(seeds: any[]): Promise<void> {
    try {
      await Storage.setItem(DEMO_SEED_KEY, JSON.stringify(seeds));
    } catch (error) {
      console.warn('Failed to save demo seeds:', error);
    }
  }

  async loadDemoSeeds(): Promise<any[]> {
    try {
      const stored = await Storage.getItem(DEMO_SEED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load demo seeds:', error);
      return [];
    }
  }

  async saveDemoSuppliers(suppliers: any[]): Promise<void> {
    try {
      await Storage.setItem(DEMO_SUPPLIER_KEY, JSON.stringify(suppliers));
    } catch (error) {
      console.warn('Failed to save demo suppliers:', error);
    }
  }

  async loadDemoSuppliers(): Promise<any[]> {
    try {
      const stored = await Storage.getItem(DEMO_SUPPLIER_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load demo suppliers:', error);
      return [];
    }
  }

  async clearDemoData(): Promise<void> {
    try {
      await Storage.removeItem(DEMO_SEED_KEY);
      await Storage.removeItem(DEMO_SUPPLIER_KEY);
      await this.resetUsage();
    } catch (error) {
      console.warn('Failed to clear demo data:', error);
    }
  }
}

export const guestTracker = GuestTracker.getInstance();
