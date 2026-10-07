/**
 * Interactive Network Graph Studio - Application Engine
 * ----------------------------------------------------
 * Developed by / for MrByronEd - Mathematics Education Resources
 * High-performance SVG Graph Engine with 3-Control-Point Bezier Edge Bending,
 * Element Styling Inspector (Line Style, Thickness, Color for Edges & Nodes),
 * Dual Theme System (Modern Dark & Textbook Monochrome / Print Light),
 * Live Adjacency Matrix Synchronization, Planarity Verification,
 * Shortest Path (Dijkstra), MST (Kruskal), and Multi-Network Set Management.
 */

// Global Application State
const state = {
  mode: 'create', // 'create' or 'interact'
  activeTool: 'select', // 'select', 'add-vertex', 'add-edge', 'bend-edge', 'delete'
  theme: 'monochrome', // 'monochrome' (default) or 'dark'
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  activeSet: {
    title: "MrByronEd Network Set 1",
    activeNetworkId: "net_1",
    networks: []
  },
  // Interaction Transient State
  edgeConnectingSourceId: null,
  selectedVertexId: null,
  selectedEdgeId: null,
  dragState: null // { pointerId, type, id, startX, startY, origX, origY, origDx1..., hasMoved }
};

// Color Palette Constants
const COLOR_PRESETS = {
  edge: [
    { label: 'Auto', value: 'auto' },
    { label: 'Black', value: '#0f172a' },
    { label: 'Slate', value: '#64748b' },
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Sky Blue', value: '#0284c7' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Coral', value: '#ef4444' },
    { label: 'Purple', value: '#8b5cf6' }
  ],
  vertexFill: [
    { label: 'Auto', value: 'auto' },
    { label: 'White', value: '#ffffff' },
    { label: 'Light Gray', value: '#f1f5f9' },
    { label: 'Dark Slate', value: '#1e293b' },
    { label: 'Indigo', value: '#312e81' },
    { label: 'Sky Blue', value: '#0369a1' },
    { label: 'Emerald', value: '#065f46' },
    { label: 'Amber', value: '#92400e' },
    { label: 'Coral', value: '#991b1b' },
    { label: 'Purple', value: '#581c87' }
  ],
  vertexStroke: [
    { label: 'Auto', value: 'auto' },
    { label: 'Black', value: '#0f172a' },
    { label: 'Slate', value: '#64748b' },
    { label: 'Indigo', value: '#818cf8' },
    { label: 'Sky Blue', value: '#38bdf8' },
    { label: 'Emerald', value: '#34d399' },
    { label: 'Amber', value: '#fbbf24' },
    { label: 'Coral', value: '#f87171' },
    { label: 'Purple', value: '#c084fc' }
  ]
};

// DOM Element References Cache
let DOM = {};

function cacheDOMElements() {
  DOM = {
    svg: document.getElementById('network-svg'),
    viewportRoot: document.getElementById('viewport-root'),
    layerEdges: document.getElementById('layer-edges'),
    layerAnalysis: document.getElementById('layer-analysis'),
    layerHandles: document.getElementById('layer-handles'),
    layerCrossings: document.getElementById('layer-crossings'),
    layerVertices: document.getElementById('layer-vertices'),
    layerTemp: document.getElementById('layer-temp'),
    canvasContainer: document.getElementById('canvas-container'),
    
    tabCreate: document.getElementById('tab-create'),
    tabInteract: document.getElementById('tab-interact'),
    paneModeBadge: document.getElementById('pane-mode-badge'),
    paneBadgeText: document.getElementById('pane-badge-text'),
    planarBanner: document.getElementById('planar-status-banner'),
    planarIconSvg: document.getElementById('planar-icon-svg'),
    planarTitle: document.getElementById('planar-status-title'),
    planarSub: document.getElementById('planar-status-sub'),
    
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    themeName: document.getElementById('theme-name'),
    btnExportImage: document.getElementById('btn-export-image'),

    // Zoom Controls
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomReset: document.getElementById('btn-zoom-reset'),
    btnZoomFit: document.getElementById('btn-zoom-fit'),
    zoomLevelLabel: document.getElementById('zoom-level-label'),

    setTitleInput: document.getElementById('set-title-input'),
    networkTabs: document.getElementById('network-tabs'),
    btnAddNetwork: document.getElementById('btn-add-network'),
    btnExportSet: document.getElementById('btn-export-set'),
    inputImportSet: document.getElementById('input-import-set'),
    btnLoadSample: document.getElementById('btn-load-sample'),
    
    mainToolbar: document.getElementById('main-toolbar'),

    // Element Style Inspector Elements
    cardElementInspector: document.getElementById('card-element-inspector'),
    inspectorTitle: document.getElementById('inspector-title'),
    btnDeselectElement: document.getElementById('btn-deselect-element'),
    btnToggleInspectorCard: document.getElementById('btn-toggle-inspector-card'),
    inspectorBodyEmpty: document.getElementById('inspector-body-empty'),
    inspectorBodyEdge: document.getElementById('inspector-body-edge'),
    inspectorBodyVertex: document.getElementById('inspector-body-vertex'),

    // Edge Inspector Controls
    edgeStyleGroup: document.getElementById('edge-style-group'),
    edgeDirectionGroup: document.getElementById('edge-direction-group'),
    valEdgeThickness: document.getElementById('val-edge-thickness'),
    edgeThicknessGroup: document.getElementById('edge-thickness-group'),
    edgeColorPalette: document.getElementById('edge-color-palette'),
    edgeCustomColor: document.getElementById('edge-custom-color'),
    inputEdgeWeight: document.getElementById('input-edge-weight'),
    btnResetEdgeStyle: document.getElementById('btn-reset-edge-style'),
    btnDeleteSelectedEdge: document.getElementById('btn-delete-selected-edge'),

    // Vertex Inspector Controls
    inputVertexLabel: document.getElementById('input-vertex-label'),
    vertexFillPalette: document.getElementById('vertex-fill-palette'),
    vertexCustomFill: document.getElementById('vertex-custom-fill'),
    vertexStrokePalette: document.getElementById('vertex-stroke-palette'),
    vertexCustomStroke: document.getElementById('vertex-custom-stroke'),
    valVertexStrokeWidth: document.getElementById('val-vertex-stroke-width'),
    vertexStrokeWidthGroup: document.getElementById('vertex-stroke-width-group'),
    btnResetVertexStyle: document.getElementById('btn-reset-vertex-style'),
    btnDeleteSelectedVertex: document.getElementById('btn-delete-selected-vertex'),

    // Graph Analysis Controls (Interact Mode)
    cardInteractAnalysis: document.getElementById('card-interact-analysis'),
    selectPathStart: document.getElementById('select-path-start'),
    selectPathEnd: document.getElementById('select-path-end'),
    btnFindShortestPath: document.getElementById('btn-find-shortest-path'),
    btnFindMst: document.getElementById('btn-find-mst'),
    btnCheckEulerian: document.getElementById('btn-check-eulerian'),
    analysisResultBox: document.getElementById('analysis-result-box'),
    resultTitle: document.getElementById('result-title'),
    resultBadgeVal: document.getElementById('result-badge-val'),
    resultPathSeq: document.getElementById('result-path-seq'),
    resultNotes: document.getElementById('result-notes'),
    btnClearAnalysis: document.getElementById('btn-clear-analysis'),

    // Matrix & Stats
    matrixTable: document.getElementById('matrix-table'),
    btnAddMatrixVertex: document.getElementById('btn-add-matrix-vertex'),
    matrixDesc: document.getElementById('matrix-desc'),
    
    statVertices: document.getElementById('stat-vertices'),
    statEdges: document.getElementById('stat-edges'),
    statCrossings: document.getElementById('stat-crossings'),
    statFaces: document.getElementById('stat-faces'),
    propType: document.getElementById('prop-type'),
    propDegrees: document.getElementById('prop-degrees'),
    propEuler: document.getElementById('prop-euler'),
    
    btnLayoutCircle: document.getElementById('btn-layout-circle'),
    btnLayoutGrid: document.getElementById('btn-layout-grid'),
    btnLayoutResetBends: document.getElementById('btn-layout-reset-bends'),
    btnClearGraph: document.getElementById('btn-clear-graph'),
    
    modalSample: document.getElementById('modal-sample'),
    btnCloseSampleModal: document.getElementById('btn-close-sample-modal'),
    hintText: document.getElementById('hint-text')
  };
}

// ==========================================
// Initialisation & Sample Data Creation
// ==========================================
function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ||
         document.body.classList.contains('theme-dark') ||
         (typeof window.MrByronTheme !== 'undefined' && typeof window.MrByronTheme.isDark === 'function' && window.MrByronTheme.isDark());
}

function initApp() {
  cacheDOMElements();

  // Synchronize initial theme from shared theme manager / document attribute
  const isDark = isDarkMode();
  applyTheme(isDark ? 'dark' : 'monochrome', false);

  // Initialize Color Palettes UI
  buildColorPalettes();

  // Create default network 1
  const defaultNetwork = createSampleNetwork('net_1', 'Network 1', 'default');
  state.activeSet.networks.push(defaultNetwork);
  state.activeSet.activeNetworkId = 'net_1';

  setupEventListeners();
  renderSetTabs();
  renderActiveNetwork();
}

function getActiveNetwork() {
  return state.activeSet.networks.find(n => n.id === state.activeSet.activeNetworkId) || state.activeSet.networks[0];
}

// Helper to generate sequential vertex labels (A, B, C... Z, A1, B1...)
function generateVertexLabel(vertices) {
  const existingLabels = new Set(vertices.map(v => v.label));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  for (let i = 0; i < alphabet.length; i++) {
    const letter = alphabet[i];
    if (!existingLabels.has(letter)) return letter;
  }
  
  let suffix = 1;
  while (true) {
    for (let i = 0; i < alphabet.length; i++) {
      const label = alphabet[i] + suffix;
      if (!existingLabels.has(label)) return label;
    }
    suffix++;
  }
}

