export const providers = [
  {
    id: "cangyuan",
    name: "沧元算力",
    kind: "relay",
    baseUrl: "https://ai.cangyuansuanli.cn",
    authType: "bearer",
    status: "active",
    rpm: 60,
    concurrency: 2,
    latencyMs: 1800,
    successRate: 98,
    timeoutMs: 120000,
  },
];

export const providerModels = [
  {
    id: "pm-cangyuan-gpt-image-2-4k",
    providerId: "cangyuan",
    upstreamModelName: "cy-img2-gpt-image-2-4k",
    endpointType: "image_generation",
    modality: "image",
    status: "active",
    rawCapabilities: {
      display_model: "gpt-image-2-4k",
      endpoint_path: "/v1/images/generations",
      async_poll: true,
      poll_status_path: "/v1/images/generations/{task_id}",
      poll_interval_ms: 1500,
      compatible: "openai-gpt-image",
      supports: [
        "prompt",
        "size",
        "n",
        "quality",
        "background",
        "output_format",
        "output_compression",
        "moderation",
        "stream",
        "partial_images",
        "async",
      ],
    },
    notes: "Cangyuan gpt-image-2-4k text-to-image async mode.",
  },
];

export const platformModels = [
  {
    id: "tikpan.image.gpt-image-2-4k",
    name: "GPT Image 2 4K",
    shortName: "Image 2 4K",
    modality: "image",
    tier: "pro",
    description: "适合高分辨率商品图、广告海报和社媒封面，可在后台自定义前台展示名称、简介和参数。",
    useCases: ["商品主图", "广告海报", "社媒封面"],
    visible: true,
    recommended: true,
    estimatedCost: "0.08 Tokens / 张",
    estimatedTime: "异步生成",
    sortOrder: 10,
    schema: [
      { key: "prompt", label: "画面描述", type: "textarea", required: true },
      {
        key: "size",
        label: "尺寸",
        type: "select",
        defaultValue: "auto",
        options: ["auto", "1024x1024", "1536x1024", "1024x1536", "2048x2048", "3840x2160"],
      },
      {
        key: "quality",
        label: "画质",
        type: "segmented",
        defaultValue: "auto",
        options: ["auto", "low", "medium", "high"],
      },
      { key: "n", label: "生成张数", type: "slider", defaultValue: 1, min: 1, max: 10, step: 1 },
      {
        key: "background",
        label: "背景",
        type: "segmented",
        defaultValue: "opaque",
        options: ["auto", "opaque"],
      },
      {
        key: "output_format",
        label: "输出格式",
        type: "segmented",
        defaultValue: "png",
        options: ["png", "jpeg", "webp"],
      },
      {
        key: "output_compression",
        label: "压缩质量",
        type: "slider",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        advanced: true,
      },
      {
        key: "moderation",
        label: "内容审核",
        type: "segmented",
        defaultValue: "auto",
        options: ["auto", "low"],
        advanced: true,
      },
      { key: "stream", label: "流式返回", type: "switch", defaultValue: false, advanced: true },
      { key: "partial_images", label: "部分预览图", type: "slider", defaultValue: 0, min: 0, max: 3, step: 1, advanced: true },
      { key: "async", label: "异步模式", type: "switch", defaultValue: true, advanced: true },
    ],
  },
];

export const modelChannels = [
  {
    id: "ch-cangyuan-gpt-image-2-4k",
    platformModelId: "tikpan.image.gpt-image-2-4k",
    providerId: "cangyuan",
    providerModelId: "pm-cangyuan-gpt-image-2-4k",
    role: "primary",
    status: "active",
    weight: 100,
    priority: 1,
    costPrice: 0.08,
    salePrice: 0.08,
    billingUnit: "image",
    latency: 18,
    successRate: 98,
    supports: [
      "prompt",
      "size",
      "n",
      "quality",
      "background",
      "output_format",
      "output_compression",
      "moderation",
      "stream",
      "partial_images",
      "async",
    ],
    timeoutMs: 120000,
  },
];

export const parameterMappings = [
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "model", upstream: "model", transform: "default", defaultValue: "cy-img2-gpt-image-2-4k" },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "prompt", upstream: "prompt", transform: "direct" },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "size", upstream: "size", transform: "direct", defaultValue: "auto" },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "n", upstream: "n", transform: "direct", defaultValue: 1 },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "quality", upstream: "quality", transform: "direct", defaultValue: "auto" },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "background", upstream: "background", transform: "direct", defaultValue: "opaque" },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "output_format", upstream: "output_format", transform: "direct", defaultValue: "png" },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "output_compression", upstream: "output_compression", transform: "direct", defaultValue: 100 },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "moderation", upstream: "moderation", transform: "direct", defaultValue: "auto" },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "stream", upstream: "stream", transform: "direct", defaultValue: false },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "partial_images", upstream: "partial_images", transform: "direct", defaultValue: 0 },
  { channelId: "ch-cangyuan-gpt-image-2-4k", platform: "async", upstream: "async", transform: "direct", defaultValue: true },
];

