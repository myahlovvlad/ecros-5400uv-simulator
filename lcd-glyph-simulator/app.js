(function () {
  const SCREEN_W = 128;
  const SCREEN_H = 64;

  const state = {
    variant: "8",
    text: "ЭКРОС-5400УФ\nλ = 280\nA = 1.234",
    startX: 0,
    startY: 0,
    charSpacing: 1,
    lineSpacing: 1,
    scale: 6,
    pixelGap: 1,
    wrap: true,
    showGrid: false,
    invert: false,
    selectedGlyph: null,
  };

  const $ = (id) => document.getElementById(id);
  const data = window.GLYPH_DATA;
  const variants = data.variants;
  const diagnostics = data.diagnostics;

  const elements = {
    variant: $("variant"),
    text: $("textInput"),
    startX: $("startX"),
    startY: $("startY"),
    charSpacing: $("charSpacing"),
    lineSpacing: $("lineSpacing"),
    scale: $("scale"),
    pixelGap: $("pixelGap"),
    wrap: $("wrap"),
    showGrid: $("showGrid"),
    invert: $("invert"),
    lcdCanvas: $("lcdCanvas"),
    glyphPreviewCanvas: $("glyphPreviewCanvas"),
    glyphList: $("glyphList"),
    glyphSearch: $("glyphSearch"),
    glyphVariant: $("glyphVariant"),
    renderReport: $("renderReport"),
    frameBufferExport: $("frameBufferExport"),
    diagnosticsList: $("diagnosticsList"),
    selectedGlyphMeta: $("selectedGlyphMeta"),
    selectedGlyphTitle: $("selectedGlyphTitle"),
    statsGlyphs: $("statsGlyphs"),
    statsWarnings: $("statsWarnings"),
    statsVariant: $("statsVariant"),
    metaDimensions: $("metaDimensions"),
    metaCursor: $("metaCursor"),
    metaPixels: $("metaPixels"),
  };

  let currentFrameBuffer = createBuffer();
  let lastRenderInfo = null;

  function createBuffer() {
    return Array.from({ length: SCREEN_H }, () => Array(SCREEN_W).fill(false));
  }

  function getVariantMap(variant) {
    return variants[String(variant)] || {};
  }

  function getVariantStats(variant) {
    return data.meta.variantStats[String(variant)];
  }

  function buildFallbackGlyph(variant) {
    const h = Number(variant);
    const width = 4;
    const rows = [];
    for (let y = 0; y < h; y++) {
      if (y === 0 || y === h - 1) rows.push("####");
      else rows.push("#..#");
    }
    return {
      char: "?",
      actualWidth: width,
      actualHeight: h,
      rows,
      bitmap: rows,
      nominalHeight: h,
      nominalWidth: width,
      topOffset: 0,
    };
  }

  function renderToBuffer() {
    const buffer = createBuffer();
    const font = getVariantMap(state.variant);
    const stats = getVariantStats(state.variant);
    const fallback = buildFallbackGlyph(state.variant);

    let cursorX = clampInt(state.startX, 0, SCREEN_W - 1);
    let cursorY = clampInt(state.startY, 0, SCREEN_H - 1);
    const lineAdvance = (stats?.maxActualHeight || Number(state.variant)) + clampInt(state.lineSpacing, 0, 20);
    let usedPixels = 0;
    let missingGlyphs = [];
    let lastX = cursorX;
    let lastY = cursorY;
    let maxX = cursorX;
    let maxY = cursorY;

    const text = state.text.replace(/\r\n/g, "\n");

    for (const ch of text) {
      if (ch === "\n") {
        cursorX = clampInt(state.startX, 0, SCREEN_W - 1);
        cursorY += lineAdvance;
        lastX = cursorX;
        lastY = cursorY;
        continue;
      }

      const glyph = font[ch] || fallback;
      if (!font[ch] && !missingGlyphs.includes(ch)) missingGlyphs.push(ch);

      if (state.wrap && cursorX + glyph.actualWidth > SCREEN_W) {
        cursorX = clampInt(state.startX, 0, SCREEN_W - 1);
        cursorY += lineAdvance;
      }

      const bitmap = glyph.bitmap || glyph.rows || [];
      for (let gy = 0; gy < bitmap.length; gy++) {
        const row = bitmap[gy];
        for (let gx = 0; gx < row.length; gx++) {
          if (row[gx] !== "#") continue;
          const x = cursorX + gx;
          const y = cursorY + gy;
          if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) continue;
          if (!buffer[y][x]) {
            buffer[y][x] = true;
            usedPixels += 1;
          }
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }

      lastX = cursorX;
      lastY = cursorY;
      cursorX += glyph.actualWidth + clampInt(state.charSpacing, 0, 20);
    }

    lastRenderInfo = {
      lineAdvance,
      missingGlyphs,
      usedPixels,
      lastCursor: { x: lastX, y: lastY },
      bounds: {
        width: maxX - clampInt(state.startX, 0, SCREEN_W - 1) + 1,
        height: maxY - clampInt(state.startY, 0, SCREEN_H - 1) + 1,
      },
    };

    currentFrameBuffer = buffer;
    return buffer;
  }

  function drawBuffer() {
    const scale = clampInt(state.scale, 2, 16);
    const pixelGap = clampInt(state.pixelGap, 0, 4);
    const canvas = elements.lcdCanvas;
    canvas.width = SCREEN_W * scale;
    canvas.height = SCREEN_H * scale;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const onColor = state.invert ? "#c7d9ac" : "#1c2a0d";
    const offColor = state.invert ? "#1c2a0d" : "#c4d0a7";
    const gridColor = "rgba(20,32,10,.08)";

    ctx.fillStyle = offColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SCREEN_H; y++) {
      for (let x = 0; x < SCREEN_W; x++) {
        const px = x * scale;
        const py = y * scale;
        ctx.fillStyle = currentFrameBuffer[y][x] ? onColor : offColor;
        ctx.fillRect(px, py, Math.max(1, scale - pixelGap), Math.max(1, scale - pixelGap));

        if (state.showGrid && scale >= 4) {
          ctx.strokeStyle = gridColor;
          ctx.strokeRect(px + 0.5, py + 0.5, scale, scale);
        }
      }
    }
  }

  function generateCArray(buffer) {
    const bytes = [];
    for (let page = 0; page < 8; page++) {
      for (let x = 0; x < SCREEN_W; x++) {
        let value = 0;
        for (let bit = 0; bit < 8; bit++) {
          const y = page * 8 + bit;
          if (buffer[y][x]) value |= (1 << bit);
        }
        bytes.push(value);
      }
    }

    const lines = [];
    for (let i = 0; i < bytes.length; i += 16) {
      const slice = bytes.slice(i, i + 16).map((b) => "0x" + b.toString(16).padStart(2, "0").toUpperCase());
      lines.push("  " + slice.join(", "));
    }

    return [
      `// LCD 128x64 framebuffer generated from glyph specification`,
      `// Variant: ${state.variant}px`,
      `// Text: ${JSON.stringify(state.text)}`,
      `const uint8_t lcd_buffer[1024] = {`,
      lines.join(",\n"),
      `};`,
    ].join("\n");
  }

  function renderReport() {
    const stats = getVariantStats(state.variant);
    elements.statsGlyphs.textContent = String(stats?.count || 0);
    elements.statsWarnings.textContent = String(diagnostics.filter((d) => String(d.variant) === String(state.variant)).length);
    elements.statsVariant.textContent = `${state.variant}px`;

    elements.metaDimensions.textContent = `${SCREEN_W}×${SCREEN_H}`;
    elements.metaCursor.textContent = `${clampInt(state.startX, 0, SCREEN_W - 1)}, ${clampInt(state.startY, 0, SCREEN_H - 1)}`;
    elements.metaPixels.textContent = String(lastRenderInfo?.usedPixels || 0);

    const missing = lastRenderInfo?.missingGlyphs?.length
      ? `Отсутствующие глифы: ${lastRenderInfo.missingGlyphs.join(" ")}`
      : "Все символы найдены в выбранном наборе.";

    const bounds = lastRenderInfo?.bounds
      ? `${lastRenderInfo.bounds.width}×${lastRenderInfo.bounds.height}`
      : "—";

    const html = `
      <div class="report-grid">
        <div><strong>Границы вывода</strong><br>${bounds}</div>
        <div><strong>Шаг строки</strong><br>${lastRenderInfo?.lineAdvance || "—"} px</div>
        <div><strong>Пикселей включено</strong><br>${lastRenderInfo?.usedPixels || 0}</div>
        <div><strong>Последний курсор</strong><br>${lastRenderInfo?.lastCursor ? `${lastRenderInfo.lastCursor.x}, ${lastRenderInfo.lastCursor.y}` : "—"}</div>
      </div>
      <div style="margin-top:10px;">${missing}</div>
    `;
    elements.renderReport.innerHTML = html;
    elements.frameBufferExport.value = generateCArray(currentFrameBuffer);
  }

  function selectDefaultGlyph() {
    const variantMap = getVariantMap(state.variant);
    const chars = Object.keys(variantMap);
    if (!chars.length) return;
    if (!state.selectedGlyph || !variantMap[state.selectedGlyph]) {
      state.selectedGlyph = chars[0];
    }
  }

  function renderGlyphBrowser() {
    const variant = elements.glyphVariant.value;
    const query = elements.glyphSearch.value.trim().toLowerCase();
    const variantMap = getVariantMap(variant);
    const chars = Object.keys(variantMap).sort((a, b) => a.localeCompare(b, "ru"));
    const filtered = chars.filter((ch) => {
      const entry = variantMap[ch];
      return !query || ch.toLowerCase().includes(query) || (entry.title || "").toLowerCase().includes(query) || (entry.section || "").toLowerCase().includes(query);
    });

    if (!state.selectedGlyph || !variantMap[state.selectedGlyph]) {
      state.selectedGlyph = filtered[0] || chars[0] || null;
    }

    elements.glyphList.innerHTML = filtered.map((ch) => {
      const entry = variantMap[ch];
      const active = ch === state.selectedGlyph ? "active" : "";
      return `
        <button class="glyph-card ${active}" data-char="${escapeAttr(ch)}" title="${escapeAttr(entry.title)}">
          <span class="char">${escapeHtml(ch)}</span>
          <span class="dims">${entry.actualWidth}×${entry.actualHeight}</span>
        </button>
      `;
    }).join("");

    elements.glyphList.querySelectorAll(".glyph-card").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedGlyph = button.dataset.char;
        renderGlyphBrowser();
      });
    });

    renderSelectedGlyphPreview(variantMap[state.selectedGlyph]);
    renderDiagnostics(variant);
  }

  function renderSelectedGlyphPreview(entry) {
    if (!entry) {
      elements.selectedGlyphTitle.textContent = "Глиф не выбран";
      elements.selectedGlyphMeta.innerHTML = "";
      return;
    }

    elements.selectedGlyphTitle.textContent = `${entry.char} — ${entry.title}`;
    elements.selectedGlyphMeta.innerHTML = `
      <div><strong>Номинал</strong><br>${entry.nominalWidth}×${entry.nominalHeight}</div>
      <div><strong>Факт</strong><br>${entry.actualWidth}×${entry.actualHeight}</div>
      <div><strong>Вариант</strong><br>${entry.variant}px</div>
      <div><strong>Секция</strong><br>${escapeHtml(entry.section || "—")}</div>
      <div><strong>Top offset</strong><br>${entry.topOffset || 0}</div>
      <div><strong>Unicode</strong><br>${entry.codepoint ? "U+" + entry.codepoint.toString(16).toUpperCase().padStart(4, "0") : "—"}</div>
    `;

    const scale = 18;
    const canvas = elements.glyphPreviewCanvas;
    canvas.width = Math.max(80, entry.actualWidth * scale);
    canvas.height = Math.max(80, entry.actualHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#c4d0a7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = Math.floor((canvas.width - entry.actualWidth * scale) / 2);
    const offsetY = Math.floor((canvas.height - entry.actualHeight * scale) / 2);
    const bitmap = entry.bitmap || [];

    for (let y = 0; y < bitmap.length; y++) {
      for (let x = 0; x < bitmap[y].length; x++) {
        ctx.fillStyle = bitmap[y][x] === "#" ? "#1c2a0d" : "#c4d0a7";
        ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale - 1, scale - 1);
      }
    }
  }

  function renderDiagnostics(variant) {
    const list = diagnostics
      .filter((d) => String(d.variant) === String(variant))
      .map((d) => `
        <div class="diag-item">
          <strong>${escapeHtml(d.char)}</strong> — ${escapeHtml(d.nominal)} → ${escapeHtml(d.actual)}<br>
          ${d.reasons.map((reason) => escapeHtml(reason)).join("<br>")}
        </div>
      `)
      .join("");
    elements.diagnosticsList.innerHTML = list || '<div class="diag-item">Несоответствия для этого варианта не обнаружены.</div>';
  }

  function syncStateFromInputs() {
    state.variant = elements.variant.value;
    state.text = elements.text.value;
    state.startX = Number(elements.startX.value || 0);
    state.startY = Number(elements.startY.value || 0);
    state.charSpacing = Number(elements.charSpacing.value || 0);
    state.lineSpacing = Number(elements.lineSpacing.value || 0);
    state.scale = Number(elements.scale.value || 6);
    state.pixelGap = Number(elements.pixelGap.value || 0);
    state.wrap = elements.wrap.checked;
    state.showGrid = elements.showGrid.checked;
    state.invert = elements.invert.checked;
  }

  function repaint() {
    syncStateFromInputs();
    renderToBuffer();
    drawBuffer();
    renderReport();
    selectDefaultGlyph();
    renderGlyphBrowser();
  }

  function bindControls() {
    [
      elements.variant,
      elements.text,
      elements.startX,
      elements.startY,
      elements.charSpacing,
      elements.lineSpacing,
      elements.scale,
      elements.pixelGap,
      elements.wrap,
      elements.showGrid,
      elements.invert,
    ].forEach((node) => {
      const eventName = node.tagName === "TEXTAREA" || node.tagName === "INPUT" || node.tagName === "SELECT" ? "input" : "change";
      node.addEventListener(eventName, repaint);
      node.addEventListener("change", repaint);
    });

    elements.glyphVariant.addEventListener("change", renderGlyphBrowser);
    elements.glyphSearch.addEventListener("input", renderGlyphBrowser);

    document.querySelectorAll("[data-example]").forEach((button) => {
      button.addEventListener("click", () => {
        elements.text.value = button.dataset.example;
        repaint();
      });
    });

    $("clearBtn").addEventListener("click", () => {
      elements.text.value = "";
      repaint();
    });

    $("downloadPngBtn").addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = elements.lcdCanvas.toDataURL("image/png");
      link.download = `lcd-${state.variant}px.png`;
      link.click();
    });

    $("copyCBtn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(elements.frameBufferExport.value);
        $("copyCBtn").textContent = "Скопировано";
        setTimeout(() => { $("copyCBtn").textContent = "Скопировать C-массив"; }, 1000);
      } catch (e) {
        alert("Не удалось скопировать массив в буфер обмена.");
      }
    });

    $("fillDemoBtn").addEventListener("click", () => {
      const demo = {
        "5": "scan λ=280\nA=0.456",
        "6": "этап 1\nбланк\nстарт",
        "8": "ЭКРОС-5400УФ\nЛЯМБДА = 280\nA = 1.234"
      };
      elements.text.value = demo[state.variant] || demo["8"];
      repaint();
    });
  }

  function clampInt(value, min, max) {
    const num = Number.isFinite(value) ? Math.round(value) : min;
    return Math.min(max, Math.max(min, num));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function init() {
    const options = Object.keys(variants).map((variant) => `<option value="${variant}">${variant}px</option>`).join("");
    elements.variant.innerHTML = options;
    elements.glyphVariant.innerHTML = options;
    elements.variant.value = state.variant;
    elements.glyphVariant.value = state.variant;
    bindControls();
    repaint();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
