/* Pixel-art characters in the Avaruun style. 16 x 28 grid, drawn crisp with fillRect. */
(function () {
  'use strict';
  const SKINS = ['#fbe3cf', '#f1c6a5', '#d9a07a', '#a86a45', '#6e4530'];
  const HAIRS = ['#6b3d22', '#262a44', '#e2c05a', '#d9542a', '#e4e6ef', '#e27cbf', '#3d6fd6', '#3f9a4a'];
  const SHIRTS = ['#c9b58a', '#3e8c4a', '#4b8ad8', '#8a3fa6', '#3aa38e', '#e0a52a', '#c8403b', '#5a6a8a'];
  const TROUSERS = ['#6b4b2d', '#2d3f6b', '#4a5a2a', '#1d3550', '#8a7a4a'];
  const NAMES_F = ['Mira', 'Luna', 'Elowen', 'Sora', 'Nell', 'Ayla', 'June', 'Rosalind', 'Iris', 'Wren'];
  const NAMES_M = ['Rowan', 'Theo', 'Kai', 'Arlo', 'Jasper', 'Ren', 'Finn', 'Elias', 'Milo', 'Cassian'];
  const BIOS = [
    'A former town guard who wants to see what\'s past the gate.',
    'Keeps a tin of seashells and counts stars before bed.',
    'Can find the brightest star in any sky. Usually looks at you instead.',
    'Believes every mountain is better with pine trees.',
    'Packs too many snacks. Never regrets it.',
    'Learned the names of every constellation for one person.',
    'Walks slowly on beaches so the night lasts longer.',
    'Once got lost in a forest on purpose. Found a wedding there.'
  ];

  const P = {
    // '.' empty, 'o' outline, 'k' skin, 'h' hair, 'e' eye, 'w' mouth, 's' shirt, 'd' shirt shade, 't' trousers, 'b' boots, 'n' hands
    head: [
      '......oooo......',
      '....oohhhhoo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhkkkkhhho..',
      '..okkkkkkkkkko..',
      '..okkekkkkekko..',
      '..okkkkkkkkkko..',
      '..okkkwwkkkkko..',
      '...okkkkkkkko...',
      '....ookkkkoo....',
      '......okko......'
    ],
    bodyM: [
      '....ossssssso...',
      '..oossssssssoo..',
      '.osossddsssoso..',
      '.ososssssssoso..',
      '.ososssssssoso..',
      '.onossssssssono.',
      '..oossssssssoo..',
      '...otttttttto...',
      '...ottttttttto..',
      '...ottoooottto..',
      '...otto..otto...',
      '...otto..otto...',
      '...otto..otto...',
      '...obbo..obbo...',
      '...obbo..obbo...',
      '...oooo..oooo...'
    ],
    bodyF: [
      '....ossssssso...',
      '..oossssssssoo..',
      '.osossddsssoso..',
      '.ososssssssoso..',
      '.ososssssssoso..',
      '.onossssssssono.',
      '..oossssssssoo..',
      '...otttttttto...',
      '..ottttttttttto.',
      '..ottttttttttto.',
      '.ottttttttttttto',
      '.oooooooooooooo.',
      '....okko.okko...',
      '....okko.okko...',
      '....obbo.obbo...',
      '....oooo.oooo...'
    ],
    // long hair overlay: drawn after body so it falls over the shoulders
    longHair: [
      '................',
      '................',
      '................',
      '................',
      '..ohh......hho..',
      '..ohh......hho..',
      '..ohh......hho..',
      '..ohh......hho..',
      '..ohh......hho..',
      '..ohh......hho..',
      '..ohhh....hhho..',
      '..ohhh....hhho..',
      '..ohhho..ohhho..',
      '...ooo....ooo...'
    ],
    // seated, seen from behind (16 x 20)
    seatBack: [
      '......oooo......',
      '....oohhhhoo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '...ohhhhhhhho...',
      '....ookkkkoo....',
      '......okko......',
      '....ossssssso...',
      '..oossssssssoo..',
      '.ososssssssoso..',
      '.ososssssssoso..',
      '.onossssssssono.',
      '.ossssssssssso..',
      '.osssssssssssso.',
      'ottttttttttttto.',
      'otttttttttttttto',
      'oooooooooooooooo'
    ],
    seatLong: [
      '................', '................', '................', '................',
      '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..',
      '...ohhhhhhhho...', '...ohhhhhhhho...', '....ohhhhhho....', '....ohhhhhho....',
      '.....ohhhho.....', '......oooo......'
    ]
  };

  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function night(hex, k) {
    const [r, g, b] = hexToRgb(hex); const t = k >= 0.98 ? 0 : 0.2;
    return `rgb(${(r * k * (1 - t) + 40 * t) | 0},${(g * k * (1 - t) + 60 * t) | 0},${(b * k * (1 - t) + 110 * t) | 0})`;
  }
  function darker(hex, f) { const [r, g, b] = hexToRgb(hex); return '#' + [r, g, b].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join(''); }

  function palette(spec, k, outfit) {
    const o = outfit || {};
    const shirt = o.shirt || spec.shirt, trousers = o.trousers || spec.trousers;
    return {
      o: night('#2b1a12', k), k: night(spec.skin, k), h: night(spec.hair, k), e: night('#2b1a12', k),
      w: night(darker(spec.skin, 0.75), k), s: night(shirt, k), d: night(o.shade || darker(shirt, 0.8), k),
      t: night(trousers, k), b: night('#3a2618', k), n: night(spec.skin, k)
    };
  }

  function blit(ctx, rows, pal, x, y, px) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c]; if (ch === '.') continue;
        ctx.fillStyle = pal[ch]; ctx.fillRect(x + c * px, y + r * px, px, px);
      }
    }
  }

  // Draw a character. x = center, y = feet line, px = size of one pixel.
  function drawStanding(ctx, spec, x, y, px, k, outfit) {
    const pal = palette(spec, k, outfit);
    const body = spec.body === 'f' ? P.bodyF : P.bodyM;
    const H = P.head.length + body.length;
    const ox = x - 8 * px, oy = y - H * px;
    blit(ctx, P.head, pal, ox, oy, px);
    blit(ctx, body, pal, ox, oy + P.head.length * px, px);
    if (spec.style === 'long') blit(ctx, P.longHair, pal, ox, oy, px);
    if (outfit && outfit.veil) { ctx.fillStyle = 'rgba(244,239,230,0.35)'; ctx.fillRect(ox + 1 * px, oy + 2 * px, 2 * px, 18 * px); ctx.fillRect(ox + 13 * px, oy + 2 * px, 2 * px, 18 * px); }
  }
  function drawSeated(ctx, spec, x, y, px, k) {
    const pal = palette(spec, k);
    const ox = x - 8 * px, oy = y - P.seatBack.length * px;
    blit(ctx, P.seatBack, pal, ox, oy, px);
    if (spec.style === 'long') blit(ctx, P.seatLong, pal, ox, oy, px);
  }

  window.Avatars = {
    SKINS, HAIRS, SHIRTS, TROUSERS, BIOS, NAMES_F, NAMES_M,
    defaults() {
      return {
        her: { body: 'f', style: 'long', skin: SKINS[1], hair: HAIRS[0], shirt: SHIRTS[2], trousers: TROUSERS[1], name: 'Lovey', bio: BIOS[2] },
        him: { body: 'm', style: 'short', skin: SKINS[2], hair: HAIRS[1], shirt: SHIRTS[1], trousers: TROUSERS[0], name: 'Me', bio: BIOS[0] }
      };
    },
    pick(list) { return list[Math.floor(Math.random() * list.length)]; },
    randomize(who) {
      const f = who === 'her';
      return { body: f ? 'f' : 'm', style: Math.random() < (f ? 0.7 : 0.25) ? 'long' : 'short', skin: this.pick(SKINS), hair: this.pick(HAIRS), shirt: this.pick(SHIRTS), trousers: this.pick(TROUSERS), name: this.pick(f ? NAMES_F : NAMES_M), bio: this.pick(BIOS) };
    },
    // pose: 'standing' | 'seated' | 'wedding'; s = pixel size; k = light (1 preview, ~0.55 night)
    draw(ctx, spec, x, y, s, pose, k) {
      ctx.save(); ctx.imageSmoothingEnabled = false;
      if (pose === 'seated') drawSeated(ctx, spec, x, y, s, k);
      else if (pose === 'wedding') drawStanding(ctx, spec, x, y, s, k, spec.body === 'f' ? { shirt: '#f4efe6', trousers: '#f4efe6', shade: '#d8d0c2', veil: true } : { shirt: '#1d2130', trousers: '#1d2130', shade: '#f4efe6' });
      else drawStanding(ctx, spec, x, y, s, k);
      ctx.restore();
    },
    shadow(ctx, x, y, s) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 1 * s, 9 * s, 2 * s, 0, 0, Math.PI * 2); ctx.fill(); }
  };
})();