// Sample Network Generator
function createSampleNetwork(id, name, type) {
  const net = { id, name, vertices: [], edges: [] };

  if (type === 'default') {
    net.vertices = [
      { id: 'v1', label: 'A', x: 260, y: 180 },
      { id: 'v2', label: 'B', x: 480, y: 180 },
      { id: 'v3', label: 'C', x: 480, y: 380 },
      { id: 'v4', label: 'D', x: 260, y: 380 }
    ];
    net.edges = [
      { id: 'e1', source: 'v1', target: 'v2', controlOffset1: { dx: 0, dy: -25 }, controlOffset2: { dx: 0, dy: -35 }, controlOffset3: { dx: 0, dy: -25 } },
      { id: 'e2', source: 'v2', target: 'v3', controlOffset1: { dx: 0, dy: 0 }, controlOffset2: { dx: 0, dy: 0 }, controlOffset3: { dx: 0, dy: 0 } },
      { id: 'e3', source: 'v3', target: 'v4', controlOffset1: { dx: 0, dy: 25 }, controlOffset2: { dx: 0, dy: 35 }, controlOffset3: { dx: 0, dy: 25 } },
      { id: 'e4', source: 'v4', target: 'v1', controlOffset1: { dx: 0, dy: 0 }, controlOffset2: { dx: 0, dy: 0 }, controlOffset3: { dx: 0, dy: 0 } },
      { id: 'e5', source: 'v1', target: 'v3', controlOffset1: { dx: 0, dy: 0 }, controlOffset2: { dx: 0, dy: 0 }, controlOffset3: { dx: 0, dy: 0 } }
    ];
  } else if (type === 'k33') {
    net.name = "Utility Graph (K₃,₃)";
    net.vertices = [
      { id: 'v1', label: 'H1', x: 220, y: 140 },
      { id: 'v2', label: 'H2', x: 370, y: 140 },
      { id: 'v3', label: 'H3', x: 520, y: 140 },
      { id: 'v4', label: 'U1', x: 220, y: 400 },
      { id: 'v5', label: 'U2', x: 370, y: 400 },
      { id: 'v6', label: 'U3', x: 520, y: 400 }
    ];
    let edgeId = 1;
    ['v1', 'v2', 'v3'].forEach(h => {
      ['v4', 'v5', 'v6'].forEach(u => {
        net.edges.push({
          id: 'e' + (edgeId++),
          source: h,
          target: u,
          controlOffset1: { dx: 0, dy: 0 },
          controlOffset2: { dx: 0, dy: 0 },
          controlOffset3: { dx: 0, dy: 0 }
        });
      });
    });
  } else if (type === 'k5') {
    net.name = "Complete Graph (K₅)";
    const cx = 380, cy = 280, r = 160;
    const labels = ['A', 'B', 'C', 'D', 'E'];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      net.vertices.push({
        id: 'v' + (i + 1),
        label: labels[i],
        x: Math.round(cx + r * Math.cos(angle)),
        y: Math.round(cy + r * Math.sin(angle))
      });
    }
    let edgeId = 1;
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        net.edges.push({
          id: 'e' + (edgeId++),
          source: 'v' + (i + 1),
          target: 'v' + (j + 1),
          controlOffset1: { dx: 0, dy: 0 },
          controlOffset2: { dx: 0, dy: 0 },
          controlOffset3: { dx: 0, dy: 0 }
        });
      }
    }
  } else if (type === 'planar_challenge1') {
    net.name = "Planar Challenge 1";
    net.vertices = [
      { id: 'v1', label: 'A', x: 380, y: 120 },
      { id: 'v2', label: 'B', x: 220, y: 280 },
      { id: 'v3', label: 'C', x: 540, y: 280 },
      { id: 'v4', label: 'D', x: 380, y: 440 },
      { id: 'v5', label: 'E', x: 320, y: 240 },
      { id: 'v6', label: 'F', x: 440, y: 320 }
    ];
    net.edges = [
      { id: 'e1', source: 'v1', target: 'v2' },
      { id: 'e2', source: 'v1', target: 'v3' },
      { id: 'e3', source: 'v2', target: 'v4' },
      { id: 'e4', source: 'v3', target: 'v4' },
      { id: 'e5', source: 'v1', target: 'v6' },
      { id: 'e6', source: 'v4', target: 'v5' },
      { id: 'e7', source: 'v2', target: 'v6' },
      { id: 'e8', source: 'v3', target: 'v5' },
      { id: 'e9', source: 'v5', target: 'v6' }
    ];
  } else if (type === 'planar_challenge2') {
    net.name = "Prism Planar Challenge";
    net.vertices = [
      { id: 'v1', label: 'A', x: 380, y: 150 },
      { id: 'v2', label: 'B', x: 480, y: 250 },
      { id: 'v3', label: 'C', x: 440, y: 380 },
      { id: 'v4', label: 'D', x: 320, y: 380 },
      { id: 'v5', label: 'E', x: 280, y: 250 },
      { id: 'v6', label: 'F', x: 380, y: 230 },
      { id: 'v7', label: 'G', x: 420, y: 300 },
      { id: 'v8', label: 'H', x: 340, y: 300 }
    ];
    net.edges = [
      { id: 'e1', source: 'v1', target: 'v2' },
      { id: 'e2', source: 'v2', target: 'v3' },
      { id: 'e3', source: 'v3', target: 'v4' },
      { id: 'e4', source: 'v4', target: 'v5' },
      { id: 'e5', source: 'v5', target: 'v1' },
      { id: 'e6', source: 'v6', target: 'v7' },
      { id: 'e7', source: 'v7', target: 'v8' },
      { id: 'e8', source: 'v8', target: 'v6' },
      { id: 'e9', source: 'v1', target: 'v6' },
      { id: 'e10', source: 'v2', target: 'v7' },
      { id: 'e11', source: 'v4', target: 'v8' }
    ];
  } else if (type === 'konigsberg') {
    net.name = "Königsberg Bridges";
    net.vertices = [
      { id: 'v1', label: 'North', x: 380, y: 150 },
      { id: 'v2', label: 'Island A', x: 260, y: 300 },
      { id: 'v3', label: 'Island B', x: 500, y: 300 },
      { id: 'v4', label: 'South', x: 380, y: 450 }
    ];
    net.edges = [
      { id: 'e1', source: 'v1', target: 'v2', controlOffset1: { dx: -30, dy: 0 }, controlOffset2: { dx: -45, dy: 0 }, controlOffset3: { dx: -30, dy: 0 } },
      { id: 'e2', source: 'v1', target: 'v2', controlOffset1: { dx: 30, dy: 0 }, controlOffset2: { dx: 45, dy: 0 }, controlOffset3: { dx: 30, dy: 0 } },
      { id: 'e3', source: 'v1', target: 'v3', controlOffset1: { dx: 0, dy: -25 }, controlOffset2: { dx: 0, dy: -35 }, controlOffset3: { dx: 0, dy: -25 } },
      { id: 'e4', source: 'v2', target: 'v4', controlOffset1: { dx: -30, dy: 0 }, controlOffset2: { dx: -45, dy: 0 }, controlOffset3: { dx: -30, dy: 0 } },
      { id: 'e5', source: 'v2', target: 'v4', controlOffset1: { dx: 30, dy: 0 }, controlOffset2: { dx: 45, dy: 0 }, controlOffset3: { dx: 30, dy: 0 } },
      { id: 'e6', source: 'v3', target: 'v4', controlOffset1: { dx: 0, dy: 25 }, controlOffset2: { dx: 0, dy: 35 }, controlOffset3: { dx: 0, dy: 25 } },
      { id: 'e7', source: 'v2', target: 'v3' }
    ];
  }

  return net;
}

// ==========================================
// Theme Management Engine
// ==========================================
function applyTheme(themeName, shouldRender = true) {
  const isDark = (themeName === 'dark');
  state.theme = isDark ? 'dark' : 'monochrome';

  if (!isDark) {
    document.body.classList.add('theme-monochrome');
    document.body.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
  } else {
    document.body.classList.remove('theme-monochrome');
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }

  if (shouldRender) {
    renderActiveNetwork();
  }
}

// Listen to global theme changes from shared theme manager
window.addEventListener('themeChanged', (e) => {
  const isDark = e.detail && e.detail.isDark;
  const targetTheme = isDark ? 'dark' : 'monochrome';
  applyTheme(targetTheme, true);
});

