import QRCode from 'qrcode';
import pruanedLogoUrl from '../assets/pruaned-official-logo.png';
import { buildCredentialData, CR80 } from './credentialData.js';

export { buildCredentialData, CR80 };

const FONT_SANS = '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const roundedRectPath = (ctx, x, y, w, h, r = 0) => {
  const radius = Math.min(Math.max(0, r), w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const wrapWords = (ctx, text, maxWidth) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      return;
    }

    if (current) {
      lines.push(current);
      current = word;
      return;
    }

    // Si una palabra individual es más ancha que maxWidth, partir por caracteres sin perder letras.
    let chunk = '';
    for (const ch of word) {
      if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    current = chunk;
  });

  if (current) lines.push(current);
  return lines;
};

/**
 * Ajusta el tamaño tipográfico hasta lograr que el texto quepa completo dentro
 * del bloque (evitando truncamientos "..." en nombres extensos).
 */
const fitTextLines = (ctx, text, {
  maxWidth,
  initialSize = 24,
  minSize = 13,
  maxLines = 2,
  weight = '700',
  italic = false
} = {}) => {
  const content = String(text || '').trim();
  if (!content) return { size: initialSize, lines: [''] };

  const prefix = italic ? 'italic ' : '';
  for (let size = initialSize; size >= minSize; size -= 1) {
    ctx.font = `${prefix}${weight} ${size}px ${FONT_SANS}`;
    const lines = wrapWords(ctx, content, maxWidth);
    const fitsAllLines = lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth + 1);
    if (fitsAllLines) {
      return { size, lines };
    }
  }

  ctx.font = `${prefix}${weight} ${minSize}px ${FONT_SANS}`;
  const fallbackLines = wrapWords(ctx, content, maxWidth);
  if (fallbackLines.length <= maxLines) {
    return { size: minSize, lines: fallbackLines };
  }
  const merged = fallbackLines.slice(0, maxLines);
  merged[maxLines - 1] = fallbackLines.slice(maxLines - 1).join(' ');
  return { size: minSize, lines: merged };
};

const drawMultilineText = (ctx, lines, x, y, lineHeight, { align = 'left' } = {}) => {
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * lineHeight);
  });
};

const blobToDataUrl = (blob) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
  reader.onerror = () => resolve(null);
  reader.readAsDataURL(blob);
});

