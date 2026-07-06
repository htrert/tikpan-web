"""
🗄️ 数据库模型 — 用户/订单/生成记录/代理
"""
import sqlite3
import json
import os
import hashlib
import hmac
import secrets
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "tikpan.db")


def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """初始化所有业务表"""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nickname TEXT DEFAULT '',
            balance INTEGER DEFAULT 0,
            role TEXT DEFAULT 'user',
            agent_code TEXT UNIQUE,
            parent_id INTEGER,
            api_key_custom TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            credits INTEGER NOT NULL,
            payment_method TEXT DEFAULT 'alipay',
            status TEXT DEFAULT 'pending',
            trade_no TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS generation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            model TEXT NOT NULL,
            credits_used INTEGER NOT NULL,
            prompt TEXT DEFAULT '',
            status TEXT DEFAULT 'success',
            image_url TEXT DEFAULT '',
            idempotency_key TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT DEFAULT 'general',
            status TEXT DEFAULT 'active',
            description TEXT DEFAULT '',
            cover_url TEXT DEFAULT '',
            tags_json TEXT DEFAULT '[]',
            settings_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            archived_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS media_assets (
            id TEXT PRIMARY KEY,
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            project_id TEXT,
            direction TEXT DEFAULT 'output',
            object_key TEXT NOT NULL,
            public_url TEXT DEFAULT '',
            source_url TEXT DEFAULT '',
            mime_type TEXT DEFAULT '',
            storage_mode TEXT DEFAULT 'local',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES generation_logs(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        );

        CREATE TABLE IF NOT EXISTS asset_metadata (
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            title TEXT DEFAULT '',
            note TEXT DEFAULT '',
            favorite INTEGER DEFAULT 0,
            review_status TEXT DEFAULT 'candidate',
            tags_json TEXT DEFAULT '[]',
            collections_json TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (task_id, user_id),
            FOREIGN KEY (task_id) REFERENCES generation_logs(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS balance_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            entry_type TEXT NOT NULL,
            delta INTEGER NOT NULL,
            balance_before INTEGER NOT NULL,
            balance_after INTEGER NOT NULL,
            reference_type TEXT DEFAULT '',
            reference_id TEXT DEFAULT '',
            idempotency_key TEXT DEFAULT '',
            status TEXT DEFAULT 'posted',
            note TEXT DEFAULT '',
            metadata_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS models_pricing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id TEXT UNIQUE NOT NULL,
            model_name TEXT NOT NULL,
            credits_1k INTEGER DEFAULT 5,
            credits_2k INTEGER DEFAULT 8,
            credits_4k INTEGER DEFAULT 15,
            billing_mode TEXT DEFAULT 'resolution',
            unit_name TEXT DEFAULT 'generation',
            unit_field TEXT DEFAULT '',
            unit_credits REAL DEFAULT 0,
            min_credits INTEGER DEFAULT 0,
            cost_per_unit REAL DEFAULT 0,
            retail_markup REAL DEFAULT 1.0,
            is_active INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS provider_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            provider_type TEXT DEFAULT '',
            base_url TEXT DEFAULT '',
            api_key TEXT DEFAULT '',
            priority INTEGER DEFAULT 100,
            weight INTEGER DEFAULT 1,
            timeout_seconds INTEGER DEFAULT 120,
            is_active INTEGER DEFAULT 1,
            notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS model_provider_routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id TEXT NOT NULL,
            channel_key TEXT NOT NULL,
            upstream_model TEXT DEFAULT '',
            endpoint TEXT DEFAULT '',
            priority INTEGER DEFAULT 100,
            weight INTEGER DEFAULT 1,
            cost_per_unit REAL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(model_id, channel_key)
        );

        CREATE TABLE IF NOT EXISTS agent_configs (
            user_id INTEGER PRIMARY KEY,
            wholesale_price REAL DEFAULT 0.475,
            markup_limit_min REAL DEFAULT 0.5,
            markup_limit_max REAL DEFAULT 5.0,
            profit_share REAL DEFAULT 0.1,
            is_approved INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    _ensure_generation_log_columns(conn)
    _ensure_pricing_columns(conn)
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_balance_ledger_idempotency "
        "ON balance_ledger(idempotency_key) WHERE idempotency_key <> ''"
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_balance_ledger_user_created ON balance_ledger(user_id, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_generation_logs_idempotency ON generation_logs(user_id, idempotency_key)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_media_assets_user_created ON media_assets(user_id, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_media_assets_project_created ON media_assets(project_id, created_at)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_asset_metadata_user_updated ON asset_metadata(user_id, updated_at)")
    conn.commit()
    conn.close()


def _ensure_generation_log_columns(conn):
    """Keep old SQLite databases compatible with newer generation tracking."""
    rows = conn.execute("PRAGMA table_info(generation_logs)").fetchall()
    existing = {row["name"] for row in rows}
    columns = {
        "status": "TEXT DEFAULT 'success'",
        "image_url": "TEXT DEFAULT ''",
        "error_message": "TEXT DEFAULT ''",
        "request_id": "TEXT DEFAULT ''",
        "raw_response": "TEXT DEFAULT ''",
        "refunded_at": "TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT ''",
        "idempotency_key": "TEXT DEFAULT ''",
    }
    for name, ddl in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE generation_logs ADD COLUMN {name} {ddl}")


def _ensure_pricing_columns(conn):
    """Keep old pricing rows compatible with flexible commercial billing."""
    rows = conn.execute("PRAGMA table_info(models_pricing)").fetchall()
    existing = {row["name"] for row in rows}
    columns = {
        "billing_mode": "TEXT DEFAULT 'resolution'",
        "unit_name": "TEXT DEFAULT 'generation'",
        "unit_field": "TEXT DEFAULT ''",
        "unit_credits": "REAL DEFAULT 0",
        "min_credits": "INTEGER DEFAULT 0",
        "cost_per_unit": "REAL DEFAULT 0",
        "retail_markup": "REAL DEFAULT 1.0",
    }
    for name, ddl in columns.items():
        if name not in existing:
            conn.execute(f"ALTER TABLE models_pricing ADD COLUMN {name} {ddl}")


def seed_pricing():
    """初始化模型定价 — 覆盖所有攀升AI节点支持的模型

    billing_mode 说明:
      resolution  - 按分辨率阶梯计费（图片生成）
      per_call    - 按次数计费（音乐/视频/固定TTS）
      per_char    - 按字符数计费（TTS）
      per_token   - 按 token 计费（LLM 分析）
    """
    conn = get_db()

    # ─── 图片生成模型（resolution 计费）──────────────────────────────────
    image_models = [
        # (model_id, display_name, credits_1k, credits_2k, credits_4k)
        ("gpt-image-2-official",             "GPT-Image-2 官方",          8,  14, 28),
        ("gpt-image-2-gen",                  "GPT-Image-2-all 生图",       6,  10, 20),
        ("gpt-image-2-edit",                 "GPT-Image-2-all 修图",       6,  10, 20),
        ("gemini-image-max",                 "Gemini 14图极限生图",         6,  10, 18),
        ("gemini-3-pro-image-preview",       "Gemini 3 Pro 图像",          6,  10, 18),
        ("gemini-3.1-flash-image-preview",   "Gemini 3.1 Flash 图像",      4,   6, 12),
        ("nano-banana-pro",                  "Nano Banana Pro",            5,   8, 16),
        ("doubao-seedream-5-0-260128",       "豆包图像 Seedream",           3,   5, 10),
        ("grok-imagine-image",               "Grok Imagine Image",         4,   7, 14),
        ("grok-imagine-image-pro",           "Grok Imagine Image Pro",    10,  16, 32),
        ("qwen-image-2.0",                   "Qwen-Image-2.0",             4,   7, 14),
        ("wan-2.7-image-pro",                "Wan 2.7 Image Pro",          5,   8, 20),
    ]
    for row in image_models:
        conn.execute(
            "INSERT OR IGNORE INTO models_pricing "
            "(model_id, model_name, credits_1k, credits_2k, credits_4k, billing_mode) "
            "VALUES (?,?,?,?,?,'resolution')",
            row
        )

    # ─── 视频生成模型（per_call 计费，credits_1k 字段存储每次费用）────────
    video_models = [
        # (model_id, display_name, credits_per_call)
        ("happyhorse-t2v",           "HappyHorse 文生视频",    30),
        ("happyhorse-i2v",           "HappyHorse 图生视频",    30),
        ("happyhorse-r2v",           "HappyHorse 参考生视频",  35),
        ("happyhorse-edit",          "HappyHorse 视频编辑",    35),
        ("grok-videos",              "Grok-Videos",           40),
        ("veo-3.1-lite",             "Veo 3.1 Lite",          30),
        ("veo-3.1-fast-4k",          "Veo 3.1 Fast 4K",       50),
        ("veo-3.1-pro",              "Veo 3.1 Pro",           80),
        ("veo-3.1-components",       "Veo 3.1 Components",    50),
        ("kling-motion-control",     "Kling 动作控制",         50),
        ("vidu3-reference",          "Vidu3 参考生视频",       40),
        ("vidu3-turbo",              "Vidu3 Turbo",           35),
        ("gemini-omni-flash",        "Gemini Omni Flash",     30),
        ("gemini-omni-components",   "Gemini Omni Components",35),
    ]
    for model_id, name, cpc in video_models:
        conn.execute(
            "INSERT OR IGNORE INTO models_pricing "
            "(model_id, model_name, credits_1k, billing_mode, unit_name, unit_credits, min_credits) "
            "VALUES (?,?,?,'per_call','次',?,?)",
            (model_id, name, cpc, cpc, cpc)
        )

    # ─── 音乐生成（per_call）────────────────────────────────────────────
    music_models = [
        ("suno-v5",      "Suno V5 音乐",   15),
        ("suno-v4",      "Suno V4 音乐",   12),
        ("suno-fenix",   "Suno Fenix 音乐",18),
    ]
    for model_id, name, cpc in music_models:
        conn.execute(
            "INSERT OR IGNORE INTO models_pricing "
            "(model_id, model_name, credits_1k, billing_mode, unit_name, unit_credits, min_credits) "
            "VALUES (?,?,?,'per_call','首',?,?)",
            (model_id, name, cpc, cpc, cpc)
        )

    # ─── TTS 语音合成（per_char 计费，unit_credits = 每千字符费用）────────
    tts_models = [
        # (model_id, name, credits_per_1k_chars, min_credits)
        ("minimax-speech-2.8-hd",    "speech-2.8-hd 高清",   6, 2),
        ("minimax-speech-2.8-turbo", "speech-2.8-turbo 极速", 4, 1),
        ("doubao-tts-2.0",           "豆包语音合成 2.0",       3, 1),
        ("gemini-3.1-flash-tts",     "Gemini 3.1 Flash TTS",  5, 2),
    ]
    for model_id, name, per_1k, min_c in tts_models:
        conn.execute(
            "INSERT OR IGNORE INTO models_pricing "
            "(model_id, model_name, billing_mode, unit_name, unit_field, unit_credits, min_credits) "
            "VALUES (?,?,'per_char','千字符','char_count',?,?)",
            (model_id, name, per_1k, min_c)
        )

    # ─── 多模态分析（per_token 计费）───────────────────────────────────
    analysis_models = [
        # (model_id, name, credits_per_1k_tokens, min_credits)
        ("gpt-5-mini-responses",           "GPT-5.4 Mini 推理",         2, 1),
        ("gemini-3-flash-preview-analyst", "Gemini 3 Flash 分析",        2, 1),
        ("gemini-3.5-flash",               "Gemini 3.5 Flash 推理",      3, 1),
        ("grok-prompt-optimizer",          "Grok 剧本重构",               4, 2),
        ("gemini-video-analyst",           "AI 音视频双轨解析",            5, 2),
    ]
    for model_id, name, per_1k, min_c in analysis_models:
        conn.execute(
            "INSERT OR IGNORE INTO models_pricing "
            "(model_id, model_name, billing_mode, unit_name, unit_field, unit_credits, min_credits) "
            "VALUES (?,?,'per_token','千Token','token_count',?,?)",
            (model_id, name, per_1k, min_c)
        )

    conn.commit()
    conn.close()



def seed_provider_channels():
    """Initialize default provider channels for multi-supplier routing."""
    channels = [
        ("tikpan-default", "Tikpan 默认中转", "tikpan", "", "", 10, 1, 120, 1, "默认平台渠道"),
        ("openai-compatible", "OpenAI 兼容渠道", "openai", "", "", 50, 1, 180, 0, "可配置第三方兼容 API"),
        ("doubao-compatible", "豆包兼容渠道", "doubao", "", "", 50, 1, 180, 0, "可配置火山/豆包渠道"),
    ]
    conn = get_db()
    for row in channels:
        conn.execute(
            """
            INSERT OR IGNORE INTO provider_channels
                (key, name, provider_type, base_url, api_key, priority, weight, timeout_seconds, is_active, notes)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            """,
            row,
        )
    conn.commit()
    conn.close()


# ==================== 用户操作 ====================

PASSWORD_HASH_ITERATIONS = 260_000


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        str(password).encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_HASH_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt}${digest}"


def _legacy_sha256(password):
    return hashlib.sha256(str(password).encode()).hexdigest()


def verify_password_hash(stored_hash, password):
    stored_hash = str(stored_hash or "")
    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            _, iterations, salt, digest = stored_hash.split("$", 3)
            expected = hashlib.pbkdf2_hmac(
                "sha256",
                str(password).encode("utf-8"),
                salt.encode("utf-8"),
                int(iterations),
            ).hex()
            return hmac.compare_digest(expected, digest), False
        except Exception:
            return False, False
    return hmac.compare_digest(stored_hash, _legacy_sha256(password)), True


def create_user(username, password, nickname=""):
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, nickname) VALUES (?,?,?)",
            (username, hash_password(password), nickname)
        )
        conn.commit()
        user_id = conn.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()["id"]
        return user_id, None
    except sqlite3.IntegrityError:
        return None, "用户名已存在"
    finally:
        conn.close()


def verify_user(username, password):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
    if not user:
        conn.close()
        return None
    matched, needs_upgrade = verify_password_hash(user["password_hash"], password)
    if matched and needs_upgrade:
        conn.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(password), user["id"]))
        conn.commit()
    conn.close()
    return dict(user) if matched else None


