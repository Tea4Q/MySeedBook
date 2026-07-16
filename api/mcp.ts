import { createHash } from 'node:crypto';
import type { Database, Seed, Supplier, HarvestYield, WateringLog, FertilizerLog, PlantingLog, Garden, GardenPlot, SeedLocation } from '../types/database';
import { createClient } from '@supabase/supabase-js';

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

type VerifiedToken = {
  userId: string;
  scopes: string[];
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const serverClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function jsonResponse(body: JsonRpcResponse | Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function rpcError(id: string | number | null, code: number, message: string): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message },
  };
}

function normalizeToken(rawToken: string): string {
  return rawToken.trim();
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

async function verifyToken(authHeader: string | null): Promise<VerifiedToken | null> {
  if (!serverClient || !authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const rawToken = normalizeToken(authHeader.slice('Bearer '.length));
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const { data, error } = await serverClient
    .from('mcp_tokens')
    .select('user_id, scopes, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !data || data.revoked_at) {
    return null;
  }

  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    return null;
  }

  await serverClient
    .from('mcp_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  return {
    userId: data.user_id,
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
  };
}

function requireScope(token: VerifiedToken, scope: 'read' | 'write'): boolean {
  return token.scopes.includes(scope) || token.scopes.includes('write');
}

async function listSeeds(userId: string): Promise<Seed[]> {
  const { data, error } = await serverClient!
    .from('seeds')
    .select('*, suppliers(*)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('seed_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Seed[];
}

async function listSuppliers(userId: string): Promise<Supplier[]> {
  const { data, error } = await serverClient!
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('supplier_name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Supplier[];
}

async function listHarvestYields(userId: string): Promise<HarvestYield[]> {
  const { data, error } = await serverClient!
    .from('harvest_yields')
    .select('*')
    .eq('user_id', userId)
    .order('harvest_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as HarvestYield[];
}

async function listWateringLogs(userId: string): Promise<WateringLog[]> {
  const { data, error } = await serverClient!
    .from('watering_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WateringLog[];
}

async function listFertilizerLogs(userId: string): Promise<FertilizerLog[]> {
  const { data, error } = await serverClient!
    .from('fertilizer_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as FertilizerLog[];
}

async function listPlantingLogs(userId: string): Promise<PlantingLog[]> {
  const { data, error } = await serverClient!
    .from('planting_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PlantingLog[];
}

async function listGardens(userId: string): Promise<Garden[]> {
  const { data, error } = await serverClient!
    .from('gardens')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Garden[];
}

async function listGardenPlots(userId: string): Promise<GardenPlot[]> {
  const { data, error } = await serverClient!
    .from('garden_plots')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as GardenPlot[];
}

async function listSeedLocations(userId: string): Promise<SeedLocation[]> {
  const { data, error } = await serverClient!
    .from('seed_locations')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SeedLocation[];
}

async function getGardenSummary(userId: string) {
  const [seeds, suppliers, harvestYields, wateringLogs, fertilizerLogs, plantingLogs, gardens, gardenPlots, seedLocations] = await Promise.all([
    listSeeds(userId),
    listSuppliers(userId),
    listHarvestYields(userId),
    listWateringLogs(userId),
    listFertilizerLogs(userId),
    listPlantingLogs(userId),
    listGardens(userId),
    listGardenPlots(userId),
    listSeedLocations(userId),
  ]);

  const { data: thresholdRows } = await serverClient!
    .from('seeds')
    .select('id, seed_name, quantity, low_stock_threshold')
    .eq('user_id', userId)
    .is('deleted_at', null);

  const lowStockSeeds = (thresholdRows ?? []).filter((seed) => {
    const threshold = (seed as { low_stock_threshold?: number | null }).low_stock_threshold;
    return typeof threshold === 'number' && (seed as { quantity: number }).quantity <= threshold;
  });

  return {
    counts: {
      seeds: seeds.length,
      suppliers: suppliers.length,
      harvest_yields: harvestYields.length,
      watering_logs: wateringLogs.length,
      fertilizer_logs: fertilizerLogs.length,
      planting_logs: plantingLogs.length,
      gardens: gardens.length,
      garden_plots: gardenPlots.length,
      seed_locations: seedLocations.length,
    },
    low_stock: lowStockSeeds.map((seed) => ({
      id: (seed as { id: string }).id,
      seed_name: (seed as { seed_name: string }).seed_name,
      quantity: (seed as { quantity: number }).quantity,
    })),
  };
}

function sanitizePayload<T extends Record<string, unknown>>(payload: T, disallowedKeys: string[]): T {
  const sanitized = { ...payload };
  for (const key of disallowedKeys) {
    delete sanitized[key];
  }
  return sanitized;
}

function parseSeedImages(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value ?? null;
  }

  return value
    .filter((item) => item && typeof item === 'object' && typeof (item as { url?: unknown }).url === 'string')
    .map((item) => ({
      type: typeof (item as { type?: unknown }).type === 'string' ? (item as { type: string }).type : 'url',
      url: (item as { url: string }).url,
    }));
}

function buildSeedPayload(params: Record<string, unknown> | undefined, userId: string) {
  const quantity = readNumberParam(params, 'quantity') ?? 0;
  const seedPrice = readNumberParam(params, 'seed_price') ?? 0;
  const germinationRate = readNumberParam(params, 'germination_rate') ?? 0;
  const supplierId = readMaybeStringParam(params, 'supplier_id');

  return sanitizePayload(
    {
      seed_name: readStringParam(params, 'seed_name'),
      type: readStringParam(params, 'type') || 'Unknown',
      quantity,
      quantity_unit: readMaybeStringParam(params, 'quantity_unit') ?? 'packages',
      source: readMaybeStringParam(params, 'source'),
      supplier_id: supplierId,
      date_purchased: readMaybeStringParam(params, 'date_purchased'),
      indoor_sow_date: readMaybeStringParam(params, 'indoor_sow_date'),
      transplant_date: readMaybeStringParam(params, 'transplant_date'),
      seed_price: seedPrice,
      storage_location: readMaybeStringParam(params, 'storage_location'),
      storage_requirements: readMaybeStringParam(params, 'storage_requirements'),
      germination_rate: germinationRate,
      planting_depth: readMaybeStringParam(params, 'planting_depth'),
      spacing: readMaybeStringParam(params, 'spacing'),
      watering_requirements: readMaybeStringParam(params, 'watering_requirements'),
      sunlight_requirements: readMaybeStringParam(params, 'sunlight_requirements'),
      soil_type: readMaybeStringParam(params, 'soil_type'),
      fertilizer_requirements: readMaybeStringParam(params, 'fertilizer_requirements'),
      days_to_germinate: readMaybeStringParam(params, 'days_to_germinate'),
      days_to_harvest: readMaybeStringParam(params, 'days_to_harvest'),
      planting_season: readMaybeStringParam(params, 'planting_season'),
      harvest_season: readMaybeStringParam(params, 'harvest_season'),
      notes: readMaybeStringParam(params, 'notes'),
      description: readMaybeStringParam(params, 'description'),
      low_stock_threshold: readNumberParam(params, 'low_stock_threshold'),
      seed_images: parseSeedImages(params?.seed_images),
      user_id: userId,
    },
    ['id']
  );
}

function buildSeedUpdatePayload(params: Record<string, unknown> | undefined) {
  const payload: Record<string, unknown> = {};

  if (params?.seed_name !== undefined) payload.seed_name = params.seed_name;
  if (params?.type !== undefined) payload.type = params.type;
  if (params?.quantity !== undefined) payload.quantity = readNumberParam(params, 'quantity');
  if (params?.quantity_unit !== undefined) payload.quantity_unit = params.quantity_unit;
  if (params?.source !== undefined) payload.source = params.source;
  if (params?.supplier_id !== undefined) payload.supplier_id = params.supplier_id;
  if (params?.date_purchased !== undefined) payload.date_purchased = params.date_purchased;
  if (params?.indoor_sow_date !== undefined) payload.indoor_sow_date = params.indoor_sow_date;
  if (params?.transplant_date !== undefined) payload.transplant_date = params.transplant_date;
  if (params?.seed_price !== undefined) payload.seed_price = readNumberParam(params, 'seed_price');
  if (params?.storage_location !== undefined) payload.storage_location = params.storage_location;
  if (params?.storage_requirements !== undefined) payload.storage_requirements = params.storage_requirements;
  if (params?.germination_rate !== undefined) payload.germination_rate = readNumberParam(params, 'germination_rate');
  if (params?.planting_depth !== undefined) payload.planting_depth = params.planting_depth;
  if (params?.spacing !== undefined) payload.spacing = params.spacing;
  if (params?.watering_requirements !== undefined) payload.watering_requirements = params.watering_requirements;
  if (params?.sunlight_requirements !== undefined) payload.sunlight_requirements = params.sunlight_requirements;
  if (params?.soil_type !== undefined) payload.soil_type = params.soil_type;
  if (params?.fertilizer_requirements !== undefined) payload.fertilizer_requirements = params.fertilizer_requirements;
  if (params?.days_to_germinate !== undefined) payload.days_to_germinate = params.days_to_germinate;
  if (params?.days_to_harvest !== undefined) payload.days_to_harvest = params.days_to_harvest;
  if (params?.planting_season !== undefined) payload.planting_season = params.planting_season;
  if (params?.harvest_season !== undefined) payload.harvest_season = params.harvest_season;
  if (params?.notes !== undefined) payload.notes = params.notes;
  if (params?.description !== undefined) payload.description = params.description;
  if (params?.low_stock_threshold !== undefined) payload.low_stock_threshold = readNumberParam(params, 'low_stock_threshold');
  if (params?.seed_images !== undefined) payload.seed_images = parseSeedImages(params.seed_images);

  return payload;
}

function buildSupplierUpdatePayload(params: Record<string, unknown> | undefined) {
  const payload: Record<string, unknown> = {};

  if (params?.supplier_name !== undefined) payload.supplier_name = params.supplier_name;
  if (params?.webaddress !== undefined) payload.webaddress = params.webaddress;
  if (params?.email !== undefined) payload.email = params.email;
  if (params?.phone !== undefined) payload.phone = params.phone;
  if (params?.address !== undefined) payload.address = params.address;
  if (params?.notes !== undefined) payload.notes = params.notes;
  if (params?.is_active !== undefined) payload.is_active = params.is_active;
  if (params?.supplier_image !== undefined) payload.supplier_image = params.supplier_image;

  return payload;
}

function buildSupplierPayload(params: Record<string, unknown> | undefined, userId: string) {
  return sanitizePayload(
    {
      supplier_name: readStringParam(params, 'supplier_name'),
      webaddress: readMaybeStringParam(params, 'webaddress'),
      email: readMaybeStringParam(params, 'email'),
      phone: readMaybeStringParam(params, 'phone'),
      address: readMaybeStringParam(params, 'address'),
      notes: readMaybeStringParam(params, 'notes'),
      is_active: params?.is_active === false ? false : true,
      supplier_image: readMaybeStringParam(params, 'supplier_image') ?? '',
      user_id: userId,
    },
    ['id']
  );
}

function buildWateringPayload(params: Record<string, unknown> | undefined, userId: string) {
  return {
    seed_id: readStringParam(params, 'seed_id'),
    seed_location_id: readMaybeStringParam(params, 'seed_location_id'),
    logged_at: readMaybeStringParam(params, 'logged_at') ?? new Date().toISOString(),
    amount_ml: readNumberParam(params, 'amount_ml'),
    notes: readMaybeStringParam(params, 'notes'),
    user_id: userId,
  };
}

function buildFertilizerPayload(params: Record<string, unknown> | undefined, userId: string) {
  return {
    seed_id: readStringParam(params, 'seed_id'),
    seed_location_id: readMaybeStringParam(params, 'seed_location_id'),
    logged_at: readMaybeStringParam(params, 'logged_at') ?? new Date().toISOString(),
    fertilizer_type: readStringParam(params, 'fertilizer_type') || 'Unknown',
    amount: readNumberParam(params, 'amount'),
    notes: readMaybeStringParam(params, 'notes'),
    user_id: userId,
  };
}

function buildPlantingPayload(params: Record<string, unknown> | undefined, userId: string) {
  return {
    seed_id: readStringParam(params, 'seed_id'),
    seed_location_id: readMaybeStringParam(params, 'seed_location_id'),
    logged_at: readMaybeStringParam(params, 'logged_at') ?? new Date().toISOString(),
    image_url: readMaybeStringParam(params, 'image_url'),
    result: readMaybeStringParam(params, 'result'),
    notes: readMaybeStringParam(params, 'notes'),
    user_id: userId,
  };
}

function readStringParam(params: Record<string, unknown> | undefined, key: string): string {
  const value = params?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readNumberParam(params: Record<string, unknown> | undefined, key: string): number | null {
  const value = params?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readMaybeStringParam(params: Record<string, unknown> | undefined, key: string): string | null {
  const value = params?.[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

async function handleToolCall(token: VerifiedToken, name: string, params: Record<string, unknown> | undefined) {
  switch (name) {
    case 'list_seeds':
    case 'list_suppliers':
    case 'list_harvest_yields':
    case 'list_watering_logs':
    case 'list_fertilizer_logs':
    case 'list_planting_logs':
    case 'list_gardens':
    case 'list_garden_plots':
    case 'list_seed_locations':
    case 'get_seed':
    case 'get_garden_summary': {
      if (!requireScope(token, 'read')) {
        throw new Error('Token does not include the required scope.');
      }

      break;
    }
    default:
      break;
  }

  switch (name) {
    case 'list_seeds':
      return { seeds: await listSeeds(token.userId) };
    case 'get_seed': {
      const seedId = readStringParam(params, 'id');
      const { data, error } = await serverClient!
        .from('seeds')
        .select('*, suppliers(*)')
        .eq('user_id', token.userId)
        .eq('id', seedId)
        .maybeSingle();
      if (error) throw error;
      return { seed: data ?? null };
    }
    case 'list_suppliers':
      return { suppliers: await listSuppliers(token.userId) };
    case 'get_supplier': {
      if (!requireScope(token, 'read')) {
        throw new Error('Token does not include the required scope.');
      }

      const supplierId = readStringParam(params, 'id');
      const { data, error } = await serverClient!
        .from('suppliers')
        .select('*')
        .eq('user_id', token.userId)
        .eq('id', supplierId)
        .maybeSingle();
      if (error) throw error;
      return { supplier: data ?? null };
    }
    case 'add_supplier': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const supplierPayload = buildSupplierPayload(params, token.userId);
      const { data, error } = await serverClient!
        .from('suppliers')
        .insert(supplierPayload)
        .select('id')
        .single();

      if (error) throw error;
      return { supplier: data ?? null };
    }
    case 'update_supplier': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const supplierId = readStringParam(params, 'id');
      const supplierPayload = buildSupplierUpdatePayload(params);

      const { data, error } = await serverClient!
        .from('suppliers')
        .update(supplierPayload)
        .eq('user_id', token.userId)
        .eq('id', supplierId)
        .select('id')
        .single();

      if (error) throw error;
      return { supplier: data ?? null };
    }
    case 'delete_supplier': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const supplierId = readStringParam(params, 'id');
      const { error } = await serverClient!
        .from('suppliers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', token.userId)
        .eq('id', supplierId);

      if (error) throw error;
      return { ok: true };
    }
    case 'list_harvest_yields':
      return { harvest_yields: await listHarvestYields(token.userId) };
    case 'list_watering_logs':
      return { watering_logs: await listWateringLogs(token.userId) };
    case 'list_fertilizer_logs':
      return { fertilizer_logs: await listFertilizerLogs(token.userId) };
    case 'list_planting_logs':
      return { planting_logs: await listPlantingLogs(token.userId) };
    case 'get_garden_summary':
      return await getGardenSummary(token.userId);
    case 'list_gardens':
      return { gardens: await listGardens(token.userId) };
    case 'list_garden_plots':
      return { garden_plots: await listGardenPlots(token.userId) };
    case 'list_seed_locations':
      return { seed_locations: await listSeedLocations(token.userId) };
    case 'add_seed': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const seedPayload = buildSeedPayload(params, token.userId);
      const { data, error } = await serverClient!
        .from('seeds')
        .insert(seedPayload)
        .select('id')
        .single();

      if (error) throw error;
      return { seed: data ?? null };
    }
    case 'update_seed': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const seedId = readStringParam(params, 'id');
      const seedPayload = buildSeedUpdatePayload(params);

      const { data, error } = await serverClient!
        .from('seeds')
        .update(seedPayload)
        .eq('user_id', token.userId)
        .eq('id', seedId)
        .select('id')
        .single();

      if (error) throw error;
      return { seed: data ?? null };
    }
    case 'delete_seed': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const seedId = readStringParam(params, 'id');
      const { error } = await serverClient!
        .from('seeds')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', token.userId)
        .eq('id', seedId);

      if (error) throw error;
      return { ok: true };
    }
    case 'log_harvest_yield': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const { data, error } = await serverClient!
        .from('harvest_yields')
        .insert({
          seed_id: readStringParam(params, 'seed_id'),
          harvest_date: readMaybeStringParam(params, 'harvest_date') ?? new Date().toISOString().slice(0, 10),
          yield_weight: readNumberParam(params, 'yield_weight'),
          yield_weight_unit: readMaybeStringParam(params, 'yield_weight_unit'),
          yield_quantity: readNumberParam(params, 'yield_quantity'),
          yield_quantity_unit: readMaybeStringParam(params, 'yield_quantity_unit'),
          season_label: readMaybeStringParam(params, 'season_label'),
          notes: readMaybeStringParam(params, 'notes'),
          user_id: token.userId,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { harvest_yield: data ?? null };
    }
    case 'log_watering': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const { data, error } = await serverClient!
        .from('watering_logs')
        .insert(buildWateringPayload(params, token.userId))
        .select('id')
        .single();

      if (error) throw error;
      return { watering_log: data ?? null };
    }
    case 'log_fertilizer': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const { data, error } = await serverClient!
        .from('fertilizer_logs')
        .insert(buildFertilizerPayload(params, token.userId))
        .select('id')
        .single();

      if (error) throw error;
      return { fertilizer_log: data ?? null };
    }
    case 'log_planting': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const { data, error } = await serverClient!
        .from('planting_logs')
        .insert(buildPlantingPayload(params, token.userId))
        .select('id')
        .single();

      if (error) throw error;
      return { planting_log: data ?? null };
    }
    case 'place_seed': {
      if (!requireScope(token, 'write')) {
        throw new Error('Token does not include write access.');
      }

      const { data, error } = await serverClient!
        .from('seed_locations')
        .insert({
          seed_id: readStringParam(params, 'seed_id'),
          plot_id: readStringParam(params, 'plot_id'),
          grid_x: readNumberParam(params, 'grid_x') ?? 0,
          grid_y: readNumberParam(params, 'grid_y') ?? 0,
          planted_date: readMaybeStringParam(params, 'planted_date'),
          notes: readMaybeStringParam(params, 'notes'),
          user_id: token.userId,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { seed_location: data ?? null };
    }
    case 'get_garden_layout': {
      if (!requireScope(token, 'read')) {
        throw new Error('Token does not include the required scope.');
      }

      const [gardens, gardenPlots, seedLocations] = await Promise.all([
        listGardens(token.userId),
        listGardenPlots(token.userId),
        listSeedLocations(token.userId),
      ]);

      return { gardens, garden_plots: gardenPlots, seed_locations: seedLocations };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleResourceRead(token: VerifiedToken, uri: string) {
  if (!requireScope(token, 'read')) {
    throw new Error('Token does not include the required scope.');
  }

  if (uri === 'myseedbook://inventory') {
    return { uri, mimeType: 'application/json', text: JSON.stringify({ seeds: await listSeeds(token.userId) }) };
  }

  if (uri === 'myseedbook://low-stock') {
    const summary = await getGardenSummary(token.userId);
    return { uri, mimeType: 'application/json', text: JSON.stringify({ low_stock: summary.low_stock }) };
  }

  if (uri === 'myseedbook://calendar') {
    const [harvestYields, wateringLogs, fertilizerLogs, plantingLogs] = await Promise.all([
      listHarvestYields(token.userId),
      listWateringLogs(token.userId),
      listFertilizerLogs(token.userId),
      listPlantingLogs(token.userId),
    ]);

    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ harvest_yields: harvestYields, watering_logs: wateringLogs, fertilizer_logs: fertilizerLogs, planting_logs: plantingLogs }),
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
}

function createToolDefinitions() {
  return [
    { name: 'list_seeds', description: 'List the authenticated user\'s seeds.' },
    { name: 'get_seed', description: 'Get a single seed by id.' },
    { name: 'add_seed', description: 'Add a seed to the authenticated user\'s inventory.' },
    { name: 'update_seed', description: 'Update a seed in the authenticated user\'s inventory.' },
    { name: 'delete_seed', description: 'Soft-delete a seed from the authenticated user\'s inventory.' },
    { name: 'list_suppliers', description: 'List the authenticated user\'s suppliers.' },
    { name: 'get_supplier', description: 'Get a supplier by id.' },
    { name: 'add_supplier', description: 'Add a supplier.' },
    { name: 'update_supplier', description: 'Update a supplier.' },
    { name: 'delete_supplier', description: 'Soft-delete a supplier.' },
    { name: 'list_harvest_yields', description: 'List harvest yield records.' },
    { name: 'log_harvest_yield', description: 'Create a harvest yield record.' },
    { name: 'list_watering_logs', description: 'List watering log records.' },
    { name: 'log_watering', description: 'Create a watering log record.' },
    { name: 'list_fertilizer_logs', description: 'List fertilizer log records.' },
    { name: 'log_fertilizer', description: 'Create a fertilizer log record.' },
    { name: 'list_planting_logs', description: 'List planting log records.' },
    { name: 'log_planting', description: 'Create a planting log record.' },
    { name: 'get_garden_summary', description: 'Summarize the user\'s garden state.' },
    { name: 'list_gardens', description: 'List gardens.' },
    { name: 'list_garden_plots', description: 'List garden plots.' },
    { name: 'list_seed_locations', description: 'List seed placements.' },
    { name: 'place_seed', description: 'Place a seed into a garden plot.' },
    { name: 'get_garden_layout', description: 'Return the current garden layout.' },
  ];
}

function createResourceDefinitions() {
  return [
    { uri: 'myseedbook://inventory', name: 'Seed inventory', description: 'Current seed collection.' },
    { uri: 'myseedbook://low-stock', name: 'Low stock seeds', description: 'Seeds at or below their low stock threshold.' },
    { uri: 'myseedbook://calendar', name: 'Garden calendar', description: 'Harvest, watering, fertilizing, and planting activity.' },
  ];
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!serverClient) {
    return jsonResponse({ error: 'Server configuration is incomplete.' }, 500);
  }

  if (req.method === 'GET') {
    return jsonResponse({
      jsonrpc: '2.0',
      id: null,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'myseedbook-mcp',
          version: '1.4.1',
        },
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
        },
      },
    });
  }

  const authHeader = req.headers.get('authorization');
  const token = await verifyToken(authHeader);
  if (!token) {
    return jsonResponse(rpcError(null, -32001, 'Unauthorized.'), 401);
  }

  if (req.method !== 'POST') {
    return jsonResponse(rpcError(null, -32600, 'Method not allowed.'), 405);
  }

  const payload = (await req.json().catch(() => null)) as JsonRpcRequest | null;
  if (!payload || payload.jsonrpc !== '2.0' || !payload.method) {
    return jsonResponse(rpcError(payload?.id ?? null, -32600, 'Invalid request.'), 400);
  }

  const { id, method, params } = payload;

  try {
    if (method === 'initialize') {
      return jsonResponse({
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'myseedbook-mcp',
            version: '1.4.1',
          },
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
          },
        },
      });
    }

    if (method === 'tools/list') {
      return jsonResponse({ jsonrpc: '2.0', id: id ?? null, result: { tools: createToolDefinitions() } });
    }

    if (method === 'resources/list') {
      return jsonResponse({ jsonrpc: '2.0', id: id ?? null, result: { resources: createResourceDefinitions() } });
    }

    if (method === 'tools/call') {
      const toolName = readStringParam(params, 'name');
      const toolParams = (params?.arguments as Record<string, unknown> | undefined) ?? undefined;

      const result = await handleToolCall(token, toolName, toolParams);
      return jsonResponse({ jsonrpc: '2.0', id: id ?? null, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } });
    }

    if (method === 'resources/read') {
      const uri = readStringParam(params, 'uri');
      const result = await handleResourceRead(token, uri);
      return jsonResponse({ jsonrpc: '2.0', id: id ?? null, result: { contents: [result] } });
    }

    if (method === 'ping') {
      return jsonResponse({ jsonrpc: '2.0', id: id ?? null, result: { ok: true } });
    }

    return jsonResponse(rpcError(id ?? null, -32601, `Unknown method: ${method}`), 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return jsonResponse(rpcError(id ?? null, -32603, message), 500);
  }
}

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;