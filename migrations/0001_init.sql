-- 提案管理スキーマ初期化
-- 適用方法:
--   curl -X POST -H "Authorization: Bearer <TOKEN>" \
--     "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/d1/database/<DATABASE_ID>/query" \
--     -H "Content-Type: application/json" \
--     -d "{\"sql\":\"$(cat migrations/0001_init.sql)\"}"

CREATE TABLE IF NOT EXISTS proposals (
  id              TEXT PRIMARY KEY,                        -- 受付番号 (例: JHTA-2026-0001)
  source          TEXT NOT NULL,                           -- 'form' | 'manual'
  name            TEXT NOT NULL,                           -- 氏名
  company         TEXT NOT NULL,                           -- 会社・所属
  email           TEXT NOT NULL,                           -- メール
  theme           TEXT NOT NULL,                           -- 課題テーマ
  summary         TEXT NOT NULL,                           -- 一言で課題
  internal_notes  TEXT,                                    -- 事務局メモ
  status          TEXT NOT NULL DEFAULT '受付中',          -- 受付中 / 検討中 / 詳細送付済 / PreWG化 / クローズ
  created_at      TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
);

CREATE INDEX IF NOT EXISTS idx_proposals_status     ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);

CREATE TABLE IF NOT EXISTS proposal_details (
  proposal_id            TEXT PRIMARY KEY REFERENCES proposals(id),
  background             TEXT,        -- 課題の背景・現状の問題
  scope_type             TEXT,        -- 'industry' (業界全体) | 'specific' (特定領域)
  scope_text             TEXT,        -- 影響範囲の自由記述
  expected_outcomes      TEXT,        -- JSON配列：標準仕様/ガイドライン/ツール/調査
  expected_outcomes_text TEXT,        -- 期待する成果の自由記述
  expected_effects       TEXT,        -- 期待する効果（業界DXへの貢献）
  stakeholders           TEXT,        -- JSON配列：PMS/ホテル/OTA/SC/鍵メーカー...
  reference_urls         TEXT,        -- JSON配列：参考URL
  whitepaper_url         TEXT,        -- ホワイトペーパーURL（任意）
  additional_notes       TEXT,        -- 自由記述
  created_at             TEXT NOT NULL DEFAULT (datetime('now', '+9 hours'))
);

CREATE TABLE IF NOT EXISTS proposal_counter (
  year     INTEGER PRIMARY KEY,
  last_seq INTEGER NOT NULL DEFAULT 0
);
