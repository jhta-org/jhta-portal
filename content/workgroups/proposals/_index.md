---
title: "業界課題の提案"
date: 2026-04-01
draft: false
type: "proposals"
ShowBreadCrumbs: true
---

## 業界課題を提案する

ホスピタリティ業界の DX 推進に向けて、課題やテーマをご提案ください。**まずは概要のみご記入いただく簡易フォーム**です。事務局で内容を確認の上、必要に応じて詳細記入用フォームのご案内をメールでお送りします。

<span class="wg-badge badge-open">どなたでも投稿可能</span>

---

<form id="contact-form" class="contact-form" novalidate>
  <input type="hidden" name="form_type" value="proposal">

  <div class="form-group">
    <label class="form-label" for="name">氏名 <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="name" name="name" required placeholder="山田 太郎">
  </div>

  <div class="form-group">
    <label class="form-label" for="company">会社・所属 <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="company" name="company" required placeholder="株式会社〇〇／〇〇ホテル">
  </div>

  <div class="form-group">
    <label class="form-label" for="email">メールアドレス <span class="form-required">*</span></label>
    <input class="form-input" type="email" id="email" name="email" required placeholder="taro@example.com">
  </div>

  <div class="form-group">
    <label class="form-label" for="theme">課題テーマ <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="theme" name="theme" required placeholder="例：宿泊データのフォーマット統一">
  </div>

  <div class="form-group">
    <label class="form-label" for="summary">課題 <span class="form-required">*</span></label>
    <textarea class="form-textarea" id="summary" name="summary" rows="4" maxlength="400" required placeholder="どのような場面でどんな問題があるかを簡潔にご記入ください。詳細は後ほど別フォームでお伺いします。"></textarea>
  </div>

  <div id="form-message" class="form-message" hidden></div>

  <button type="submit" class="btn btn-primary form-submit">提案を送信する</button>
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
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        const id = body.id ? `（受付番号: <strong>${body.id}</strong>）` : '';
        msg.innerHTML = `✅ ご提案ありがとうございます。${id} 内容を確認の上、メールでご連絡いたします。`;
        msg.classList.add('form-message-success');
      } else {
        msg.textContent = '⚠️ 送信に失敗しました。しばらくしてからもう一度お試しください。';
        msg.classList.add('form-message-error');
        btn.disabled = false;
        btn.textContent = '提案を送信する';
      }
    } catch {
      msg.textContent = '⚠️ 通信エラーが発生しました。しばらくしてからもう一度お試しください。';
      msg.classList.add('form-message-error');
      btn.disabled = false;
      btn.textContent = '提案を送信する';
    }
    msg.hidden = false;
  });
})();
</script>

---

### 進め方の流れ

1. **提案** — このフォームから簡易にご提案
2. **JHTA事務局で調整・判断** — 内容を確認し、ご連絡
3. **詳細記入フォームのご案内** — 進める案件は詳細フォーム（別URL）をメールでお送りします
4. **PreWG・正式WG化の検討** — 詳細をもとにECで検討、必要に応じてPreWG／WG立ち上げへ

### 簡易フォームに書く内容

- **どこで** どのような場面で問題が起きているか
- **何が** 課題と感じているか