const loadRawImage = (src, useAnonymous = false) => new Promise((resolve) => {
  const img = new Image();
  if (useAnonymous) img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

/**
 * Carga una imagen sin contaminar el canvas (CORS-safe para exportar PNG).
 */
const loadImageForCanvas = async (src) => {
  if (!src) return null;
  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
    return loadRawImage(src, false);
  }
  try {
    const response = await fetch(src, { mode: 'cors' });
    if (response.ok) {
      const dataUrl = await blobToDataUrl(await response.blob());
      if (dataUrl) {
        const img = await loadRawImage(dataUrl, false);
        if (img) return img;
      }
    }
  } catch {
    // Fallback a carga directa con crossOrigin anonymous
  }
  return loadRawImage(src, true);
};

let cachedShieldPromise = null;

/**
 * Recorta el escudo oficial desde pruaned-official-logo.png (eliminando el texto
 * inferior duplicado y el fondo blanco exterior para superponerlo limpiamente sobre
 * cabeceras oscuras manteniendo blancos los animales interiores).
 */
const getCleanShieldCanvas = () => {
  if (!cachedShieldPromise) {
    cachedShieldPromise = (async () => {
      const logoImg = await loadImageForCanvas(pruanedLogoUrl);
      if (!logoImg || !logoImg.width || !logoImg.height) return null;

      const sx = Math.floor(logoImg.width * 0.308);
      const sy = Math.floor(logoImg.height * 0.105);
      const sw = Math.ceil(logoImg.width * 0.384);
      const sh = Math.ceil(logoImg.height * 0.661);

      const offscreen = document.createElement('canvas');
      offscreen.width = sw;
      offscreen.height = sh;
      const octx = offscreen.getContext('2d');
      if (!octx) return null;

      octx.drawImage(logoImg, sx, sy, sw, sh, 0, 0, sw, sh);

      try {
        const imageData = octx.getImageData(0, 0, sw, sh);
        const { data } = imageData;
        const visited = new Uint8Array(sw * sh);
        const queue = new Int32Array(sw * sh);
        let head = 0;
        let tail = 0;

        const isNearWhite = (idx) => {
          const p = idx * 4;
          return data[p + 3] < 20 || (data[p] > 238 && data[p + 1] > 238 && data[p + 2] > 238);
        };

        const enqueueIfWhite = (x, y) => {
          if (x < 0 || y < 0 || x >= sw || y >= sh) return;
          const idx = y * sw + x;
          if (visited[idx] || !isNearWhite(idx)) return;
          visited[idx] = 1;
          queue[tail] = idx;
          tail += 1;
        };

        for (let x = 0; x < sw; x += 1) {
          enqueueIfWhite(x, 0);
          enqueueIfWhite(x, sh - 1);
        }
        for (let y = 1; y < sh - 1; y += 1) {
          enqueueIfWhite(0, y);
          enqueueIfWhite(sw - 1, y);
        }

        while (head < tail) {
          const idx = queue[head];
          head += 1;
          const p = idx * 4;
          data[p + 3] = 0;

          const x = idx % sw;
          const y = (idx - x) / sw;
          enqueueIfWhite(x + 1, y);
          enqueueIfWhite(x - 1, y);
          enqueueIfWhite(x, y + 1);
          enqueueIfWhite(x, y - 1);
        }

        octx.putImageData(imageData, 0, 0);
      } catch {
        // En caso de error de lectura, se devuelve el recorte limpio.
      }

      return offscreen;
    })();
  }
  return cachedShieldPromise;
};

const drawCoverImage = (ctx, img, x, y, w, h, radius) => {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let drawX = x;
  let drawY = y;

  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = h * imgRatio;
    drawX = x - (drawW - w) / 2;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    drawY = y - (drawH - h) / 4; // Favorecer encuadre de rostro
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
};

const drawPhotoPlaceholder = (ctx, x, y, w, h, radius, { dark = false } = {}) => {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = dark ? '#1E293B' : '#F1F5F9';
  ctx.fill();
  ctx.clip();

  const cx = x + w / 2;
  ctx.fillStyle = dark ? '#64748B' : '#94A3B8';
  // Cabeza
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.36, w * 0.19, 0, Math.PI * 2);
  ctx.fill();
  // Hombros
  ctx.beginPath();
  ctx.ellipse(cx, y + h * 0.92, w * 0.39, h * 0.36, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawPaw = (ctx, cx, cy, size, color, rotationRad = 0) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.fillStyle = color;

  // Almohadilla central
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.08);
  ctx.bezierCurveTo(size * 0.34, -size * 0.08, size * 0.44, size * 0.25, size * 0.24, size * 0.38);
  ctx.bezierCurveTo(size * 0.1, size * 0.46, size * 0.05, size * 0.34, 0, size * 0.34);
  ctx.bezierCurveTo(-size * 0.05, size * 0.34, -size * 0.1, size * 0.46, -size * 0.24, size * 0.38);
  ctx.bezierCurveTo(-size * 0.44, size * 0.25, -size * 0.34, -size * 0.08, 0, -size * 0.08);
  ctx.closePath();
  ctx.fill();

  // Dedos
  const toes = [
    [-size * 0.34, -size * 0.12, size * 0.105, size * 0.145, -0.35],
    [-size * 0.12, -size * 0.31, size * 0.11, size * 0.155, -0.1],
    [size * 0.12, -size * 0.31, size * 0.11, size * 0.155, 0.1],
    [size * 0.34, -size * 0.12, size * 0.105, size * 0.145, 0.35]
  ];
  toes.forEach(([tx, ty, rx, ry, angle]) => {
    ctx.beginPath();
    ctx.ellipse(tx, ty, rx, ry, angle, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};

const drawCapsuleIcon = (ctx, cx, cy, kind, color = '#FFFFFF') => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'person') {
    ctx.beginPath();
    ctx.arc(0, -6.5, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 11.5, 11.5, 9, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'paw') {
    drawPaw(ctx, 0, 1, 24, color, 0);
  } else if (kind === 'idcard') {
    ctx.lineWidth = 2.2;
    roundedRectPath(ctx, -13, -9, 26, 18, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-6, -1.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-6, 5.5, 4.4, 3.2, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(9.5, -3);
    ctx.moveTo(2, 1.5);
    ctx.lineTo(9.5, 1.5);
    ctx.moveTo(2, 5.5);
    ctx.lineTo(7, 5.5);
    ctx.stroke();
  } else if (kind === 'briefcase') {
    roundedRectPath(ctx, -12.5, -6, 25, 17, 3);
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-5, -10.5);
    ctx.lineTo(5, -10.5);
    ctx.lineTo(5, -6);
    ctx.stroke();
    ctx.fillStyle = '#0A265C';
    ctx.fillRect(-2.5, 0, 5, 3.5);
  } else if (kind === 'calendar') {
    ctx.lineWidth = 2.2;
    roundedRectPath(ctx, -11.5, -9, 23, 21, 3);
    ctx.stroke();
    ctx.fillRect(-11.5, -9, 23, 6);
    ctx.beginPath();
    ctx.moveTo(-6, -12.5);
    ctx.lineTo(-6, -7.5);
    ctx.moveTo(6, -12.5);
    ctx.lineTo(6, -7.5);
    ctx.stroke();
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        ctx.fillRect(-7 + col * 5.6, 0.5 + row * 5.2, 3.4, 3.2);
      }
    }
  }

  ctx.restore();
};