def get_user(user_id):
    conn = get_db()
    user = conn.execute("SELECT id, username, nickname, balance, role, agent_code, parent_id, created_at FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None


def update_balance(
    user_id,
    delta,
    entry_type="adjustment",
    reference_type="",
    reference_id="",
    idempotency_key="",
    note="",
    metadata=None,
):
    """增加/扣除余额，并写入不可变流水账本。"""
    conn = get_db()
    try:
        if idempotency_key:
            existing = conn.execute(
                "SELECT id FROM balance_ledger WHERE idempotency_key=?",
                (idempotency_key,),
            ).fetchone()
            if existing:
                return True, None

        conn.execute("BEGIN IMMEDIATE")
        user = conn.execute("SELECT balance FROM users WHERE id=?", (user_id,)).fetchone()
        if not user:
            conn.rollback()
            return False, "用户不存在"

        balance_before = int(user["balance"] or 0)
        delta = int(delta)
        balance_after = balance_before + delta
        if balance_after < 0:
            conn.rollback()
            return False, "余额不足"

        conn.execute("UPDATE users SET balance=? WHERE id=?", (balance_after, user_id))
        conn.execute(
            """
            INSERT INTO balance_ledger
                (user_id, entry_type, delta, balance_before, balance_after,
                 reference_type, reference_id, idempotency_key, note, metadata_json)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            """,
            (
                user_id,
                entry_type,
                delta,
                balance_before,
                balance_after,
                reference_type,
                str(reference_id or ""),
                idempotency_key or "",
                note or "",
                json.dumps(metadata or {}, ensure_ascii=False, default=str),
            ),
        )
        conn.commit()
        return True, None
    except sqlite3.IntegrityError:
        conn.rollback()
        return True, None
    except Exception as exc:
        conn.rollback()
        return False, str(exc)
    finally:
        conn.close()


# ==================== 订单 ====================

def create_order(user_id, amount, credits, payment_method="alipay", trade_no=""):
    conn = get_db()
    conn.execute(
        "INSERT INTO orders (user_id, amount, credits, payment_method, status, trade_no) VALUES (?,?,?,?,?,?)",
        (user_id, amount, credits, payment_method, "pending", trade_no)
    )
    order_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.commit()
    conn.close()
    return order_id


def complete_order(order_id):
    """完成订单，增加用户余额"""
    conn = get_db()
    order = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
    if order and order["status"] == "completed":
        conn.close()
        return True
    if not order or order["status"] != "pending":
        conn.close()
        return False
    conn.close()

    ok, _ = update_balance(
        order["user_id"],
        order["credits"],
        entry_type="recharge",
        reference_type="order",
        reference_id=order_id,
        idempotency_key=f"order:{order_id}:complete",
        note=f"充值订单完成，获得 {order['credits']} 额度",
        metadata={"amount": order["amount"], "payment_method": order["payment_method"]},
    )
    if not ok:
        return False

    conn = get_db()
    conn.execute("UPDATE orders SET status='completed' WHERE id=?", (order_id,))
    conn.commit()
    conn.close()
    return True


# ==================== 生成记录 ====================

def log_generation(
    user_id,
    model,
    credits_used,
    prompt,
    image_url="",
    status="success",
    error_message="",
    request_id="",
    raw_response="",
    idempotency_key="",
):
    conn = get_db()
    cur = conn.execute(
        """
        INSERT INTO generation_logs
            (user_id, model, credits_used, prompt, image_url, status, error_message,
             request_id, raw_response, idempotency_key, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
        """,
        (user_id, model, credits_used, prompt, image_url, status, error_message, request_id, raw_response, idempotency_key)
    )
    log_id = cur.lastrowid
    conn.commit()
    conn.close()
    return log_id


def update_generation_log(log_id, **kwargs):
    allowed = {
        "status",
        "image_url",
        "error_message",
        "request_id",
        "raw_response",
        "refunded_at",
        "idempotency_key",
    }
    updates = {k: v for k, v in kwargs.items() if k in allowed}
    if not updates:
        return

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    if updates.get("refunded_at") == "now":
        updates["refunded_at"] = now
    updates["updated_at"] = now
    sets = ", ".join(f"{k}=?" for k in updates)
    values = list(updates.values()) + [log_id]

    conn = get_db()
    conn.execute(f"UPDATE generation_logs SET {sets} WHERE id=?", values)
    conn.commit()
    conn.close()


def get_user_logs(user_id, limit=20):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM generation_logs WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ==================== 定价 ====================

def get_model_price(model_id, resolution="2K"):
    return calculate_model_credits(model_id, {"resolution": resolution})["credits"]


def calculate_model_credits(model_id, params=None):
    """Calculate billable credits for a model using fixed or usage-based rules."""
    params = params or {}
    conn = get_db()
    price_row = conn.execute("SELECT * FROM models_pricing WHERE model_id=?", (model_id,)).fetchone()
    conn.close()
    if not price_row:
        return {
            "credits": 5,
            "billing_mode": "fallback",
            "unit_name": "generation",
            "quantity": 1,
            "detail": "未配置价格，使用默认 5 额度",
        }

    row = dict(price_row)
    mode = row.get("billing_mode") or "resolution"
    resolution = str(params.get("resolution") or params.get("size") or "2K")

    if mode == "per_unit":
        unit_field = row.get("unit_field") or "n"
        try:
            quantity = float(params.get(unit_field, 1) or 1)
        except (TypeError, ValueError):
            quantity = 1
        unit_credits = float(row.get("unit_credits") or row.get("credits_2k") or 1)
        min_credits = int(row.get("min_credits") or 0)
        credits = max(min_credits, int(round(quantity * unit_credits)))
        return {
            "credits": credits,
            "billing_mode": mode,
            "unit_name": row.get("unit_name") or unit_field,
            "unit_field": unit_field,
            "quantity": quantity,
            "unit_credits": unit_credits,
            "detail": f"{quantity:g} × {unit_credits:g} 额度",
        }

    if mode == "flat":
        credits = int(row.get("credits_2k") or 5)
        return {
            "credits": credits,
            "billing_mode": mode,
            "unit_name": row.get("unit_name") or "generation",
            "quantity": 1,
            "detail": f"固定 {credits} 额度/次",
        }

    if resolution == "4K":
        credits = row["credits_4k"]
    elif resolution == "1K":
        credits = row["credits_1k"]
    else:
        credits = row["credits_2k"]
    return {
        "credits": int(credits),
        "billing_mode": "resolution",
        "unit_name": row.get("unit_name") or "generation",
        "quantity": 1,
        "resolution": resolution,
        "detail": f"{resolution} 档位 {credits} 额度",
    }


def get_all_pricing():
    conn = get_db()
    rows = conn.execute("SELECT * FROM models_pricing WHERE is_active=1").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_generation_by_idempotency(user_id, idempotency_key):
    if not idempotency_key:
        return None
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM generation_logs WHERE user_id=? AND idempotency_key=? ORDER BY id DESC LIMIT 1",
        (user_id, idempotency_key),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


# ==================== 项目与作品资产 ====================

def _json_loads(value, fallback):
    if value in (None, ""):
        return fallback
    try:
        parsed = json.loads(value)
        return parsed if parsed is not None else fallback
    except (TypeError, json.JSONDecodeError):
        return fallback


def _json_dumps(value):
    return json.dumps(value, ensure_ascii=False, default=str)


def create_project(user_id, name, project_type="general", description="", tags=None, settings=None):
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db()
    conn.execute(
        """
        INSERT INTO projects
            (id, user_id, name, type, status, description, tags_json, settings_json, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        """,
        (
            project_id,
            user_id,
            str(name).strip()[:100],
            project_type or "general",
            "active",
            str(description or "").strip()[:500],
            _json_dumps(tags or []),
            _json_dumps(settings or {}),
            now,
            now,
        ),
    )
    conn.commit()
    conn.close()
    return get_project(project_id, user_id)


def get_project(project_id, user_id):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM projects WHERE id=? AND user_id=? AND status <> 'archived'",
        (project_id, user_id),
    ).fetchone()
    conn.close()
    return _project_from_row(row) if row else None


