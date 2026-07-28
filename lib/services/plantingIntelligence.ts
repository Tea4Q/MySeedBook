import { addDays } from 'date-fns';
import type { Seed } from '@/types/database';

export type Season = 'winter' | 'spring' | 'summer' | 'fall';

export interface SeasonalRecommendation {
  id: string;
  title: string;
  season: Season;
  seedTypes: string[];
  timing: string;
  reason: string;
  suggestedAction: string;
  reminderSeedName: string;
  reminderNotes: string;
  reminderDateISO: string;
  reminderCategory: 'sow' | 'transplant';
}

export interface InventoryRecommendation {
  seed: Seed;
  ageDays: number;
  season: Season;
  reason: string;
  suggestedAction: string;
  reminderNotes: string;
  reminderDateISO: string;
  reminderCategory: 'sow' | 'transplant';
}

type SeasonalRule = {
  title: string;
  seedTypes: string[];
  timing: string;
  reason: string;
  suggestedAction: string;
  reminderCategory: 'sow' | 'transplant';
};

const DAY_MS = 1000 * 60 * 60 * 24;

const SEASON_RULES: Record<Season, SeasonalRule[]> = {
  winter: [
    {
      title: 'Leafy greens',
      seedTypes: ['lettuce', 'spinach', 'kale'],
      timing: 'Start indoors or in a protected space now.',
      reason: 'Cool-weather greens do best when the heat is low and light is steady.',
      suggestedAction: 'Sow indoors or under cover',
      reminderCategory: 'sow',
    },
    {
      title: 'Onions and leeks',
      seedTypes: ['onion', 'leek', 'allium'],
      timing: 'Give slow starters an early head start indoors.',
      reason: 'Long-season crops benefit from being started before the main growing rush.',
      suggestedAction: 'Start seedlings indoors',
      reminderCategory: 'sow',
    },
    {
      title: 'Peas',
      seedTypes: ['pea'],
      timing: 'Sow once the soil is workable and temperatures are still cool.',
      reason: 'Peas like cool weather and can be planted before the main spring surge.',
      suggestedAction: 'Sow directly outside',
      reminderCategory: 'sow',
    },
  ],
  spring: [
    {
      title: 'Lettuce and salad greens',
      seedTypes: ['lettuce', 'spinach', 'arugula'],
      timing: 'Plant now for fast spring growth.',
      reason: 'These crops germinate quickly and reward early planting in mild weather.',
      suggestedAction: 'Sow this week',
      reminderCategory: 'sow',
    },
    {
      title: 'Carrots and radishes',
      seedTypes: ['carrot', 'radish', 'beet'],
      timing: 'Direct sow while the soil stays cool and loose.',
      reason: 'Root crops stay tender and reliable when planted before summer heat arrives.',
      suggestedAction: 'Direct sow in rows',
      reminderCategory: 'sow',
    },
    {
      title: 'Herbs',
      seedTypes: ['basil', 'parsley', 'cilantro', 'dill', 'thyme'],
      timing: 'Move or sow herbs as spring temperatures settle.',
      reason: 'Herbs establish quickly and make good use of the spring growing window.',
      suggestedAction: 'Sow or transplant herbs',
      reminderCategory: 'transplant',
    },
  ],
  summer: [
    {
      title: 'Beans and corn',
      seedTypes: ['bean', 'corn', 'maize'],
      timing: 'Plant into warm soil for reliable germination.',
      reason: 'Warm-season crops thrive once nights stay mild and the soil is warm.',
      suggestedAction: 'Sow outdoors now',
      reminderCategory: 'sow',
    },
    {
      title: 'Cucumbers and squash',
      seedTypes: ['cucumber', 'squash', 'zucchini', 'courgette'],
      timing: 'Direct sow or transplant while summer heat is building.',
      reason: 'These fast growers like warmth and respond well to regular watering.',
      suggestedAction: 'Sow or transplant now',
      reminderCategory: 'transplant',
    },
    {
      title: 'Basil and heat-loving herbs',
      seedTypes: ['basil', 'oregano', 'rosemary', 'sage'],
      timing: 'Keep compact herb crops moving through the warm season.',
      reason: 'Heat-loving herbs stay productive when planted in full sun during summer.',
      suggestedAction: 'Transplant into sun',
      reminderCategory: 'transplant',
    },
  ],
  fall: [
    {
      title: 'Brassicas',
      seedTypes: ['broccoli', 'cauliflower', 'cabbage', 'kale'],
      timing: 'Start fall crops early while temperatures are still warm enough for establishment.',
      reason: 'Brassicas settle in well for a cooler finish to the season.',
      suggestedAction: 'Transplant or sow now',
      reminderCategory: 'transplant',
    },
    {
      title: 'Spinach and greens',
      seedTypes: ['spinach', 'lettuce', 'mustard'],
      timing: 'Sow for a late-season harvest before hard frost.',
      reason: 'Cool nights improve flavour and slow bolting in fall greens.',
      suggestedAction: 'Sow directly outside',
      reminderCategory: 'sow',
    },
    {
      title: 'Garlic and overwintering alliums',
      seedTypes: ['garlic', 'onion', 'shallot'],
      timing: 'Plant cloves or sets before the ground freezes.',
      reason: 'Fall planting gives alliums a head start for a strong spring return.',
      suggestedAction: 'Plant before freeze-up',
      reminderCategory: 'transplant',
    },
  ],
};

