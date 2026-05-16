export interface Supplier {
  supplier_image: string;
  id: string;
  supplier_name?: string;
  webaddress?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  deleted_at?: string | null; // Soft delete field (optional for backward compatibility)
}

export interface Seed {
  seed_images: ({ type: 'supabase' | 'url'; url: string }[]) | string;
  id: string;
  seed_name: string;
  type: string;
  quantity: number;
  quantity_unit?: string;
  supplier_id?: string;
  date_purchased: Date | null | undefined;
  indoor_sow_date?: Date | null | undefined;
  transplant_date?: Date | null | undefined;
  seed_price?: number;
  storage_location?: string;
  storage_requirements?: string;
  germination_rate?: number;
  planting_depth?: string;
  spacing?: string;
  watering_requirements?: string;
  sunlight_requirements?: string;
  soil_type?: string;
  fertilizer_requirements?: string;
  days_to_germinate?: string | number;
  days_to_harvest?: string | number;
  planting_season?: string;
  harvest_season?: string;
  notes?: string;
  user_id: string;
  description?: string;
  deleted_at?: string | null; // Soft delete field
  suppliers?: Supplier; // Optional joined supplier data
}

export interface SeedInventoryHistory {
  id: string;
  seed_id: string;
  action: 'add' | 'remove';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  date: Date;
  notes?: string;
  user_id: string;
  created_at: Date;
}

export interface CalendarEvent {
  id: string;
  seed_id: string;
  seed_name: string;
  event_date: Date;
  category: 'sow' | 'purchase' | 'harvest' | 'germination';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

// v1.4.0 — Harvest yield tracking (Essential tier)
export interface HarvestYield {
  id: string;
  user_id: string;
  seed_id: string;
  harvest_date: string; // ISO date string
  yield_weight?: number | null;
  yield_weight_unit?: string | null;
  yield_quantity?: number | null;
  yield_quantity_unit?: string | null;
  season_label?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// v1.4.0 — Notification preferences (Free tier)
export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  planting_reminder_days: number;
  low_stock_default_threshold: number;
  reorder_reminder_enabled: boolean;
  harvest_reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// v1.4.1 — MCP token (Voice & AI tier)
export type McpScope = 'read' | 'write';

export interface McpToken {
  id: string;
  user_id: string;
  token_hash: string;
  token_prefix: string;
  label: string;
  scopes: McpScope[];
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

// v1.4.1 — Garden (parent of garden beds/plots)
export interface Garden {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  location_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// v1.4.1 — Garden layout (Essential tier, UI ships v1.5.0)
export interface GardenPlot {
  id: string;
  user_id: string;
  garden_id?: string | null;
  name: string;
  width_units: number;
  height_units: number;
  unit_label: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeedLocation {
  id: string;
  user_id: string;
  seed_id: string;
  plot_id: string;
  grid_x: number;
  grid_y: number;
  planted_date?: string | null;
  notes?: string | null;
  created_at: string;
  deleted_at: string | null;
}

// v1.4.1 — Care tracking logs (Essential tier, UI ships v1.5.0)
export interface WateringLog {
  id: string;
  user_id: string;
  seed_id: string;
  seed_location_id?: string | null;
  logged_at: string;
  amount_ml?: number | null;
  notes?: string | null;
}

export interface FertilizerLog {
  id: string;
  user_id: string;
  seed_id: string;
  seed_location_id?: string | null;
  logged_at: string;
  fertilizer_type: string;
  amount?: number | null;
  notes?: string | null;
}

export interface PlantingLog {
  id: string;
  user_id: string;
  seed_id: string;
  seed_location_id?: string | null;
  logged_at: string;
  image_url?: string | null;
  notes?: string | null;
}

export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>;
      };
      seeds: {
        Row: Seed;
        Insert: Omit<Seed, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Seed, 'id' | 'created_at' | 'updated_at'>>;
      };
      seed_inventory_history: {
        Row: SeedInventoryHistory;
        Insert: Omit<SeedInventoryHistory, 'id' | 'created_at'>;
        Update: never;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>;
      };
      harvest_yields: {
        Row: HarvestYield;
        Insert: Omit<HarvestYield, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<HarvestYield, 'id' | 'created_at' | 'updated_at'>>;
      };
      notification_preferences: {
        Row: NotificationPreferences;
        Insert: Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'>>;
      };
      mcp_tokens: {
        Row: McpToken;
        Insert: Omit<McpToken, 'id' | 'created_at'>;
        Update: Partial<Omit<McpToken, 'id' | 'created_at'>>;
      };
      gardens: {
        Row: Garden;
        Insert: Omit<Garden, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Garden, 'id' | 'created_at' | 'updated_at'>>;
      };
      garden_plots: {
        Row: GardenPlot;
        Insert: Omit<GardenPlot, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<GardenPlot, 'id' | 'created_at' | 'updated_at'>>;
      };
      seed_locations: {
        Row: SeedLocation;
        Insert: Omit<SeedLocation, 'id' | 'created_at'>;
        Update: Partial<Omit<SeedLocation, 'id' | 'created_at'>>;
      };
      watering_logs: {
        Row: WateringLog;
        Insert: Omit<WateringLog, 'id'>;
        Update: never;
      };
      fertilizer_logs: {
        Row: FertilizerLog;
        Insert: Omit<FertilizerLog, 'id'>;
        Update: never;
      };
      planting_logs: {
        Row: PlantingLog;
        Insert: Omit<PlantingLog, 'id'>;
        Update: never;
      };
    };
  };
}