const drawAnimalSilhouettes = (ctx, baseX, baseY, scale = 1, color = '#FFFFFF') => {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;

  // Perro sentado mirando a la derecha
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(56, 0);
  ctx.quadraticCurveTo(59, -6, 54, -9);
  ctx.lineTo(51, -18);
  ctx.lineTo(52, -46);
  ctx.quadraticCurveTo(64, -52, 72, -62);
  ctx.quadraticCurveTo(80, -68, 86, -69);
  ctx.quadraticCurveTo(92, -71, 90, -78);
  ctx.quadraticCurveTo(86, -82, 75, -85);
  ctx.quadraticCurveTo(69, -96, 56, -98);
  ctx.quadraticCurveTo(47, -99, 43, -91);
  // Oreja
  ctx.quadraticCurveTo(36, -80, 41, -67);
  // Lomo
  ctx.quadraticCurveTo(31, -50, 21, -35);
  ctx.quadraticCurveTo(10, -20, 12, -4);
  ctx.quadraticCurveTo(3, -15, 0, -28);
  ctx.quadraticCurveTo(3, -8, 6, 0);
  ctx.closePath();
  ctx.fill();

  // Gato sentado entre perro y caballo
  ctx.beginPath();
  ctx.moveTo(102, 0);
  ctx.lineTo(146, 0);
  ctx.quadraticCurveTo(156, -4, 151, -11);
  ctx.quadraticCurveTo(146, -13, 143, -4);
  ctx.lineTo(141, -30);
  ctx.quadraticCurveTo(142, -43, 134, -50);
  // Cabeza y orejas
  ctx.quadraticCurveTo(137, -58, 134, -67);
  ctx.lineTo(135, -78);
  ctx.lineTo(127, -71);
  ctx.quadraticCurveTo(122, -73, 117, -71);
  ctx.lineTo(111, -78);
  ctx.lineTo(111, -66);
  ctx.quadraticCurveTo(108, -58, 112, -50);
  ctx.quadraticCurveTo(100, -34, 102, 0);
  ctx.closePath();
  ctx.fill();

  // Busto/perfil de caballo mirando a la derecha
  ctx.beginPath();
  ctx.moveTo(154, 0);
  ctx.lineTo(222, 0);
  ctx.quadraticCurveTo(224, -22, 229, -36);
  ctx.quadraticCurveTo(240, -36, 250, -32);
  ctx.quadraticCurveTo(259, -32, 260, -41);
  ctx.quadraticCurveTo(256, -48, 245, -58);
  ctx.quadraticCurveTo(239, -68, 232, -77);
  // Orejas del caballo
  ctx.lineTo(234, -90);
  ctx.lineTo(224, -82);
  ctx.lineTo(220, -92);
  ctx.lineTo(213, -81);
  // Crin fluida
  ctx.quadraticCurveTo(192, -69, 178, -46);
  ctx.quadraticCurveTo(164, -25, 154, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};

const createQrImage = async (verifyUrl, sizePx = 300, darkColor = '#0A1E3D') => {
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: sizePx,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: darkColor,
      light: '#FFFFFF'
    }
  });
  return loadRawImage(qrDataUrl, false);
};

