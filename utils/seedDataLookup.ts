/**
 * Seed Data Lookup Service
 * 
 * This service provides barcode-to-seed information mapping.
 * It can be extended to integrate with various APIs and databases:
 * 
 * 1. User Memory: Previously scanned barcodes (learned by the app)
 * 2. Local Database: Pre-populated seed catalog with common seed packages
 * 3. Open Food Facts API: For packaged seeds with UPC codes
 * 4. Custom Seed Database API: Industry-specific seed catalogs
 * 5. OCR Enhancement: Extract additional info from package images
 * 
 * Current implementation provides a foundation with common seed brands
 * and allows manual entry fallback for unknown barcodes.
 */

import { lookupBarcodeInMemory } from './barcodeMemory';

export interface SeedLookupResult {
  seedName?: string;
  type?: string;
  variety?: string;
  description?: string;
  supplier?: string;
  daysToMaturity?: number;
  plantingDepth?: string;
  spacing?: string;
  sunRequirement?: string;
  waterRequirement?: string;
  soilpH?: string;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
}

// Known seed package prefixes (first digits of UPC/EAN codes)
const SEED_BRAND_PREFIXES: Record<string, string> = {
  '078742': 'Burpee Seeds',
  '071791': 'Ferry-Morse',
  '015844': 'Botanical Interests',
  '684506': 'Renee\'s Garden',
  '719908': 'Baker Creek / Rare Seeds',
  '854796': 'Johnny\'s Selected Seeds',
  '661799': 'Park Seed',
  '013684': 'American Seed',
  // Add more as discovered
};

// Baker Creek / Rare Seeds Code128 product codes
// These are internal product codes, not UPC barcodes
// Add codes as you scan and identify them
const BAKER_CREEK_CODES: Record<string, {
  name: string;
  type: string;
  variety?: string;
  description?: string;
}> = {
  // Add Baker Creek codes here as you learn them
  // Example:
  // 'CN123': {
  //   name: 'Seed Name',
  //   type: 'vegetable',
  //   description: 'Seed description',
  // },
};

// Common seed types by package indicators
const SEED_TYPE_KEYWORDS: Record<string, string> = {
  tomato: 'vegetable',
  pepper: 'vegetable',
  lettuce: 'vegetable',
  carrot: 'vegetable',
  cucumber: 'vegetable',
  bean: 'vegetable',
  pea: 'vegetable',
  squash: 'vegetable',
  zucchini: 'vegetable',
  corn: 'grain',
  sunflower: 'flower',
  marigold: 'flower',
  zinnia: 'flower',
  petunia: 'flower',
  basil: 'herb',
  cilantro: 'herb',
  parsley: 'herb',
  dill: 'herb',
  thyme: 'herb',
  oregano: 'herb',
};

/**
 * Look up seed information by barcode
 */
export async function lookupSeedByBarcode(
  barcode: string,
  barcodeType: string
): Promise<SeedLookupResult> {
  console.log(`Looking up barcode: ${barcode} (${barcodeType})`);

  // Priority 1: Check user's learned barcodes (memory)
  const memoryResult = await lookupBarcodeInMemory(barcode);
  if (memoryResult) {
    console.log('💾 Found in user memory:', memoryResult.seedName);
    return {
      seedName: memoryResult.seedName,
      type: memoryResult.type,
      variety: memoryResult.variety,
      description: memoryResult.description,
      supplier: memoryResult.supplier,
      confidence: 'high',
    };
  }

  // Priority 2: Check for Baker Creek Code128 barcodes
  if (barcodeType.toLowerCase().includes('code128') || barcodeType.toLowerCase().includes('code_128')) {
    const bakerCreekData = BAKER_CREEK_CODES[barcode.toUpperCase()];
    if (bakerCreekData) {
      console.log('✅ Found Baker Creek product:', bakerCreekData.name);
      return {
        seedName: bakerCreekData.name,
        type: bakerCreekData.type,
        variety: bakerCreekData.variety,
        description: bakerCreekData.description,
        supplier: 'Baker Creek / Rare Seeds',
        confidence: 'high',
      };
    }
  }

  // Priority 3: Check if it's a known seed brand by UPC prefix
  const supplier = identifySupplier(barcode);
  
  // Priority 4: Try to get additional information from external APIs
  try {
    // Option 1: Try Open Food Facts (for packaged seeds)
    const openFoodFactsData = await queryOpenFoodFacts(barcode);
    if (openFoodFactsData) {
      return {
        ...openFoodFactsData,
        supplier: supplier || openFoodFactsData.supplier,
        confidence: 'high',
      };
    }

    // Option 2: Try custom seed database (would be implemented server-side)
    // const customData = await queryCustomSeedDatabase(barcode);
    // if (customData) return customData;

  } catch (error) {
    console.error('Error querying external APIs:', error);
  }

  // Fallback: Return minimal information - let user fill in details
  // This allows scanning any seed package and entering the correct information
  return {
    seedName: undefined, // Leave empty so user can enter the correct name
    supplier: supplier,
    description: `Barcode: ${barcode}${supplier ? ` (${supplier})` : ''}. Package scanned successfully - please enter seed details.`,
    confidence: supplier ? 'medium' : 'low',
  };
}