def list_projects(user_id, limit=50):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT * FROM projects
        WHERE user_id=? AND status <> 'archived'
        ORDER BY updated_at DESC, created_at DESC
        LIMIT ?
        """,
        (user_id, int(limit)),
    ).fetchall()
    conn.close()
    return [_project_from_row(row) for row in rows]


def touch_project(project_id, user_id):
    conn = get_db()
    conn.execute(
        "UPDATE projects SET updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?",
        (project_id, user_id),
    )
    conn.commit()
    conn.close()


def create_manual_project_asset(user_id, project_id, title, source_url, mime_type, tags=None, note=""):
    project = get_project(project_id, user_id)
    if not project:
        return None

    tags = tags or []
    title = str(title or "").strip()[:100]
    note = str(note or "").strip()[:500]
    source_url = str(source_url or "").strip()
    mime_type = str(mime_type or "").strip().lower()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    try:
        conn.execute("BEGIN IMMEDIATE")
        cur = conn.execute(
            """
            INSERT INTO generation_logs
                (user_id, model, credits_used, prompt, status, image_url, request_id,
                 raw_response, idempotency_key, created_at, updated_at)
            VALUES (?, 'manual-project-asset', 0, ?, 'success', ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                title,
                source_url,
                f"manual:{project_id}:{uuid.uuid4().hex[:12]}",
                _json_dumps({
                    "source": "manual_import",
                    "project_id": project_id,
                    "source_url": source_url,
                    "mime_type": mime_type,
                    "tags": tags,
                    "note": note,
                }),
                f"manual_asset:{user_id}:{project_id}:{uuid.uuid4().hex}",
                now,
                now,
            ),
        )
        task_id = cur.lastrowid
        media_id = f"media_{uuid.uuid4().hex[:12]}"
        conn.execute(
            """
            INSERT INTO media_assets
                (id, task_id, user_id, project_id, direction, object_key, public_url,
                 source_url, mime_type, storage_mode, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                media_id,
                task_id,
                user_id,
                project_id,
                "output",
                f"manual/{project_id}/{media_id}",
                source_url,
                source_url,
                mime_type,
                "local",
                now,
            ),
        )
        conn.execute(
            """
            INSERT INTO asset_metadata
                (task_id, user_id, title, note, favorite, review_status, tags_json,
                 collections_json, created_at, updated_at)
            VALUES (?,?,?,?,0,'approved',?,'[]',?,?)
            """,
            (task_id, user_id, title, note, _json_dumps(tags), now, now),
        )
        conn.execute(
            "UPDATE projects SET updated_at=? WHERE id=? AND user_id=?",
            (now, project_id, user_id),
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return get_asset_item(task_id, user_id)


def list_project_assets(user_id, project_id=None, limit=50):
    conn = get_db()
    clauses = ["g.user_id=?", "g.status='success'", "m.id IS NOT NULL"]
    args = [user_id]
    if project_id:
        clauses.append("m.project_id=?")
        args.append(project_id)
    args.append(int(limit))
    rows = conn.execute(
        f"""
        SELECT
            g.*,
            m.id AS media_id,
            m.project_id AS asset_project_id,
            m.object_key,
            m.public_url,
            m.source_url,
            m.mime_type,
            m.storage_mode,
            m.direction,
            m.created_at AS media_created_at,
            p.name AS project_name,
            am.title AS asset_title,
            am.note AS asset_note,
            am.favorite,
            am.review_status,
            am.tags_json,
            am.collections_json
        FROM generation_logs g
        LEFT JOIN media_assets m ON m.task_id = g.id
        LEFT JOIN projects p ON p.id = m.project_id
        LEFT JOIN asset_metadata am ON am.task_id = g.id AND am.user_id = g.user_id
        WHERE {" AND ".join(clauses)}
        ORDER BY g.created_at DESC, g.id DESC
        LIMIT ?
        """,
        args,
    ).fetchall()
    conn.close()
    return [_asset_from_row(row) for row in rows]


def get_asset_item(task_id, user_id):
    conn = get_db()
    row = conn.execute(
        """
        SELECT
            g.*,
            m.id AS media_id,
            m.project_id AS asset_project_id,
            m.object_key,
            m.public_url,
            m.source_url,
            m.mime_type,
            m.storage_mode,
            m.direction,
            m.created_at AS media_created_at,
            p.name AS project_name,
            am.title AS asset_title,
            am.note AS asset_note,
            am.favorite,
            am.review_status,
            am.tags_json,
            am.collections_json
        FROM generation_logs g
        LEFT JOIN media_assets m ON m.task_id = g.id
        LEFT JOIN projects p ON p.id = m.project_id
        LEFT JOIN asset_metadata am ON am.task_id = g.id AND am.user_id = g.user_id
        WHERE g.id=? AND g.user_id=?
        """,
        (task_id, user_id),
    ).fetchone()
    conn.close()
    return _asset_from_row(row) if row else None


def project_stats(user_id, project_id):
    conn = get_db()
    tasks = conn.execute(
        """
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS completed,
               SUM(CASE WHEN status IN ('failed','refunded') THEN 1 ELSE 0 END) AS failed,
               SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS active,
               SUM(credits_used) AS spend
        FROM generation_logs
        WHERE user_id=? AND id IN (SELECT task_id FROM media_assets WHERE project_id=?)
        """,
        (user_id, project_id),
    ).fetchone()
    assets = conn.execute(
        "SELECT COUNT(*) AS total FROM media_assets WHERE user_id=? AND project_id=?",
        (user_id, project_id),
    ).fetchone()
    conn.close()
    return {
        "tasks_total": int(tasks["total"] or 0),
        "tasks_completed": int(tasks["completed"] or 0),
        "tasks_failed": int(tasks["failed"] or 0),
        "tasks_active": int(tasks["active"] or 0),
        "assets_total": int(assets["total"] or 0),
        "token_spend": int(tasks["spend"] or 0),
    }


def public_project(project, include_detail=False):
    data = {
        **project,
        "stats": project_stats(project["user_id"], project["id"]),
    }
    if include_detail:
        data["assets"] = list_project_assets(project["user_id"], project["id"], 20)
        data["tasks"] = [
            {
                "task_id": asset["task_id"],
                "model": asset["model"],
                "status": "succeeded",
                "project_id": asset["project_id"],
                "project_name": asset["project_name"],
                "input": asset["input"],
                "output": {"publicUrls": asset["output_urls"]},
                "created_at": asset["created_at"],
                "finished_at": asset["finished_at"],
            }
            for asset in data["assets"]
        ]
    return data


def _project_from_row(row):
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "name": row["name"],
        "type": row["type"] or "general",
        "status": row["status"] or "active",
        "description": row["description"] or "",
        "cover_url": row["cover_url"] or None,
        "tags": _json_loads(row["tags_json"], []),
        "settings": _json_loads(row["settings_json"], {}),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "archived_at": row["archived_at"],
    }


def _asset_from_row(row):
    tags = _json_loads(row["tags_json"], []) if "tags_json" in row.keys() else []
    collections = _json_loads(row["collections_json"], []) if "collections_json" in row.keys() else []
    media_asset = {
        "id": row["media_id"],
        "object_key": row["object_key"],
        "public_url": row["public_url"],
        "mime_type": row["mime_type"],
        "source_url": row["source_url"],
        "storage_mode": row["storage_mode"],
        "direction": row["direction"],
        "created_at": row["media_created_at"],
    }
    output_urls = [url for url in [row["public_url"], row["image_url"]] if url]
    return {
        "id": f"asset_{row['id']}",
        "task_id": row["id"],
        "project_id": row["asset_project_id"],
        "project_name": row["project_name"],
        "model": row["model"],
        "model_name": "Manual asset" if row["model"] == "manual-project-asset" else row["model"],
        "modality": _asset_modality(row["mime_type"]),
        "status": row["status"],
        "route_mode": "manual" if row["model"] == "manual-project-asset" else "balanced",
        "title": row["asset_title"] or "",
        "note": row["asset_note"] or "",
        "favorite": bool(row["favorite"] or 0),
        "review_status": row["review_status"] or "candidate",
        "tags": tags,
        "collections": collections,
        "prompt": row["prompt"] or "",
        "input": {"prompt": row["prompt"] or "", "source_url": row["source_url"], "tags": tags},
        "output_urls": list(dict.fromkeys(output_urls)),
        "media_assets": [media_asset] if row["media_id"] else [],
        "final_cost": row["credits_used"] or 0,
        "created_at": row["created_at"],
        "finished_at": row["updated_at"] or row["created_at"],
    }


def _asset_modality(mime_type):
    value = str(mime_type or "")
    if value.startswith("video/"):
        return "video"
    if value.startswith("audio/"):
        return "audio"
    if value.startswith("text/") or value == "application/pdf":
        return "chat"
    return "image"


def get_ledger_entries(user_id=None, limit=100):
    conn = get_db()
    sql = "SELECT * FROM balance_ledger"
    args = []
    if user_id:
        sql += " WHERE user_id=?"
        args.append(user_id)
    sql += " ORDER BY created_at DESC, id DESC LIMIT ?"
    args.append(int(limit))
    rows = conn.execute(sql, args).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_pricing(model_id=None, active_only=False):
    conn = get_db()
    sql = "SELECT * FROM models_pricing"
    args = []
    clauses = []
    if model_id:
        clauses.append("model_id=?")
        args.append(model_id)
    if active_only:
        clauses.append("is_active=1")
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY model_id"
    rows = conn.execute(sql, args).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def upsert_pricing(data):
    model_id = str(data.get("model_id", "")).strip()
    if not model_id:
        return False, "model_id required"
    conn = get_db()
    conn.execute(
        """
        INSERT INTO models_pricing
            (model_id, model_name, credits_1k, credits_2k, credits_4k, billing_mode,
             unit_name, unit_field, unit_credits, min_credits, cost_per_unit, retail_markup, is_active)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(model_id) DO UPDATE SET
            model_name=excluded.model_name,
            credits_1k=excluded.credits_1k,
            credits_2k=excluded.credits_2k,
            credits_4k=excluded.credits_4k,
            billing_mode=excluded.billing_mode,
            unit_name=excluded.unit_name,
            unit_field=excluded.unit_field,
            unit_credits=excluded.unit_credits,
            min_credits=excluded.min_credits,
            cost_per_unit=excluded.cost_per_unit,
            retail_markup=excluded.retail_markup,
            is_active=excluded.is_active
        """,
        (
            model_id,
            data.get("model_name") or model_id,
            int(data.get("credits_1k") or 5),
            int(data.get("credits_2k") or 8),
            int(data.get("credits_4k") or 15),
            data.get("billing_mode") or "resolution",
            data.get("unit_name") or "generation",
            data.get("unit_field") or "",
            float(data.get("unit_credits") or 0),
            int(data.get("min_credits") or 0),
            float(data.get("cost_per_unit") or 0),
            float(data.get("retail_markup") or 1.0),
            int(data.get("is_active", 1)),
        ),
    )
    conn.commit()
    conn.close()
    return True, None


def get_provider_channels(active_only=False):
    conn = get_db()
    sql = "SELECT * FROM provider_channels"
    if active_only:
        sql += " WHERE is_active=1"
    sql += " ORDER BY priority, id"
    rows = conn.execute(sql).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def upsert_provider_channel(data):
    key = str(data.get("key", "")).strip()
    if not key:
        return False, "key required"
    conn = get_db()
    conn.execute(
        """
        INSERT INTO provider_channels
            (key, name, provider_type, base_url, api_key, priority, weight, timeout_seconds, is_active, notes, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
            name=excluded.name,
            provider_type=excluded.provider_type,
            base_url=excluded.base_url,
            api_key=excluded.api_key,
            priority=excluded.priority,
            weight=excluded.weight,
            timeout_seconds=excluded.timeout_seconds,
            is_active=excluded.is_active,
            notes=excluded.notes,
            updated_at=CURRENT_TIMESTAMP
        """,
        (
            key,
            data.get("name") or key,
            data.get("provider_type") or "",
            data.get("base_url") or "",
            data.get("api_key") or "",
            int(data.get("priority") or 100),
            int(data.get("weight") or 1),
            int(data.get("timeout_seconds") or 120),
            int(data.get("is_active", 1)),
            data.get("notes") or "",
        ),
    )
    conn.commit()
    conn.close()
    return True, None


def get_model_routes(model_id=None, active_only=False):
    conn = get_db()
    sql = "SELECT * FROM model_provider_routes"
    args = []
    clauses = []
    if model_id:
        clauses.append("model_id=?")
        args.append(model_id)
    if active_only:
        clauses.append("is_active=1")
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY model_id, priority, id"
    rows = conn.execute(sql, args).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def upsert_model_route(data):
    model_id = str(data.get("model_id", "")).strip()
    channel_key = str(data.get("channel_key", "")).strip()
    if not model_id or not channel_key:
        return False, "model_id and channel_key required"
    conn = get_db()
    conn.execute(
        """
        INSERT INTO model_provider_routes
            (model_id, channel_key, upstream_model, endpoint, priority, weight, cost_per_unit, is_active, notes, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(model_id, channel_key) DO UPDATE SET
            upstream_model=excluded.upstream_model,
            endpoint=excluded.endpoint,
            priority=excluded.priority,
            weight=excluded.weight,
            cost_per_unit=excluded.cost_per_unit,
            is_active=excluded.is_active,
            notes=excluded.notes,
            updated_at=CURRENT_TIMESTAMP
        """,
        (
            model_id,
            channel_key,
            data.get("upstream_model") or "",
            data.get("endpoint") or "",
            int(data.get("priority") or 100),
            int(data.get("weight") or 1),
            float(data.get("cost_per_unit") or 0),
            int(data.get("is_active", 1)),
            data.get("notes") or "",
        ),
    )
    conn.commit()
    conn.close()
    return True, None


def select_model_route(model_id):
    routes = get_model_routes(model_id, active_only=True)
    return routes[0] if routes else None


# ==================== 代理 ====================

def create_agent_config(user_id, wholesale_price=0.475):
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO agent_configs (user_id, wholesale_price) VALUES (?,?)",
        (user_id, wholesale_price)
    )
    conn.execute("UPDATE users SET role='agent' WHERE id=?", (user_id,))
    conn.commit()
    conn.close()


def get_agent_config(user_id):
    conn = get_db()
    config = conn.execute("SELECT * FROM agent_configs WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    return dict(config) if config else None


def get_agent_children(agent_id):
    conn = get_db()
    rows = conn.execute("SELECT id, username, nickname, balance, created_at FROM users WHERE parent_id=?", (agent_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_agent_earnings(agent_id):
    """计算代理收益 = 下级用户的消费 * (1 - 平台抽成比例)"""
    conn = get_db()
    config = conn.execute("SELECT profit_share FROM agent_configs WHERE user_id=?", (agent_id,)).fetchone()
    if not config:
        conn.close()
        return 0
    share = config["profit_share"]
    logs = conn.execute(
        "SELECT SUM(l.credits_used) as total FROM generation_logs l JOIN users u ON l.user_id=u.id WHERE u.parent_id=? AND l.status='success'",
        (agent_id,)
    ).fetchone()
    conn.close()
    total_credits = logs["total"] or 0
    # 代理收益 = 下级消费额度 * (1 - 平台抽成)
    earnings = total_credits * (1 - share)
    return round(earnings, 2)


# ==================== 系统设置 ====================

def get_setting(key, default=""):
    conn = get_db()
    row = conn.execute("SELECT value FROM system_settings WHERE key=?", (key,)).fetchone()
    conn.close()
    return row["value"] if row else default


def set_setting(key, value):
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?,?, datetime('now'))",
        (key, str(value))
    )
    conn.commit()
    conn.close()


def get_all_settings():
    conn = get_db()
    rows = conn.execute("SELECT key, value FROM system_settings").fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}


def get_smtp_config():
    settings = get_all_settings()
    return {
        "server": settings.get("smtp_server", "smtp.qq.com"),
        "port": int(settings.get("smtp_port", 465)),
        "use_ssl": settings.get("smtp_use_ssl", "true") == "true",
        "account": settings.get("smtp_account", ""),
        "sender": settings.get("smtp_sender", ""),
        "password": settings.get("smtp_password", ""),
    }


def get_oauth_config():
    settings = get_all_settings()
    return {
        "google_enabled": settings.get("oauth_google_enabled", "false") == "true",
        "google_client_id": settings.get("oauth_google_client_id", ""),
        "google_secret": settings.get("oauth_google_secret", ""),
        "github_enabled": settings.get("oauth_github_enabled", "false") == "true",
        "github_client_id": settings.get("oauth_github_client_id", ""),
        "github_secret": settings.get("oauth_github_secret", ""),
        "redirect_base": settings.get("oauth_redirect_base", ""),
    }