// ==========================================
// Rendering Engine
// ==========================================
function renderActiveNetwork() {
  const net = getActiveNetwork();

  // Clear SVG Layers
  DOM.layerEdges.innerHTML = '';
  DOM.layerHandles.innerHTML = '';
  DOM.layerCrossings.innerHTML = '';
  DOM.layerVertices.innerHTML = '';
  DOM.layerTemp.innerHTML = '';

  // Maps for quick lookup
  const vertexMap = new Map(net.vertices.map(v => [v.id, v]));

  // 1. Calculate 3-Control-Point Bezier Paths (Quartic Bezier Curve)
  const edgeCurves = [];
  net.edges.forEach(edge => {
    const v1 = vertexMap.get(edge.source);
    const v2 = vertexMap.get(edge.target);
    if (!v1 || !v2) return;

    const off1 = edge.controlOffset1 || { dx: 0, dy: 0 };
    const off2 = edge.controlOffset2 || { dx: 0, dy: 0 };
    const off3 = edge.controlOffset3 || edge.controlOffset || { dx: 0, dy: 0 };

    let c1, c2, c3;

    if (edge.source === edge.target) {
      // Loop edge with 3 control points
      c1 = { x: v1.x - 50 + (off1.dx || 0), y: v1.y - 60 + (off1.dy || 0) };
      c2 = { x: v1.x + (off2.dx || 0), y: v1.y - 90 + (off2.dy || 0) };
      c3 = { x: v1.x + 50 + (off3.dx || 0), y: v1.y - 60 + (off3.dy || 0) };
    } else {
      // 3 control points along line v1 -> v2
      const base1 = { x: v1.x + (v2.x - v1.x) * 0.25, y: v1.y + (v2.y - v1.y) * 0.25 };
      const base2 = { x: v1.x + (v2.x - v1.x) * 0.50, y: v1.y + (v2.y - v1.y) * 0.50 };
      const base3 = { x: v1.x + (v2.x - v1.x) * 0.75, y: v1.y + (v2.y - v1.y) * 0.75 };

      c1 = { x: Math.round(base1.x + (off1.dx || 0)), y: Math.round(base1.y + (off1.dy || 0)) };
      c2 = { x: Math.round(base2.x + (off2.dx || 0)), y: Math.round(base2.y + (off2.dy || 0)) };
      c3 = { x: Math.round(base3.x + (off3.dx || 0)), y: Math.round(base3.y + (off3.dy || 0)) };
    }

    // Estimate curve length to dynamically scale sampling density
    const chordLen = Math.hypot(v2.x - v1.x, v2.y - v1.y);
    const polyLen = Math.hypot(c1.x - v1.x, c1.y - v1.y) +
                    Math.hypot(c2.x - c1.x, c2.y - c1.y) +
                    Math.hypot(c3.x - c2.x, c3.y - c2.y) +
                    Math.hypot(v2.x - c3.x, v2.y - c3.y);
    const approxLen = Math.max(chordLen, polyLen * 0.7);

    // High resolution sampling (between 50 and 150 steps)
    const steps = Math.max(50, Math.min(150, Math.ceil(approxLen / 5)));
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const mt4 = mt3 * mt;
      const t2 = t * t;
      const t3 = t2 * t;
      const t4 = t3 * t;

      // Quartic Bezier: B(t) = mt^4 P0 + 4 mt^3 t C1 + 6 mt^2 t^2 C2 + 4 mt t^3 C3 + t^4 P3
      const px = mt4 * v1.x + 4 * mt3 * t * c1.x + 6 * mt2 * t2 * c2.x + 4 * mt * t3 * c3.x + t4 * v2.x;
      const py = mt4 * v1.y + 4 * mt3 * t * c1.y + 6 * mt2 * t2 * c2.y + 4 * mt * t3 * c3.y + t4 * v2.y;
      points.push({ x: px, y: py, t });
    }

    // Build SVG smooth path string
    let dPath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      dPath += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }

    // Midpoint for weight label (at t=0.5)
    const midIdx = Math.floor(points.length / 2);
    const midX = Math.round(points[midIdx].x);
    const midY = Math.round(points[midIdx].y);

    // Segment list for crossing detection
    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      segs.push({
        p1: points[i],
        p2: points[i + 1],
        isEndpoint1: i === 0,
        isEndpoint2: i === points.length - 2
      });
    }

    edgeCurves.push({
      edge,
      v1,
      v2,
      c1,
      c2,
      c3,
      points,
      segs,
      midX,
      midY,
      dPath
    });
  });

  // 2. Perform Edge Crossing Detection
  const crossingResults = computeEdgeCrossings(edgeCurves);

  // 3. Render Edges
  edgeCurves.forEach(item => {
    const isSelected = state.selectedEdgeId === item.edge.id;

    const pathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElem.setAttribute('d', item.dPath);
    pathElem.setAttribute('fill', 'none');
    pathElem.setAttribute('class', `edge-path ${isSelected ? 'selected' : ''}`);
    pathElem.setAttribute('data-edge-id', item.edge.id);

    // Apply Custom Edge Styling
    if (item.edge.lineWidth) {
      pathElem.style.strokeWidth = `${item.edge.lineWidth}px`;
    }
    if (item.edge.lineStyle === 'dashed') {
      pathElem.style.strokeDasharray = '7 5';
    } else if (item.edge.lineStyle === 'dotted') {
      pathElem.style.strokeDasharray = '2.5 4';
    }
    if (item.edge.lineColor && item.edge.lineColor !== 'auto') {
      pathElem.style.stroke = item.edge.lineColor;
    }
    
    pathElem.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onEdgePointerDown(e, item.edge.id);
    });

    DOM.layerEdges.appendChild(pathElem);

    // Optional Direction Arrowheads (Forward, Reverse, or Bidirectional)
    const direction = item.edge.direction || 'none';
    if (direction !== 'none' && item.points.length > 10) {
      const isDark = isDarkMode();
      const defaultArrowColor = isDark ? '#818cf8' : '#0f172a';
      const edgeColor = (item.edge.lineColor && item.edge.lineColor !== 'auto') 
        ? item.edge.lineColor 
        : (isSelected ? 'var(--edge-stroke-selected)' : defaultArrowColor);

      const arrowSize = Math.max(9, (item.edge.lineWidth || 3) * 2.8);

      function createArrowPolygon(pHead, pPrev) {
        const angle = Math.atan2(pHead.y - pPrev.y, pHead.x - pPrev.x);
        const p1x = pHead.x - arrowSize * Math.cos(angle - 0.45);
        const p1y = pHead.y - arrowSize * Math.sin(angle - 0.45);
        const p2x = pHead.x - arrowSize * Math.cos(angle + 0.45);
        const p2y = pHead.y - arrowSize * Math.sin(angle + 0.45);

        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', `${pHead.x.toFixed(1)},${pHead.y.toFixed(1)} ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)}`);
        poly.setAttribute('class', `edge-arrow ${isSelected ? 'selected' : ''}`);
        poly.style.fill = edgeColor;
        return poly;
      }

      const totalPts = item.points.length;
      if (direction === 'forward' || direction === 'bidirectional') {
        const idxHead = Math.floor(totalPts * 0.88);
        const idxPrev = Math.floor(totalPts * 0.82);
        DOM.layerEdges.appendChild(createArrowPolygon(item.points[idxHead], item.points[idxPrev]));
      }
      if (direction === 'reverse' || direction === 'bidirectional') {
        const idxHead = Math.floor(totalPts * 0.12);
        const idxPrev = Math.floor(totalPts * 0.18);
        DOM.layerEdges.appendChild(createArrowPolygon(item.points[idxHead], item.points[idxPrev]));
      }
    }

    // Edge Weight / Label (Rendered only if explicit weight is set)
    if (item.edge.weight !== undefined && item.edge.weight !== null && String(item.edge.weight).trim() !== '') {
      const weightStr = String(item.edge.weight).trim();
      
      // Calculate tangent and normal vector at midpoint
      let nx = 0, ny = -1;
      if (item.points && item.points.length >= 5) {
        const midIdx = Math.floor(item.points.length / 2);
        const pA = item.points[Math.max(0, midIdx - 2)];
        const pB = item.points[Math.min(item.points.length - 1, midIdx + 2)];
        const tdx = pB.x - pA.x;
        const tdy = pB.y - pA.y;
        const len = Math.hypot(tdx, tdy);
        if (len > 0.001) {
          let unx = -tdy / len;
          let uny = tdx / len;
          // Prefer placing above/right if nearly horizontal, or right if vertical
          if (uny > 0.3 || (Math.abs(uny) <= 0.3 && unx < 0)) {
            unx = -unx;
            uny = -uny;
          }
          nx = unx;
          ny = uny;
        }
      }

      const offsetDist = 15;
      const labelX = item.midX + nx * offsetDist;
      const labelY = item.midY + ny * offsetDist;

      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', labelX.toFixed(1));
      txt.setAttribute('y', labelY.toFixed(1));
      txt.setAttribute('class', 'edge-weight-label');
      txt.textContent = weightStr;

      DOM.layerEdges.appendChild(txt);
    }
  });

  // 4. Render Vertices
  net.vertices.forEach(v => {
    const isSelected = state.selectedVertexId === v.id;
    const isConnectingSource = state.edgeConnectingSourceId === v.id;
    
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `vertex-group ${isSelected ? 'selected' : ''} ${isConnectingSource ? 'connecting' : ''}`);
    g.setAttribute('transform', `translate(${v.x}, ${v.y})`);
    g.setAttribute('data-vertex-id', v.id);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', 0);
    circle.setAttribute('cy', 0);
    circle.setAttribute('r', 20);
    circle.setAttribute('class', 'vertex-circle');

    // Apply Custom Vertex Styling
    if (v.fillColor && v.fillColor !== 'auto') {
      circle.style.fill = v.fillColor;
    } else {
      circle.style.fill = '';
    }

    if (v.strokeColor && v.strokeColor !== 'auto') {
      circle.style.stroke = v.strokeColor;
    } else {
      circle.style.stroke = '';
    }

    if (v.strokeWidth) {
      circle.style.strokeWidth = `${v.strokeWidth}px`;
    } else {
      circle.style.strokeWidth = '';
    }

    const labelStr = (v.label !== undefined && v.label !== null) ? String(v.label) : '';
    const isMultiChar = labelStr.length > 1;

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.textContent = labelStr;

    const isDark = isDarkMode();

    if (isMultiChar) {
      // Multi-letter label: placed beside the node (to the right)
      text.setAttribute('class', 'vertex-label external');
      text.setAttribute('x', 25);
      text.setAttribute('y', 0);
      
      // Ensure label text is clearly visible against the canvas background
      if (v.textColor) {
        text.style.fill = v.textColor;
      } else {
        text.style.fill = isDark ? '#f8fafc' : '#0f172a';
      }
    } else {
      // Single letter label: placed centered inside the node circle
      text.setAttribute('class', 'vertex-label');
      text.setAttribute('x', 0);
      text.setAttribute('y', 0);

      // High contrast text against node circle fill
      if (v.textColor) {
        text.style.fill = v.textColor;
      } else if (v.fillColor && v.fillColor !== 'auto') {
        text.style.fill = getContrastTextColor(v.fillColor);
      } else {
        text.style.fill = isDark ? '#ffffff' : '#0f172a';
      }
    }

    g.appendChild(circle);
    g.appendChild(text);

    g.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onVertexPointerDown(e, v.id);
    });

    DOM.layerVertices.appendChild(g);
  });

  // 5. Update Element Style Inspector, Matrix & Stats
  updateElementInspector();
  renderMatrixTable();
  updateGraphStats(crossingResults.crossingCount);
  updateViewportTransform();
}

// ==========================================
// Viewport Zoom & Pan Engine
// ==========================================
function updateViewportTransform() {
  if (DOM.viewportRoot) {
    DOM.viewportRoot.setAttribute('transform', `translate(${state.pan.x.toFixed(2)}, ${state.pan.y.toFixed(2)}) scale(${state.zoom.toFixed(3)})`);
  }
  if (DOM.zoomLevelLabel) {
    DOM.zoomLevelLabel.textContent = `${Math.round(state.zoom * 100)}%`;
  }
}

function setZoom(newZoom, pivotX, pivotY) {
  const clamped = Math.min(3.5, Math.max(0.25, newZoom));
  const rect = DOM.svg.getBoundingClientRect();
  const px = pivotX !== undefined ? pivotX : (rect.width / 2 || 400);
  const py = pivotY !== undefined ? pivotY : (rect.height / 2 || 300);

  // World point under pivot
  const worldX = (px - state.pan.x) / state.zoom;
  const worldY = (py - state.pan.y) / state.zoom;

  state.zoom = clamped;
  state.pan.x = px - worldX * clamped;
  state.pan.y = py - worldY * clamped;
  updateViewportTransform();
}

function resetZoom() {
  state.zoom = 1.0;
  state.pan = { x: 0, y: 0 };
  updateViewportTransform();
}

function fitNetworkToView() {
  const net = getActiveNetwork();
  if (!net || net.vertices.length === 0) {
    resetZoom();
    return;
  }

  const rect = DOM.svg.getBoundingClientRect();
  const w = rect.width || 800;
  const h = rect.height || 600;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  net.vertices.forEach(v => {
    minX = Math.min(minX, v.x - 40);
    minY = Math.min(minY, v.y - 40);
    maxX = Math.max(maxX, v.x + 40);
    maxY = Math.max(maxY, v.y + 40);
  });

  const graphW = Math.max(100, maxX - minX);
  const graphH = Math.max(100, maxY - minY);
  const padding = 70;

  const scaleX = (w - padding * 2) / graphW;
  const scaleY = (h - padding * 2) / graphH;
  const newZoom = Math.min(2.0, Math.max(0.35, Math.min(scaleX, scaleY)));

  const graphCenterX = (minX + maxX) / 2;
  const graphCenterY = (minY + maxY) / 2;

  state.zoom = newZoom;
  state.pan.x = (w / 2) - graphCenterX * newZoom;
  state.pan.y = (h / 2) - graphCenterY * newZoom;
  updateViewportTransform();
}

function onCanvasWheel(e) {
  e.preventDefault();
  const rect = DOM.svg.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
  setZoom(state.zoom * zoomFactor, mouseX, mouseY);
}

// Utility: Determine if text on custom fill should be dark or light
function getContrastTextColor(hexColor) {
  if (!hexColor || hexColor === 'auto') return '';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140 ? '#0f172a' : '#ffffff';
}

// ==========================================
// Edge Crossing & Planarity Math Engine
// ==========================================
function computeEdgeCrossings(edgeCurves) {
  const crossingEdgeIds = new Set();
  const crossingPoints = [];

  // Compare sampled segments of every edge against every other edge
  for (let i = 0; i < edgeCurves.length; i++) {
    for (let j = i + 1; j < edgeCurves.length; j++) {
      const e1 = edgeCurves[i];
      const e2 = edgeCurves[j];

      // Check if edges share endpoint nodes
      const shareV1V1 = e1.v1.id === e2.v1.id;
      const shareV1V2 = e1.v1.id === e2.v2.id;
      const shareV2V1 = e1.v2.id === e2.v1.id;
      const shareV2V2 = e1.v2.id === e2.v2.id;

      for (let s1 = 0; s1 < e1.segs.length; s1++) {
        for (let s2 = 0; s2 < e2.segs.length; s2++) {
          const segA = e1.segs[s1];
          const segB = e2.segs[s2];

          // Skip comparing segments attached to a shared vertex
          if (segA.isEndpoint1 && (shareV1V1 || shareV1V2)) continue;
          if (segA.isEndpoint2 && (shareV2V1 || shareV2V2)) continue;
          if (segB.isEndpoint1 && (shareV1V1 || shareV2V1)) continue;
          if (segB.isEndpoint2 && (shareV1V2 || shareV2V2)) continue;

          const inter = getLineSegmentIntersection(
            segA.p1.x, segA.p1.y, segA.p2.x, segA.p2.y,
            segB.p1.x, segB.p1.y, segB.p2.x, segB.p2.y
          );

          if (inter) {
            crossingEdgeIds.add(e1.edge.id);
            crossingEdgeIds.add(e2.edge.id);
            crossingPoints.push(inter);
          }
        }
      }
    }
  }

  return {
    crossingEdgeIds,
    crossingPoints,
    crossingCount: crossingPoints.length
  };
}

// 2D Line Segment Intersection Algorithm
function getLineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null; // Parallel

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  // Strict interior intersection
  if (ua > 0.02 && ua < 0.98 && ub > 0.02 && ub < 0.98) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
}

