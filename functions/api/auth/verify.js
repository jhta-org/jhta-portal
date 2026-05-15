/**
 * POST /api/auth/verify
 * メアド＋6桁OTPを受け取り、検証してセッションCookieを発行
 * body: { email, code }
 */
const MAX_ATTEMPTS = 5;
const SESSION_DAYS = 30;

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try { data = await request.json(); } catch { return json({ error: '入力が不正です' }, 400); }

  const email = (data.email || '').toString().trim().toLowerCase();
  const code = (data.code || '').toString().trim();
  if (!email || !/^\d{6}$/.test(code)) {
    return json({ error: 'メールアドレスと6桁の認証コードを入力してください' }, 400);
  }

  // 未使用かつ未期限切れのコードを取得
  const otp = await env.DB.prepare(
    `SELECT id, code_hash, attempts, expires_at FROM member_otp_codes
     WHERE email = ? AND used_at IS NULL
       AND datetime(expires_at) >= datetime('now', '+9 hours')
     ORDER BY created_at DESC LIMIT 1`
  ).bind(email).first();

  if (!otp) {
    return json({ error: '認証コードが見つかりません、または期限切れです。再度ログインからやり直してください。' }, 400);
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await env.DB.prepare(
      `UPDATE member_otp_codes SET used_at = datetime('now', '+9 hours') WHERE id = ?`
    ).bind(otp.id).run();
    return json({ error: '試行回数の上限に達しました。再度ログインからやり直してください。' }, 400);
  }

  const codeHash = await sha256Hex(code);
  if (codeHash !== otp.code_hash) {
    await env.DB.prepare(
      `UPDATE member_otp_codes SET attempts = attempts + 1 WHERE id = ?`
    ).bind(otp.id).run();
    return json({ error: '認証コードが一致しません' }, 400);
  }

  // 会員ステータス再チェック
  const member = await env.DB.prepare(
    `SELECT email, name, status FROM members WHERE email = ?`
  ).bind(email).first();
  if (!member || member.status !== 'active') {
    return json({ error: '会員が無効です' }, 403);
  }

  // OTPを使用済みに
  await env.DB.prepare(
    `UPDATE member_otp_codes SET used_at = datetime('now', '+9 hours') WHERE id = ?`
  ).bind(otp.id).run();

  // セッショントークン生成（256bit/64hex chars）
  const token = generateToken();
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 300);

  await env.DB.prepare(
    `INSERT INTO member_sessions (token, email, expires_at, user_agent)
     VALUES (?, ?, datetime('now', '+9 hours', '+${SESSION_DAYS} days'), ?)`
  ).bind(token, email, userAgent).run();

  // 会員のログイン情報更新
  await env.DB.prepare(
    `UPDATE members
     SET last_login_at = datetime('now', '+9 hours'),
         login_count = login_count + 1
     WHERE email = ?`
  ).bind(email).run();

  // 期限切れセッションを掃除（軽くついで）
  await env.DB.prepare(
    `DELETE FROM member_sessions WHERE datetime(expires_at) < datetime('now', '+9 hours')`
  ).run();

  const maxAge = SESSION_DAYS * 24 * 3600;
  const cookie = `jhta_member=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;

  return new Response(JSON.stringify({ ok: true, name: member.name }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}

function generateToken() {
  const buf = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
