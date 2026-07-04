# Tikpan Platform API Demo

这是 AI 聚合平台的最小后端骨架，用于验证：

- 平台模型和真实上游模型分离
- 多供应商渠道路由
- 参数映射
- 任务创建
- 预冻结和结算流水
- 用户侧 API 与管理后台 API 分层

当前版本使用内存数据，不依赖数据库和第三方包，方便先跑通业务结构。

## 运行

```bash
cd landing-page/api
npm run dev
```

默认地址：

```text
http://localhost:8787
```

语法检查：

```bash
npm run check
```

## 用户侧接口

```http
GET /health
GET /v1/capabilities
GET /v1/models/{platform_model_id}/schema
POST /v1/routes/preview
POST /v1/tasks
GET /v1/tasks/{task_id}
POST /v1/tasks/{task_id}/status
```

创建图片任务：

```bash
curl -X POST http://localhost:8787/v1/tasks ^
  -H "Content-Type: application/json" ^
  -d "{\"model\":\"tikpan.image.pro\",\"input\":{\"prompt\":\"明亮干净的护肤品商品图\",\"aspect_ratio\":\"1:1\",\"quality\":\"high\"},\"routing\":{\"mode\":\"quality\"}}"
```

返回里会同时包含：

- 用户可见任务信息
- 内部选择的供应商
- 真实上游模型
- 映射后的 payload
- 路由打分和被过滤渠道

## 管理后台接口

```http
GET /admin/providers
GET /admin/platform-models
GET /admin/provider-models
GET /admin/channels
GET /admin/tasks
GET /admin/wallet-ledger
```

## 文件结构

```text
api/src/store.mjs
  内存版 providers、provider_models、platform_models、model_channels、parameter_mappings

api/src/orchestrator.mjs
  任务校验、路由选择、参数映射、预冻结、任务状态推进

api/src/server.mjs
  Node HTTP API 服务、CORS、JSON 响应、Problem Details 错误格式
```

## 下一步接真实系统

1. 用 PostgreSQL 替换 `store.mjs`。
2. 给 `providers.encrypted_api_key` 加密保存。
3. 把 `advanceTask` 换成 Worker 队列。
4. 增加 R2/S3 预签名上传接口。
5. 增加真实 provider adapter。
6. 增加登录、钱包余额、支付订单和权限控制。
7. 前端从 `src/productData.ts` 切换到这些 API。
