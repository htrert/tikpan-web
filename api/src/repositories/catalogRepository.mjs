import {
  getChannelMappings,
  getPlatformModel,
  getProvider,
  getProviderModel,
  listChannelsForModel,
  modelChannels,
  parameterMappings,
  platformModels,
  providerModels,
  providers,
} from "../store.mjs";

export const catalogRepository = {
  listProviders() {
    return providers;
  },

  listPlatformModels() {
    return platformModels;
  },

  listProviderModels() {
    return providerModels;
  },

  listChannels() {
    return modelChannels;
  },

  getProvider(id) {
    return getProvider(id);
  },

  getProviderModel(id) {
    return getProviderModel(id);
  },

  getPlatformModel(id) {
    return getPlatformModel(id);
  },

  upsertProvider(provider) {
    const index = providers.findIndex((item) => item.id === provider.id);
    if (index >= 0) {
      providers[index] = { ...providers[index], ...provider };
      return providers[index];
    }

    providers.push(provider);
    return provider;
  },

  upsertProviderModel(providerModel) {
    const index = providerModels.findIndex((item) => item.id === providerModel.id);
    if (index >= 0) {
      providerModels[index] = { ...providerModels[index], ...providerModel };
      return providerModels[index];
    }

    providerModels.push(providerModel);
    return providerModel;
  },

  upsertPlatformModel(platformModel) {
    const index = platformModels.findIndex((item) => item.id === platformModel.id);
    if (index >= 0) {
      platformModels[index] = { ...platformModels[index], ...platformModel };
      return platformModels[index];
    }

    platformModels.push(platformModel);
    platformModels.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return platformModel;
  },

  listChannelsForModel(platformModelId) {
    return listChannelsForModel(platformModelId);
  },

  getChannelMappings(channelId) {
    return getChannelMappings(channelId);
  },

  getChannel(id) {
    return modelChannels.find((channel) => channel.id === id);
  },

  createChannel(channel) {
    modelChannels.push(channel);
    return channel;
  },

  upsertPlatformModelSchemaField(platformModelId, field) {
    const model = getPlatformModel(platformModelId);
    if (!model) {
      return null;
    }

    const schema = Array.isArray(model.schema) ? model.schema : [];
    const index = schema.findIndex((item) => item.key === field.key);
    if (index >= 0) {
      schema[index] = { ...schema[index], ...field };
    } else {
      schema.push(field);
    }
    model.schema = schema;
    return model;
  },

  upsertChannelMapping(mapping) {
    const index = parameterMappings.findIndex(
      (item) => item.channelId === mapping.channelId && item.platform === mapping.platform
    );

    if (index >= 0) {
      parameterMappings[index] = { ...parameterMappings[index], ...mapping };
      return parameterMappings[index];
    }

    parameterMappings.push(mapping);
    return mapping;
  },

  listParameterMappings() {
    return parameterMappings;
  },
};
