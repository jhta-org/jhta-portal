---
name: sync-newsletters
description: Slack #jhtaメルマガ チャンネルから未取り込みのメルマガ DM (.docx) を取得し、tech.j-hta.org のニュースレターバックナンバーに下書きとして追加する。D1 既存 slug をチェックして重複は自動スキップ。画像も抽出して static/newsletter/images/ に配置。
---

# Slack DM → ニュースレター 取り込みスキル

## 何をするか

1. Slack `#jhtaメルマガ` (channel `C08PRR9D89Y`) の全メッセージ＋スレッドから .docx 添付を抽出
2. D1 newsletters テーブルの既存 `dm-*` slug を取得
3. 差分（新規分）の .docx だけを `docs/dm/` にダウンロード
4. docx → Markdown 変換、画像を `static/newsletter/images/dm-XXXXX/` に展開
5. D1 newsletters に `status='draft', visibility='members'` で投入
6. 画像が追加された場合は `git status` を表示（commit / push は別途必要）

## 前提条件

- `slackcli` が `~/.config/slackcli/workspaces.json` で認証済み（一度設定すれば永続）
- プロジェクトルートに `.env`（CF_API_TOKEN 等は既存のものを利用）

## 実行手順

ユーザーから「ニュースレターを同期して」「Slackから新しいメルマガ取り込んで」等と依頼されたら:

1. **同期スクリプトを実行**:
   ```bash
   python3 docs/sync_newsletters.py
   ```

2. **結果を確認**して、ユーザーに以下を報告:
   - D1 にあった既存数 / Slack上の総数 / 新規追加数
   - 新規追加された各 slug（dm-XXXXX 形式）
   - 画像が追加されていれば、その件数と git push が必要な旨

3. **画像があれば commit & push**:
   ```bash
   git add static/newsletter/
   git commit -m "ニュースレター画像追加 (XX件)"
   git push origin main
   ```

4. **管理画面で確認するよう案内**:
   - https://tech.j-hta.org/admin/newsletters/?status=draft

## 注意点

- `convert_dm.py` は `--import` モード時に D1 既存 slug をチェックして処理スキップする（INSERT OR IGNORE と二重防御）
- Slack tokens (xoxc/xoxd) は slackcli の workspaces.json から読み取る
- 失敗時は `docs/dm/_slack_files.json` 等のデバッグ用ファイルを参照
- 公開設定変更（visibility 切替、status を published に）は管理画面で個別に行う
