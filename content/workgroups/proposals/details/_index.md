---
title: "業界課題の提案（詳細記入）"
date: 2026-04-01
draft: false
type: "proposals"
ShowBreadCrumbs: true
hiddenInHomeList: true
---

## 提案の詳細をご記入ください

事務局からご案内のあった方向けの詳細記入フォームです。EC（理事会）での検討材料として、なるべく具体的にご記入をお願いします。すべて任意項目ですが、判断材料として可能な範囲でご記入いただけると助かります。

---

<form id="details-form" class="contact-form" novalidate>

  <div class="form-group">
    <label class="form-label" for="proposal_id">受付番号 <span class="form-required">*</span></label>
    <input class="form-input" type="text" id="proposal_id" name="proposal_id" required placeholder="例：JHTA-2026-0001" pattern="^JHTA-\d{4}-\d{4}$">
    <small class="form-hint">事務局からのメールに記載の受付番号をご入力ください</small>
  </div>

  <div class="form-group">
    <label class="form-label" for="background">課題の背景・現状の問題</label>
    <textarea class="form-textarea" id="background" name="background" rows="5" placeholder="どの業務フロー・場面で、どのような問題が起きていますか。背景となる業界・組織の状況も含めてご記入ください。"></textarea>
  </div>

  <div class="form-group">
    <label class="form-label">影響範囲</label>
    <div class="form-radio-group">
      <label class="form-radio"><input type="radio" name="scope_type" value="industry"> 業界全体</label>
      <label class="form-radio"><input type="radio" name="scope_type" value="specific"> 特定領域</label>
    </div>
    <textarea class="form-textarea" id="scope_text" name="scope_text" rows="3" placeholder="影響を受ける業務領域・規模・対象を具体的にご記入ください。"></textarea>
  </div>

  <div class="form-group">
    <label class="form-label">期待する成果（複数選択可）</label>
    <div class="form-check-group">
      <label class="form-check"><input type="checkbox" name="expected_outcomes[]" value="標準仕様"> 標準仕様</label>
      <label class="form-check"><input type="checkbox" name="expected_outcomes[]" value="ガイドライン"> ガイドライン</label>
      <label class="form-check"><input type="checkbox" name="expected_outcomes[]" value="ツール"> ツール</label>
      <label class="form-check"><input type="checkbox" name="expected_outcomes[]" value="調査・レポート"> 調査・レポート</label>
    </div>
    <textarea class="form-textarea" id="expected_outcomes_text" name="expected_outcomes_text" rows="3" placeholder="期待する成果物のイメージを自由にご記入ください。"></textarea>
  </div>

  <div class="form-group">
    <label class="form-label" for="expected_effects">期待する効果（業界DXへの貢献）</label>
    <textarea class="form-textarea" id="expected_effects" name="expected_effects" rows="4" placeholder="この課題を解決することで、業界・自社にどのような効果が見込めますか。可能なら定量的な見込みも添えてください。"></textarea>
  </div>

  <div class="form-group">
    <label class="form-label">想定する参加ステークホルダー（複数選択可）</label>
    <div class="form-check-group">
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="PMSベンダー"> PMSベンダー</label>
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="ホテル・旅館"> ホテル・旅館</label>
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="OTA"> OTA</label>
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="サイトコントローラー"> サイトコントローラー</label>
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="鍵メーカー（IoT）"> 鍵メーカー（IoT）</label>
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="関連団体"> 関連団体</label>
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="行政・自治体"> 行政・自治体</label>
      <label class="form-check"><input type="checkbox" name="stakeholders[]" value="その他"> その他</label>
    </div>
  </div>

  <div class="form-group">
    <label class="form-label" for="reference_urls">参考URL（複数の場合は改行区切り）</label>
    <textarea class="form-textarea" id="reference_urls" name="reference_urls" rows="3" placeholder="https://...&#10;https://..."></textarea>
  </div>

  <div class="form-group">
    <label class="form-label" for="whitepaper_url">ホワイトペーパーURL（任意）</label>
    <input class="form-input" type="url" id="whitepaper_url" name="whitepaper_url" placeholder="https://...">
    <small class="form-hint">添付ファイルがある場合は、Google Drive 等の共有可能なリンクをご記入ください</small>
  </div>

  <div class="form-group">
    <label class="form-label" for="additional_notes">その他補足</label>
    <textarea class="form-textarea" id="additional_notes" name="additional_notes" rows="3" placeholder="その他、伝えておきたい情報があればご記入ください。"></textarea>
  </div>

  <div id="form-message" class="form-message" hidden></div>

  <button type="submit" class="btn btn-primary form-submit">詳細を送信する</button>
</form>

<script>
(function() {
  const form = document.getElementById('details-form');
  const msg  = document.getElementById('form-message');

  // URL の ?id=JHTA-2026-0001 を受付番号にプリセット
  const params = new URLSearchParams(location.search);
  const idFromQuery = params.get('id');
  if (idFromQuery) {
    document.getElementById('proposal_id').value = idFromQuery;
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.disabled = true;
    btn.textContent = '送信中…';
    msg.hidden = true;
    msg.className = 'form-message';

    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) {
      if (k.endsWith('[]')) {
        const key = k.slice(0, -2);
        if (!data[key]) data[key] = [];
        data[key].push(v);
      } else {
        data[k] = v;
      }
    }

    try {
      const res = await fetch('/api/proposals/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        msg.textContent = '✅ ご提供ありがとうございます。事務局で確認させていただきます。';
        msg.classList.add('form-message-success');
        btn.textContent = '✓ 送信完了';
      } else {
        msg.textContent = body.error
          ? `⚠️ ${body.error}`
          : '⚠️ 送信に失敗しました。受付番号をご確認の上もう一度お試しください。';
        msg.classList.add('form-message-error');
        btn.disabled = false;
        btn.textContent = '詳細を送信する';
      }
    } catch {
      msg.textContent = '⚠️ 通信エラーが発生しました。しばらくしてからもう一度お試しください。';
      msg.classList.add('form-message-error');
      btn.disabled = false;
      btn.textContent = '詳細を送信する';
    }
    msg.hidden = false;
  });
})();
</script>
