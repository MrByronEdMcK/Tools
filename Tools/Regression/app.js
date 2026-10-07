/**
 * Least Squares Regression Visualizer
 * Core JavaScript Logic Engine
 */

(function () {
  'use strict';

  // ==========================================================================
  // Global Application State
  // ==========================================================================
  const state = {
    // World Coordinate Bounds
    world: {
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 10
    },

    // Canvas Paddings (px)
    margin: {
      top: 30,
      right: 30,
      bottom: 50,
      left: 55
    },

    // Data Points [{ id, x, y }]
    points: [],
    nextPointId: 1,

    // Manual Line Endpoints in World Coordinates (x1, y1) -> (x2, y2)
    manualLine: {
      x1: 0,
      y1: 1.5,
      x2: 10,
      y2: 7.5
    },

    // View Options
    options: {
      showResiduals: true,
      showSquares: true,
      showOlsLine: true,
      showMeanY: false
    },

    // Pointer Interaction State
    drag: {
      active: false,
      target: null, // 'handle1' | 'handle2' | 'point'
      pointId: null,
      offset: { x: 0, y: 0 }
    },

    // Hover State for Cursor Styling
    hover: {
      target: null, // 'handle1' | 'handle2' | 'point'
      pointId: null
    },

    // Animation State for "Fit"
    animation: {
      active: false,
      startTime: 0,
      duration: 1000,
      startLine: { x1: 0, y1: 0, x2: 10, y2: 0 },
      targetLine: { x1: 0, y1: 0, x2: 10, y2: 0 }
    }
  };

  // ==========================================================================
  // DOM Elements Reference
  // ==========================================================================
  const canvas = document.getElementById('regression-canvas');
  const ctx = canvas.getContext('2d');

  // Sliders & Inputs
  const sliderM = document.getElementById('slider-m');
  const sliderC = document.getElementById('slider-c');
  const numM = document.getElementById('num-m');
  const numC = document.getElementById('num-c');

  // Display badges & texts
  const valMDisplay = document.getElementById('val-m-display');
  const valCDisplay = document.getElementById('val-c-display');
  const valCSign = document.getElementById('val-c-sign');
  const olsEqDisplay = document.getElementById('ols-equation-display');

  // Checkboxes
  const chkResiduals = document.getElementById('chk-residuals');
  const chkSquares = document.getElementById('chk-squares');
  const chkOls = document.getElementById('chk-ols');
  const chkMeanY = document.getElementById('chk-meany');

  // Stats Displays
  const statSse = document.getElementById('stat-sse');
  const barSse = document.getElementById('bar-sse');
  const statR2 = document.getElementById('stat-r2');
  const statMse = document.getElementById('stat-mse');
  const statRmse = document.getElementById('stat-rmse');

  // Buttons
  const btnFit = document.getElementById('btn-fit');
  const btnRandomize = document.getElementById('btn-randomize');
  const btnClear = document.getElementById('btn-clear');
  const btnResetLine = document.getElementById('btn-reset-line');

  // Generator Sliders
  const genCountSlider = document.getElementById('gen-count');
  const genNoiseSlider = document.getElementById('gen-noise');
  const genCountVal = document.getElementById('gen-count-val');
  const genNoiseVal = document.getElementById('gen-noise-val');

  // Table & Accordion
  const pointsTableBody = document.getElementById('points-table-body');
  const pointCountBadge = document.getElementById('point-count-badge');
  const accordionHeader = document.getElementById('points-accordion-header');
  const accordionCard = accordionHeader ? accordionHeader.closest('.collapsible-card') : null;
  const accordionContent = document.getElementById('points-accordion-content');
  const toastEl = document.getElementById('toast-message');

  // ==========================================================================
  // Coordinate System Mapping Functions
  // ==========================================================================

  function getCanvasMetrics() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const innerWidth = width - state.margin.left - state.margin.right;
    const innerHeight = height - state.margin.top - state.margin.bottom;

    return { width, height, innerWidth, innerHeight };
  }

  function worldToScreen(wx, wy) {
    const { height, innerWidth, innerHeight } = getCanvasMetrics();
    const sx = state.margin.left + ((wx - state.world.xMin) / (state.world.xMax - state.world.xMin)) * innerWidth;
    const sy = height - state.margin.bottom - ((wy - state.world.yMin) / (state.world.yMax - state.world.yMin)) * innerHeight;
    return { x: sx, y: sy };
  }

  function screenToWorld(sx, sy) {
    const { height, innerWidth, innerHeight } = getCanvasMetrics();
    const wx = state.world.xMin + ((sx - state.margin.left) / innerWidth) * (state.world.xMax - state.world.xMin);
    const wy = state.world.yMin + ((height - state.margin.bottom - sy) / innerHeight) * (state.world.yMax - state.world.yMin);
    return { x: wx, y: wy };
  }

  // Clamping helper
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Helper: check if dark mode is active
  function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' || 
           (typeof window.MrByronTheme !== 'undefined' && typeof window.MrByronTheme.isDark === 'function' && window.MrByronTheme.isDark());
  }

  // ==========================================================================
  // Canvas High-DPI Scaling & Resizing
  // ==========================================================================

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    render();
  }

  window.addEventListener('resize', resizeCanvas);

  const canvasWrapper = document.querySelector('.canvas-wrapper');
  if (window.ResizeObserver && canvasWrapper) {
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvasWrapper);
  }

  // ==========================================================================
  // Mathematical Engine & Regression Calculations
  // ==========================================================================

  function getManualLineParams() {
    const { x1, y1, x2, y2 } = state.manualLine;
    const dx = x2 - x1;
    const m = Math.abs(dx) < 1e-6 ? 0 : (y2 - y1) / dx;
    const c = y1 - m * x1;
    return { m, c };
  }

  function setManualLineFromParams(m, c) {
    state.manualLine.x1 = 0;
    state.manualLine.y1 = c;
    state.manualLine.x2 = 10;
    state.manualLine.y2 = 10 * m + c;
  }

  function calculateOLS() {
    const n = state.points.length;
    if (n < 2) {
      return { m: 1, c: 0, valid: false };
    }

    let sumX = 0, sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += state.points[i].x;
      sumY += state.points[i].y;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const dx = state.points[i].x - meanX;
      const dy = state.points[i].y - meanY;
      num += dx * dy;
      den += dx * dx;
    }

    if (Math.abs(den) < 1e-8) {
      return { m: 0, c: meanY, valid: true, meanX, meanY };
    }

    const m = num / den;
    const c = meanY - m * meanX;

    return { m, c, valid: true, meanX, meanY };
  }

  function calculateMetrics() {
    const { m, c } = getManualLineParams();
    const n = state.points.length;

    if (n === 0) {
      return { sse: 0, mse: 0, rmse: 0, r2: 0, sst: 0, meanY: 0 };
    }

    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumY += state.points[i].y;
    }
    const meanY = sumY / n;

    let sse = 0;
    let sst = 0;

    for (let i = 0; i < n; i++) {
      const pt = state.points[i];
      const yPred = m * pt.x + c;
      const residual = pt.y - yPred;
      sse += residual * residual;
      sst += (pt.y - meanY) * (pt.y - meanY);
    }

    const mse = sse / n;
    const rmse = Math.sqrt(mse);
    let r2 = sst > 1e-8 ? 1 - (sse / sst) : 1;

    return { sse, mse, rmse, r2, sst, meanY };
  }

  // ==========================================================================
  // Render Pipeline
  // ==========================================================================

  function render() {
    const { width, height } = getCanvasMetrics();
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid & Axes
    drawGrid(width, height);

    // 2. Compute Lines & Metrics
    const { m, c } = getManualLineParams();
    const ols = calculateOLS();
    const metrics = calculateMetrics();

    // 3. Optional: Draw Mean Y Line
    if (state.options.showMeanY && state.points.length > 0) {
      drawMeanYLine(metrics.meanY);
    }

    // 4. Optional: Draw Target OLS Line
    if (state.options.showOlsLine && ols.valid) {
      drawOLSLine(ols.m, ols.c);
    }

    // 5. Draw Residual Squares (Underneath line and points)
    if (state.options.showSquares) {
      drawResidualSquares(m, c);
    }

    // 6. Draw Residual Vertical Lines
    if (state.options.showResiduals) {
      drawResidualLines(m, c);
    }

    // 7. Draw Active Manual Line
    drawManualLine(m, c);

    // 8. Draw Data Points
    drawPoints();

    // 9. Update Controls & Text UI
    updateUI(m, c, ols, metrics);
  }

  // Draw Grid Lines & Numeric Axis Labels
  function drawGrid(width, height) {
    const { xMin, xMax, yMin, yMax } = state.world;
    const isDark = isDarkMode();

    ctx.save();

    // Fill canvas background
    ctx.fillStyle = isDark ? '#121826' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;

    // Background Grid
    const stepX = 1;
    const stepY = 1;

    for (let x = xMin; x <= xMax; x += stepX) {
      const p1 = worldToScreen(x, yMin);
      const p2 = worldToScreen(x, yMax);

      ctx.strokeStyle = x === 0 
        ? (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)')
        : (isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.08)');
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Axis label X
      if (x % 2 === 0) {
        ctx.fillStyle = isDark ? '#9ca3af' : '#475569';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(x.toString(), p1.x, p1.y + 18);
      }
    }

    for (let y = yMin; y <= yMax; y += stepY) {
      const p1 = worldToScreen(xMin, y);
      const p2 = worldToScreen(xMax, y);

      ctx.strokeStyle = y === 0 
        ? (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)')
        : (isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.08)');
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Axis label Y
      if (y % 2 === 0) {
        ctx.fillStyle = isDark ? '#9ca3af' : '#475569';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(y.toString(), p1.x - 10, p1.y + 4);
      }
    }

    // Outer Bounding Box
    const origin = worldToScreen(xMin, yMin);
    const topCorner = worldToScreen(xMax, yMax);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.18)';
    ctx.strokeRect(origin.x, topCorner.y, topCorner.x - origin.x, origin.y - topCorner.y);

    ctx.restore();
  }

  // Draw Mean Line (y_bar)
  function drawMeanYLine(meanY) {
    const isDark = isDarkMode();
    const p1 = worldToScreen(state.world.xMin, meanY);
    const p2 = worldToScreen(state.world.xMax, meanY);

    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(156, 163, 175, 0.65)' : 'rgba(100, 116, 139, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.fillStyle = isDark ? 'rgba(156, 163, 175, 0.85)' : 'rgba(51, 65, 85, 0.9)';
    ctx.font = '11px "Outfit", sans-serif';
    ctx.fillText(`ȳ = ${meanY.toFixed(2)}`, p2.x - 45, p2.y - 6);
    ctx.restore();
  }

  // Draw OLS Ideal Reference Line
  function drawOLSLine(m, c) {
    const isDark = isDarkMode();
    const p1 = worldToScreen(state.world.xMin, m * state.world.xMin + c);
    const p2 = worldToScreen(state.world.xMax, m * state.world.xMax + c);

    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.85)' : 'rgba(147, 51, 234, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  // Draw Residual Squares
  function drawResidualSquares(m, c) {
    const isDark = isDarkMode();
    const { width } = getCanvasMetrics();

    ctx.save();

    for (let i = 0; i < state.points.length; i++) {
      const pt = state.points[i];
      const yPred = m * pt.x + c;

      const pData = worldToScreen(pt.x, pt.y);
      const pLine = worldToScreen(pt.x, yPred);

      // Height of residual in screen pixels
      const hPx = pLine.y - pData.y; // Positive if point is above line in canvas coords
      const absHPx = Math.abs(hPx);

      if (absHPx < 0.5) continue; // Skip near-zero squares

      // Determine square position
      const topY = Math.min(pData.y, pLine.y);
      let leftX = pData.x;

      // Smart flip if square exceeds right canvas boundary
      if (leftX + absHPx > width - state.margin.right) {
        leftX = pData.x - absHPx;
      }

      // Draw Translucent Residual Square
      ctx.fillStyle = isDark ? 'rgba(251, 191, 36, 0.16)' : 'rgba(217, 119, 6, 0.12)';
      ctx.fillRect(leftX, topY, absHPx, absHPx);

      ctx.strokeStyle = isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(217, 119, 6, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(leftX, topY, absHPx, absHPx);
    }

    ctx.restore();
  }

  // Draw Vertical Residual Lines
  function drawResidualLines(m, c) {
    const isDark = isDarkMode();
    ctx.save();
    ctx.strokeStyle = isDark ? '#fbbf24' : '#d97706';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);

    for (let i = 0; i < state.points.length; i++) {
      const pt = state.points[i];
      const yPred = m * pt.x + c;

      const pData = worldToScreen(pt.x, pt.y);
      const pLine = worldToScreen(pt.x, yPred);

      ctx.beginPath();
      ctx.moveTo(pData.x, pData.y);
      ctx.lineTo(pLine.x, pLine.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Manual Line & Draggable Endpoint Handles
  function drawManualLine(m, c) {
    const isDark = isDarkMode();
    const p1 = worldToScreen(state.manualLine.x1, state.manualLine.y1);
    const p2 = worldToScreen(state.manualLine.x2, state.manualLine.y2);

    ctx.save();

    // Line Shadow/Glow
    ctx.shadowColor = isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(2, 132, 199, 0.25)';
    ctx.shadowBlur = isDark ? 12 : 4;
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.shadowBlur = 0; // Reset shadow for handles

    // Draw Control Handles (P1 & P2)
    drawHandle(p1.x, p1.y, state.hover.target === 'handle1');
    drawHandle(p2.x, p2.y, state.hover.target === 'handle2');

    ctx.restore();
  }

  function drawHandle(sx, sy, isHovered) {
    const isDark = isDarkMode();
    ctx.save();
    const radius = isHovered ? 9 : 7;

    // Outer Halo
    ctx.fillStyle = isHovered 
      ? (isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.25)') 
      : (isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)');
    ctx.beginPath();
    ctx.arc(sx, sy, radius + 5, 0, Math.PI * 2);
    ctx.fill();

    // Solid Handle Core
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Draw Scatter Data Points
  function drawPoints() {
    const isDark = isDarkMode();
    ctx.save();

    for (let i = 0; i < state.points.length; i++) {
      const pt = state.points[i];
      const pScreen = worldToScreen(pt.x, pt.y);
      const isHovered = state.hover.target === 'point' && state.hover.pointId === pt.id;

      const radius = isHovered ? 8 : 6;

      // Glow halo
      ctx.shadowColor = isDark ? 'rgba(244, 63, 94, 0.7)' : 'rgba(225, 29, 72, 0.25)';
      ctx.shadowBlur = isHovered ? (isDark ? 12 : 6) : (isDark ? 6 : 2);

      ctx.fillStyle = isDark ? '#f43f5e' : '#e11d48';
      ctx.beginPath();
      ctx.arc(pScreen.x, pScreen.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border highlight
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isHovered ? 2 : 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Update UI Elements, Numbers & Table
  function updateUI(m, c, ols, metrics) {
    // 1. Text displays for m & c
    valMDisplay.textContent = m.toFixed(2);
    valCDisplay.textContent = Math.abs(c).toFixed(2);
    valCSign.textContent = c >= 0 ? '+' : '-';

    // 2. Synchronize sliders & number inputs without breaking active focus
    if (document.activeElement !== sliderM && document.activeElement !== numM) {
      sliderM.value = m;
      numM.value = m.toFixed(2);
    }
    if (document.activeElement !== sliderC && document.activeElement !== numC) {
      sliderC.value = c;
      numC.value = c.toFixed(2);
    }

    // 3. Stats Displays
    statSse.textContent = metrics.sse.toFixed(3);
    statR2.textContent = metrics.r2.toFixed(3);
    statMse.textContent = metrics.mse.toFixed(3);
    statRmse.textContent = metrics.rmse.toFixed(3);

    // Dynamic bar for SSE relative visual scaling
    const sseBarPct = Math.min(100, Math.max(2, (metrics.sse / Math.max(1, metrics.sst * 1.5)) * 100));
    barSse.style.width = `${sseBarPct}%`;

    // 4. OLS Equation Display
    if (ols.valid) {
      const sign = ols.c >= 0 ? '+' : '-';
      olsEqDisplay.textContent = `y = ${ols.m.toFixed(3)}x ${sign} ${Math.abs(ols.c).toFixed(3)}`;
    } else {
      olsEqDisplay.textContent = 'Add at least 2 points';
    }

    // 5. Update Table & Point Count
    pointCountBadge.textContent = state.points.length.toString();
    updatePointsTable(m, c);
  }

  function updatePointsTable(m, c) {
    if (!accordionContent || accordionContent.classList.contains('hidden')) return;

    pointsTableBody.innerHTML = '';
    state.points.forEach((pt, index) => {
      const yPred = m * pt.x + c;
      const res = pt.y - yPred;
      const sq = res * res;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${pt.x.toFixed(2)}</td>
        <td>${pt.y.toFixed(2)}</td>
        <td style="color: ${res >= 0 ? '#fbbf24' : '#f43f5e'}">${res >= 0 ? '+' : ''}${res.toFixed(2)}</td>
        <td>${sq.toFixed(2)}</td>
        <td>
          <button class="btn-del-point" data-id="${pt.id}" title="Delete point">&times;</button>
        </td>
      `;
      pointsTableBody.appendChild(tr);
    });

    // Attach delete event handlers
    const delBtns = pointsTableBody.querySelectorAll('.btn-del-point');
    delBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'), 10);
        removePoint(id);
      });
    });
  }

  // ==========================================================================
  // Interactive Pointer Events (Dragging Line Handles & Points)
  // ==========================================================================

  function getHitTarget(sx, sy) {
    // 1. Check Handle 1
    const p1 = worldToScreen(state.manualLine.x1, state.manualLine.y1);
    if (Math.hypot(sx - p1.x, sy - p1.y) <= 14) {
      return { target: 'handle1' };
    }

    // 2. Check Handle 2
    const p2 = worldToScreen(state.manualLine.x2, state.manualLine.y2);
    if (Math.hypot(sx - p2.x, sy - p2.y) <= 14) {
      return { target: 'handle2' };
    }

    // 3. Check Points
    for (let i = state.points.length - 1; i >= 0; i--) {
      const pt = state.points[i];
      const pPt = worldToScreen(pt.x, pt.y);
      if (Math.hypot(sx - pPt.x, sy - pPt.y) <= 12) {
        return { target: 'point', pointId: pt.id };
      }
    }

    return { target: null };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const hit = getHitTarget(sx, sy);

    if (hit.target) {
      state.drag.active = true;
      state.drag.target = hit.target;
      state.drag.pointId = hit.pointId || null;
      canvas.setPointerCapture(e.pointerId);
    } else {
      // Add a new point if clicked on empty grid
      const world = screenToWorld(sx, sy);
      if (world.x >= state.world.xMin && world.x <= state.world.xMax &&
          world.y >= state.world.yMin && world.y <= state.world.yMax) {
        addPoint(world.x, world.y);
      }
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Handle Dragging State
    if (state.drag.active) {
      const world = screenToWorld(sx, sy);
      const clampedX = clamp(world.x, state.world.xMin, state.world.xMax);
      const clampedY = clamp(world.y, state.world.yMin, state.world.yMax);

      if (state.drag.target === 'handle1') {
        state.manualLine.x1 = clampedX;
        state.manualLine.y1 = clampedY;
      } else if (state.drag.target === 'handle2') {
        state.manualLine.x2 = clampedX;
        state.manualLine.y2 = clampedY;
      } else if (state.drag.target === 'point' && state.drag.pointId !== null) {
        const pt = state.points.find(p => p.id === state.drag.pointId);
        if (pt) {
          pt.x = clampedX;
          pt.y = clampedY;
        }
      }

      render();
      return;
    }

    // Update Hover States & Cursor Style
    const hit = getHitTarget(sx, sy);
    state.hover.target = hit.target;
    state.hover.pointId = hit.pointId || null;

    if (hit.target === 'handle1' || hit.target === 'handle2') {
      canvas.style.cursor = 'grab';
    } else if (hit.target === 'point') {
      canvas.style.cursor = 'move';
    } else {
      canvas.style.cursor = 'crosshair';
    }

    render();
  });

  function stopDrag(e) {
    if (state.drag.active) {
      state.drag.active = false;
      state.drag.target = null;
      state.drag.pointId = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Pointer capture might already be released
      }
      canvas.style.cursor = 'crosshair';
    }
  }

  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  // Right-click / Double-click to remove point
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const hit = getHitTarget(sx, sy);

    if (hit.target === 'point' && hit.pointId !== null) {
      removePoint(hit.pointId);
    }
  });

  // ==========================================================================
  // Points Management
  // ==========================================================================

  function addPoint(x, y) {
    state.points.push({
      id: state.nextPointId++,
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2))
    });
    render();
  }

  function removePoint(id) {
    state.points = state.points.filter(p => p.id !== id);
    render();
  }

  function clearPoints() {
    state.points = [];
    render();
    showToast('All points cleared');
  }

  // ==========================================================================
  // "Fit" Smooth Animation Engine
  // ==========================================================================

  function animateFit() {
    const ols = calculateOLS();
    if (!ols.valid) {
      showToast('Need at least 2 points to fit a line');
      return;
    }

    if (state.animation.active) return;

    // Current line state
    const currentParams = getManualLineParams();
    const startM = currentParams.m;
    const startC = currentParams.c;

    const targetM = ols.m;
    const targetC = ols.c;

    state.animation.active = true;
    state.animation.startTime = performance.now();
    btnFit.classList.add('pulse-btn');

    function animationStep(now) {
      const elapsed = now - state.animation.startTime;
      const progress = Math.min(1, elapsed / state.animation.duration);

      // Smooth Ease-Out Cubic Curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const mCurr = startM + (targetM - startM) * easeProgress;
      const cCurr = startC + (targetC - startC) * easeProgress;

      setManualLineFromParams(mCurr, cCurr);
      render();

      if (progress < 1) {
        requestAnimationFrame(animationStep);
      } else {
        state.animation.active = false;
        showToast(`Line fitted! Optimal SSE = ${calculateMetrics().sse.toFixed(3)}`);
      }
    }

    requestAnimationFrame(animationStep);
  }

  // ==========================================================================
  // Data Presets & Random Generators
  // ==========================================================================

  function generateRandomDataset(type = 'linear') {
    const count = parseInt(genCountSlider.value, 10);
    const noise = parseFloat(genNoiseSlider.value);

    state.points = [];
    state.nextPointId = 1;

    for (let i = 0; i < count; i++) {
      // Evenly distribute X from 1 to 9 with slight variance
      const x = 1 + (i / (count - 1)) * 8 + (Math.random() - 0.5) * 0.4;
      let y = 0;

      switch (type) {
        case 'noisy':
          y = 0.6 * x + 2.0 + (Math.random() - 0.5) * (noise * 2.5);
          break;
        case 'outlier':
          y = 0.8 * x + 1.5 + (Math.random() - 0.5) * (noise * 0.5);
          // Insert dramatic outlier on middle point
          if (i === Math.floor(count / 2)) {
            y = 9.2;
          }
          break;
        case 'horizontal':
          y = 5.0 + (Math.random() - 0.5) * noise;
          break;
        case 'linear':
        default:
          y = 0.85 * x + 1.2 + (Math.random() - 0.5) * noise;
          break;
      }

      state.points.push({
        id: state.nextPointId++,
        x: clamp(parseFloat(x.toFixed(2)), 0.5, 9.5),
        y: clamp(parseFloat(y.toFixed(2)), 0.5, 9.5)
      });
    }

    render();
    showToast(`Generated dataset: ${type.toUpperCase()}`);
  }

  // ==========================================================================
  // Helper Toast Notifications
  // ==========================================================================

  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.add('hidden');
    }, 2400);
  }

  // ==========================================================================
  // UI Event Listeners Wiring
  // ==========================================================================

  function initEventListeners() {
    // 1. Controls for m & c
    const handleManualChange = () => {
      const m = parseFloat(sliderM.value);
      const c = parseFloat(sliderC.value);
      setManualLineFromParams(m, c);
      render();
    };

    sliderM.addEventListener('input', handleManualChange);
    sliderC.addEventListener('input', handleManualChange);

    numM.addEventListener('change', () => {
      const m = parseFloat(numM.value) || 0;
      const c = parseFloat(sliderC.value);
      sliderM.value = m;
      setManualLineFromParams(m, c);
      render();
    });

    numC.addEventListener('change', () => {
      const m = parseFloat(sliderM.value);
      const c = parseFloat(numC.value) || 0;
      sliderC.value = c;
      setManualLineFromParams(m, c);
      render();
    });

    btnResetLine.addEventListener('click', () => {
      setManualLineFromParams(1, 0);
      render();
      showToast('Line reset to y = 1.00x');
    });

    // 2. Checkboxes
    chkResiduals.addEventListener('change', () => {
      state.options.showResiduals = chkResiduals.checked;
      render();
    });
    chkSquares.addEventListener('change', () => {
      state.options.showSquares = chkSquares.checked;
      render();
    });
    chkOls.addEventListener('change', () => {
      state.options.showOlsLine = chkOls.checked;
      render();
    });
    chkMeanY.addEventListener('change', () => {
      state.options.showMeanY = chkMeanY.checked;
      render();
    });

    // 3. Main Action Buttons
    btnFit.addEventListener('click', animateFit);
    btnRandomize.addEventListener('click', () => generateRandomDataset('linear'));
    btnClear.addEventListener('click', clearPoints);

    // 4. Data Generator Sliders
    genCountSlider.addEventListener('input', () => {
      genCountVal.textContent = genCountSlider.value;
    });
    genNoiseSlider.addEventListener('input', () => {
      genNoiseVal.textContent = genNoiseSlider.value;
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        generateRandomDataset(preset);
      });
    });

    // 5. Accordion Toggle
    if (accordionHeader && accordionCard && accordionContent) {
      accordionHeader.addEventListener('click', () => {
        accordionCard.classList.toggle('open');
        accordionContent.classList.toggle('hidden');
        if (!accordionContent.classList.contains('hidden')) {
          render(); // Refresh table contents
        }
      });
    }

    // 6. Dynamic Theme Change Listener
    window.addEventListener('themeChanged', () => {
      render();
    });
  }

  // ==========================================================================
  // Application Initialization
  // ==========================================================================

  function init() {
    initEventListeners();
    resizeCanvas();
    generateRandomDataset('linear');

    // Default line position
    setManualLineFromParams(0.5, 3.0);
    render();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
