import { getDb } from "../db/client.mjs";
import { frontendConfig as defaultFrontendConfig } from "../store.mjs";

const cache = {
  ready: false,
  loadedAt: null,
  providers: [],
  providerModels: [],
  platformModels: [],
  channels: [],
  parameterMappings: [],
  frontendConfig: JSON.parse(JSON.stringify(defaultFrontendConfig)),
};

export const postgresCatalogRepository = {
  async initialize() {
    const db = await getDb();
    const [providers, providerModels, platformModels, channels, mappings, frontendConfigs] = await Promise.all([
      db.query(
        `select id, name, kind, base_url, auth_type, encrypted_api_key, status, rpm, concurrency, latency_ms, success_rate
         from providers
         order by id`
      ),
      db.query(
        `select id, provider_id, upstream_model_name, endpoint_type, modality, status, raw_capabilities, notes
         from provider_models
         order by id`
      ),
      db.query(
        `select id, name, short_name, modality, tier, description, use_cases, visible, recommended,
                estimated_cost, estimated_time, sort_order, schema
         from platform_models
         order by sort_order, id`
      ),
      db.query(
        `select id, platform_model_id, provider_id, provider_model_id, role, status, weight, priority,
                cost_price, sale_price, billing_unit, latency, success_rate, max_concurrency, timeout_ms, supports
         from model_channels
         order by platform_model_id, priority, id`
      ),
      db.query(
        `select id, channel_id, platform_param_key, upstream_param_key, transform, value_map, default_value, note
         from channel_parameter_mappings
         order by channel_id, platform_param_key`
      ),
      db.query(
        `select id, nav_items, capability_menu, default_route_mode
         from frontend_configs
         where id = 'default'`
      ).catch(() => ({ rows: [] })),
    ]);

    cache.providers = providers.rows.map(mapProvider);
    cache.providerModels = providerModels.rows.map(mapProviderModel);
    cache.platformModels = platformModels.rows.map(mapPlatformModel);
    cache.channels = channels.rows.map(mapChannel);
    cache.parameterMappings = mappings.rows.map(mapParameterMapping);
    cache.frontendConfig = frontendConfigs.rows[0] ? mapFrontendConfig(frontendConfigs.rows[0]) : JSON.parse(JSON.stringify(defaultFrontendConfig));
    cache.ready = true;
    cache.loadedAt = new Date().toISOString();
  },

  getStatus() {
    return {
      ready: cache.ready,
      loaded_at: cache.loadedAt,
      providers: cache.providers.length,
      platform_models: cache.platformModels.length,
      channels: cache.channels.length,
      parameter_mappings: cache.parameterMappings.length,
    };
  },

  listProviders() {
    return cache.providers;
  },

  listPlatformModels() {
    return cache.platformModels;
  },

  listProviderModels() {
    return cache.providerModels;
  },

  listChannels() {
    return cache.channels;
  },

  getFrontendConfig() {
    return cache.frontendConfig;
  },

  async updateFrontendConfig(config) {
    const db = await getDb();
    const result = await db.query(
      `insert into frontend_configs (id, nav_items, capability_menu, default_route_mode, updated_at)
       values ('default', $1::jsonb, $2::jsonb, $3, now())
       on conflict (id)
       do update set
         nav_items = excluded.nav_items,
         capability_menu = excluded.capability_menu,
         default_route_mode = excluded.default_route_mode,
         updated_at = now()
       returning id, nav_items, capability_menu, default_route_mode`,
      [JSON.stringify(config.navItems ?? []), JSON.stringify(config.capabilityMenu ?? []), config.defaultRouteMode ?? "balanced"]
    );
    cache.frontendConfig = mapFrontendConfig(result.rows[0]);
    return cache.frontendConfig;
  },

  getProvider(id) {
    return cache.providers.find((provider) => provider.id === id);
  },

  getProviderModel(id) {
    return cache.providerModels.find((model) => model.id === id);
  },

  getPlatformModel(id) {
    return cache.platformModels.find((model) => model.id === id);
  },

  async upsertProvider(provider) {
    const db = await getDb();
    const result = await db.query(
      `insert into providers (
         id, name, kind, base_url, auth_type, encrypted_api_key, status,
         rpm, concurrency, latency_ms, success_rate, updated_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
       on conflict (id)
       do update set
         name = excluded.name,
         kind = excluded.kind,
         base_url = excluded.base_url,
         auth_type = excluded.auth_type,
         encrypted_api_key = coalesce(excluded.encrypted_api_key, providers.encrypted_api_key),
         status = excluded.status,
         rpm = excluded.rpm,
         concurrency = excluded.concurrency,
         latency_ms = excluded.latency_ms,
         success_rate = excluded.success_rate,
         updated_at = now()
       returning id, name, kind, base_url, auth_type, encrypted_api_key, status, rpm, concurrency, latency_ms, success_rate`,
      [
        provider.id,
        provider.name,
        provider.kind,
        provider.baseUrl,
        provider.authType,
        provider.encryptedApiKey ?? null,
        provider.status,
        provider.rpm,
        provider.concurrency,
        provider.latencyMs,
        provider.successRate,
      ]
    );

    const saved = mapProvider(result.rows[0]);
    await this.initialize();
    return saved;
  },

  async upsertProviderModel(providerModel) {
    const db = await getDb();
    const result = await db.query(
      `insert into provider_models (
         id, provider_id, upstream_model_name, endpoint_type, modality, status,
         raw_capabilities, notes, updated_at
       )
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, now())
       on conflict (id)
       do update set
         provider_id = excluded.provider_id,
         upstream_model_name = excluded.upstream_model_name,
         endpoint_type = excluded.endpoint_type,
         modality = excluded.modality,
         status = excluded.status,
         raw_capabilities = excluded.raw_capabilities,
         notes = excluded.notes,
         updated_at = now()
       returning id, provider_id, upstream_model_name, endpoint_type, modality, status, raw_capabilities, notes`,
      [
        providerModel.id,
        providerModel.providerId,
        providerModel.upstreamModelName,
        providerModel.endpointType,
        providerModel.modality,
        providerModel.status,
        JSON.stringify(providerModel.rawCapabilities ?? {}),
        providerModel.notes ?? null,
      ]
    );

    const saved = mapProviderModel(result.rows[0]);
    await this.initialize();
    return saved;
  },

  async upsertPlatformModel(platformModel) {
    const db = await getDb();
    const result = await db.query(
      `insert into platform_models (
         id, name, short_name, modality, tier, description, use_cases,
         visible, recommended, estimated_cost, estimated_time, sort_order, schema, updated_at
       )
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13::jsonb, now())
       on conflict (id)
       do update set
         name = excluded.name,
         short_name = excluded.short_name,
         modality = excluded.modality,
         tier = excluded.tier,
         description = excluded.description,
         use_cases = excluded.use_cases,
         visible = excluded.visible,
         recommended = excluded.recommended,
         estimated_cost = excluded.estimated_cost,
         estimated_time = excluded.estimated_time,
         sort_order = excluded.sort_order,
         schema = excluded.schema,
         updated_at = now()
       returning id, name, short_name, modality, tier, description, use_cases, visible, recommended,
                 estimated_cost, estimated_time, sort_order, schema`,
      [
        platformModel.id,
        platformModel.name,
        platformModel.shortName,
        platformModel.modality,
        platformModel.tier,
        platformModel.description,
        JSON.stringify(platformModel.useCases ?? []),
        platformModel.visible,
        platformModel.recommended,
        platformModel.estimatedCost ?? null,
        platformModel.estimatedTime ?? null,
        platformModel.sortOrder ?? 0,
        JSON.stringify(platformModel.schema ?? []),
      ]
    );

    const saved = mapPlatformModel(result.rows[0]);
    await this.initialize();
    return saved;
  },

  listChannelsForModel(platformModelId) {
    return cache.channels.filter((channel) => channel.platformModelId === platformModelId);
  },

  getChannelMappings(channelId) {
    return cache.parameterMappings.filter((mapping) => mapping.channelId === channelId);
  },

  getChannel(id) {
    return cache.channels.find((channel) => channel.id === id);
  },

  async createChannel(channel) {
    const db = await getDb();
    const result = await db.query(
      `insert into model_channels (
         id, platform_model_id, provider_id, provider_model_id, role, status, weight, priority,
         cost_price, sale_price, billing_unit, latency, success_rate, max_concurrency, timeout_ms, supports
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
       returning id, platform_model_id, provider_id, provider_model_id, role, status, weight, priority,
                 cost_price, sale_price, billing_unit, latency, success_rate, max_concurrency, timeout_ms, supports`,
      [
        channel.id,
        channel.platformModelId,
        channel.providerId,
        channel.providerModelId,
        channel.role,
        channel.status,
        channel.weight,
        channel.priority,
        channel.costPrice,
        channel.salePrice,
        channel.billingUnit,
        channel.latency,
        channel.successRate,
        channel.maxConcurrency ?? null,
        channel.timeoutMs ?? null,
        JSON.stringify(channel.supports ?? []),
      ]
    );

    const created = mapChannel(result.rows[0]);
    await this.initialize();
    return created;
  },

  async upsertPlatformModelSchemaField(platformModelId, field) {
    const model = this.getPlatformModel(platformModelId);
    if (!model) {
      return null;
    }

    const schema = Array.isArray(model.schema) ? [...model.schema] : [];
    const index = schema.findIndex((item) => item.key === field.key);
    if (index >= 0) {
      schema[index] = { ...schema[index], ...field };
    } else {
      schema.push(field);
    }

    const db = await getDb();
    const result = await db.query(
      `update platform_models
       set schema = $2::jsonb
       where id = $1
       returning id, name, short_name, modality, tier, description, use_cases, visible, recommended,
                 estimated_cost, estimated_time, sort_order, schema`,
      [platformModelId, JSON.stringify(schema)]
    );

    if (result.rowCount === 0) {
      return null;
    }

    const updated = mapPlatformModel(result.rows[0]);
    await this.initialize();
    return updated;
  },

  async upsertChannelMapping(mapping) {
    const db = await getDb();
    const result = await db.query(
      `insert into channel_parameter_mappings (
         id, channel_id, platform_param_key, upstream_param_key, transform, value_map, default_value, note
       )
       values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8)
       on conflict (channel_id, platform_param_key)
       do update set
         upstream_param_key = excluded.upstream_param_key,
         transform = excluded.transform,
         value_map = excluded.value_map,
         default_value = excluded.default_value,
         note = excluded.note
       returning id, channel_id, platform_param_key, upstream_param_key, transform, value_map, default_value, note`,
      [
        mapping.id,
        mapping.channelId,
        mapping.platform,
        mapping.upstream ?? null,
        mapping.transform,
        JSON.stringify(mapping.valueMap ?? {}),
        mapping.defaultValue === undefined ? null : JSON.stringify(mapping.defaultValue),
        mapping.note ?? null,
      ]
    );

    const saved = mapParameterMapping(result.rows[0]);
    await this.initialize();
    return saved;
  },

  listParameterMappings() {
    return cache.parameterMappings;
  },
};

