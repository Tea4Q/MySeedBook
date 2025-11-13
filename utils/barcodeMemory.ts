/**
 * Barcode Memory Service
 * 
 * Stores and retrieves user-learned barcode-to-seed mappings.
 * When a user scans a barcode and enters seed information,
 * the app remembers it for future scans.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BARCODE_MEMORY_KEY = 'barcode_seed_memory';

export interface BarcodeMemoryEntry {
  barcode: string;
  barcodeType: string;
  seedName: string;
  type?: string;
  variety?: string;
  description?: string;
  supplier?: string;
  learnedAt: string; // ISO date string
  scanCount: number; // How many times this barcode has been scanned
}

/**
 * Save a barcode-to-seed mapping
 */
export async function saveBarcodeMapping(
  barcode: string,
  barcodeType: string,
  seedData: {
    seedName: string;
    type?: string;
    variety?: string;
    description?: string;
    supplier?: string;
  }
): Promise<void> {
  try {
    const memory = await loadBarcodeMemory();
    
    const existing = memory[barcode];
    
    memory[barcode] = {
      barcode,
      barcodeType,
      ...seedData,
      learnedAt: existing?.learnedAt || new Date().toISOString(),
      scanCount: (existing?.scanCount || 0) + 1,
    };

    await AsyncStorage.setItem(BARCODE_MEMORY_KEY, JSON.stringify(memory));
    console.log(`💾 Saved barcode mapping: ${barcode} -> ${seedData.seedName}`);
  } catch (error) {
    console.error('Error saving barcode mapping:', error);
  }
}

/**
 * Look up a barcode in memory
 */
export async function lookupBarcodeInMemory(
  barcode: string
): Promise<BarcodeMemoryEntry | null> {
  try {
    const memory = await loadBarcodeMemory();
    return memory[barcode] || null;
  } catch (error) {
    console.error('Error looking up barcode:', error);
    return null;
  }
}

/**
 * Load all barcode memories
 */
async function loadBarcodeMemory(): Promise<Record<string, BarcodeMemoryEntry>> {
  try {
    const stored = await AsyncStorage.getItem(BARCODE_MEMORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading barcode memory:', error);
    return {};
  }
}

/**
 * Get all learned barcodes (for debugging/management)
 */
export async function getAllLearnedBarcodes(): Promise<BarcodeMemoryEntry[]> {
  try {
    const memory = await loadBarcodeMemory();
    return Object.values(memory).sort((a, b) => b.scanCount - a.scanCount);
  } catch (error) {
    console.error('Error getting learned barcodes:', error);
    return [];
  }
}

/**
 * Clear a specific barcode from memory
 */
export async function forgetBarcode(barcode: string): Promise<void> {
  try {
    const memory = await loadBarcodeMemory();
    delete memory[barcode];
    await AsyncStorage.setItem(BARCODE_MEMORY_KEY, JSON.stringify(memory));
    console.log(`🗑️ Forgot barcode: ${barcode}`);
  } catch (error) {
    console.error('Error forgetting barcode:', error);
  }
}

/**
 * Clear all barcode memories
 */
export async function clearAllBarcodeMemory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BARCODE_MEMORY_KEY);
    console.log('🗑️ Cleared all barcode memory');
  } catch (error) {
    console.error('Error clearing barcode memory:', error);
  }
}
