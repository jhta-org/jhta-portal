---
title: "業界課題の提案"
date: 2026-04-01
draft: false
type: "proposals"
ShowBreadCrumbs: true
---

## 業界課題を提案する

ホスピタリティ業界で感じるDX課題を自由にご提案ください。提案内容は協会で検討し、プレワーキンググループとして立ち上げるかを判断します。

<span class="wg-badge badge-open">誰でも投稿可能</span>

---

<form id="contact-form" class="contact-form" novalidate>
  <input type="hidden" name="form_type" value="proposal">

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
    <label class="form-label" for="theme">課題テーマ <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="theme" name="theme" required placeholder="例：宿泊データのフォーマット統一">
  </div>

  <div class="form-group">
    <label class="form-label" for="description">課題の概要 <span class="form-required">*</span></label>
    <textarea class="form-textarea" id="description" name="description" rows="5" required placeholder="どのような場面で、どのような問題が発生しているかをご記入ください。"></textarea>
  </div>

  <div class="form-group">
    <label class="form-label" for="reference">参考URL（任意）</label>
    <input class="form-input" type="url" id="reference" name="reference" placeholder="https://...">
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
      if (res.ok) {
        form.reset();
        msg.textContent = '✅ ご提案ありがとうございます。内容を確認の上、ご連絡いたします。';
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

### 提案のポイント

- **具体的な課題** - どのような場面で、どのような問題が発生しているか
- **影響範囲** - 業界全体に共通する課題か、特定の領域の課題か
- **期待する成果** - 標準仕様、ガイドライン、ツールなど、どのような解決を期待するか
