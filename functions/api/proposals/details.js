/**
 * POST /api/proposals/details
 * Step 2 詳細フォーム受付
 * body: { proposal_id, background, scope_type, scope_text,
 *         expected_outcomes[], expected_outcomes_text, expected_effects,
 *         stakeholders[], reference_urls, whitepaper_url, additional_notes }
 */
export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;

  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ error: 'Failed to parse request body' }, 400);
  }

  const id = (data.proposal_id || '').trim();
  if (!/^JHTA-\d{4}-\d{4}$/.test(id)) {
    return jsonResponse({ error: '受付番号の形式が不正です' }, 400);
  }

  const db = env.DB;
  if (!db) return jsonResponse({ error: 'D1 binding "DB" not available' }, 500);

  // 受付番号の存在確認
  const proposal = await db.prepare('SELECT id, name, company, theme FROM proposals WHERE id = ?')
    .bind(id).first();
  if (!proposal) {
    return jsonResponse({ error: '指定された受付番号が見つかりません' }, 404);
  }

  // 入力サニタイズ
  const text = (v, max = 4000) => (typeof v === 'string' ? v.trim().slice(0, max) : null);
  const arr = (v) => (Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, 20) : []);

  const detail = {
    background: text(data.background),
    scope_type: ['industry', 'specific'].includes(data.scope_type) ? data.scope_type : null,
    scope_text: text(data.scope_text),
    expected_outcomes: JSON.stringify(arr(data.expected_outcomes)),
    expected_outcomes_text: text(data.expected_outcomes_text),
    expected_effects: text(data.expected_effects),
    stakeholders: JSON.stringify(arr(data.stakeholders)),
    reference_urls: JSON.stringify(
      text(data.reference_urls)?.split(/\r?\n/).map(s => s.trim()).filter(Boolean) || []
    ),
    whitepaper_url: text(data.whitepaper_url, 1000),
    additional_notes: text(data.additional_notes),
  };

  try {
    // UPSERT 相当：既存があれば置き換え
    await db.prepare('DELETE FROM proposal_details WHERE proposal_id = ?').bind(id).run();
    await db.prepare(
      `INSERT INTO proposal_details (
        proposal_id, background, scope_type, scope_text,
        expected_outcomes, expected_outcomes_text, expected_effects,
        stakeholders, reference_urls, whitepaper_url, additional_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, detail.background, detail.scope_type, detail.scope_text,
      detail.expected_outcomes, detail.expected_outcomes_text, detail.expected_effects,
      detail.stakeholders, detail.reference_urls, detail.whitepaper_url, detail.additional_notes
    ).run();

    // ステータス遷移：詳細送付済 → 検討中
    await db.prepare(
      `UPDATE proposals SET status = '検討中',
                            updated_at = datetime('now', '+9 hours')
       WHERE id = ? AND status IN ('受付中', '詳細送付済')`
    ).bind(id).run();
  } catch (err) {
    console.error('D1 error:', err);
    return jsonResponse({ error: 'Failed to save details' }, 500);
  }

  // Slack 通知（waitUntil でレスポンス返却後も完了を保証）
  if (env.SLACK_WEBHOOK_URL) {
    const msg = buildDetailsMessage(id, proposal, detail);
    const slackPromise = fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    }).catch(err => console.error('Slack notify error:', err));
    if (typeof waitUntil === 'function') {
      waitUntil(slackPromise);
    } else {
      await slackPromise;
    }
  }

  return jsonResponse({ ok: true }, 200);
}

function buildDetailsMessage(id, proposal, detail) {
  const outcomes = JSON.parse(detail.expected_outcomes || '[]').join(', ') || '—';
  const stakeholders = JSON.parse(detail.stakeholders || '[]').join(', ') || '—';
  return {
    text: `📝 提案詳細が記入されました（${id}）`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `📝 提案詳細  ${id}`, emoji: true } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*提案者*\n${proposal.name}（${proposal.company}）` },
          { type: 'mrkdwn', text: `*テーマ*\n${proposal.theme}` },
          { type: 'mrkdwn', text: `*影響範囲*\n${detail.scope_type === 'industry' ? '業界全体' : detail.scope_type === 'specific' ? '特定領域' : '—'}` },
          { type: 'mrkdwn', text: `*期待する成果*\n${outcomes}` },
          { type: 'mrkdwn', text: `*ステークホルダー*\n${stakeholders}` },
        ],
      },
      ...(detail.background ? [{ type: 'section', text: { type: 'mrkdwn', text: `*背景*\n${truncate(detail.background, 700)}` } }] : []),
      ...(detail.expected_effects ? [{ type: 'section', text: { type: 'mrkdwn', text: `*期待する効果*\n${truncate(detail.expected_effects, 700)}` } }] : []),
      { type: 'section', text: { type: 'mrkdwn', text: `*🔧 管理画面で開く*\n<https://tech.j-hta.org/admin/proposals/${id}|https://tech.j-hta.org/admin/proposals/${id}>` } },
      { type: 'divider' },
      { type: 'context', elements: [{ type: 'mrkdwn', text: `JHTA Tech Portal › 課題提案フォーム（Step 2 詳細）` }] },
    ],
  };
}

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n) + '…' : s;
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