// ==========================================
// Element Style Inspector UI Engine
// ==========================================
function buildColorPalettes() {
  if (!DOM.edgeColorPalette || !DOM.vertexFillPalette || !DOM.vertexStrokePalette) return;

  function renderPalette(container, presets, type) {
    container.innerHTML = '';
    presets.forEach(p => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.title = p.label;
      swatch.setAttribute('data-color', p.value);
      swatch.setAttribute('data-palette-type', type);

      if (p.value === 'auto') {
        swatch.style.background = 'linear-gradient(135deg, #475569 50%, #94a3b8 50%)';
        swatch.style.border = '1px solid var(--border-light)';
      } else {
        swatch.style.backgroundColor = p.value;
        if (p.value === '#ffffff') swatch.style.border = '1px solid #cbd5e1';
      }

      container.appendChild(swatch);
    });
  }

  renderPalette(DOM.edgeColorPalette, COLOR_PRESETS.edge, 'edge-color');
  renderPalette(DOM.vertexFillPalette, COLOR_PRESETS.vertexFill, 'vertex-fill');
  renderPalette(DOM.vertexStrokePalette, COLOR_PRESETS.vertexStroke, 'vertex-stroke');
}

function updateElementInspector() {
  const net = getActiveNetwork();

  // Update Hide/Show button text
  if (DOM.btnToggleInspectorCard && DOM.cardElementInspector) {
    const isCollapsed = DOM.cardElementInspector.classList.contains('collapsed');
    DOM.btnToggleInspectorCard.textContent = isCollapsed ? 'Show' : 'Hide';
  }

  if (state.selectedEdgeId) {
    const edge = net.edges.find(e => e.id === state.selectedEdgeId);
    if (edge) {
      DOM.inspectorBodyEmpty.style.display = 'none';
      DOM.inspectorBodyVertex.style.display = 'none';
      DOM.inspectorBodyEdge.style.display = 'block';
      DOM.btnDeselectElement.style.display = 'inline-block';
      DOM.inspectorTitle.textContent = 'Connection Style';

      // Sync Line Style (solid, dashed, dotted)
      const currentStyle = edge.lineStyle || 'solid';
      DOM.edgeStyleGroup.querySelectorAll('.seg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-style') === currentStyle);
      });

      // Sync Direction (none, forward, reverse, bidirectional)
      const currentDir = edge.direction || 'none';
      if (DOM.edgeDirectionGroup) {
        DOM.edgeDirectionGroup.querySelectorAll('.seg-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-dir') === currentDir);
        });
      }

      // Sync Thickness
      const currentThick = edge.lineWidth || 3;
      DOM.valEdgeThickness.textContent = `${currentThick}px`;
      DOM.edgeThicknessGroup.querySelectorAll('.thick-btn').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.getAttribute('data-thick')) === currentThick);
      });

      // Sync Line Color Swatches
      const currentColor = edge.lineColor || 'auto';
      DOM.edgeColorPalette.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.getAttribute('data-color') === currentColor);
      });
      if (currentColor !== 'auto') {
        DOM.edgeCustomColor.value = currentColor;
      }

      // Sync Weight
      DOM.inputEdgeWeight.value = edge.weight !== undefined && edge.weight !== null ? edge.weight : '';
      return;
    }
  }

  if (state.selectedVertexId) {
    const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
    if (vertex) {
      DOM.inspectorBodyEmpty.style.display = 'none';
      DOM.inspectorBodyEdge.style.display = 'none';
      DOM.inspectorBodyVertex.style.display = 'block';
      DOM.btnDeselectElement.style.display = 'inline-block';
      DOM.inspectorTitle.textContent = `Node (${vertex.label}) Style`;

      // Sync Label
      DOM.inputVertexLabel.value = vertex.label || '';

      // Sync Fill Color
      const currentFill = vertex.fillColor || 'auto';
      DOM.vertexFillPalette.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.getAttribute('data-color') === currentFill);
      });
      if (currentFill !== 'auto') {
        DOM.vertexCustomFill.value = currentFill;
      }

      // Sync Stroke Color
      const currentStroke = vertex.strokeColor || 'auto';
      DOM.vertexStrokePalette.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.classList.toggle('active', swatch.getAttribute('data-color') === currentStroke);
      });
      if (currentStroke !== 'auto') {
        DOM.vertexCustomStroke.value = currentStroke;
      }

      // Sync Stroke Width
      const currentStrokeWidth = vertex.strokeWidth || 2.5;
      DOM.valVertexStrokeWidth.textContent = `${currentStrokeWidth}px`;
      DOM.vertexStrokeWidthGroup.querySelectorAll('.thick-btn').forEach(btn => {
        btn.classList.toggle('active', parseFloat(btn.getAttribute('data-thick')) === currentStrokeWidth);
      });
      return;
    }
  }

  // Empty State (No selection)
  DOM.inspectorBodyEmpty.style.display = 'block';
  DOM.inspectorBodyEdge.style.display = 'none';
  DOM.inspectorBodyVertex.style.display = 'none';
  DOM.btnDeselectElement.style.display = 'none';
  DOM.inspectorTitle.textContent = 'Element Style';
}

// ==========================================
// Adjacency Matrix Panel Logic
// ==========================================
function renderMatrixTable() {
  const net = getActiveNetwork();
  const vertices = net.vertices;
  const isCreateMode = state.mode === 'create';

  // Build Adjacency Matrix Map
  const matrix = {};
  vertices.forEach(v1 => {
    matrix[v1.id] = {};
    vertices.forEach(v2 => {
      matrix[v1.id][v2.id] = 0;
    });
  });

  net.edges.forEach(e => {
    const dir = e.direction || 'none';
    if (matrix[e.source] && matrix[e.source][e.target] !== undefined) {
      if (dir === 'forward') {
        matrix[e.source][e.target] += 1;
      } else if (dir === 'reverse') {
        matrix[e.target][e.source] += 1;
      } else {
        // undirected ('none') or bidirectional
        matrix[e.source][e.target] += 1;
        if (e.source !== e.target) {
          matrix[e.target][e.source] += 1;
        }
      }
    }
  });

  let html = '<thead><tr><th></th>';
  vertices.forEach(v => {
    html += `<th>${v.label}</th>`;
  });
  if (isCreateMode) html += '<th></th>';
  html += '</tr></thead><tbody>';

  vertices.forEach((rowV) => {
    html += `<tr><th>${rowV.label}</th>`;
    vertices.forEach((colV) => {
      const val = matrix[rowV.id][colV.id];
      const isDiagonal = rowV.id === colV.id;
      const cellClass = isDiagonal ? 'cell-diagonal' : '';
      
      if (isCreateMode) {
        html += `<td class="${cellClass}">
          <input type="text" inputmode="numeric" class="matrix-input" maxlength="2"
            value="${val}" 
            data-row="${rowV.id}" 
            data-col="${colV.id}">
        </td>`;
      } else {
        html += `<td class="${cellClass}">${val}</td>`;
      }
    });

    if (isCreateMode) {
      html += `<td>
        <span class="row-del-btn" data-del-vertex="${rowV.id}" title="Delete Vertex ${rowV.label}">&times;</span>
      </td>`;
    }

    html += '</tr>';
  });

  html += '</tbody>';
  DOM.matrixTable.innerHTML = html;

  // Add event listeners to inputs in Create Mode
  if (isCreateMode) {
    DOM.matrixTable.querySelectorAll('.matrix-input').forEach(input => {
      input.addEventListener('change', onMatrixCellChange);
      input.addEventListener('focus', (e) => e.target.select());
    });
    DOM.matrixTable.querySelectorAll('.row-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vId = e.target.getAttribute('data-del-vertex');
        deleteVertex(vId);
      });
    });
  }
}

// 2-Way Synchronization: Matrix Input Changed -> Update Graph Edges
function onMatrixCellChange(e) {
  const rowId = e.target.getAttribute('data-row');
  const colId = e.target.getAttribute('data-col');
  const raw = e.target.value.trim();
  const newCount = Math.min(9, Math.max(0, parseInt(raw, 10) || 0));
  e.target.value = newCount;

  const net = getActiveNetwork();
  
  // Find current edge count between rowId and colId
  const existingEdges = net.edges.filter(edge => 
    (edge.source === rowId && edge.target === colId) ||
    (edge.source === colId && edge.target === rowId)
  );

  const currentCount = existingEdges.length;

  if (newCount > currentCount) {
    // Add missing edges
    for (let i = 0; i < newCount - currentCount; i++) {
      const offset = (i + 1) * 30 * (i % 2 === 0 ? 1 : -1);
      net.edges.push({
        id: 'e_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        source: rowId,
        target: colId,
        controlOffset1: { dx: offset * 0.7, dy: offset * 0.7 },
        controlOffset2: { dx: offset, dy: offset },
        controlOffset3: { dx: offset * 0.7, dy: offset * 0.7 }
      });
    }
  } else if (newCount < currentCount) {
    // Remove excess edges
    const toRemove = currentCount - newCount;
    for (let i = 0; i < toRemove; i++) {
      const removedEdge = existingEdges.pop();
      net.edges = net.edges.filter(edge => edge.id !== removedEdge.id);
    }
  }

  renderActiveNetwork();
}

// ==========================================
// Graph Properties & Planar Dashboard
// ==========================================
function updateGraphStats(crossingCount) {
  const net = getActiveNetwork();
  const V = net.vertices.length;
  const E = net.edges.length;

  DOM.statVertices.textContent = V;
  DOM.statEdges.textContent = E;
  DOM.statCrossings.textContent = crossingCount;

  // Degrees calculation
  const degreesMap = {};
  net.vertices.forEach(v => degreesMap[v.id] = 0);
  net.edges.forEach(e => {
    if (degreesMap[e.source] !== undefined) degreesMap[e.source]++;
    if (degreesMap[e.target] !== undefined) degreesMap[e.target]++;
  });

  const degreeSeq = Object.values(degreesMap).sort((a, b) => b - a);
  DOM.propDegrees.textContent = `[${degreeSeq.join(', ')}]`;

  // Euler Formula Faces: F = E - V + 2
  if (crossingCount === 0 && V > 0) {
    const F = E - V + 2;
    DOM.statFaces.textContent = F > 0 ? F : 1;
    DOM.propEuler.textContent = `${V} - ${E} + ${F > 0 ? F : 1} = 2`;
  } else {
    DOM.statFaces.textContent = '-';
    DOM.propEuler.textContent = 'Requires Planar Layout';
  }

  // Update Planarity Banner (Interact Mode)
  if (state.mode === 'interact') {
    DOM.planarBanner.style.display = 'flex';
    if (crossingCount === 0) {
      DOM.planarBanner.className = 'planar-banner planar-yes';
      DOM.planarTitle.textContent = 'Planar Layout Achieved!';
      DOM.planarSub.textContent = '0 edge crossings. Graph is cleanly disentangled!';
      DOM.planarIconSvg.innerHTML = `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`;
    } else {
      DOM.planarBanner.className = 'planar-banner planar-no';
      DOM.planarTitle.textContent = `Non-Planar Layout (${crossingCount} Crossing${crossingCount > 1 ? 's' : ''})`;
      DOM.planarSub.textContent = 'Drag vertices or edge curves to disentangle crossing edges.';
      DOM.planarIconSvg.innerHTML = `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`;
    }
  } else {
    DOM.planarBanner.style.display = 'none';
  }
}

