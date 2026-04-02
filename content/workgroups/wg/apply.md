---
title: "WG参加申し込み"
date: 2026-04-01
draft: false
ShowBreadCrumbs: true
---

## ワーキンググループに参加する

ワーキンググループへの参加は**JHTA会員限定**です。
参加を希望するWGをお選びいただき、フォームからお申し込みください。

<span class="wg-badge badge-member">JHTA会員限定</span>

---

<form id="contact-form" class="contact-form" novalidate>
  <input type="hidden" name="form_type" value="wg">

  <div class="form-group">
    <label class="form-label" for="name">氏名 <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="name" name="name" required placeholder="山田 太郎">
  </div>

  <div class="form-group">
    <label class="form-label" for="company">会社名 <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="company" name="company" required placeholder="株式会社〇〇">
  </div>

  <div class="form-group">
    <label class="form-label" for="email">メールアドレス <span class="form-required">*</span></label>
    <input class="form-input" type="email" id="email" name="email" required placeholder="taro@example.com">
  </div>

  <div class="form-group">
    <label class="form-label" for="wg_name">参加希望のWG <span class="form-required">*</span></label>
    <select class="form-select" id="wg_name" name="wg_name" required>
      <option value="">選択してください</option>
      <option value="API仕様策定WG">API仕様策定WG</option>
      <option value="その他">その他（下記に記入）</option>
    </select>
  </div>

  <div class="form-group">
    <label class="form-label" for="membership">JHTA会員種別 <span class="form-required">*</span></label>
    <select class="form-select" id="membership" name="membership" required>
      <option value="">選択してください</option>
      <option value="正会員">正会員</option>
      <option value="賛助会員">賛助会員</option>
      <option value="特別会員">特別会員</option>
    </select>
  </div>

  <div class="form-group">
    <label class="form-label" for="motivation">参加理由・背景 <span class="form-required">*</span></label>
    <textarea class="form-textarea" id="motivation" name="motivation" rows="4" required placeholder="参加を希望する理由や、関連する業務経験などをご記入ください。"></textarea>
  </div>

  <div id="form-message" class="form-message" hidden></div>

  <button type="submit" class="btn btn-primary form-submit">申し込みを送信する</button>
</form>

<script>
(function() {
  const form = document.getElementById('contact-form');
  const msg  = document.getElementById('form-message');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.disabled = true;
    btn.textContent = '送信中…';
    msg.hidden = true;
    msg.className = 'form-message';

    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        form.reset();
        msg.textContent = '✅ 申し込みを受け付けました。担当者よりご連絡いたします。';
        msg.classList.add('form-message-success');
      } else {
        msg.textContent = '⚠️ 送信に失敗しました。しばらくしてからもう一度お試しください。';
        msg.classList.add('form-message-error');
        btn.disabled = false;
        btn.textContent = '申し込みを送信する';
      }
    } catch {
      msg.textContent = '⚠️ 通信エラーが発生しました。しばらくしてからもう一度お試しください。';
      msg.classList.add('form-message-error');
      btn.disabled = false;
      btn.textContent = '申し込みを送信する';
    }
    msg.hidden = false;
  });
})();
</script>
