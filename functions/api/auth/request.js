/**
 * POST /api/auth/request
 * 会員メアドを受け取り、6桁OTPを生成してメール送信
 * body: { email }
 */
export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;

  let data;
  try { data = await request.json(); } catch { return json({ error: '入力が不正です' }, 400); }

  const email = (data.email || '').toString().trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'メールアドレスの形式が不正です' }, 400);
  }

  // 会員リストに存在するか確認
  const member = await env.DB.prepare(
    `SELECT email, name, status FROM members WHERE email = ?`
  ).bind(email).first();

  if (!member) {
    return json({
      error: 'このメールアドレスは JHTA 会員として登録されていません。',
      not_member: true,
    }, 404);
  }
  if (member.status !== 'active') {
    return json({
      error: 'このアカウントは無効化されています。事務局にお問い合わせください。',
    }, 403);
  }

  const code = generateOtpCode();
  const codeHash = await sha256Hex(code);

  // 既存の未使用コードを無効化
  await env.DB.prepare(
    `UPDATE member_otp_codes SET used_at = datetime('now', '+9 hours')
     WHERE email = ? AND used_at IS NULL`
  ).bind(email).run();

  // 新規コード保存（5分有効）
  await env.DB.prepare(
    `INSERT INTO member_otp_codes (email, code_hash, expires_at)
     VALUES (?, ?, datetime('now', '+9 hours', '+5 minutes'))`
  ).bind(email, codeHash).run();

  // メール送信（waitUntilでバックグラウンド）
  const sendPromise = sendOtpEmail(env, email, member.name, code).catch(err => {
    console.error('OTP email send error:', err);
  });
  if (typeof waitUntil === 'function') waitUntil(sendPromise);
  else await sendPromise;

  return json({ ok: true }, 200);
}

function generateOtpCode() {
  // 6桁のゼロ埋め数字
  const n = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295 * 1000000);
  return String(n).padStart(6, '0');
}

async function sha256Hex(input) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendOtpEmail(env, email, name, code) {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
  const from = env.RESEND_FROM_EMAIL || 'noreply@tech.j-hta.org';
  const body = {
    from: `JHTA Tech Portal <${from}>`,
    to: [email],
    subject: `【JHTA】ログイン認証コード: ${code}`,
    text: buildTextBody(name, code),
    html: buildHtmlBody(name, code),
  };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error: ${res.status} ${text}`);
  }
}

function buildTextBody(name, code) {
  return `${name} 様

JHTA Tech Portal のログイン認証コードをお送りします。

認証コード： ${code}

このコードは5分間有効です。
ログインページに戻り、認証コード入力欄にこの番号をご入力ください。

このメールに心当たりがない場合は、無視していただいて問題ありません。

--
一般社団法人 日本ホスピタリティテクノロジー協会（JHTA）
https://tech.j-hta.org/
`;
}

function buildHtmlBody(name, code) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html>
<html><body style="font-family:-apple-system,'Yu Gothic',sans-serif;color:#2a3342;line-height:1.7;max-width:560px;margin:0 auto;padding:24px">
<p>${esc(name)} 様</p>
<p>JHTA Tech Portal のログイン認証コードをお送りします。</p>
<div style="margin:24px 0;padding:24px;background:#f6f7f9;border:1px solid #e1e1e1;border-radius:8px;text-align:center">
  <div style="font-size:13px;color:#5e6a7b;margin-bottom:8px">認証コード</div>
  <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1b2d5b;font-family:'SF Mono',Menlo,monospace">${esc(code)}</div>
</div>
<p style="color:#5e6a7b;font-size:14px">
このコードは <strong>5分間</strong> 有効です。<br>
ログインページに戻り、認証コード入力欄にこの番号をご入力ください。
</p>
<p style="color:#5e6a7b;font-size:13px">
このメールに心当たりがない場合は、無視していただいて問題ありません。
</p>
<hr style="border:none;border-top:1px solid #e1e1e1;margin:32px 0">
<p style="color:#5e6a7b;font-size:12px">
一般社団法人 日本ホスピタリティテクノロジー協会（JHTA）<br>
<a href="https://tech.j-hta.org/" style="color:#1b2d5b">https://tech.j-hta.org/</a>
</p>
</body></html>`;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