export const frontendConfig = {
  navItems: [
    { key: "workspace", label: "创作工作台", visible: true, sortOrder: 10 },
    { key: "explore", label: "探索/市场", visible: true, sortOrder: 20 },
    { key: "library", label: "作品库", visible: true, sortOrder: 30 },
  ],
  capabilityMenu: [
    {
      key: "image",
      label: "图片",
      description: "AI 绘图、商品图、局部重绘、扩图、高清修复和换背景。",
      icon: "image",
      modelIds: ["tikpan.image.gpt-image-2-4k"],
      visible: true,
      sortOrder: 10,
    },
    {
      key: "video",
      label: "视频",
      description: "文生视频、图生视频、产品短片和动态海报。",
      icon: "video",
      modelIds: [],
      visible: true,
      sortOrder: 20,
    },
    {
      key: "copywriting",
      label: "文案",
      description: "标题、种草文案、脚本、详情页和营销内容。",
      icon: "file-text",
      modelIds: [],
      visible: true,
      sortOrder: 30,
    },
    {
      key: "audio",
      label: "音频",
      description: "配音、旁白、口播和播客内容。",
      icon: "audio",
      modelIds: [],
      visible: true,
      sortOrder: 40,
    },
    {
      key: "office",
      label: "办公",
      description: "文档、表格、PPT 和团队知识处理。",
      icon: "office",
      modelIds: [],
      visible: true,
      sortOrder: 50,
    },
    {
      key: "agent",
      label: "Agent",
      description: "可配置的智能体、角色和自动执行助手。",
      icon: "bot",
      modelIds: [],
      visible: true,
      sortOrder: 60,
    },
    {
      key: "workflow",
      label: "工作流",
      description: "把图片、视频、文案和业务动作编排成复用流程。",
      icon: "workflow",
      modelIds: [],
      visible: true,
      sortOrder: 70,
    },
  ],
  defaultRouteMode: "balanced",
};

export const tasks = [];
export const presets = [];
export const assetMetadata = [];

export const users = [
  {
    id: "demo_user",
    displayName: "Demo User",
    email: "demo@tikpan.local",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const billingPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyTaskLimit: 120,
    monthlySpendLimit: 30,
    rateLimitPerMinute: 20,
    concurrencyLimit: 2,
    features: ["image", "video"],
    status: "active",
  },
];

export const userSubscriptions = [
  {
    id: "sub_demo_starter",
    userId: "demo_user",
    planId: "starter",
    status: "active",
    renewsAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  },
];

export const rateLimitBuckets = [];

export const wallets = [
  {
    userId: "demo_user",
    currency: "TOKENS",
    balance: 8.8,
    frozen: 0,
    updatedAt: new Date().toISOString(),
  },
];

export const walletLedger = [
  {
    id: "ledger_seed_balance",
    userId: "demo_user",
    taskId: null,
    type: "top_up",
    amount: 8.8,
    balanceAfter: 8.8,
    frozenAfter: 0,
    note: "Demo initial balance",
    createdAt: new Date().toISOString(),
  },
];

export const paymentOrders = [];

export const paymentProviders = [
  {
    id: "mock",
    name: "Mock Pay",
    kind: "mock",
    status: "active",
    currencies: ["TOKENS"],
    feeRate: 0,
    fixedFee: 0,
    minAmount: 0.01,
    maxAmount: 999999,
    checkoutMode: "mock",
    webhookSecret: "tikpan_mock_webhook_secret",
    sortOrder: 10,
    metadata: { settlement: "instant" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const apiKeys = [
  {
    id: "key_demo_default",
    userId: "demo_user",
    name: "Default Demo Key",
    prefix: "tk_demo",
    secret: "tk_demo_sk_live_demo123456",
    status: "active",
    scopes: ["tasks:create", "wallet:read"],
    lastUsedAt: null,
    createdAt: new Date().toISOString(),
  },
];

export const webhookEndpoints = [];
export const webhookDeliveries = [];

export const auditLogs = [
  {
    id: "audit_seed_catalog",
    actorId: "system",
    actorType: "system",
    action: "catalog.seeded",
    resourceType: "platform",
    resourceId: "memory",
    userId: null,
    summary: "Seeded Cangyuan gpt-image-2-4k single-channel catalog.",
    metadata: {
      providers: providers.length,
      platformModels: platformModels.length,
      channels: modelChannels.length,
    },
    createdAt: new Date().toISOString(),
  },
];

export function getProvider(id) {
  return providers.find((provider) => provider.id === id);
}

export function getProviderModel(id) {
  return providerModels.find((model) => model.id === id);
}

export function getPlatformModel(id) {
  return platformModels.find((model) => model.id === id);
}

export function getChannelMappings(channelId) {
  return parameterMappings.filter((mapping) => mapping.channelId === channelId);
}

export function listChannelsForModel(platformModelId) {
  return modelChannels.filter((channel) => channel.platformModelId === platformModelId);
}

export function getWallet(userId = "demo_user") {
  let wallet = wallets.find((item) => item.userId === userId);
  if (!wallet) {
    wallet = {
      userId,
      currency: "TOKENS",
      balance: 0,
      frozen: 0,
      updatedAt: new Date().toISOString(),
    };
    wallets.push(wallet);
  }

  return wallet;
}

export function listApiKeys(userId = "demo_user") {
  return apiKeys.filter((key) => key.userId === userId);
}

export function findApiKey(secret) {
  return apiKeys.find((key) => key.secret === secret);
}

export function getBillingPlan(id) {
  return billingPlans.find((plan) => plan.id === id);
}

export function getUserSubscription(userId = "demo_user") {
  let subscription = userSubscriptions.find((item) => item.userId === userId);
  if (!subscription) {
    subscription = {
      id: `sub_${userId}`,
      userId,
      planId: "starter",
      status: "active",
      renewsAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    };
    userSubscriptions.push(subscription);
  }

  return subscription;
}