/**
 * Credencial Oficial de Socio PRUANED A.G. — Horizontal CR80 (85.60 × 53.98 mm · 1011 × 638 px)
 */
const renderSocioCredential = async (ctx, data) => {
  const W = CR80.horizontal.widthPx;
  const H = CR80.horizontal.heightPx;

  const [photoImg, shieldCanvas, qrImg] = await Promise.all([
    loadImageForCanvas(data.photoUrl),
    getCleanShieldCanvas(),
    createQrImage(data.verifyUrl, 320, '#0B1D36')
  ]);

  // Fondo institucional profundo + acento esmeralda sutil
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#091529');
  bg.addColorStop(0.55, '#0E213D');
  bg.addColorStop(1, '#081326');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.88, H * 0.14, 10, W * 0.88, H * 0.14, 420);
  glow.addColorStop(0, 'rgba(16, 185, 129, 0.20)');
  glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Franja superior acento
  const topStripe = ctx.createLinearGradient(0, 0, W, 0);
  topStripe.addColorStop(0, '#059669');
  topStripe.addColorStop(0.5, '#34D399');
  topStripe.addColorStop(1, '#2563EB');
  ctx.fillStyle = topStripe;
  ctx.fillRect(0, 0, W, 8);

  // Encabezado
  roundedRectPath(ctx, 46, 34, 82, 82, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  if (shieldCanvas) {
    const pad = 8;
    const targetH = 82 - pad * 2;
    const targetW = targetH * (shieldCanvas.width / shieldCanvas.height);
    ctx.drawImage(
      shieldCanvas,
      46 + (82 - targetW) / 2,
      34 + pad,
      targetW,
      targetH
    );
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#34D399';
  ctx.font = `800 18px ${FONT_SANS}`;
  ctx.fillText('PRUANED A.G.', 146, 40);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `700 26px ${FONT_SANS}`;
  ctx.fillText('Asociación Gremial Nacional', 146, 65);

  ctx.fillStyle = '#94A3B8';
  ctx.font = `500 15px ${FONT_SANS}`;
  ctx.fillText('Credencial Oficial de Socio · Emergencias y Desastres', 146, 98);

  // Pastilla de categoría/estado superior derecha
  const badgeText = String(data.roleLabel || 'Socio Activo').toUpperCase();
  ctx.font = `800 16px ${FONT_SANS}`;
  const badgeW = Math.min(265, Math.max(150, ctx.measureText(badgeText).width + 44));
  const badgeX = W - 46 - badgeW;
  roundedRectPath(ctx, badgeX, 42, badgeW, 42, 21);
  ctx.fillStyle = data.isActive ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.18)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = data.isActive ? 'rgba(52, 211, 153, 0.65)' : 'rgba(251, 113, 133, 0.7)';
  ctx.stroke();

  ctx.fillStyle = data.isActive ? '#6EE7B7' : '#FDA4AF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + badgeW / 2, 64);

  // Línea divisoria superior
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(46, 136);
  ctx.lineTo(W - 46, 136);
  ctx.stroke();

  // Foto de perfil (izquierda) — proporción carnet vertical nítida 205×258
  const photoX = 46;
  const photoY = 166;
  const photoW = 205;
  const photoH = 260;

  if (photoImg) {
    drawCoverImage(ctx, photoImg, photoX, photoY, photoW, photoH, 20);
  } else {
    drawPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH, 20, { dark: true });
  }
  roundedRectPath(ctx, photoX, photoY, photoW, photoH, 20);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.5)';
  ctx.stroke();

  // Bloque QR (derecha) — módulo cuadrado blanco de alta legibilidad
  const qrCardW = 212;
  const qrCardH = 252;
  const qrCardX = W - 46 - qrCardW;
  const qrCardY = 170;

  roundedRectPath(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 20);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  if (qrImg) {
    ctx.drawImage(qrImg, qrCardX + 16, qrCardY + 14, 180, 180);
  }
  ctx.fillStyle = '#0F172A';
  ctx.font = `800 15px ${FONT_SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('ESCANEAR QR', qrCardX + qrCardW / 2, qrCardY + 201);
  ctx.fillStyle = '#475569';
  ctx.font = `700 13px ${FONT_SANS}`;
  ctx.fillText('VALIDACIÓN OFICIAL', qrCardX + qrCardW / 2, qrCardY + 221);

  // Zona central de identidad (ancho completo disponible entre foto y QR — sin truncar nombres)
  const infoX = photoX + photoW + 30;
  const infoW = qrCardX - 26 - infoX;

  const fittedName = fitTextLines(ctx, data.fullName, {
    maxWidth: infoW,
    initialSize: 34,
    minSize: 21,
    maxLines: 2,
    weight: '800'
  });
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${fittedName.size}px ${FONT_SANS}`;
  const nameLineHeight = Math.round(fittedName.size * 1.18);
  drawMultilineText(ctx, fittedName.lines, infoX, 170, nameLineHeight);

  let cursorY = 170 + fittedName.lines.length * nameLineHeight + 18;

  // RUT
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#94A3B8';
  ctx.font = `700 14px ${FONT_SANS}`;
  ctx.fillText('RUT', infoX, cursorY);
  ctx.fillStyle = '#E2E8F0';
  ctx.font = `800 22px ${FONT_SANS}`;
  ctx.fillText(data.rut, infoX + 48, cursorY - 3);
  cursorY += 36;

  // Profesión o especialidad (1 a 2 líneas dinámicas)
  const fittedProf = fitTextLines(ctx, data.profession, {
    maxWidth: infoW,
    initialSize: 22,
    minSize: 15,
    maxLines: 2,
    weight: '700'
  });
  ctx.fillStyle = '#34D399';
  ctx.font = `700 ${fittedProf.size}px ${FONT_SANS}`;
  const profLH = Math.round(fittedProf.size * 1.24);
  drawMultilineText(ctx, fittedProf.lines, infoX, cursorY, profLH);
  cursorY += fittedProf.lines.length * profLH + 16;

  // Región y Vigencia
  ctx.fillStyle = '#CBD5E1';
  ctx.font = `600 18px ${FONT_SANS}`;
  const regionFitted = fitTextLines(ctx, `Región: ${data.region}`, {
    maxWidth: infoW,
    initialSize: 18,
    minSize: 14,
    maxLines: 1,
    weight: '600'
  });
  ctx.font = `600 ${regionFitted.size}px ${FONT_SANS}`;
  ctx.fillText(regionFitted.lines[0], infoX, cursorY);

  cursorY += 28;
  ctx.fillStyle = '#94A3B8';
  ctx.font = `600 16px ${FONT_SANS}`;
  ctx.fillText(`Vigencia anual: ${data.vigencia}`, infoX, cursorY);

  // Pie de tarjeta
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(46, 558);
  ctx.lineTo(W - 46, 558);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#94A3B8';
  ctx.font = `600 18px ${FONT_SANS}`;
  ctx.fillText(`Registro: ${data.code}`, 46, 594);

  ctx.textAlign = 'right';
  ctx.fillStyle = data.isActive ? '#34D399' : '#FDA4AF';
  ctx.font = `700 18px ${FONT_SANS}`;
  ctx.fillText(`● Estado gremial: ${data.feeStatus}`, W - 46, 594);
};

