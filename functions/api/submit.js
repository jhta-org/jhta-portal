/**
 * POST /api/submit
 * Handles contact form submissions and sends Slack notifications.
 * For form_type=proposal, also persists Step 1 data to D1 and returns the receipt id.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const webhookUrl = env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return jsonResponse({ error: 'Webhook not configured' }, 500);
  }

  let data;
  const contentType = request.headers.get('Content-Type') || '';

  try {
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      data = Object.fromEntries(new URLSearchParams(text).entries());
    } else {
      return jsonResponse({ error: 'Invalid content type' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Failed to parse request body' }, 400);
  }

  // Sanitize inputs
  for (const key of Object.keys(data)) {
    if (typeof data[key] === 'string') {
      data[key] = data[key].trim().slice(0, 2000);
    }
  }

  let slackPayload;
  let extraResponse = {};
  switch (data.form_type) {
    case 'proposal':
      try {
        const id = await createProposalStep1(env.DB, data);
        data.id = id;
        extraResponse.id = id;
      } catch (err) {
        console.error('D1 insert error:', err);
        return jsonResponse({ error: 'Failed to save proposal' }, 500);
      }
      slackPayload = buildProposalMessage(data);
      break;
    case 'pre-wg':
      slackPayload = buildPreWgMessage(data);
      break;
    case 'wg':
      slackPayload = buildWgMessage(data);
      break;
    default:
      return jsonResponse({ error: 'Invalid form type' }, 400);
  }

  try {
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });
    if (!slackRes.ok) {
      console.error('Slack error:', slackRes.status, await slackRes.text());
      // 通知失敗してもDB登録済みならOKとする（後で再通知可能）
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }

  return jsonResponse({ ok: true, ...extraResponse }, 200);
}

// ── D1 helpers ────────────────────────────────────────────────────────────────

async function generateProposalId(db) {
  const year = new Date().getUTCFullYear();
  await db.prepare('INSERT OR IGNORE INTO proposal_counter (year, last_seq) VALUES (?, 0)')
    .bind(year).run();
  const row = await db.prepare(
    'UPDATE proposal_counter SET last_seq = last_seq + 1 WHERE year = ? RETURNING last_seq'
  ).bind(year).first();
  const seq = String(row.last_seq).padStart(4, '0');
  return `JHTA-${year}-${seq}`;
}

async function createProposalStep1(db, data) {
  if (!db) throw new Error('D1 binding "DB" not available');
  const required = ['name', 'company', 'email', 'theme', 'summary'];
  for (const k of required) {
    if (!data[k]) throw new Error(`missing field: ${k}`);
  }
  const id = await generateProposalId(db);
  await db.prepare(
    `INSERT INTO proposals (id, source, name, company, email, theme, summary)
     VALUES (?, 'form', ?, ?, ?, ?, ?)`
  ).bind(id, data.name, data.company, data.email, data.theme, data.summary).run();
  return id;
}

// ── Slack message builders ────────────────────────────────────────────────────

function buildProposalMessage(d) {
  return {
    text: `📬 新しい課題提案が届きました${d.id ? `（${d.id}）` : ''}`,
    blocks: [
      header(`📬 新しい課題提案${d.id ? `  ${d.id}` : ''}`),
      fields([
        field('氏名', d.name),
        field('会社・所属', d.company),
        field('メールアドレス', d.email),
        field('課題テーマ', d.theme),
      ]),
      section(`*課題*\n${d.summary || '—'}`),
      ...(d.id ? [section(`*Step 2 詳細フォーム URL*\n\`https://tech.j-hta.org/workgroups/proposals/details/?id=${d.id}\``)] : []),
      divider(),
      context(`JHTA Tech Portal › 課題提案フォーム（Step 1）`),
    ],
  };
}

function buildPreWgMessage(d) {
  return {
    text: '✋ プレWG参加申し込みが届きました',
    blocks: [
      header('✋ プレWG参加申し込み'),
      fields([
        field('氏名', d.name),
        field('会社名', d.company),
        field('メールアドレス', d.email),
        field('参加希望プレWG', d.wg_name),
      ]),
      section(`*参加理由・背景*\n${d.motivation}`),
      divider(),
      context(`JHTA Tech Portal › プレWG参加申し込みフォーム`),
    ],
  };
}

function buildWgMessage(d) {
  return {
    text: '🏢 WG参加申し込みが届きました',
    blocks: [
      header('🏢 WG参加申し込み'),
      fields([
        field('氏名', d.name),
        field('会社名', d.company),
        field('メールアドレス', d.email),
        field('参加希望WG', d.wg_name),
        field('JHTA会員種別', d.membership),
      ]),
      section(`*参加理由・背景*\n${d.motivation}`),
      divider(),
      context(`JHTA Tech Portal › WG参加申し込みフォーム`),
    ],
  };
}

// ── Block Kit helpers ─────────────────────────────────────────────────────────

function header(text) {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } };
}

function section(text) {
  return { type: 'section', text: { type: 'mrkdwn', text } };
}

function fields(items) {
  return { type: 'section', fields: items };
}

function field(label, value) {
  return { type: 'mrkdwn', text: `*${label}*\n${value || '—'}` };
}

function divider() {
  return { type: 'divider' };
}

function context(text) {
  return {
    type: 'context',
    elements: [{ type: 'mrkdwn', text }],
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
