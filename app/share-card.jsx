// share-card.jsx — generate a branded 1M Beers image and share it to
// Instagram / anywhere via the native share sheet.
//
// Exposes:
//   window.buildShareCard(data) -> Promise<Blob>   (a 1080x1350 PNG)
//   window.shareBeer(data)      -> Promise<'shared'|'downloaded'|'cancelled'>
//
// data = { beer_name, brewery, style, abv, rating, photo, handle, count, venue }
//   photo/venue optional; count = community total after this log.

(function () {
  const W = 1080, H = 1350;
  const AMBER = '#F4B73D', CREAM = '#F4ECDD', MUTE = '#B8A584';

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Draw centered text, wrapping to at most maxLines. Returns y after the block.
  function wrapCentered(ctx, text, cx, y, maxW, lineH, maxLines) {
    const words = (text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line); line = w;
        if (lines.length === maxLines - 1) break;
      } else { line = test; }
    }
    if (line && lines.length < maxLines) lines.push(line);
    // Ellipsize last line if we ran out of room
    if (words.length && lines.length === maxLines) {
      let last = lines[maxLines - 1];
      while (ctx.measureText(last + '…').width > maxW && last.length) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    lines.forEach((ln, i) => ctx.fillText(ln, cx, y + i * lineH));
    return y + lines.length * lineH;
  }

  function drawStars(ctx, rating, cx, y, size) {
    const n = 5, gap = size * 0.28;
    const totalW = n * size + (n - 1) * gap;
    let x = cx - totalW / 2 + size / 2;
    ctx.font = `${size}px "Geist", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i < rating ? AMBER : 'rgba(244,236,221,0.22)';
      ctx.fillText('★', x, y);
      x += size + gap;
    }
  }

  async function ensureFonts() {
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.all([
          document.fonts.load('700 80px "Bricolage Grotesque"'),
          document.fonts.load('600 34px "Geist"'),
          document.fonts.load('400 30px "Geist"'),
        ]);
        await document.fonts.ready;
      }
    } catch (_) { /* fall back to system fonts */ }
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  window.buildShareCard = async function buildShareCard(data) {
    await ensureFonts();
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background — warm pub gradient + radial glows
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#2A1F12'); g.addColorStop(1, '#0d0b07');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.32, 40, W * 0.5, H * 0.32, 620);
    glow.addColorStop(0, 'rgba(244,183,61,0.16)'); glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    const cx = W / 2;

    // Eyebrow
    ctx.textAlign = 'center';
    ctx.fillStyle = AMBER;
    ctx.font = '600 30px "Geist", system-ui, sans-serif';
    ctx.save(); ctx.translate(0, 0);
    ctx.fillText('🍺  1 M   B E E R S', cx, 150);
    ctx.restore();

    // Optional photo (rounded square)
    let y = 250;
    const img = data.photo ? await loadImage(data.photo) : null;
    if (img) {
      const S = 460, x = cx - S / 2;
      ctx.save();
      roundRect(ctx, x, y, S, S, 44); ctx.clip();
      // cover-fit
      const ar = img.width / img.height, box = S / S;
      let sw = img.width, sh = img.height, sx = 0, sy = 0;
      if (ar > 1) { sw = img.height; sx = (img.width - sw) / 2; }
      else if (ar < 1) { sh = img.width; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, x, y, S, S);
      ctx.restore();
      ctx.strokeStyle = 'rgba(244,183,61,0.35)'; ctx.lineWidth = 3;
      roundRect(ctx, x, y, S, S, 44); ctx.stroke();
      y += S + 70;
    } else {
      // Simple beer glyph medallion
      ctx.font = '260px "Geist", system-ui, sans-serif';
      ctx.fillText('🍺', cx, y + 250);
      y += 340;
    }

    // Beer name
    ctx.fillStyle = CREAM;
    ctx.font = '700 74px "Bricolage Grotesque", system-ui, sans-serif';
    y = wrapCentered(ctx, data.beer_name || 'A beer', cx, y + 30, W - 160, 82, 2) + 18;

    // Brewery · style · abv
    const sub = [data.brewery, data.style, data.abv ? data.abv + '% ABV' : null]
      .filter(Boolean).join('  ·  ');
    if (sub) {
      ctx.fillStyle = MUTE;
      ctx.font = '400 32px "Geist", system-ui, sans-serif';
      y = wrapCentered(ctx, sub, cx, y + 12, W - 180, 42, 2) + 20;
    }

    // Stars
    if (data.rating > 0) { drawStars(ctx, data.rating, cx, y + 44, 46); y += 84; }

    // Venue
    if (data.venue) {
      ctx.fillStyle = MUTE;
      ctx.font = '400 28px "Geist", system-ui, sans-serif';
      ctx.fillText('📍 ' + data.venue, cx, y + 20); y += 44;
    }

    // Footer — community total + progress
    const count = Number(data.count) || 0;
    const pct = Math.max(0.004, Math.min(1, count / 1000000));
    const barW = W - 200, barX = cx - barW / 2, barY = H - 210;

    ctx.fillStyle = MUTE;
    ctx.font = '600 26px "Geist", system-ui, sans-serif';
    ctx.fillText('P O U R E D   T O G E T H E R', cx, barY - 96);

    ctx.fillStyle = AMBER;
    ctx.font = '700 84px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillText(count.toLocaleString(), cx, barY - 20);

    // progress track + fill
    ctx.fillStyle = 'rgba(244,236,221,0.12)';
    roundRect(ctx, barX, barY, barW, 14, 7); ctx.fill();
    ctx.fillStyle = AMBER;
    roundRect(ctx, barX, barY, Math.max(14, barW * pct), 14, 7); ctx.fill();

    ctx.fillStyle = MUTE;
    ctx.font = '400 28px "Geist", system-ui, sans-serif';
    ctx.textAlign = 'left';  ctx.fillText((pct * 100).toFixed(pct < 0.01 ? 3 : 1) + '% to 1M', barX, barY + 56);
    ctx.textAlign = 'right'; ctx.fillText('of 1,000,000', barX + barW, barY + 56);

    // Handle credit
    if (data.handle) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(184,165,132,0.7)';
      ctx.font = '500 26px "Geist", system-ui, sans-serif';
      ctx.fillText('logged by ' + data.handle + ' · onemillionbeers', cx, H - 70);
    }

    return await new Promise((res) => canvas.toBlob(res, 'image/png', 0.95));
  };

  window.shareBeer = async function shareBeer(data) {
    let blob;
    try { blob = await window.buildShareCard(data); }
    catch (e) { console.warn('[share] build failed', e); return 'error'; }

    const file = new File([blob], '1m-beers.png', { type: 'image/png' });
    const caption = `Just logged ${data.beer_name || 'a beer'} 🍺 — ${(Number(data.count) || 0).toLocaleString()} of 1,000,000 poured by the community. Join the toast! #1MBeers`;

    // Preferred: native share sheet (Instagram, Messages, etc.) with the image
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: '1M Beers', text: caption });
        return 'shared';
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
      // otherwise fall through to download
    }

    // Fallback (desktop / unsupported): download the image so they can post it
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '1m-beers.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return 'downloaded';
    } catch (e) { return 'error'; }
  };
})();
