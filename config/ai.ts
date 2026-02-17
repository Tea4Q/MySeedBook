// AI Service Configuration
import { Platform } from 'react-native';
import OpenAI from 'openai';

// OpenAI Configuration
export class AIConfig {
  private static openai: OpenAI | null = null;
  private static apiKey: string | null = null;

  // Initialize with API key (should be stored securely)
  static initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({
      apiKey: apiKey,
      // Note: For production, you'd want to use a proxy server
      // as OpenAI doesn't officially support React Native
      dangerouslyAllowBrowser: true,
    });
  }

  static getClient(): OpenAI | null {
    return this.openai;
  }

  static isConfigured(): boolean {
    return this.openai !== null && this.apiKey !== null;
  }
}

// Garden AI Assistant Configuration
export const GARDEN_AI_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 500,
  system_prompt: `You are an expert garden advisor and plant specialist. You help gardeners with:
- Plant identification and care advice
- Growing season recommendations
- Companion planting suggestions  
- Problem diagnosis (pests, diseases, nutrient deficiencies)
- Harvest timing
- Seed starting and planting schedules
- Gardening best practices

Always provide practical, actionable advice. When discussing timing, ask for the user's location if not provided. Be encouraging and educational. If you're unsure about something specific, suggest consulting with local extension services or master gardeners.

Keep responses concise but informative. Focus on solutions and next steps.`,
};

// Voice Recognition Configuration
export const VOICE_CONFIG = {
  locale: 'en-US',
  language: 'en',
  interimResults: true,
  maxAlternatives: 3,
  timeout: 10000,
  continuous: false,
};

// Smart Shopping Configuration  
export const SHOPPING_AI_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.3, // Lower temperature for more focused recommendations
  max_tokens: 300,
  system_prompt: `You are a smart gardening shopping assistant. Analyze a user's seed inventory and gardening goals to provide personalized recommendations for:
- Seeds to buy for companion planting
- Seasonal seed purchases
- Succession planting suggestions
- Missing varieties in their collection
- Supplier recommendations based on past purchases

Consider:
- Current season and planting calendar
- Garden space optimization
- Beginner-friendly vs expert varieties
- Pest management through diversity
- Harvest scheduling

Format as JSON with: seed_name, supplier, reason, confidence (0-1), season_relevance, and price_range if known.`,
};

// Feature flags for AI capabilities
export const AI_FEATURES = {
  voice_notes: Platform.OS !== 'web', // Voice only on mobile
  ai_chat: true,
  smart_shopping: true,
  plant_identification: false, // Phase 2
  disease_diagnosis: false, // Phase 2
  harvest_prediction: false, // Phase 3
};