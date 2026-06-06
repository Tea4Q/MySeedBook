export const PRICING = {
  essential: {
    monthlyAmount: '$7.99',
    monthlyDisplay: '$7.99 / month',
    yearlyDisplay: '$63.99 / year',
  },
  voice: {
    monthlyAmount: '$9.99',
    monthlyDisplay: '$9.99 / month',
    yearlyDisplay: '$79.99 / year',
    comingSoonLabel: 'Coming in v1.3.1',
  },
} as const;

export const PRICING_COPY = {
  planChooserTitle: 'Choose Your Garden Plan',
  essentialStartingPrice: `Essential starts at ${PRICING.essential.monthlyAmount}.`,
  modalHeroSub: `Essential starts at ${PRICING.essential.monthlyAmount}.`,
  upgradePromptDefault: `MySeedBook Essential unlocks unlimited seeds, weather integration, and cloud sync at ${PRICING.essential.monthlyAmount}/month.`,
  upgradePromptForFeature: (feature: string) => {
    const isVoiceFeature = /voice|ai|chat|whisper/i.test(feature);
    return isVoiceFeature
      ? `Unlock ${feature} with the Voice & AI plan at ${PRICING.voice.monthlyAmount}/month — includes AI garden chat, smart shopping, and voice notes.`
      : `Unlock ${feature} with MySeedBook Essential at ${PRICING.essential.monthlyAmount}/month - unlimited seeds, weather integration, and cloud sync.`;
  },
  upgradePromptForAIFeature: (feature: string) =>
    `Unlock ${feature} with the Voice & AI plan at ${PRICING.voice.monthlyAmount}/month — includes AI garden chat, smart shopping, and voice notes.`,
} as const;
