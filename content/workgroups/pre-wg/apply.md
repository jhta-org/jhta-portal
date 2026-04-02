---
title: "プレWG参加申し込み"
date: 2026-04-01
draft: false
ShowBreadCrumbs: true
---

## プレワーキンググループに参加する

プレワーキンググループは業界関係者であれば**どなたでも参加できます**。
参加を希望するプレWGをお選びいただき、フォームからお申し込みください。

<span class="wg-badge badge-open">誰でも参加可能</span>

---

<form id="contact-form" class="contact-form" novalidate>
  <input type="hidden" name="form_type" value="pre-wg">

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
    <label class="form-label" for="wg_name">参加希望のプレWG <span class="form-required">*</span></label>
    <select class="form-select" id="wg_name" name="wg_name" required>
      <option value="">選択してください</option>
      <option value="データ標準化プレWG">データ標準化プレWG</option>
      <option value="その他">その他（下記に記入）</option>
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
