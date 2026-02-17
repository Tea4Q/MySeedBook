// AI-related TypeScript interfaces

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  title?: string;
  messages: AIMessage[];
  created_at: Date;
  updated_at: Date;
  user_id?: string;
}

export interface VoiceNote {
  id: string;
  text: string;
  audio_uri?: string;
  duration?: number;
  created_at: Date;
}

export interface ShoppingRecommendation {
  id: string;
  seed_name: string;
  supplier: string;
  reason: string;
  confidence: number;
  price_range?: string;
  season_relevance: 'high' | 'medium' | 'low';
  in_stock?: boolean;
  url?: string;
}

export interface PlantingAdvice {
  seed_name: string;
  action: 'plant' | 'water' | 'fertilize' | 'harvest' | 'transplant';
  priority: 'high' | 'medium' | 'low';
  advice: string;
  weather_dependent: boolean;
  days_until_action?: number;
}

export interface AIGardenContext {
  seeds: string[];
  suppliers: string[];
  location?: string;
  current_season: string;
  recent_weather?: string;
  garden_goals?: string;
}