export function getCurrentSeason(date = new Date()): Season {
  const month = date.getMonth();
  if (month < 3 || month === 11) return 'winter';
  if (month < 6) return 'spring';
  if (month < 9) return 'summer';
  return 'fall';
}

function hasAnyMatch(value: string | undefined, matches: string[]): boolean {
  const normalized = (value || '').toLowerCase();
  return matches.some((match) => normalized.includes(match));
}

function getAgeDays(seed: Seed, referenceDate = new Date()): number {
  if (!seed.date_purchased) return 0;
  const purchaseDate = new Date(seed.date_purchased);
  if (Number.isNaN(purchaseDate.getTime())) return 0;
  return Math.max(0, Math.floor((referenceDate.getTime() - purchaseDate.getTime()) / DAY_MS));
}

function buildReminderDate(seed: Seed, referenceDate = new Date(), season: Season = getCurrentSeason(referenceDate)): string {
  if (seed.indoor_sow_date) {
    const indoorDate = new Date(seed.indoor_sow_date);
    if (!Number.isNaN(indoorDate.getTime())) return indoorDate.toISOString();
  }

  if (seed.transplant_date) {
    const transplantDate = new Date(seed.transplant_date);
    if (!Number.isNaN(transplantDate.getTime())) return transplantDate.toISOString();
  }

  const seedSeason = (seed.planting_season || '').toLowerCase();
  const seasonalDelay = seedSeason.includes(season) ? 3 : 7;
  return addDays(referenceDate, seasonalDelay).toISOString();
}

export function getSeasonalPlantingRecommendations(referenceDate = new Date()): SeasonalRecommendation[] {
  const season = getCurrentSeason(referenceDate);
  return SEASON_RULES[season].map((rule, index) => ({
    id: `${season}-${index}`,
    title: rule.title,
    season,
    seedTypes: rule.seedTypes,
    timing: rule.timing,
    reason: rule.reason,
    suggestedAction: rule.suggestedAction,
    reminderSeedName: rule.title,
    reminderNotes: `${rule.suggestedAction} - ${rule.reason}`,
    reminderDateISO: addDays(referenceDate, 2 + index).toISOString(),
    reminderCategory: rule.reminderCategory,
  }));
}

export function recommendNextSeeds(seeds: Seed[], referenceDate = new Date()): InventoryRecommendation[] {
  const season = getCurrentSeason(referenceDate);

  return [...seeds]
    .filter((seed) => !seed.deleted_at)
    .map((seed) => {
      const ageDays = getAgeDays(seed, referenceDate);
      const plantingSeason = (seed.planting_season || '').toLowerCase();
      const harvestSeason = (seed.harvest_season || '').toLowerCase();
      const seedType = (seed.type || '').toLowerCase();
      const seasonMatch = hasAnyMatch(plantingSeason, [season]) || hasAnyMatch(harvestSeason, [season]) || hasAnyMatch(seedType, SEASON_RULES[season].flatMap((rule) => rule.seedTypes));
      const quantity = Number(seed.quantity) || 0;
      const reasons: string[] = [];

      if (ageDays >= 365) {
        reasons.push(`Packet is about ${Math.max(1, Math.round(ageDays / 365))} year${ageDays >= 730 ? 's' : ''} old`);
      } else if (ageDays > 0) {
        reasons.push(`Purchased ${ageDays} day${ageDays === 1 ? '' : 's'} ago`);
      }

      if (seasonMatch) {
        reasons.push(`Matches the current ${season} planting window`);
      }

      if (quantity <= 1) {
        reasons.push('Only one packet left');
      }

      const score = (seasonMatch ? 10 : 0) + Math.min(ageDays / 30, 18) + (quantity <= 1 ? 2 : 0);
      const reminderDateISO = buildReminderDate(seed, referenceDate, season);

      return {
        seed,
        ageDays,
        season,
        reason: reasons.join(' · ') || 'Good candidate to use next',
        suggestedAction: seasonMatch ? 'Plant this week' : 'Keep in rotation and plant soon',
        reminderNotes: `Suggested next seed: ${seed.seed_name}. ${reasons.join(' ') || 'Good candidate to plant next.'}`,
        reminderDateISO,
        reminderCategory: seed.transplant_date ? 'transplant' : 'sow',
        score,
      } as InventoryRecommendation & { score: number };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map(({ score: _score, ...rest }) => rest);
}

export function buildReminderPayload(seedName: string, reason: string): { notes: string; suggestedDateISO: string } {
  const suggestedDate = new Date();
  suggestedDate.setDate(suggestedDate.getDate() + 7);
  return {
    notes: `${seedName}: ${reason}`,
    suggestedDateISO: suggestedDate.toISOString().slice(0, 10),
  };
}
