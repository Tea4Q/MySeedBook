import { describe, expect, it } from '@jest/globals';
import { getSeedPacketInsight, getSeedQuantityLabel, getSeedSupplierLabel, getSeedProvenanceLabel } from '../seedCabinetService';

describe('getSeedPacketInsight', () => {
  it('marks very old packets as low viability', () => {
    const seed = {
      id: '1',
      seed_name: 'Tomato',
      type: 'vegetable',
      quantity: 1,
      user_id: 'user-1',
      seed_images: [],
      date_purchased: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1300),
    } as any;

    const insight = getSeedPacketInsight(seed);

    expect(insight.status).toBe('low-viability');
    expect(insight.label).toContain('Low viability');
  });

  it('marks recently added packets as fresh', () => {
    const seed = {
      id: '2',
      seed_name: 'Lettuce',
      type: 'vegetable',
      quantity: 1,
      user_id: 'user-1',
      seed_images: [],
      date_purchased: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    } as any;

    const insight = getSeedPacketInsight(seed);

    expect(insight.status).toBe('fresh');
    expect(insight.label).toContain('Fresh packet');
  });

  it('labels packet counts as packages', () => {
    expect(getSeedQuantityLabel(1, 'seeds')).toBe('1 package');
    expect(getSeedQuantityLabel(3, 'seeds')).toBe('3 packages');
  });

  it('formats supplier values for display', () => {
    expect(getSeedSupplierLabel('Seed Co')).toBe('Seed Co');
    expect(getSeedSupplierLabel('')).toBe('No supplier');
  });

  it('formats provenance values for display', () => {
    expect(getSeedProvenanceLabel({ supplierName: 'Seed Co' })).toBe('Seed Co');
    expect(getSeedProvenanceLabel({ source: 'Gift from grandma' })).toBe('Gift from grandma');
    expect(getSeedProvenanceLabel({})).toBe('No supplier');
    expect(getSeedProvenanceLabel({ source: '   ' })).toBe('No supplier');
  });
});
