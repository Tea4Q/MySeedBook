export interface Supplier {
  supplier_image: varchar;
  id: string;
  name: string;
  webaddress?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

export interface Seed {
  seed_image: varchar;
  id: string;
  name: string;
  type: string;
  quantity: number;
  quantity_unit?: string;
  supplier_id?: string;
  date_purchased: Date;
  storage_location?: string;
  storage_requirements?: string;
  germination_rate?: number;
  planting_depth?: string;
  spacing?: string;
  watering_requirements?: string;
  sunlight_requirements?: string;
  soil_type?: string;
  fertilizer_requirements?: string;
  days_to_germinate?: string;
  days_to_harvest?: string;
  planting_season?: string;
  harvest_season?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  description?: string;
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
    };
  };
}