/**
 * Identify supplier from barcode prefix
 */
function identifySupplier(barcode: string): string | undefined {
  // Check first 6 digits for brand match
  const prefix6 = barcode.substring(0, 6);
  if (SEED_BRAND_PREFIXES[prefix6]) {
    return SEED_BRAND_PREFIXES[prefix6];
  }

  // Check first 5 digits
  const prefix5 = barcode.substring(0, 5);
  for (const [prefix, brand] of Object.entries(SEED_BRAND_PREFIXES)) {
    if (prefix.startsWith(prefix5)) {
      return brand;
    }
  }

  return undefined;
}

/**
 * Query Open Food Facts API for seed package information
 * https://world.openfoodfacts.org/
 */
async function queryOpenFoodFacts(barcode: string): Promise<SeedLookupResult | null> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.status === 0) {
      // Product not found
      return null;
    }

    const product = data.product;
    
    // Check if it's actually a seed product
    const categories = product.categories_tags || [];
    const isSeed = categories.some((cat: string) => 
      cat.includes('seed') || 
      cat.includes('garden') || 
      cat.includes('plant')
    );

    if (!isSeed) {
      return null;
    }

    // Extract seed information
    const productName = product.product_name || '';
    const brand = product.brands || '';
    const description = product.ingredients_text || product.generic_name || '';

    // Try to determine seed type from product name
    const seedType = determineSeedType(productName + ' ' + description);

    return {
      seedName: productName,
      supplier: brand,
      type: seedType,
      description: description,
      confidence: 'high',
    };
  } catch (error) {
    console.error('Error querying Open Food Facts:', error);
    return null;
  }
}

/**
 * Determine seed type from product name/description
 */
function determineSeedType(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  for (const [keyword, type] of Object.entries(SEED_TYPE_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return type;
    }
  }

  return undefined;
}

/**
 * Parse seed package data from text (for future OCR integration)
 */
export function parseSeedPackageText(text: string): Partial<SeedLookupResult> {
  const result: Partial<SeedLookupResult> = {};

  // Extract common patterns
  const daysMatch = text.match(/(\d+)\s*days?\s*to\s*maturity/i);
  if (daysMatch) {
    result.daysToMaturity = parseInt(daysMatch[1], 10);
  }

  const depthMatch = text.match(/plant\s*(\d+\/?\d*)\s*(inch|")/i);
  if (depthMatch) {
    result.plantingDepth = depthMatch[1] + ' inches';
  }

  const spacingMatch = text.match(/space\s*(\d+)\s*(inch|")/i);
  if (spacingMatch) {
    result.spacing = spacingMatch[1] + ' inches';
  }

  // Sun requirements
  if (text.match(/full\s*sun/i)) {
    result.sunRequirement = 'Full Sun';
  } else if (text.match(/partial\s*(sun|shade)/i)) {
    result.sunRequirement = 'Partial Sun';
  } else if (text.match(/shade/i)) {
    result.sunRequirement = 'Shade';
  }

  return result;
}

/**
 * Validate barcode format
 */
export function isValidBarcode(barcode: string, type: string): boolean {
  // Remove any non-numeric characters
  const numericBarcode = barcode.replace(/\D/g, '');

  switch (type) {
    case 'org.gs1.EAN-13':
    case 'org.iso.Code128':
      return numericBarcode.length === 13 || numericBarcode.length === 12;
    
    case 'org.gs1.UPC-A':
    case 'org.gs1.UPC-E':
      return numericBarcode.length === 12 || numericBarcode.length === 8;
    
    case 'org.iso.QRCode':
    case 'org.iso.DataMatrix':
      // QR codes and Data Matrix can contain various data
      return barcode.length > 0;
    
    default:
      return barcode.length > 4; // Minimum reasonable length
  }
}

/**
 * Add a seed package to local database for future lookups
 * This allows users to build their own seed catalog
 */
export async function addSeedToLocalCatalog(
  barcode: string,
  seedData: SeedLookupResult
): Promise<void> {
  try {
    // This would store to AsyncStorage or local database
    // For now, just log
    console.log('Adding seed to local catalog:', barcode, seedData);
    // TODO: Implement local storage
  } catch (error) {
    console.error('Error adding seed to local catalog:', error);
  }
}
