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
  {
    id: "pm-tikpan-video-story",
    providerId: "cangyuan",
    upstreamModelName: "mock-video-story",
    endpointType: "video_generation",
    modality: "video",
    status: "active",
    rawCapabilities: {
      endpoint_path: "/v1/videos/generations",
      supports: ["prompt", "duration", "resolution", "first_frame", "motion"],
    },
    notes: "Mock video provider model for frontend capability verification.",
  },
  {
    id: "pm-tikpan-chat-assistant",
    providerId: "cangyuan",
    upstreamModelName: "mock-chat-assistant",
    endpointType: "chat_completions",
    modality: "chat",
    status: "active",
    rawCapabilities: {
      endpoint_path: "/v1/chat/completions",
      supports: ["message", "tone", "stream"],
    },
    notes: "Mock chat provider model for copywriting and assistant flows.",
  },
  {
    id: "pm-tikpan-audio-voice",
    providerId: "cangyuan",
    upstreamModelName: "mock-audio-voice",
    endpointType: "audio_generation",
    modality: "audio",
    status: "active",
    rawCapabilities: {
      endpoint_path: "/v1/audio/generations",
      supports: ["script", "voice", "speed"],
    },
    notes: "Mock audio provider model for voice generation.",
  },
  {
    id: "pm-tikpan-workflow-ecommerce",
    providerId: "cangyuan",
    upstreamModelName: "mock-ecommerce-workflow",
    endpointType: "workflow_run",
    modality: "workflow",
    status: "active",
    rawCapabilities: {
      endpoint_path: "/v1/workflows/ecommerce",
      supports: ["product", "package", "brand_tone"],
    },
    notes: "Mock workflow provider model for ecommerce asset packages.",
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
  {
    id: "tikpan.video.story",
    name: "视频生成 Story",
    shortName: "视频 Story",
    modality: "video",
    tier: "ultra",
    description: "把脚本、图片或概念变成短视频素材，适合产品展示、广告短片和动态海报。",
    useCases: ["图生视频", "产品展示", "广告短片", "动态海报"],
    visible: true,
    recommended: true,
    estimatedCost: "1.20 Tokens 起 / 5 秒",
    estimatedTime: "35-90 秒",
    sortOrder: 20,
    schema: [
      { key: "prompt", label: "视频描述", type: "textarea", required: true },
      { key: "duration", label: "视频时长", type: "segmented", defaultValue: "5", options: ["5", "8", "10"] },
      { key: "resolution", label: "清晰度", type: "select", defaultValue: "720p", options: ["720p", "1080p"] },
      { key: "first_frame", label: "首帧图片", type: "file", advanced: true },
      { key: "motion", label: "运动强度", type: "slider", defaultValue: 6, min: 1, max: 10, step: 1, advanced: true },
    ],
  },
  {
    id: "tikpan.chat.assistant",
    name: "文案创作 Assistant",
    shortName: "文案助手",
    modality: "chat",
    tier: "standard",
    description: "面向营销、脚本和客服回复的文本助手，可在后台配置语气、长度和输出结构。",
    useCases: ["标题生成", "种草文案", "脚本扩写", "客服回复"],
    visible: true,
    recommended: true,
    estimatedCost: "按 Tokens 用量计费",
    estimatedTime: "实时响应",
    sortOrder: 30,
    schema: [
      { key: "message", label: "创作需求", type: "textarea", required: true },
      { key: "tone", label: "回答风格", type: "select", defaultValue: "natural", options: ["natural", "pro", "marketing"] },
      { key: "stream", label: "流式输出", type: "switch", defaultValue: true, advanced: true },
    ],
  },
  {
    id: "tikpan.audio.voice",
    name: "声音生成 Voice",
    shortName: "声音 Voice",
    modality: "audio",
    tier: "standard",
    description: "为短视频、课程和广告生成自然旁白，支持声音类型和语速配置。",
    useCases: ["中文配音", "课程旁白", "广告口播"],
    visible: true,
    recommended: false,
    estimatedCost: "0.06 Tokens 起 / 百字",
    estimatedTime: "3-8 秒",
    sortOrder: 40,
    schema: [
      { key: "script", label: "配音文案", type: "textarea", required: true },
      { key: "voice", label: "声音类型", type: "select", defaultValue: "warm_female", options: ["warm_female", "calm_male", "bright"] },
      { key: "speed", label: "语速", type: "slider", defaultValue: 1, min: 0.75, max: 1.5, step: 0.05 },
    ],
  },
  {
    id: "tikpan.workflow.ecommerce",
    name: "电商素材工作流",
    shortName: "电商工作流",
    modality: "workflow",
    tier: "pro",
    description: "一次生成商品图、卖点文案和短视频脚本，适合商品上新和投放素材准备。",
    useCases: ["商品上新", "详情页素材", "投放素材", "直播预热"],
    visible: true,
    recommended: false,
    estimatedCost: "2.80 Tokens 起 / 套",
    estimatedTime: "1-3 分钟",
    sortOrder: 50,
    schema: [
      { key: "product", label: "商品信息", type: "textarea", required: true },
      { key: "package", label: "输出内容", type: "select", defaultValue: "starter", options: ["starter", "ads", "launch"] },
      { key: "brand_tone", label: "品牌调性", type: "text" },
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
  {
    id: "ch-video-story",
    platformModelId: "tikpan.video.story",
    providerId: "cangyuan",
    providerModelId: "pm-tikpan-video-story",
    role: "primary",
    status: "active",
    weight: 80,
    priority: 1,
    costPrice: 0.82,
    salePrice: 1.2,
    billingUnit: "second",
    latency: 42,
    successRate: 96.8,
    supports: ["prompt", "duration", "resolution", "first_frame", "motion"],
    timeoutMs: 180000,
  },
  {
    id: "ch-chat-assistant",
    platformModelId: "tikpan.chat.assistant",
    providerId: "cangyuan",
    providerModelId: "pm-tikpan-chat-assistant",
    role: "cheap",
    status: "active",
    weight: 75,
    priority: 1,
    costPrice: 0.02,
    salePrice: 0.05,
    billingUnit: "request",
    latency: 2.2,
    successRate: 98.5,
    supports: ["message", "tone", "stream"],
    timeoutMs: 60000,
  },
  {
    id: "ch-audio-voice",
    platformModelId: "tikpan.audio.voice",
    providerId: "cangyuan",
    providerModelId: "pm-tikpan-audio-voice",
    role: "primary",
    status: "active",
    weight: 70,
    priority: 1,
    costPrice: 0.03,
    salePrice: 0.06,
    billingUnit: "request",
    latency: 8,
    successRate: 97.7,
    supports: ["script", "voice", "speed"],
    timeoutMs: 90000,
  },
  {
    id: "ch-workflow-ecommerce",
    platformModelId: "tikpan.workflow.ecommerce",
    providerId: "cangyuan",
    providerModelId: "pm-tikpan-workflow-ecommerce",
    role: "quality",
    status: "active",
    weight: 65,
    priority: 1,
    costPrice: 1.5,
    salePrice: 2.8,
    billingUnit: "workflow",
    latency: 90,
    successRate: 95.6,
    supports: ["product", "package", "brand_tone"],
    timeoutMs: 240000,
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
  { channelId: "ch-video-story", platform: "model", upstream: "model", transform: "default", defaultValue: "mock-video-story" },
  { channelId: "ch-video-story", platform: "prompt", upstream: "prompt", transform: "direct" },
  { channelId: "ch-video-story", platform: "duration", upstream: "duration", transform: "direct", defaultValue: "5" },
  { channelId: "ch-video-story", platform: "resolution", upstream: "resolution", transform: "direct", defaultValue: "720p" },
  { channelId: "ch-video-story", platform: "first_frame", upstream: "first_frame", transform: "direct" },
  { channelId: "ch-video-story", platform: "motion", upstream: "motion", transform: "direct", defaultValue: 6 },
  { channelId: "ch-chat-assistant", platform: "model", upstream: "model", transform: "default", defaultValue: "mock-chat-assistant" },
  { channelId: "ch-chat-assistant", platform: "message", upstream: "messages", transform: "template" },
  { channelId: "ch-chat-assistant", platform: "tone", upstream: "system", transform: "template", defaultValue: "natural" },
  { channelId: "ch-chat-assistant", platform: "stream", upstream: "stream", transform: "direct", defaultValue: true },
  { channelId: "ch-audio-voice", platform: "model", upstream: "model", transform: "default", defaultValue: "mock-audio-voice" },
  { channelId: "ch-audio-voice", platform: "script", upstream: "input", transform: "direct" },
  { channelId: "ch-audio-voice", platform: "voice", upstream: "voice", transform: "direct", defaultValue: "warm_female" },
  { channelId: "ch-audio-voice", platform: "speed", upstream: "speed", transform: "direct", defaultValue: 1 },
  { channelId: "ch-workflow-ecommerce", platform: "model", upstream: "model", transform: "default", defaultValue: "mock-ecommerce-workflow" },
  { channelId: "ch-workflow-ecommerce", platform: "product", upstream: "product", transform: "direct" },
  { channelId: "ch-workflow-ecommerce", platform: "package", upstream: "package", transform: "direct", defaultValue: "starter" },
  { channelId: "ch-workflow-ecommerce", platform: "brand_tone", upstream: "brand_tone", transform: "direct" },
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
      modelIds: ["tikpan.video.story"],
      visible: true,
      sortOrder: 20,
    },
    {
      key: "copywriting",
      label: "文案",
      description: "标题、种草文案、脚本、详情页和营销内容。",
      icon: "file-text",
      modelIds: ["tikpan.chat.assistant"],
      visible: true,
      sortOrder: 30,
    },
    {
      key: "audio",
      label: "音频",
      description: "配音、旁白、口播和播客内容。",
      icon: "audio",
      modelIds: ["tikpan.audio.voice"],
      visible: true,
      sortOrder: 40,
    },
    {
      key: "office",
      label: "办公",
      description: "文档、表格、PPT 和团队知识处理。",
      icon: "office",
      modelIds: ["tikpan.chat.assistant"],
      visible: true,
      sortOrder: 50,
    },
    {
      key: "agent",
      label: "Agent",
      description: "可配置的智能体、角色和自动执行助手。",
      icon: "bot",
      modelIds: ["tikpan.chat.assistant"],
      visible: true,
      sortOrder: 60,
    },
    {
      key: "workflow",
      label: "工作流",
      description: "把图片、视频、文案和业务动作编排成复用流程。",
      icon: "workflow",
      modelIds: ["tikpan.workflow.ecommerce"],
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