function mapProvider(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    baseUrl: row.base_url,
    authType: row.auth_type,
    encryptedApiKey: row.encrypted_api_key,
    status: row.status,
    rpm: row.rpm,
    concurrency: row.concurrency,
    latencyMs: row.latency_ms,
    successRate: toNumber(row.success_rate),
  };
}

function mapProviderModel(row) {
  return {
    id: row.id,
    providerId: row.provider_id,
    upstreamModelName: row.upstream_model_name,
    endpointType: row.endpoint_type,
    modality: row.modality,
    status: row.status,
    rawCapabilities: parseJsonValue(row.raw_capabilities, {}),
    notes: row.notes,
  };
}

function mapPlatformModel(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    modality: row.modality,
    tier: row.tier,
    description: row.description,
    useCases: parseJsonValue(row.use_cases, []),
    visible: row.visible,
    recommended: row.recommended,
    estimatedCost: row.estimated_cost,
    estimatedTime: row.estimated_time,
    sortOrder: row.sort_order,
    schema: parseJsonValue(row.schema, []),
  };
}

function mapChannel(row) {
  return {
    id: row.id,
    platformModelId: row.platform_model_id,
    providerId: row.provider_id,
    providerModelId: row.provider_model_id,
    role: row.role,
    status: row.status,
    weight: row.weight,
    priority: row.priority,
    costPrice: toNumber(row.cost_price),
    salePrice: toNumber(row.sale_price),
    billingUnit: row.billing_unit,
    latency: toNumber(row.latency),
    successRate: toNumber(row.success_rate),
    maxConcurrency: row.max_concurrency,
    timeoutMs: row.timeout_ms,
    supports: parseJsonValue(row.supports, []),
  };
}

function mapParameterMapping(row) {
  return {
    id: row.id,
    channelId: row.channel_id,
    platform: row.platform_param_key,
    upstream: row.upstream_param_key,
    transform: row.transform,
    valueMap: parseJsonValue(row.value_map, {}),
    defaultValue: parseJsonValue(row.default_value, undefined),
    note: row.note,
  };
}

function mapFrontendConfig(row) {
  return {
    navItems: parseJsonValue(row.nav_items, []),
    capabilityMenu: parseJsonValue(row.capability_menu, []),
    defaultRouteMode: row.default_route_mode ?? "balanced",
  };
}

function parseJsonValue(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return value;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}
