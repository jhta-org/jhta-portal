---
title: "会員ログイン"
date: 2026-04-01
draft: false
type: "members"
ShowBreadCrumbs: true
hiddenInHomeList: true
---

会員限定コンテンツを閲覧するには、JHTA 会員メールアドレスでのログインが必要です。

メールアドレスを入力していただくと、6桁の認証コードをメールでお送りします。

---

<form id="email-form" class="contact-form" novalidate>
  <div class="form-group">
    <label class="form-label" for="email">メールアドレス <span class="form-required">*</span></label>
    <input class="form-input" type="email" id="email" name="email" required placeholder="taro@example.com" autocomplete="email">
  </div>
  <div id="email-msg" class="form-message" hidden></div>
  <button type="submit" class="btn btn-primary form-submit">認証コードを送信</button>
</form>

<form id="otp-form" class="contact-form" novalidate hidden>
  <div class="form-group">
    <label class="form-label">送信先メールアドレス</label>
    <div id="email-display" style="padding:0.65rem 0.9rem;background:var(--jhta-bg-alt);border-radius:var(--jhta-radius);font-size:0.92rem;color:var(--jhta-text);"></div>
  </div>
  <div class="form-group">
    <label class="form-label" for="code">認証コード <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="code" name="code" required inputmode="numeric" pattern="\d{6}" maxlength="6" placeholder="6桁の数字" autocomplete="one-time-code" style="font-family:'SF Mono',Menlo,monospace;font-size:1.4rem;letter-spacing:0.3rem;text-align:center;">
    <small style="display:block;color:var(--jhta-text-light);font-size:0.82rem;margin-top:0.35rem">届いたメールに記載の6桁の数字を入力してください（5分間有効）</small>
  </div>
  <div id="otp-msg" class="form-message" hidden></div>
  <div style="display:flex;gap:0.5rem;align-items:center">
    <button type="submit" class="btn btn-primary form-submit">ログイン</button>
    <button type="button" id="back-btn" class="btn" style="background:transparent;color:var(--jhta-text-light);border:1px solid var(--jhta-border)">メアドを入れ直す</button>
  </div>
</form>

<script>
(function() {
  const emailForm = document.getElementById('email-form');
  const otpForm = document.getElementById('otp-form');
  const emailMsg = document.getElementById('email-msg');
  const otpMsg = document.getElementById('otp-msg');
  const emailInput = document.getElementById('email');
  const emailDisplay = document.getElementById('email-display');
  const codeInput = document.getElementById('code');
  const backBtn = document.getElementById('back-btn');

  const params = new URLSearchParams(location.search);
  const next = params.get('next') || '/newsletter/';

  let currentEmail = '';

  emailForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = emailForm.querySelector('.form-submit');
    btn.disabled = true; btn.textContent = '送信中…';
    emailMsg.hidden = true; emailMsg.className = 'form-message';

    currentEmail = emailInput.value.trim();
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        emailDisplay.textContent = currentEmail;
        emailForm.hidden = true;
        otpForm.hidden = false;
        codeInput.focus();
        otpMsg.hidden = true;
        otpMsg.textContent = '';
      } else if (body.not_member) {
        emailMsg.innerHTML = '⚠️ このメールアドレスは JHTA 会員として登録されていません。<br>' +
          '会員でない方は <a href="https://www.j-hta.org/" target="_blank" rel="noopener">JHTA 公式サイト</a> より会員登録をお願いします。<br>' +
          'メールアドレスを間違えた場合は再度ご入力ください。';
        emailMsg.classList.add('form-message-error');
        emailMsg.hidden = false;
        btn.disabled = false; btn.textContent = '認証コードを送信';
      } else {
        emailMsg.textContent = '⚠️ ' + (body.error || '送信に失敗しました');
        emailMsg.classList.add('form-message-error');
        emailMsg.hidden = false;
        btn.disabled = false; btn.textContent = '認証コードを送信';
      }
    } catch {
      emailMsg.textContent = '⚠️ 通信エラーが発生しました';
      emailMsg.classList.add('form-message-error');
      emailMsg.hidden = false;
      btn.disabled = false; btn.textContent = '認証コードを送信';
    }
  });

  otpForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = otpForm.querySelector('.form-submit');
    btn.disabled = true; btn.textContent = '確認中…';
    otpMsg.hidden = true; otpMsg.className = 'form-message';

    const code = codeInput.value.trim();
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, code }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        otpMsg.textContent = '✅ ログイン成功。リダイレクトします…';
        otpMsg.classList.add('form-message-success');
        otpMsg.hidden = false;
        setTimeout(() => { location.href = next; }, 600);
      } else {
        otpMsg.textContent = '⚠️ ' + (body.error || 'コードの検証に失敗しました');
        otpMsg.classList.add('form-message-error');
        otpMsg.hidden = false;
        btn.disabled = false; btn.textContent = 'ログイン';
      }
    } catch {
      otpMsg.textContent = '⚠️ 通信エラーが発生しました';
      otpMsg.classList.add('form-message-error');
      otpMsg.hidden = false;
      btn.disabled = false; btn.textContent = 'ログイン';
    }
  });

  backBtn.addEventListener('click', function() {
    otpForm.hidden = true;
    emailForm.hidden = false;
    emailForm.querySelector('.form-submit').disabled = false;
    emailForm.querySelector('.form-submit').textContent = '認証コードを送信';
    codeInput.value = '';
    otpMsg.hidden = true;
  });
})();
</script>

---

### 会員でない方

JHTA 会員でない方は、まず [JHTA 公式サイト](https://www.j-hta.org/) より会員登録をお願いします。