// ==========================================
// User Interaction Handlers & Pointer Events
// ==========================================
function setupEventListeners() {
  // Export Diagram Image (PNG)
  if (DOM.btnExportImage) {
    DOM.btnExportImage.addEventListener('click', exportDiagramImage);
  }

  // Mode Switcher Tabs
  DOM.tabCreate.addEventListener('click', () => switchPaneMode('create'));
  DOM.tabInteract.addEventListener('click', () => switchPaneMode('interact'));

  // Tool Buttons
  DOM.mainToolbar.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.getAttribute('data-tool');
      if (tool) setActiveTool(tool);
    });
  });

  // SVG Canvas Click / Pointer Events & Zoom Wheel
  DOM.svg.addEventListener('pointerdown', onCanvasPointerDown);
  DOM.svg.addEventListener('wheel', onCanvasWheel, { passive: false });
  window.addEventListener('pointermove', onWindowPointerMove);
  window.addEventListener('pointerup', onWindowPointerUp);
  DOM.svg.addEventListener('dblclick', onCanvasDoubleClick);

  // Viewport Zoom & Pan Floating Controls
  if (DOM.btnZoomIn) DOM.btnZoomIn.addEventListener('click', () => setZoom(state.zoom * 1.2));
  if (DOM.btnZoomOut) DOM.btnZoomOut.addEventListener('click', () => setZoom(state.zoom / 1.2));
  if (DOM.btnZoomReset) DOM.btnZoomReset.addEventListener('click', resetZoom);
  if (DOM.btnZoomFit) DOM.btnZoomFit.addEventListener('click', fitNetworkToView);
  if (DOM.zoomLevelLabel) DOM.zoomLevelLabel.addEventListener('click', resetZoom);

  // Set Manager Controls
  DOM.setTitleInput.addEventListener('change', (e) => {
    state.activeSet.title = e.target.value || "Textbook Network Set";
  });
  DOM.btnAddNetwork.addEventListener('click', addNewNetworkToSet);
  DOM.btnExportSet.addEventListener('click', exportSetToJSON);
  DOM.inputImportSet.addEventListener('change', importSetFromJSON);

  // Add Vertex via Matrix Button
  DOM.btnAddMatrixVertex.addEventListener('click', () => {
    if (state.mode === 'create') spawnVertexAtCenter();
  });

  // Layout Buttons
  DOM.btnLayoutCircle.addEventListener('click', applyCircleLayout);
  DOM.btnLayoutGrid.addEventListener('click', applyGridLayout);
  DOM.btnLayoutResetBends.addEventListener('click', straightenAllEdges);
  DOM.btnClearGraph.addEventListener('click', clearCurrentGraph);

  // Sample Modal
  DOM.btnLoadSample.addEventListener('click', () => DOM.modalSample.style.display = 'flex');
  DOM.btnCloseSampleModal.addEventListener('click', () => DOM.modalSample.style.display = 'none');
  
  document.querySelectorAll('.sample-card').forEach(card => {
    card.addEventListener('click', () => {
      const sampleKey = card.getAttribute('data-sample');
      loadSampleNetwork(sampleKey);
      DOM.modalSample.style.display = 'none';
    });
  });

  // Collapsible Sidebar Cards
  document.querySelectorAll('.card-header[data-toggle-card]').forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't toggle collapse if clicked on an action button inside the header
      if (e.target.closest('button')) return;
      const cardId = header.getAttribute('data-toggle-card');
      const card = document.getElementById(cardId);
      if (card) {
        card.classList.toggle('collapsed');
        if (cardId === 'card-element-inspector' && DOM.btnToggleInspectorCard) {
          DOM.btnToggleInspectorCard.textContent = card.classList.contains('collapsed') ? 'Show' : 'Hide';
        }
      }
    });
  });

  // Setup Element Inspector Listeners
  setupInspectorListeners();

  // Setup Graph Analysis Listeners (Interact Mode)
  setupAnalysisListeners();

  // Global Keyboard Shortcuts (Escape to deselect/close modal, Delete/Backspace to delete selected element)
  window.addEventListener('keydown', (e) => {
    const isEditingInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

    if (e.key === 'Escape') {
      if (DOM.modalSample && DOM.modalSample.style.display !== 'none') {
        DOM.modalSample.style.display = 'none';
        return;
      }
      state.selectedVertexId = null;
      state.selectedEdgeId = null;
      state.edgeConnectingSourceId = null;
      DOM.layerTemp.innerHTML = '';
      renderActiveNetwork();
      return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingInput) {
      if (state.mode === 'create') {
        if (state.selectedVertexId) {
          e.preventDefault();
          deleteVertex(state.selectedVertexId);
        } else if (state.selectedEdgeId) {
          e.preventDefault();
          deleteEdge(state.selectedEdgeId);
        }
      }
    }
  });
}

