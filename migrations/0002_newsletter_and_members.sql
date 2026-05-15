-- バックナンバー & 会員管理スキーマ
-- 適用:
--   curl -X POST -H "Authorization: Bearer <TOKEN>" \
--     "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/d1/database/<DB_ID>/query" \
--     -H "Content-Type: application/json" \
--     -d "{\"sql\":\"$(cat migrations/0002_newsletter_and_members.sql)\"}"

-- ── 会員 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  company       TEXT,
  position      TEXT,
  status        TEXT NOT NULL DEFAULT 'active',  -- active / revoked
  registered_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  last_login_at TEXT,
  login_count   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_members_email  ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- ── ログインセッション ───────────────────────────────────
CREATE TABLE IF NOT EXISTS member_sessions (
  token       TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  expires_at  TEXT NOT NULL,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_email   ON member_sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON member_sessions(expires_at);

-- ── OTP コード（一時的、5分有効） ────────────────────────
CREATE TABLE IF NOT EXISTS member_otp_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  code_hash  TEXT NOT NULL,  -- SHA-256(code)
  created_at TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  expires_at TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  used_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_otp_email   ON member_otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON member_otp_codes(expires_at);

-- ── バックナンバー ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletters (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  summary       TEXT,                            -- 一覧表示用サマリー（任意）
  body          TEXT NOT NULL,                   -- Markdown 本文
  visibility    TEXT NOT NULL DEFAULT 'public',  -- public / members
  status        TEXT NOT NULL DEFAULT 'draft',   -- draft / scheduled / published
  published_at  TEXT,                            -- 公開日時（予約含む）
  created_at    TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
);

CREATE INDEX IF NOT EXISTS idx_newsletters_status     ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_visibility ON newsletters(visibility);
CREATE INDEX IF NOT EXISTS idx_newsletters_published  ON newsletters(published_at);
