<p align="center">
  <img src="https://img.shields.io/badge/tikpan--web-v1.0.0-2cf0b6?style=for-the-badge" alt="version">
  <img src="https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask" alt="flask">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python" alt="python">
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker" alt="docker">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="license">
</p>

<h1 align="center">tikpan-web</h1>
<p align="center">攀升AI 模型聚合网站后端 · Flask · 多渠道路由 · 商业化就绪</p>

---

## 这是什么

**tikpan-web** 是 [攀升AI (tikpan.com)](https://tikpan.com) 的网站后端服务。用户在前台选择 AI 模型、填写参数、上传素材，后端把请求路由到对应的上游 API（GPT Image、Gemini、Suno、Veo 等），扣除余额，返回结果。

**核心能力：**
- 多模型聚合：图片生成/编辑、视频生成、音频生成统一接口
- 多渠道路由：按模型、优先级、可用性自动选择上游渠道
- 商业化基础：用户注册登录、余额充值、消费流水、请求幂等
- 管理后台：模型配置、定价管理、用户管理、渠道状态
- Docker 部署：Dockerfile + docker-compose + Nginx 配置一体化

---

## 技术栈

| 层 | 技术 |
|---|---|
| Web 框架 | Flask 3.0 |
| 数据库 | SQLite（开发）/ PostgreSQL（生产推荐）|
| 认证 | JWT + 邮箱验证码 |
| 部署 | Docker + Gunicorn + Nginx |
| 存储 | 本地 / 阿里云 OSS（可选）|

---

## 快速启动（开发模式）

```bash
cd tikpan-web

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate      # Mac/Linux
# 或 .venv\Scripts\activate    # Windows

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python scripts/init_db.py

# 启动开发服务器
python app.py
```

访问 `http://127.0.0.1:5000`

---

## 目录结构

```
tikpan-web/
├── app.py                   Flask 主入口
├── config.py                配置（从环境变量读取）
├── requirements.txt         依赖清单
│
├── api/                     前台 API 路由
│   ├── auth.py              注册、登录、验证码
│   ├── generate.py          生成任务（图片/视频/音频）
│   ├── payment.py           充值、余额查询
│   ├── audio.py             音频相关
│   └── agent.py             代理模式
│
├── backend/                 内部逻辑
│   ├── handlers.py          上游请求处理、渠道路由
│   ├── database.py          数据库操作
│   ├── admin.py             管理后台路由
│   └── storage.py           文件存储（本地/OSS）
│
├── core/                    基础能力
│   ├── auth.py              JWT、权限校验
│   ├── billing.py           余额扣除、流水记录
│   └── security.py          加密、幂等键
│
├── models/                  数据库表结构
├── services/                第三方服务（邮件、OAuth）
├── catalog/                 模型目录（同步自 ComfyUI 节点）
│
├── templates/               前端页面（Jinja2）
│   ├── index.html           用户前台
│   ├── admin.html           管理后台
│   └── admin_login.html     后台登录
│
├── data/
│   ├── schema.sql           数据库建表语句
│   └── seed.example.json    初始数据示例
│
├── scripts/                 运维脚本
│   ├── init_db.py           初始化数据库
│   ├── export_config.py     导出配置
│   ├── import_config.py     导入配置
│   └── deploy_check.py      部署前检查
│
├── deploy/
│   └── nginx-tikpan.conf    Nginx 反代配置
│
├── Dockerfile
└── docker-compose.yml
```

---

## 环境变量配置

复制 `.env.example` 为 `.env` 并填写：

```env
# 必填
FLASK_SECRET=your-secret-key-here
ADMIN_PASSWORD=your-admin-password

# 数据库（生产建议 PostgreSQL）
DATABASE_URL=sqlite:///data/tikpan.db

# 邮件服务（用于验证码）
MAIL_SERVER=smtp.example.com
MAIL_USERNAME=noreply@tikpan.com
MAIL_PASSWORD=

# 上游 API
TIKPAN_API_KEY=sk-your-key

# 文件存储（可选，默认本地）
OSS_BUCKET=
OSS_ENDPOINT=
OSS_ACCESS_KEY=
OSS_SECRET_KEY=
```

---

## Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 初始化数据库
docker-compose exec web python scripts/init_db.py

# 查看日志
docker-compose logs -f web
```

Nginx 反代配置见 `deploy/nginx-tikpan.conf`。

---

## 核心业务流程

```
用户请求
  → JWT 鉴权
  → 余额校验
  → 幂等键生成（防重复提交）
  → 模型参数规范化
  → 渠道路由（按优先级选上游）
  → 上游 API 请求（含超时/重试）
  → 结果存储（本地或 OSS）
  → 余额流水记录
  → 返回结果
  （失败时自动退款）
```

---

## 与其他项目的关系

| 仓库 | 角色 |
|------|------|
| [ComfyUI-Tikpan-Pro](https://github.com/htrert/ComfyUI-Tikpan-Pro) | ComfyUI 节点，本地 AI 工作流 |
| [tikpan-canvas](https://github.com/htrert/tikpan-canvas) | 本地无限画布工具，调用 ComfyUI 节点 |
| **tikpan-web**（本仓库）| 商业化网站后端，面向最终用户 |

---

## License

MIT © [htrert](https://github.com/htrert)
