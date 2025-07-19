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
}

export interface Seed {
  seed_images: Array<{ type: 'supabase' | 'url'; url: string }> | string;
  id: string;
  seed_name: string;
  type: string;
  quantity: number;
  quantity_unit?: string;
  supplier_id?: string;
  date_purchased: Date | null | undefined;
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
    };
  };
}
