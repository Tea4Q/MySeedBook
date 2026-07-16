export type SeedPacketStatus = 'fresh' | 'use-soon' | 'low-viability';

export interface SeedPacketInsight {
  status: SeedPacketStatus;
  label: string;
  description: string;
}

const DAY_MS = 1000 * 60 * 60 * 24;
const USE_SOON_THRESHOLD_DAYS = 730;
const LOW_VIABILITY_THRESHOLD_DAYS = 1095;

export function getSeedPacketInsight(seed: {
  date_purchased?: Date | string | null;
  planting_season?: string | null;
  seed_name?: string | null;
}): SeedPacketInsight {
  const purchaseDate = seed.date_purchased ? new Date(seed.date_purchased) : null;
  const ageInDays = purchaseDate && !Number.isNaN(purchaseDate.getTime())
    ? Math.floor((Date.now() - purchaseDate.getTime()) / DAY_MS)
    : 0;

  if (ageInDays >= LOW_VIABILITY_THRESHOLD_DAYS) {
    return {
      status: 'low-viability',
      label: 'Low viability',
      description: `${seed.seed_name || 'This packet'} is older than 3 years and should be used with caution.`,
    };
  }

  if (ageInDays >= USE_SOON_THRESHOLD_DAYS) {
    return {
      status: 'use-soon',
      label: 'Use soon',
      description: `${seed.seed_name || 'This packet'} is getting older and should be used soon.`,
    };
  }

  return {
    status: 'fresh',
    label: 'Fresh packet',
    description: `${seed.seed_name || 'This packet'} looks fresh and ready to use this season.`,
  };
}

export function getSeedQuantityLabel(quantity?: number | null, quantityUnit?: string | null): string {
  const count = Number(quantity) || 0;
  const normalizedUnit = (quantityUnit || 'packages').trim().toLowerCase();
  const isSingular = count === 1;

  if (normalizedUnit === 'seed' || normalizedUnit === 'seeds') {
    return `${count} ${isSingular ? 'package' : 'packages'}`;
  }

  return `${count} ${isSingular ? 'package' : 'packages'}`;
}

export function getSeedSupplierLabel(supplier?: string | null): string {
  const value = supplier?.trim();
  if (!value) return 'No supplier';
  return value;
}

export function getSeedProvenanceLabel(seed: {
  supplierName?: string | null;
  source?: string | null;
}): string {
  const sourceValue = seed.source?.trim();
  if (sourceValue) return sourceValue;

  const supplierValue = seed.supplierName?.trim();
  if (supplierValue) return supplierValue;

  return 'No supplier';
}

export function getSeedPacketSummary(seed: {
  seed_name?: string | null;
  date_purchased?: Date | string | null;
  planting_season?: string | null;
}): string {
  const insight = getSeedPacketInsight(seed);
  return `${insight.label}: ${insight.description}`;
}