function setupInspectorListeners() {
  if (DOM.btnDeselectElement) {
    DOM.btnDeselectElement.addEventListener('click', () => {
      state.selectedVertexId = null;
      state.selectedEdgeId = null;
      renderActiveNetwork();
    });
  }

  // Edge Style Controls
  if (DOM.edgeStyleGroup) {
    DOM.edgeStyleGroup.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const style = btn.getAttribute('data-style');
        const net = getActiveNetwork();
        const edge = net.edges.find(e => e.id === state.selectedEdgeId);
        if (edge) {
          edge.lineStyle = style;
          renderActiveNetwork();
        }
      });
    });
  }

  // Direction Controls
  if (DOM.edgeDirectionGroup) {
    DOM.edgeDirectionGroup.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.getAttribute('data-dir');
        const net = getActiveNetwork();
        const edge = net.edges.find(e => e.id === state.selectedEdgeId);
        if (edge) {
          edge.direction = dir;
          renderActiveNetwork();
        }
      });
    });
  }

  // Inspector Collapse / Hide Button
  if (DOM.btnToggleInspectorCard && DOM.cardElementInspector) {
    DOM.btnToggleInspectorCard.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.cardElementInspector.classList.toggle('collapsed');
      const isCollapsed = DOM.cardElementInspector.classList.contains('collapsed');
      DOM.btnToggleInspectorCard.textContent = isCollapsed ? 'Show' : 'Hide';
    });
  }

  if (DOM.edgeThicknessGroup) {
    DOM.edgeThicknessGroup.querySelectorAll('.thick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const thick = parseFloat(btn.getAttribute('data-thick'));
        const net = getActiveNetwork();
        const edge = net.edges.find(e => e.id === state.selectedEdgeId);
        if (edge) {
          edge.lineWidth = thick;
          renderActiveNetwork();
        }
      });
    });
  }

  if (DOM.edgeColorPalette) {
    DOM.edgeColorPalette.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      const color = swatch.getAttribute('data-color');
      const net = getActiveNetwork();
      const edge = net.edges.find(e => e.id === state.selectedEdgeId);
      if (edge) {
        edge.lineColor = color === 'auto' ? undefined : color;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.edgeCustomColor) {
    DOM.edgeCustomColor.addEventListener('input', (e) => {
      const net = getActiveNetwork();
      const edge = net.edges.find(e => e.id === state.selectedEdgeId);
      if (edge) {
        edge.lineColor = e.target.value;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.inputEdgeWeight) {
    DOM.inputEdgeWeight.addEventListener('input', (e) => {
      const net = getActiveNetwork();
      const edge = net.edges.find(e => e.id === state.selectedEdgeId);
      if (edge) {
        const raw = e.target.value;
        if (raw.trim() === '') {
          delete edge.weight;
        } else {
          edge.weight = raw;
        }
        renderActiveNetwork();
      }
    });
  }

  if (DOM.btnResetEdgeStyle) {
    DOM.btnResetEdgeStyle.addEventListener('click', () => {
      const net = getActiveNetwork();
      const edge = net.edges.find(e => e.id === state.selectedEdgeId);
      if (edge) {
        delete edge.lineStyle;
        delete edge.lineWidth;
        delete edge.lineColor;
        delete edge.direction;
        delete edge.weight;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.btnDeleteSelectedEdge) {
    DOM.btnDeleteSelectedEdge.addEventListener('click', () => {
      if (state.selectedEdgeId) {
        deleteEdge(state.selectedEdgeId);
      }
    });
  }

  // Vertex Style Controls
  if (DOM.inputVertexLabel) {
    DOM.inputVertexLabel.addEventListener('input', (e) => {
      const net = getActiveNetwork();
      const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
      if (vertex) {
        vertex.label = e.target.value.trim() || vertex.label;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.vertexFillPalette) {
    DOM.vertexFillPalette.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      const color = swatch.getAttribute('data-color');
      const net = getActiveNetwork();
      const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
      if (vertex) {
        vertex.fillColor = color === 'auto' ? undefined : color;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.vertexCustomFill) {
    DOM.vertexCustomFill.addEventListener('input', (e) => {
      const net = getActiveNetwork();
      const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
      if (vertex) {
        vertex.fillColor = e.target.value;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.vertexStrokePalette) {
    DOM.vertexStrokePalette.addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      const color = swatch.getAttribute('data-color');
      const net = getActiveNetwork();
      const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
      if (vertex) {
        vertex.strokeColor = color === 'auto' ? undefined : color;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.vertexCustomStroke) {
    DOM.vertexCustomStroke.addEventListener('input', (e) => {
      const net = getActiveNetwork();
      const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
      if (vertex) {
        vertex.strokeColor = e.target.value;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.vertexStrokeWidthGroup) {
    DOM.vertexStrokeWidthGroup.querySelectorAll('.thick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const thick = parseFloat(btn.getAttribute('data-thick'));
        const net = getActiveNetwork();
        const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
        if (vertex) {
          vertex.strokeWidth = thick;
          renderActiveNetwork();
        }
      });
    });
  }

  if (DOM.btnResetVertexStyle) {
    DOM.btnResetVertexStyle.addEventListener('click', () => {
      const net = getActiveNetwork();
      const vertex = net.vertices.find(v => v.id === state.selectedVertexId);
      if (vertex) {
        delete vertex.fillColor;
        delete vertex.strokeColor;
        delete vertex.strokeWidth;
        delete vertex.textColor;
        renderActiveNetwork();
      }
    });
  }

  if (DOM.btnDeleteSelectedVertex) {
    DOM.btnDeleteSelectedVertex.addEventListener('click', () => {
      if (state.selectedVertexId) {
        deleteVertex(state.selectedVertexId);
      }
    });
  }
}

// ==========================================
// Graph Analysis Engine (Interact Mode)
// ==========================================
function populateAnalysisNodeSelects() {
  const net = getActiveNetwork();
  if (!DOM.selectPathStart || !DOM.selectPathEnd) return;

  const prevStart = DOM.selectPathStart.value;
  const prevEnd = DOM.selectPathEnd.value;

  DOM.selectPathStart.innerHTML = '';
  DOM.selectPathEnd.innerHTML = '';

  net.vertices.forEach(v => {
    const opt1 = document.createElement('option');
    opt1.value = v.id;
    opt1.textContent = `${v.label} (Node ${v.label})`;
    DOM.selectPathStart.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = v.id;
    opt2.textContent = `${v.label} (Node ${v.label})`;
    DOM.selectPathEnd.appendChild(opt2);
  });

  if (prevStart && net.vertices.some(v => v.id === prevStart)) {
    DOM.selectPathStart.value = prevStart;
  }
  if (prevEnd && net.vertices.some(v => v.id === prevEnd)) {
    DOM.selectPathEnd.value = prevEnd;
  } else if (net.vertices.length > 1) {
    DOM.selectPathEnd.value = net.vertices[net.vertices.length - 1].id;
  }
}

function parseEdgeWeightNumber(weight) {
  if (weight === undefined || weight === null) return 1;
  const num = parseFloat(weight);
  return (!isNaN(num) && num > 0) ? num : 1;
}

function findShortestPath(startId, endId) {
  const net = getActiveNetwork();
  const distances = {};
  const previous = {};
  const edgeUsed = {};
  const unvisited = new Set();

  net.vertices.forEach(v => {
    distances[v.id] = Infinity;
    previous[v.id] = null;
    edgeUsed[v.id] = null;
    unvisited.add(v.id);
  });

  distances[startId] = 0;

  while (unvisited.size > 0) {
    let currentId = null;
    let minDistance = Infinity;
    unvisited.forEach(vId => {
      if (distances[vId] < minDistance) {
        minDistance = distances[vId];
        currentId = vId;
      }
    });

    if (currentId === null || minDistance === Infinity) break;
    if (currentId === endId) break;

    unvisited.delete(currentId);

    net.edges.forEach(e => {
      const weight = parseEdgeWeightNumber(e.weight);
      const dir = e.direction || 'none';

      let neighborId = null;
      if (dir === 'forward') {
        if (e.source === currentId) neighborId = e.target;
      } else if (dir === 'reverse') {
        if (e.target === currentId) neighborId = e.source;
      } else {
        if (e.source === currentId) neighborId = e.target;
        else if (e.target === currentId) neighborId = e.source;
      }

      if (neighborId && unvisited.has(neighborId)) {
        const alt = distances[currentId] + weight;
        if (alt < distances[neighborId]) {
          distances[neighborId] = alt;
          previous[neighborId] = currentId;
          edgeUsed[neighborId] = e.id;
        }
      }
    });
  }

  if (distances[endId] === Infinity) {
    return { found: false };
  }

  const pathVertexIds = [];
  const pathEdgeIds = [];
  let curr = endId;
  while (curr) {
    pathVertexIds.unshift(curr);
    if (edgeUsed[curr]) pathEdgeIds.unshift(edgeUsed[curr]);
    curr = previous[curr];
  }

  return {
    found: true,
    distance: Math.round(distances[endId] * 1000) / 1000,
    vertexIds: pathVertexIds,
    edgeIds: pathEdgeIds
  };
}

function findMinimumSpanningTree() {
  const net = getActiveNetwork();
  const sortedEdges = net.edges
    .filter(e => e.source !== e.target)
    .sort((a, b) => parseEdgeWeightNumber(a.weight) - parseEdgeWeightNumber(b.weight));
  
  const parent = {};
  net.vertices.forEach(v => parent[v.id] = v.id);
  function find(i) {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  }
  function union(i, j) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  }

  const mstEdges = [];
  let totalWeight = 0;

  for (const e of sortedEdges) {
    if (union(e.source, e.target)) {
      mstEdges.push(e.id);
      totalWeight += parseEdgeWeightNumber(e.weight);
    }
  }

  return {
    edgeIds: mstEdges,
    totalWeight: Math.round(totalWeight * 1000) / 1000,
    isSpanning: mstEdges.length === Math.max(0, net.vertices.length - 1)
  };
}

function checkEulerianTrail() {
  const net = getActiveNetwork();
  if (net.vertices.length === 0 || net.edges.length === 0) {
    return {
      type: 'none',
      label: 'Empty Network',
      desc: 'Please add vertices and connect edges to inspect Eulerian properties.'
    };
  }

  const degMap = {};
  net.vertices.forEach(v => degMap[v.id] = 0);
  net.edges.forEach(e => {
    if (degMap[e.source] !== undefined) degMap[e.source]++;
    if (degMap[e.target] !== undefined) degMap[e.target]++;
  });

  // Check connectivity among vertices that have at least one connected edge
  const activeVertices = net.vertices.filter(v => degMap[v.id] > 0);
  if (activeVertices.length > 0) {
    const visited = new Set();
    const queue = [activeVertices[0].id];
    visited.add(activeVertices[0].id);

    while (queue.length > 0) {
      const curr = queue.shift();
      net.edges.forEach(e => {
        let neighbor = null;
        if (e.source === curr) neighbor = e.target;
        else if (e.target === curr) neighbor = e.source;
        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    if (visited.size < activeVertices.length) {
      return {
        type: 'none',
        label: 'Disconnected Network',
        desc: 'Edges belong to separate disconnected components. An Eulerian trail requires all edges to be in one connected component.'
      };
    }
  }

  const oddVertices = net.vertices.filter(v => degMap[v.id] % 2 !== 0);
  const oddCount = oddVertices.length;

  if (oddCount === 0 && net.edges.length > 0) {
    return {
      type: 'circuit',
      label: 'Eulerian Circuit Exists',
      desc: 'All vertices have even degrees. A closed circuit traversing every edge exactly once is possible starting at any vertex.'
    };
  } else if (oddCount === 2) {
    return {
      type: 'trail',
      label: 'Eulerian Trail Exists',
      desc: `Exactly 2 vertices (${oddVertices.map(v => v.label).join(', ')}) have odd degree. An open trail traversing every edge exists starting at ${oddVertices[0].label} and ending at ${oddVertices[1].label}.`
    };
  } else {
    return {
      type: 'none',
      label: 'Non-Eulerian Graph',
      desc: `${oddCount} vertices have odd degrees. An Eulerian trail requires exactly 0 or 2 odd-degree vertices.`
    };
  }
}

function highlightAnalysisPath({ vertexIds = [], edgeIds = [] }) {
  if (!DOM.layerAnalysis) return;
  DOM.layerAnalysis.innerHTML = '';

  const net = getActiveNetwork();
  const vMap = new Map(net.vertices.map(v => [v.id, v]));

  // Highlight Edges
  edgeIds.forEach(edgeId => {
    const edgePathEl = DOM.layerEdges.querySelector(`[data-edge-id="${edgeId}"]`);
    if (edgePathEl) {
      const d = edgePathEl.getAttribute('d');
      const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      glowPath.setAttribute('d', d);
      glowPath.setAttribute('class', 'analysis-highlight-edge');
      DOM.layerAnalysis.appendChild(glowPath);
    }
  });

  // Highlight Vertices
  vertexIds.forEach(vId => {
    const v = vMap.get(vId);
    if (v) {
      const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glowCircle.setAttribute('cx', v.x);
      glowCircle.setAttribute('cy', v.y);
      glowCircle.setAttribute('r', 24);
      glowCircle.setAttribute('class', 'analysis-highlight-vertex');
      DOM.layerAnalysis.appendChild(glowCircle);
    }
  });
}

function clearAnalysisHighlights() {
  if (DOM.layerAnalysis) DOM.layerAnalysis.innerHTML = '';
  if (DOM.analysisResultBox) DOM.analysisResultBox.style.display = 'none';
}

function setupAnalysisListeners() {
  if (DOM.btnFindShortestPath) {
    DOM.btnFindShortestPath.addEventListener('click', () => {
      const startId = DOM.selectPathStart.value;
      const endId = DOM.selectPathEnd.value;
      const net = getActiveNetwork();
      const startV = net.vertices.find(v => v.id === startId);
      const endV = net.vertices.find(v => v.id === endId);

      if (!startV || !endV) return;

      const res = findShortestPath(startId, endId);
      DOM.analysisResultBox.style.display = 'block';

      if (res.found) {
        const vMap = new Map(net.vertices.map(v => [v.id, v]));
        const seqNames = res.vertexIds.map(id => vMap.get(id)?.label || id);

        DOM.resultTitle.textContent = `Shortest Route (${startV.label} \u2794 ${endV.label})`;
        DOM.resultBadgeVal.textContent = `Total Distance / Cost: ${res.distance}`;
        DOM.resultPathSeq.textContent = seqNames.join(' \u2794 ');
        DOM.resultNotes.textContent = `Traversed ${res.vertexIds.length} vertices across ${res.edgeIds.length} connection${res.edgeIds.length !== 1 ? 's' : ''}.`;

        highlightAnalysisPath({ vertexIds: res.vertexIds, edgeIds: res.edgeIds });
      } else {
        DOM.resultTitle.textContent = `No Route Available`;
        DOM.resultBadgeVal.textContent = `Unreachable`;
        DOM.resultPathSeq.textContent = `No directed path from ${startV.label} to ${endV.label}`;
        DOM.resultNotes.textContent = 'Check edge directions or network connectivity.';
        clearAnalysisHighlights();
        DOM.analysisResultBox.style.display = 'block';
      }
    });
  }

  if (DOM.btnFindMst) {
    DOM.btnFindMst.addEventListener('click', () => {
      const net = getActiveNetwork();
      const mst = findMinimumSpanningTree();
      DOM.analysisResultBox.style.display = 'block';

      DOM.resultTitle.textContent = 'Minimum Spanning Tree (MST)';
      DOM.resultBadgeVal.textContent = `Total Tree Weight: ${mst.totalWeight}`;
      DOM.resultPathSeq.textContent = `${mst.edgeIds.length} Edges connecting ${net.vertices.length} Nodes`;
      DOM.resultNotes.textContent = mst.isSpanning 
        ? 'Minimum connected backbone tree connecting all vertices with minimal weight.'
        : 'Graph has disconnected components. Forest of minimum trees calculated.';

      highlightAnalysisPath({ edgeIds: mst.edgeIds });
    });
  }

  if (DOM.btnCheckEulerian) {
    DOM.btnCheckEulerian.addEventListener('click', () => {
      const eul = checkEulerianTrail();
      DOM.analysisResultBox.style.display = 'block';
      DOM.resultTitle.textContent = eul.label;
      DOM.resultBadgeVal.textContent = eul.type.toUpperCase();
      DOM.resultPathSeq.textContent = eul.label;
      DOM.resultNotes.textContent = eul.desc;
    });
  }

  if (DOM.btnClearAnalysis) {
    DOM.btnClearAnalysis.addEventListener('click', clearAnalysisHighlights);
  }
}

// Switch between Create and Interact Panes
function switchPaneMode(newMode) {
  state.mode = newMode;
  clearAnalysisHighlights();
  
  if (newMode === 'create') {
    DOM.tabCreate.classList.add('active');
    DOM.tabInteract.classList.remove('active');
    DOM.paneModeBadge.className = 'mode-badge create-mode';
    DOM.paneBadgeText.textContent = 'CREATE MODE';
    DOM.hintText.textContent = 'Double-click or select "Add Node" to create vertices. Connect edges & edit matrix.';
    
    // Show create-only tools and hide interact tools
    document.querySelectorAll('.create-only-tool').forEach(el => el.style.display = '');
    document.querySelectorAll('.create-only-inline').forEach(el => el.style.display = '');
    document.querySelectorAll('.interact-only-tool').forEach(el => el.style.display = 'none');
    
    setActiveTool('select');
  } else {
    DOM.tabInteract.classList.add('active');
    DOM.tabCreate.classList.remove('active');
    DOM.paneModeBadge.className = 'mode-badge interact-mode';
    DOM.paneBadgeText.textContent = 'INTERACT MODE';
    DOM.hintText.textContent = 'Drag vertices and edge curves to explore connections, test planarity & calculate shortest routes.';

    // Hide all creation and editing tools, lock graph topology
    document.querySelectorAll('.create-only-tool').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.create-only-inline').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.interact-only-tool').forEach(el => el.style.display = '');

    populateAnalysisNodeSelects();
    setActiveTool('select');
  }

  renderActiveNetwork();
}

function setActiveTool(tool) {
  state.activeTool = tool;
  DOM.mainToolbar.querySelectorAll('.tool-btn').forEach(btn => {
    if (btn.getAttribute('data-tool') === tool) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Reset transient selections
  state.edgeConnectingSourceId = null;
  DOM.layerTemp.innerHTML = '';
}

// Pointer Events: Vertex Dragging & Single-Click Customization
function onVertexPointerDown(e, vertexId) {
  const net = getActiveNetwork();
  
  if (state.mode === 'create' && state.activeTool === 'delete') {
    deleteVertex(vertexId);
    return;
  }

  if (state.mode === 'create' && state.activeTool === 'add-edge') {
    if (!state.edgeConnectingSourceId) {
      state.edgeConnectingSourceId = vertexId;
      renderActiveNetwork();
    } else if (state.edgeConnectingSourceId !== vertexId) {
      // Connect source to target
      net.edges.push({
        id: 'e_' + Date.now(),
        source: state.edgeConnectingSourceId,
        target: vertexId,
        controlOffset1: { dx: 0, dy: 0 },
        controlOffset2: { dx: 0, dy: 0 },
        controlOffset3: { dx: 0, dy: 0 }
      });
      state.edgeConnectingSourceId = null;
      renderActiveNetwork();
    } else {
      // Loop edge
      net.edges.push({
        id: 'e_' + Date.now(),
        source: vertexId,
        target: vertexId,
        controlOffset1: { dx: 0, dy: 0 },
        controlOffset2: { dx: 0, dy: 0 },
        controlOffset3: { dx: 0, dy: 0 }
      });
      state.edgeConnectingSourceId = null;
      renderActiveNetwork();
    }
    return;
  }

  // Select / Move Mode (or Interact Mode)
  state.selectedVertexId = vertexId;
  state.selectedEdgeId = null;
  
  const vertex = net.vertices.find(v => v.id === vertexId);
  if (vertex) {
    const pt = getSVGCoordinates(e);
    tryCapturePointer(e);
    state.dragState = {
      pointerId: e.pointerId,
      type: 'vertex',
      id: vertexId,
      startX: pt.x,
      startY: pt.y,
      origX: vertex.x,
      origY: vertex.y,
      hasMoved: false
    };
  }

  renderActiveNetwork();
}

// Pointer Events: Edge Dragging & Single-Click Customization
function onEdgePointerDown(e, edgeId) {
  if (state.mode === 'create' && state.activeTool === 'delete') {
    deleteEdge(edgeId);
    return;
  }

  state.selectedEdgeId = edgeId;
  state.selectedVertexId = null;

  const net = getActiveNetwork();
  const edge = net.edges.find(e => e.id === edgeId);
  if (edge) {
    const pt = getSVGCoordinates(e);
    tryCapturePointer(e);

    const vertexMap = new Map(net.vertices.map(v => [v.id, v]));
    const v1 = vertexMap.get(edge.source);
    const v2 = vertexMap.get(edge.target);
    
    let targetPointType = 'c2';
    if (v1 && v2) {
      const off1 = edge.controlOffset1 || { dx: 0, dy: 0 };
      const off2 = edge.controlOffset2 || { dx: 0, dy: 0 };
      const off3 = edge.controlOffset3 || edge.controlOffset || { dx: 0, dy: 0 };

      let c1, c2, c3;
      if (edge.source === edge.target) {
        c1 = { x: v1.x - 50 + (off1.dx || 0), y: v1.y - 60 + (off1.dy || 0) };
        c2 = { x: v1.x + (off2.dx || 0), y: v1.y - 90 + (off2.dy || 0) };
        c3 = { x: v1.x + 50 + (off3.dx || 0), y: v1.y - 60 + (off3.dy || 0) };
      } else {
        const base1 = { x: v1.x + (v2.x - v1.x) * 0.25, y: v1.y + (v2.y - v1.y) * 0.25 };
        const base2 = { x: v1.x + (v2.x - v1.x) * 0.50, y: v1.y + (v2.y - v1.y) * 0.50 };
        const base3 = { x: v1.x + (v2.x - v1.x) * 0.75, y: v1.y + (v2.y - v1.y) * 0.75 };
        c1 = { x: Math.round(base1.x + (off1.dx || 0)), y: Math.round(base1.y + (off1.dy || 0)) };
        c2 = { x: Math.round(base2.x + (off2.dx || 0)), y: Math.round(base2.y + (off2.dy || 0)) };
        c3 = { x: Math.round(base3.x + (off3.dx || 0)), y: Math.round(base3.y + (off3.dy || 0)) };
      }

      let minDist = Infinity;
      let closestT = 0.5;
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const mt = 1 - t, mt2 = mt * mt, mt3 = mt2 * mt, mt4 = mt3 * mt;
        const t2 = t * t, t3 = t2 * t, t4 = t3 * t;
        const px = mt4 * v1.x + 4 * mt3 * t * c1.x + 6 * mt2 * t2 * c2.x + 4 * mt * t3 * c3.x + t4 * v2.x;
        const py = mt4 * v1.y + 4 * mt3 * t * c1.y + 6 * mt2 * t2 * c2.y + 4 * mt * t3 * c3.y + t4 * v2.y;
        const dist = Math.hypot(px - pt.x, py - pt.y);
        if (dist < minDist) {
          minDist = dist;
          closestT = t;
        }
      }

      if (closestT <= 0.38) targetPointType = 'c1';
      else if (closestT >= 0.62) targetPointType = 'c3';
      else targetPointType = 'c2';
    }

    const off1 = edge.controlOffset1 || { dx: 0, dy: 0 };
    const off2 = edge.controlOffset2 || { dx: 0, dy: 0 };
    const off3 = edge.controlOffset3 || edge.controlOffset || { dx: 0, dy: 0 };

    state.dragState = {
      pointerId: e.pointerId,
      type: 'edge_bezier',
      targetPointType,
      id: edgeId,
      startX: pt.x,
      startY: pt.y,
      origDx1: off1.dx || 0,
      origDy1: off1.dy || 0,
      origDx2: off2.dx || 0,
      origDy2: off2.dy || 0,
      origDx3: off3.dx || 0,
      origDy3: off3.dy || 0,
      hasMoved: false
    };
  }

  renderActiveNetwork();
}

function onCanvasPointerDown(e) {
  const pt = getSVGCoordinates(e);

  if (state.mode === 'create' && state.activeTool === 'add-vertex') {
    const net = getActiveNetwork();
    const newVertex = {
      id: 'v_' + Date.now(),
      label: generateVertexLabel(net.vertices),
      x: Math.round(pt.x),
      y: Math.round(pt.y)
    };
    net.vertices.push(newVertex);
    renderActiveNetwork();
    return;
  }

  // Clear selections if clicking empty canvas background
  state.selectedVertexId = null;
  state.selectedEdgeId = null;
  state.edgeConnectingSourceId = null;
  DOM.layerTemp.innerHTML = '';
  renderActiveNetwork();

  // Initiate canvas panning
  tryCapturePointer(e);
  state.dragState = {
    pointerId: e.pointerId,
    type: 'pan',
    startClientX: e.clientX,
    startClientY: e.clientY,
    origPanX: state.pan.x,
    origPanY: state.pan.y,
    hasMoved: false
  };
}

function onCanvasDoubleClick(e) {
  if (state.mode === 'create') {
    const pt = getSVGCoordinates(e);
    const net = getActiveNetwork();
    const newVertex = {
      id: 'v_' + Date.now(),
      label: generateVertexLabel(net.vertices),
      x: Math.round(pt.x),
      y: Math.round(pt.y)
    };
    net.vertices.push(newVertex);
    renderActiveNetwork();
  }
}

function onWindowPointerMove(e) {
  const pt = getSVGCoordinates(e);

  // Render temp edge line when connecting
  if (state.edgeConnectingSourceId && state.mode === 'create') {
    const net = getActiveNetwork();
    const src = net.vertices.find(v => v.id === state.edgeConnectingSourceId);
    if (src) {
      DOM.layerTemp.innerHTML = `<line x1="${src.x}" y1="${src.y}" x2="${pt.x}" y2="${pt.y}" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="4 4" />`;
    }
  }

  // Handle Dragging
  if (!state.dragState) return;

  // 1. Canvas Panning
  if (state.dragState.type === 'pan') {
    const dx = e.clientX - state.dragState.startClientX;
    const dy = e.clientY - state.dragState.startClientY;
    if (Math.hypot(dx, dy) > 2) {
      state.dragState.hasMoved = true;
    }
    state.pan.x = state.dragState.origPanX + dx;
    state.pan.y = state.dragState.origPanY + dy;
    updateViewportTransform();
    return;
  }

  const dx = pt.x - state.dragState.startX;
  const dy = pt.y - state.dragState.startY;
  
  if (Math.hypot(dx, dy) > 3) {
    state.dragState.hasMoved = true;
  }

  const net = getActiveNetwork();

  if (state.dragState.type === 'vertex') {
    const v = net.vertices.find(v => v.id === state.dragState.id);
    if (v) {
      v.x = Math.max(-2000, Math.min(3000, Math.round(state.dragState.origX + dx)));
      v.y = Math.max(-2000, Math.min(3000, Math.round(state.dragState.origY + dy)));
      renderActiveNetwork();
    }
  } else if (state.dragState.type === 'edge_bezier') {
    const edge = net.edges.find(e => e.id === state.dragState.id);
    if (edge) {
      const targetType = state.dragState.targetPointType || 'c2';

      if (!edge.controlOffset1) edge.controlOffset1 = { dx: state.dragState.origDx1 || 0, dy: state.dragState.origDy1 || 0 };
      if (!edge.controlOffset2) edge.controlOffset2 = { dx: state.dragState.origDx2 || 0, dy: state.dragState.origDy2 || 0 };
      if (!edge.controlOffset3) edge.controlOffset3 = { dx: state.dragState.origDx3 || 0, dy: state.dragState.origDy3 || 0 };

      if (targetType === 'c1') {
        edge.controlOffset1 = {
          dx: Math.round((state.dragState.origDx1 || 0) + 2.37 * dx),
          dy: Math.round((state.dragState.origDy1 || 0) + 2.37 * dy)
        };
      } else if (targetType === 'c2') {
        edge.controlOffset2 = {
          dx: Math.round((state.dragState.origDx2 || 0) + 2.67 * dx),
          dy: Math.round((state.dragState.origDy2 || 0) + 2.67 * dy)
        };
      } else if (targetType === 'c3') {
        edge.controlOffset3 = {
          dx: Math.round((state.dragState.origDx3 || 0) + 2.37 * dx),
          dy: Math.round((state.dragState.origDy3 || 0) + 2.37 * dy)
        };
      }
      renderActiveNetwork();
    }
  }
}

function onWindowPointerUp(e) {
  if (state.dragState) {
    tryReleasePointer(e);
    const wasPan = state.dragState.type === 'pan';
    state.dragState = null;
    if (!wasPan) renderActiveNetwork();
  }
}

function tryCapturePointer(e) {
  try {
    if (DOM.svg.setPointerCapture && e.pointerId !== undefined) {
      DOM.svg.setPointerCapture(e.pointerId);
    }
  } catch (err) {}
}

function tryReleasePointer(e) {
  try {
    if (DOM.svg.releasePointerCapture && e.pointerId !== undefined && DOM.svg.hasPointerCapture(e.pointerId)) {
      DOM.svg.releasePointerCapture(e.pointerId);
    }
  } catch (err) {}
}

// Convert Mouse/Pointer event to SVG coordinate space taking Zoom & Pan into account
function getSVGCoordinates(e) {
  const rect = DOM.svg.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;
  return {
    x: (clientX - state.pan.x) / state.zoom,
    y: (clientY - state.pan.y) / state.zoom
  };
}

// Deletion Helpers
function deleteVertex(vertexId) {
  const net = getActiveNetwork();
  net.vertices = net.vertices.filter(v => v.id !== vertexId);
  net.edges = net.edges.filter(e => e.source !== vertexId && e.target !== vertexId);
  state.selectedVertexId = null;
  renderActiveNetwork();
}

function deleteEdge(edgeId) {
  const net = getActiveNetwork();
  net.edges = net.edges.filter(e => e.id !== edgeId);
  state.selectedEdgeId = null;
  renderActiveNetwork();
}

function spawnVertexAtCenter() {
  const net = getActiveNetwork();
  const rect = DOM.svg.getBoundingClientRect();
  const cx = rect.width / 2 || 350;
  const cy = rect.height / 2 || 280;

  net.vertices.push({
    id: 'v_' + Date.now(),
    label: generateVertexLabel(net.vertices),
    x: Math.round(cx + (Math.random() * 60 - 30)),
    y: Math.round(cy + (Math.random() * 60 - 30))
  });
  renderActiveNetwork();
}

// ==========================================
// Set Management, Import & Export
// ==========================================
function renderSetTabs() {
  DOM.setTitleInput.value = state.activeSet.title;
  DOM.networkTabs.innerHTML = '';

  state.activeSet.networks.forEach((net) => {
    const tab = document.createElement('div');
    const isActive = net.id === state.activeSet.activeNetworkId;
    tab.className = `net-tab ${isActive ? 'active' : ''}`;
    
    tab.innerHTML = `
      <span>${net.name}</span>
      ${state.activeSet.networks.length > 1 ? `<span class="close-tab" data-del-net="${net.id}">&times;</span>` : ''}
    `;

    tab.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-tab')) {
        e.stopPropagation();
        deleteNetworkFromSet(net.id);
      } else {
        state.activeSet.activeNetworkId = net.id;
        state.selectedVertexId = null;
        state.selectedEdgeId = null;
        renderSetTabs();
        renderActiveNetwork();
      }
    });

    DOM.networkTabs.appendChild(tab);
  });
}

function addNewNetworkToSet() {
  const count = state.activeSet.networks.length + 1;
  const newNet = {
    id: 'net_' + Date.now(),
    name: `Network ${count}`,
    vertices: [
      { id: 'v1', label: 'A', x: 280, y: 220 },
      { id: 'v2', label: 'B', x: 480, y: 220 }
    ],
    edges: [
      { id: 'e1', source: 'v1', target: 'v2' }
    ]
  };
  
  state.activeSet.networks.push(newNet);
  state.activeSet.activeNetworkId = newNet.id;
  state.selectedVertexId = null;
  state.selectedEdgeId = null;
  renderSetTabs();
  renderActiveNetwork();
}

function deleteNetworkFromSet(netId) {
  if (state.activeSet.networks.length <= 1) return;
  state.activeSet.networks = state.activeSet.networks.filter(n => n.id !== netId);
  if (state.activeSet.activeNetworkId === netId) {
    state.activeSet.activeNetworkId = state.activeSet.networks[0].id;
  }
  state.selectedVertexId = null;
  state.selectedEdgeId = null;
  renderSetTabs();
  renderActiveNetwork();
}

function exportSetToJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.activeSet, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${state.activeSet.title.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importSetFromJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (importedData && importedData.networks && Array.isArray(importedData.networks)) {
        state.activeSet = importedData;
        if (!state.activeSet.activeNetworkId || !state.activeSet.networks.some(n => n.id === state.activeSet.activeNetworkId)) {
          state.activeSet.activeNetworkId = state.activeSet.networks[0].id;
        }
        state.selectedVertexId = null;
        state.selectedEdgeId = null;
        renderSetTabs();
        renderActiveNetwork();
        alert('Network Set imported successfully!');
      } else {
        alert('Invalid Network Set JSON format.');
      }
    } catch (err) {
      alert('Error parsing JSON file.');
    }
  };
  reader.readAsText(file);
}

function loadSampleNetwork(sampleKey) {
  const newNet = createSampleNetwork('net_' + Date.now(), 'Sample Network', sampleKey);
  state.activeSet.networks.push(newNet);
  state.activeSet.activeNetworkId = newNet.id;
  state.selectedVertexId = null;
  state.selectedEdgeId = null;
  renderSetTabs();
  renderActiveNetwork();
}

// ==========================================
// High-Res Diagram Image Export (for Tests)
// ==========================================
function exportDiagramImage() {
  const net = getActiveNetwork();
  const isMonochrome = state.theme === 'monochrome';

  // Compute graph bounding box with margin
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  net.vertices.forEach(v => {
    minX = Math.min(minX, v.x - 45);
    minY = Math.min(minY, v.y - 45);
    maxX = Math.max(maxX, v.x + 45);
    maxY = Math.max(maxY, v.y + 45);
  });

  // Also factor in curved edge control points into bounds
  net.edges.forEach(e => {
    const v1 = net.vertices.find(v => v.id === e.source);
    const v2 = net.vertices.find(v => v.id === e.target);
    if (v1 && v2) {
      const off1 = e.controlOffset1 || { dx: 0, dy: 0 };
      const off2 = e.controlOffset2 || { dx: 0, dy: 0 };
      const off3 = e.controlOffset3 || { dx: 0, dy: 0 };
      [off1, off2, off3].forEach(off => {
        if (off && (off.dx || off.dy)) {
          const midX = (v1.x + v2.x) / 2 + (off.dx || 0);
          const midY = (v1.y + v2.y) / 2 + (off.dy || 0);
          minX = Math.min(minX, midX - 30);
          minY = Math.min(minY, midY - 30);
          maxX = Math.max(maxX, midX + 30);
          maxY = Math.max(maxY, midY + 30);
        }
      });
    }
  });

  if (!isFinite(minX) || net.vertices.length === 0) {
    minX = 100; minY = 100; maxX = 700; maxY = 500;
  }

  const padding = 50;
  const cropX = Math.floor(Math.max(0, minX - padding));
  const cropY = Math.floor(Math.max(0, minY - padding));
  const cropW = Math.ceil(Math.max(300, (maxX - minX) + padding * 2));
  const cropH = Math.ceil(Math.max(240, (maxY - minY) + padding * 2));

  // Clone SVG
  const svgClone = DOM.svg.cloneNode(true);
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('width', cropW);
  svgClone.setAttribute('height', cropH);
  svgClone.setAttribute('viewBox', `${cropX} ${cropY} ${cropW} ${cropH}`);

  // Remove editor UI elements from clone
  const removeSelectors = [
    '#layer-handles',
    '#layer-temp',
    '#layer-crossings',
    'rect[fill^="url(#grid"]',
    '.canvas-hint',
    '.canvas-zoom-controls',
    '.mode-badge'
  ];
  removeSelectors.forEach(sel => {
    svgClone.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Reset viewport transform on clone
  const cloneViewport = svgClone.querySelector('#viewport-root');
  if (cloneViewport) {
    cloneViewport.removeAttribute('transform');
  }

  // Deselect all selected classes
  svgClone.querySelectorAll('.selected, .connecting').forEach(el => {
    el.classList.remove('selected', 'connecting');
  });

  // Color scheme constants for export
  const bgColor = isMonochrome ? '#ffffff' : '#0f172a';
  const defaultEdgeStroke = isMonochrome ? '#0f172a' : '#94a3b8';
  const defaultVertexFill = isMonochrome ? '#ffffff' : '#1e1b4b';
  const defaultVertexStroke = isMonochrome ? '#0f172a' : '#818cf8';
  const defaultVertexText = isMonochrome ? '#0f172a' : '#ffffff';
  const externalLabelText = isMonochrome ? '#0f172a' : '#f8fafc';
  const externalHaloStroke = isMonochrome ? '#ffffff' : '#0f172a';

  // Inject Self-Contained Stylesheet into Cloned SVG
  let defs = svgClone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgClone.insertBefore(defs, svgClone.firstChild);
  }

  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    path.edge-path {
      fill: none !important;
      stroke: ${defaultEdgeStroke};
      stroke-width: 3px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    circle.vertex-circle {
      fill: ${defaultVertexFill};
      stroke: ${defaultVertexStroke};
      stroke-width: 2.5px;
    }
    text.vertex-label {
      fill: ${defaultVertexText};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-anchor: middle;
      dominant-baseline: central;
    }
    text.vertex-label.external {
      fill: ${externalLabelText} !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      text-anchor: start !important;
      dominant-baseline: central !important;
      paint-order: stroke fill !important;
      stroke: ${externalHaloStroke} !important;
      stroke-width: 4px !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }
    .edge-arrow {
      fill: ${defaultEdgeStroke};
    }
    text.edge-weight-label {
      fill: ${externalLabelText} !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
      font-size: 13px !important;
      font-weight: 700 !important;
      text-anchor: middle !important;
      dominant-baseline: central !important;
      paint-order: stroke fill !important;
      stroke: ${externalHaloStroke} !important;
      stroke-width: 4px !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }
  `;
  defs.appendChild(styleEl);

  // Set explicit presentation attributes on every path and circle in the clone as a bulletproof fallback
  svgClone.querySelectorAll('path.edge-path').forEach(p => {
    p.setAttribute('fill', 'none');
    if (!p.getAttribute('stroke') && !p.style.stroke) {
      p.setAttribute('stroke', defaultEdgeStroke);
    }
    if (!p.getAttribute('stroke-width') && !p.style.strokeWidth) {
      p.setAttribute('stroke-width', '3');
    }
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
  });

  svgClone.querySelectorAll('circle.vertex-circle').forEach(c => {
    if (!c.getAttribute('fill') && !c.style.fill) {
      c.setAttribute('fill', defaultVertexFill);
    }
    if (!c.getAttribute('stroke') && !c.style.stroke) {
      c.setAttribute('stroke', defaultVertexStroke);
    }
    if (!c.getAttribute('stroke-width') && !c.style.strokeWidth) {
      c.setAttribute('stroke-width', '2.5');
    }
  });

  svgClone.querySelectorAll('polygon.edge-arrow').forEach(a => {
    if (!a.getAttribute('fill') && !a.style.fill) {
      a.setAttribute('fill', defaultEdgeStroke);
    }
  });

  // Background rect behind everything
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', cropX);
  bgRect.setAttribute('y', cropY);
  bgRect.setAttribute('width', cropW);
  bgRect.setAttribute('height', cropH);
  bgRect.setAttribute('fill', bgColor);
  svgClone.insertBefore(bgRect, svgClone.firstChild);

  // Serialize to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgClone);

  // Create off-screen canvas at 3x DPI for ultra high quality test and paper print
  const canvas = document.createElement('canvas');
  const scale = 3;
  canvas.width = cropW * scale;
  canvas.height = cropH * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cropW, cropH);
    ctx.drawImage(img, 0, 0, cropW, cropH);
    URL.revokeObjectURL(url);

    // Trigger PNG download
    const pngData = canvas.toDataURL('image/png');
    const downloadAnchor = document.createElement('a');
    const safeTitle = (net.name || 'network_diagram').replace(/\s+/g, '_').toLowerCase();
    downloadAnchor.download = `${safeTitle}_${isMonochrome ? 'print' : 'diagram'}.png`;
    downloadAnchor.href = pngData;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  img.onerror = (err) => {
    console.error("Image export error:", err);
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

// ==========================================
// Layout Presets & Straighten Commands
// ==========================================
function applyCircleLayout() {
  const net = getActiveNetwork();
  const count = net.vertices.length;
  if (count === 0) return;

  const rect = DOM.svg.getBoundingClientRect();
  const cx = rect.width / 2 || 380;
  const cy = rect.height / 2 || 280;
  const radius = Math.min(cx, cy) - 90;

  net.vertices.forEach((v, idx) => {
    const angle = (idx * 2 * Math.PI / count) - Math.PI / 2;
    v.x = Math.round(cx + radius * Math.cos(angle));
    v.y = Math.round(cy + radius * Math.sin(angle));
  });

  renderActiveNetwork();
}

function applyGridLayout() {
  const net = getActiveNetwork();
  const count = net.vertices.length;
  if (count === 0) return;

  const cols = Math.ceil(Math.sqrt(count));
  const spacingX = 140;
  const spacingY = 120;
  const startX = 220;
  const startY = 150;

  net.vertices.forEach((v, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    v.x = startX + c * spacingX;
    v.y = startY + r * spacingY;
  });

  renderActiveNetwork();
}

function straightenAllEdges() {
  const net = getActiveNetwork();
  net.edges.forEach(e => {
    e.controlOffset1 = { dx: 0, dy: 0 };
    e.controlOffset2 = { dx: 0, dy: 0 };
    e.controlOffset3 = { dx: 0, dy: 0 };
    e.controlOffset = { dx: 0, dy: 0 };
  });
  renderActiveNetwork();
}

function clearCurrentGraph() {
  if (confirm('Are you sure you want to clear all vertices and edges in this network?')) {
    const net = getActiveNetwork();
    net.vertices = [];
    net.edges = [];
    state.selectedVertexId = null;
    state.selectedEdgeId = null;
    renderActiveNetwork();
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
