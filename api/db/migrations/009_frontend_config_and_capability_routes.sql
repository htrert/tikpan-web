-- Persist frontend navigation/capability configuration and seed the same
-- multi-capability demo routes used by the in-memory repository.

begin;

create table if not exists frontend_configs (
  id text primary key,
  nav_items jsonb not null default '[]',
  capability_menu jsonb not null default '[]',
  default_route_mode text not null default 'balanced',
  updated_at timestamptz not null default now()
);

insert into frontend_configs (id, nav_items, capability_menu, default_route_mode, updated_at)
values (
  'default',
  '[
    {"key":"workspace","label":"创作工作台","visible":true,"sortOrder":10},
    {"key":"explore","label":"探索/市场","visible":true,"sortOrder":20},
    {"key":"library","label":"作品库","visible":true,"sortOrder":30}
  ]',
  '[
    {"key":"image","label":"图片","description":"AI 绘图、商品图、局部重绘、扩图、高清修复和换背景。","icon":"image","modelIds":["tikpan.image.gpt-image-2-4k"],"visible":true,"sortOrder":10},
    {"key":"video","label":"视频","description":"文生视频、图生视频、产品短片和动态海报。","icon":"video","modelIds":["tikpan.video.story"],"visible":true,"sortOrder":20},
    {"key":"copywriting","label":"文案","description":"标题、种草文案、脚本、详情页和营销内容。","icon":"file-text","modelIds":["tikpan.chat.assistant"],"visible":true,"sortOrder":30},
    {"key":"audio","label":"音频","description":"配音、旁白、口播和播客内容。","icon":"audio","modelIds":["tikpan.audio.voice"],"visible":true,"sortOrder":40},
    {"key":"office","label":"办公","description":"文档、表格、PPT 和团队知识处理。","icon":"office","modelIds":["tikpan.chat.assistant"],"visible":true,"sortOrder":50},
    {"key":"agent","label":"Agent","description":"可配置的智能体、角色和自动执行助手。","icon":"bot","modelIds":["tikpan.chat.assistant"],"visible":true,"sortOrder":60},
    {"key":"workflow","label":"工作流","description":"把图片、视频、文案和业务动作编排成复用流程。","icon":"workflow","modelIds":["tikpan.workflow.ecommerce"],"visible":true,"sortOrder":70}
  ]',
  'balanced',
  now()
)
on conflict (id)
do update set
  nav_items = excluded.nav_items,
  capability_menu = excluded.capability_menu,
  default_route_mode = excluded.default_route_mode,
  updated_at = now();

insert into provider_models (id, provider_id, upstream_model_name, endpoint_type, modality, status, raw_capabilities, notes)
values
  ('pm-tikpan-audio-voice', 'cangyuan', 'mock-audio-voice', 'audio_generation', 'audio', 'active', '{"endpoint_path":"/v1/audio/generations","supports":["script","voice","speed"]}', 'Mock audio provider model for voice generation.'),
  ('pm-tikpan-workflow-ecommerce', 'cangyuan', 'mock-ecommerce-workflow', 'workflow_run', 'workflow', 'active', '{"endpoint_path":"/v1/workflows/ecommerce","supports":["product","package","brand_tone"]}', 'Mock workflow provider model for ecommerce asset packages.')
on conflict (id)
do update set
  upstream_model_name = excluded.upstream_model_name,
  endpoint_type = excluded.endpoint_type,
  modality = excluded.modality,
  status = excluded.status,
  raw_capabilities = excluded.raw_capabilities,
  notes = excluded.notes,
  updated_at = now();

