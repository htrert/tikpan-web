export const adminProvider = {
  id: "cangyuan",
  name: "沧元算力",
  baseUrl: "https://ai.cangyuansuanli.cn",
  authType: "Bearer Token",
  status: "active",
  concurrency: 2,
  timeoutMs: 120000,
};

export const adminPlatformModel = {
  id: "tikpan.image.gpt-image-2-4k",
  name: "GPT Image 2 4K",
  displayName: "GPT Image 2 4K",
  category: "图片模型",
  description: "适合高分辨率商品图、广告海报和社媒封面，可在后台按业务包装展示文案。",
  useCaseText: "商品主图，广告海报，社媒封面",
  visible: true,
  estimatedCost: "0.08 Tokens / 张",
  upstreamModelId: "cy-img2-gpt-image-2-4k",
  endpointPath: "/v1/images/generations",
  pollPath: "/v1/images/generations/{task_id}",
};

export const adminParameters = [
  { key: "prompt", label: "画面描述", type: "textarea", required: true, defaultValue: "", upstream: "prompt", transform: "direct" },
  { key: "size", label: "尺寸", type: "select", required: false, defaultValue: "auto", upstream: "size", transform: "direct" },
  { key: "quality", label: "画质", type: "segmented", required: false, defaultValue: "auto", upstream: "quality", transform: "direct" },
  { key: "n", label: "生成张数", type: "number", required: false, defaultValue: "1", upstream: "n", transform: "direct" },
  { key: "background", label: "背景", type: "segmented", required: false, defaultValue: "opaque", upstream: "background", transform: "direct" },
  { key: "output_format", label: "输出格式", type: "segmented", required: false, defaultValue: "png", upstream: "output_format", transform: "direct" },
  { key: "output_compression", label: "压缩质量", type: "slider", required: false, defaultValue: "100", upstream: "output_compression", transform: "direct" },
  { key: "moderation", label: "内容审核", type: "segmented", required: false, defaultValue: "auto", upstream: "moderation", transform: "direct" },
  { key: "stream", label: "流式返回", type: "switch", required: false, defaultValue: "false", upstream: "stream", transform: "direct" },
  { key: "partial_images", label: "部分预览图", type: "number", required: false, defaultValue: "0", upstream: "partial_images", transform: "direct" },
  { key: "async", label: "异步模式", type: "switch", required: false, defaultValue: "true", upstream: "async", transform: "direct" },
];

export const adminNavGroups = [
  {
    title: "控制台",
    items: [
      { key: "dashboard", label: "数据看板" },
      { key: "api-token", label: "API 令牌" },
      { key: "app-code", label: "应用码" },
      { key: "usage-logs", label: "使用日志" },
      { key: "drawing-logs", label: "绘图日志" },
      { key: "task-logs", label: "任务日志" },
    ],
  },
  {
    title: "个人中心",
    items: [
      { key: "wallet", label: "钱包" },
      { key: "consumption", label: "消费清单" },
      { key: "personal-settings", label: "个人设置" },
      { key: "tickets", label: "我的工单" },
    ],
  },
  {
    title: "管理员",
    items: [
      { key: "core-admin", label: "核心管理" },
      { key: "admin-panel", label: "管理面板" },
      { key: "users", label: "用户管理" },
    ],
  },
  {
    title: "业务运营",
    items: [
      { key: "home", label: "首页" },
      { key: "model-market", label: "模型市场" },
      { key: "contact", label: "联系我们" },
      { key: "api-docs", label: "API 文档" },
      { key: "tutorial", label: "使用教程" },
    ],
  },
];

export const adminProfile = {
  uid: "247268",
  name: "管理员 U",
  role: "服务商",
  group: "default",
  balance: 13.03,
  spent: 140.38,
  requests: 789,
  verified: true,
};

export const adminModelProviders = [
  { name: "全部模型", count: 484, models: ["claude-fable-5", "claude-opus-4.8", "gpt-5.5", "gemini-3.1-pro", "deepseek-v4-pro"] },
  { name: "OpenAI", count: 148, models: ["gpt-5.5", "gpt-image-2", "gpt-5-codex", "gpt-5.1-codex"] },
  { name: "Anthropic", count: 15, models: ["claude-fable-5", "claude-opus-4.8", "claude-sonnet-5", "claude-haiku-4.5"] },
  { name: "Gemini", count: 33, models: ["gemini-3.1-pro", "gemini-2.5-flash", "gemini-image-preview"] },
  { name: "DeepSeek", count: 20, models: ["deepseek-v4-pro", "deepseek-r1", "deepseek-chat"] },
  { name: "Midjourney", count: 16, models: ["midjourney-v7", "niji-v6", "mj-fast"] },
  { name: "豆包", count: 23, models: ["doubao-seedream", "doubao-video", "doubao-lite"] },
  { name: "通义千问", count: 69, models: ["qwen-max", "qwen-vl", "wanx-image"] },
];

export const adminRecentLogs = [
  { id: "log-1", type: "图像生成", user: "247268", model: "图像生成 Pro", status: "成功", tokens: 0.18, time: "今天 14:20" },
  { id: "log-2", type: "短视频分镜", user: "247268", model: "视频生成 Story", status: "排队", tokens: 1.5, time: "今天 13:52" },
  { id: "log-3", type: "文案助手", user: "102938", model: "爆款文案助手", status: "成功", tokens: 0.08, time: "今天 13:40" },
  { id: "log-4", type: "任务取消", user: "247268", model: "商品图生成", status: "已退回", tokens: 0.22, time: "昨天 18:44" },
];