/**
 * Credencial Oficial de Voluntario/a PRUANED — Vertical CR80 (53.98 × 85.60 mm · 638 × 1011 px)
 * Inspirada en el diseño oficial vertical con ondas azul/naranja, 5 cápsulas informativas,
 * banda VOLUNTARIO/A, siluetas animales y QR integrado de validación en terreno.
 */
const renderVolunteerCredential = async (ctx, data) => {
  const W = CR80.vertical.widthPx;
  const H = CR80.vertical.heightPx;

  const [photoImg, shieldCanvas, qrImg] = await Promise.all([
    loadImageForCanvas(data.photoUrl),
    getCleanShieldCanvas(),
    createQrImage(data.verifyUrl, 300, '#0A265C')
  ]);

  // 1. Fondo cuerpo azul hielo suave
  const bodyBg = ctx.createLinearGradient(0, 190, 0, H - 150);
  bodyBg.addColorStop(0, '#EDF5FF');
  bodyBg.addColorStop(0.5, '#FFFFFF');
  bodyBg.addColorStop(1, '#E6F0FD');
  ctx.fillStyle = bodyBg;
  ctx.fillRect(0, 0, W, H);

  // Huellas de agua sutiles en el cuerpo
  drawPaw(ctx, 578, 272, 54, 'rgba(30, 86, 179, 0.18)', -0.22);
  drawPaw(ctx, 42, 696, 48, 'rgba(30, 86, 179, 0.16)', 0.18);

  // 2. Cabecera superior ondulada (azul marino + destello azul rey + cinta naranja)
  // Acento naranja debajo de la ola superior
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 196);
  ctx.bezierCurveTo(W * 0.72, 232, W * 0.34, 218, 0, 268);
  ctx.closePath();
  ctx.fillStyle = '#F27D21';
  ctx.fill();

  // Base azul marino cabecera
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 184);
  ctx.bezierCurveTo(W * 0.7, 222, W * 0.32, 206, 0, 250);
  ctx.closePath();
  ctx.clip();

  const headerGrad = ctx.createLinearGradient(0, 0, W, 240);
  headerGrad.addColorStop(0, '#08204F');
  headerGrad.addColorStop(0.65, '#0C3174');
  headerGrad.addColorStop(1, '#134DA3');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, W, 260);

  // Destello diagonal izquierdo azul rey + acento naranja superior izquierdo
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(132, 0);
  ctx.quadraticCurveTo(64, 90, 0, 140);
  ctx.closePath();
  ctx.fillStyle = '#1966C9';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(58, 0);
  ctx.quadraticCurveTo(26, 44, 0, 72);
  ctx.closePath();
  ctx.fillStyle = '#F27D21';
  ctx.fill();

  // Línea sutil naranja/blanca sobre la curva
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 238);
  ctx.bezierCurveTo(W * 0.32, 195, W * 0.7, 210, W, 174);
  ctx.stroke();

  // Huella decorativa blanca en cabecera derecha
  drawPaw(ctx, 590, 56, 56, 'rgba(255, 255, 255, 0.88)', -0.25);

  ctx.restore();

  // Ranura superior sutil (guía visual de portacredencial)
  roundedRectPath(ctx, W / 2 - 44, 14, 88, 16, 8);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.stroke();

  // Título PRUANED y lema (izquierda cabecera)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 54px ${FONT_SANS}`;
  ctx.fillText('PRUANED', 210, 62);

  ctx.font = `italic 700 20px ${FONT_SANS}`;
  ctx.fillText('“Profesionales Unidos por', 210, 126);
  ctx.fillText('los animales”', 210, 150);

  ctx.font = `700 20px ${FONT_SANS}`;
  ctx.fillText('En emergencias y desastres', 210, 176);

  // Escudo oficial PRUANED (derecha cabecera con halo blanco)
  if (shieldCanvas) {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = 18;
    const shieldH = 166;
    const shieldW = shieldH * (shieldCanvas.width / shieldCanvas.height);
    ctx.drawImage(shieldCanvas, 404, 42, shieldW, shieldH);
    ctx.restore();
  }

  // 3. Columna izquierda: Foto (arriba) + Código QR de validación (abajo)
  const leftX = 24;
  const leftW = 204;
  const photoY = 262;
  const photoH = 244;

  if (photoImg) {
    drawCoverImage(ctx, photoImg, leftX, photoY, leftW, photoH, 20);
  } else {
    drawPhotoPlaceholder(ctx, leftX, photoY, leftW, photoH, 20, { dark: false });
  }
  roundedRectPath(ctx, leftX, photoY, leftW, photoH, 20);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#0A265C';
  ctx.stroke();

  // Tarjeta QR debajo de la foto
  const qrBoxY = 520;
  const qrBoxH = 212;
  roundedRectPath(ctx, leftX, qrBoxY, leftW, qrBoxH, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#0A265C';
  ctx.stroke();

  if (qrImg) {
    ctx.drawImage(qrImg, leftX + 26, qrBoxY + 12, 152, 152);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0A265C';
  ctx.font = `800 14px ${FONT_SANS}`;
  ctx.fillText('ESCANEAR QR', leftX + leftW / 2, qrBoxY + 169);
  ctx.fillStyle = '#475569';
  ctx.font = `700 11.5px ${FONT_SANS}`;
  ctx.fillText('VALIDACIÓN OFICIAL', leftX + leftW / 2, qrBoxY + 187);

  // 4. Columna derecha: 5 cápsulas circulares con íconos institucionales
  const rows = [
    { icon: 'person', label: 'Nombre:', value: data.fullName },
    { icon: 'paw', label: 'Rol:', value: data.roleLabel },
    { icon: 'idcard', label: 'N° de Credencial:', value: data.code },
    { icon: 'briefcase', label: 'Profesión:', value: data.profession },
    { icon: 'calendar', label: 'Vigencia:', value: data.vigencia }
  ];

  const capX = 244;
  const capW = W - 24 - capX; // 370 px
  const capH = 84;
  const capGap = 13;
  const circleRadius = 37;

  rows.forEach((row, idx) => {
    const y = 262 + idx * (capH + capGap);

    // Cápsula blanca redondeada con sombra sutil
    ctx.save();
    ctx.shadowColor = 'rgba(10, 38, 92, 0.08)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    roundedRectPath(ctx, capX + 18, y + 3, capW - 18, capH - 6, (capH - 6) / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    roundedRectPath(ctx, capX + 18, y + 3, capW - 18, capH - 6, (capH - 6) / 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#93C5FD';
    ctx.stroke();

    // Círculo azul marino izquierdo + ícono blanco
    const cCx = capX + circleRadius;
    const cCy = y + capH / 2;
    ctx.beginPath();
    ctx.arc(cCx, cCy, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0A265C';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    drawCapsuleIcon(ctx, cCx, cCy, row.icon, '#FFFFFF');

    // Textos de etiqueta y valor sin truncar
    const textX = capX + circleRadius * 2 + 12;
    const textW = capX + capW - 16 - textX;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#0A265C';
    ctx.font = `800 18px ${FONT_SANS}`;
    ctx.fillText(row.label, textX, y + 12);

    const fittedVal = fitTextLines(ctx, row.value, {
      maxWidth: textW,
      initialSize: 19,
      minSize: 12,
      maxLines: 2,
      weight: '700'
    });
    ctx.fillStyle = '#0F172A';
    ctx.font = `700 ${fittedVal.size}px ${FONT_SANS}`;
    const lineH = Math.round(fittedVal.size * 1.15);
    const valueTopY = fittedVal.lines.length > 1 ? y + 35 : y + 40;
    drawMultilineText(ctx, fittedVal.lines, textX, valueTopY, lineH);
  });

  // 5. Franja cápsula destacada VOLUNTARIO/A + huella blanca
  const bannerY = 748;
  const bannerH = 74;
  roundedRectPath(ctx, 24, bannerY, W - 48, bannerH, bannerH / 2);
  ctx.fillStyle = data.isActive ? '#0A265C' : '#991B1B';
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 44px ${FONT_SANS}`;
  ctx.fillText(data.isActive ? 'VOLUNTARIO/A' : 'INACTIVO/A', W / 2 - 22, bannerY + bannerH / 2 + 2);

  drawPaw(ctx, W - 78, bannerY + bannerH / 2, 48, '#FFFFFF', 0.14);

  // 6. Pie curvo con acento naranja, siluetas animales blancas y lema nacional
  // Onda naranja izquierda
  ctx.beginPath();
  ctx.moveTo(0, 840);
  ctx.bezierCurveTo(W * 0.28, 818, W * 0.65, 868, W, 854);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = '#F27D21';
  ctx.fill();

  // Onda azul marino principal inferior
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 858);
  ctx.bezierCurveTo(W * 0.25, 822, W * 0.64, 872, W, 846);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();

  const footerGrad = ctx.createLinearGradient(0, 830, W, H);
  footerGrad.addColorStop(0, '#071E4B');
  footerGrad.addColorStop(0.55, '#0B3073');
  footerGrad.addColorStop(1, '#124DA1');
  ctx.fillStyle = footerGrad;
  ctx.fillRect(0, 820, W, H - 820);

  // Siluetas blancas perro, gato y caballo
  drawAnimalSilhouettes(ctx, 18, 992, 1.06, '#FFFFFF');

  // Frase institucional + curva subrayado naranja
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `italic 600 22px ${FONT_SANS}`;
  ctx.fillText('Juntos por el bienestar animal', 462, 886);
  ctx.fillText('en todo Chile', 446, 916);

  ctx.strokeStyle = '#F27D21';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(354, 960);
  ctx.quadraticCurveTo(445, 938, 534, 948);
  ctx.stroke();

  // Corte inferior derecho claro + huella azul tal como la referencia
  ctx.beginPath();
  ctx.moveTo(W * 0.64, H);
  ctx.quadraticCurveTo(W * 0.85, 956, W, 912);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = '#F27D21';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(W * 0.67, H);
  ctx.quadraticCurveTo(W * 0.87, 962, W, 926);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = '#EFF6FF';
  ctx.fill();

  drawPaw(ctx, 594, 976, 46, '#8BB8F2', -0.18);

  ctx.restore();
};

export const renderCredentialDataUrl = async ({ member, type, origin } = {}) => {
  const safeOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://pruaned.cl');
  const data = buildCredentialData({ member, type, origin: safeOrigin });

  const canvas = document.createElement('canvas');
  canvas.width = data.spec.widthPx;
  canvas.height = data.spec.heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el lienzo 2D para generar la credencial.');
  }

  if (data.type === 'voluntario') {
    await renderVolunteerCredential(ctx, data);
  } else {
    await renderSocioCredential(ctx, data);
  }

  return {
    dataUrl: canvas.toDataURL('image/png', 1.0),
    data
  };
};

export const downloadCredentialPng = async ({ member, type, origin, preRendered } = {}) => {
  const rendered = preRendered?.dataUrl
    ? preRendered
    : await renderCredentialDataUrl({ member, type, origin });

  const link = document.createElement('a');
  link.href = rendered.dataUrl;
  link.download = rendered.data.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  return rendered;
};

/**
 * Imprime exclusivamente la credencial a tamaño físico exacto CR80
 * (85.60 × 53.98 mm horizontal o 53.98 × 85.60 mm vertical) mediante un iframe aislado.
 */
export const printCredentialCard = ({ dataUrl, data }) => {
  if (!dataUrl || !data?.spec) return;

  const { widthMm, heightMm } = data.spec;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }

  const safeTitle = `${data.type === 'voluntario' ? 'Credencial Voluntario' : 'Credencial Socio'} PRUANED - ${data.fullName}`;
  doc.open();
  doc.write(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle.replace(/[<>]/g, '')}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, sans-serif;
        color: #334155;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      }
      .sheet-note {
        font-size: 9pt;
        margin-bottom: 6mm;
        text-align: center;
      }
      .cr80-frame {
        width: ${widthMm}mm;
        height: ${heightMm}mm;
        padding: 0;
        border: 0.25mm dashed #94A3B8;
        border-radius: 3.18mm;
        overflow: hidden;
        background: #FFFFFF;
      }
      .cr80-frame img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
      }
    </style>
  </head>
  <body>
    <div class="sheet-note">
      PRUANED A.G. · Tamaño estándar tarjeta de crédito CR80 (${widthMm} mm × ${heightMm} mm · Imprimir al 100%)
    </div>
    <div class="cr80-frame">
      <img id="credential-img" src="${dataUrl}" alt="${safeTitle.replace(/"/g, '&quot;')}" />
    </div>
  </body>
</html>`);
  doc.close();

  const img = doc.getElementById('credential-img');
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      cleanup();
    }
  };

  if (img && !img.complete) {
    img.onload = triggerPrint;
    img.onerror = triggerPrint;
  } else {
    window.setTimeout(triggerPrint, 60);
  }
};