insert into platform_models (
  id, name, short_name, modality, tier, description, use_cases,
  visible, recommended, estimated_cost, estimated_time, sort_order, schema
)
values
  (
    'tikpan.audio.voice',
    '声音生成 Voice',
    '声音 Voice',
    'audio',
    'standard',
    '为短视频、课程和广告生成自然旁白，支持声音类型和语速配置。',
    '["中文配音","课程旁白","广告口播"]',
    true,
    false,
    '0.06 Tokens 起 / 百字',
    '3-8 秒',
    40,
    '[
      {"key":"script","label":"配音文案","type":"textarea","required":true},
      {"key":"voice","label":"声音类型","type":"select","defaultValue":"warm_female","options":["warm_female","calm_male","bright"]},
      {"key":"speed","label":"语速","type":"slider","defaultValue":1,"min":0.75,"max":1.5,"step":0.05}
    ]'
  ),
  (
    'tikpan.workflow.ecommerce',
    '电商素材工作流',
    '电商工作流',
    'workflow',
    'pro',
    '一次生成商品图、卖点文案和短视频脚本，适合商品上新和投放素材准备。',
    '["商品上新","详情页素材","投放素材","直播预热"]',
    true,
    false,
    '2.80 Tokens 起 / 套',
    '1-3 分钟',
    50,
    '[
      {"key":"product","label":"商品信息","type":"textarea","required":true},
      {"key":"package","label":"输出内容","type":"select","defaultValue":"starter","options":["starter","ads","launch"]},
      {"key":"brand_tone","label":"品牌调性","type":"text"}
    ]'
  )
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
  updated_at = now();

insert into model_channels (
  id, platform_model_id, provider_id, provider_model_id, role, status, weight, priority,
  cost_price, sale_price, billing_unit, latency, success_rate, supports
)
values
  ('ch-audio-voice', 'tikpan.audio.voice', 'cangyuan', 'pm-tikpan-audio-voice', 'primary', 'active', 70, 1, 0.03, 0.06, 'request', 8, 97.7, '["script","voice","speed"]'),
  ('ch-workflow-ecommerce', 'tikpan.workflow.ecommerce', 'cangyuan', 'pm-tikpan-workflow-ecommerce', 'quality', 'active', 65, 1, 1.5, 2.8, 'workflow', 90, 95.6, '["product","package","brand_tone"]')
on conflict (id)
do update set
  platform_model_id = excluded.platform_model_id,
  provider_id = excluded.provider_id,
  provider_model_id = excluded.provider_model_id,
  role = excluded.role,
  status = excluded.status,
  weight = excluded.weight,
  priority = excluded.priority,
  cost_price = excluded.cost_price,
  sale_price = excluded.sale_price,
  billing_unit = excluded.billing_unit,
  latency = excluded.latency,
  success_rate = excluded.success_rate,
  supports = excluded.supports,
  updated_at = now();

insert into channel_parameter_mappings (
  id, channel_id, platform_param_key, upstream_param_key, transform, value_map, default_value, note
)
values
  ('map-audio-model', 'ch-audio-voice', 'model', 'model', 'default', '{}', '"mock-audio-voice"', null),
  ('map-audio-script', 'ch-audio-voice', 'script', 'input', 'direct', '{}', null, null),
  ('map-audio-voice', 'ch-audio-voice', 'voice', 'voice', 'direct', '{}', '"warm_female"', null),
  ('map-audio-speed', 'ch-audio-voice', 'speed', 'speed', 'direct', '{}', '1', null),
  ('map-workflow-model', 'ch-workflow-ecommerce', 'model', 'model', 'default', '{}', '"mock-ecommerce-workflow"', null),
  ('map-workflow-product', 'ch-workflow-ecommerce', 'product', 'product', 'direct', '{}', null, null),
  ('map-workflow-package', 'ch-workflow-ecommerce', 'package', 'package', 'direct', '{}', '"starter"', null),
  ('map-workflow-brand-tone', 'ch-workflow-ecommerce', 'brand_tone', 'brand_tone', 'direct', '{}', null, null)
on conflict (channel_id, platform_param_key)
do update set
  upstream_param_key = excluded.upstream_param_key,
  transform = excluded.transform,
  value_map = excluded.value_map,
  default_value = excluded.default_value,
  note = excluded.note;

commit;
