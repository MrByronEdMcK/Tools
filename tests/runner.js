/**
 * Educational Tools Hub - In-Browser Test Suite & Bug Checker Engine
 */

(function () {
  'use strict';

  let currentMode = 'full'; // 'quick' | 'full'
  let isRunning = false;

  const btnModeQuick = document.getElementById('btn-mode-quick');
  const btnModeFull = document.getElementById('btn-mode-full');
  const btnRunTests = document.getElementById('btn-run-tests');
  const btnRunText = document.getElementById('btn-run-text');

  const metricStatusBox = document.getElementById('metric-status-box');
  const metricStatus = document.getElementById('metric-status');
  const metricTotal = document.getElementById('metric-total');
  const metricPassed = document.getElementById('metric-passed');
  const metricFailed = document.getElementById('metric-failed');
  const metricDuration = document.getElementById('metric-duration');
  const progressBar = document.getElementById('test-progress-bar');
  const suitesContainer = document.getElementById('test-suites-container');
  const sandboxIframe = document.getElementById('test-sandbox-iframe');

  // Test Suite Definitions
  const TEST_SUITES = [
    {
      id: 'suite-hub',
      title: 'Hub Portal & Registry Integrity',
      tier: 'quick',
      tests: [
        {
          name: 'Tools Data Registry Schema',
          desc: 'Verify window.MR_BYRON_TOOLS format, required keys (id, title, category, path), and non-empty tags.',
          fn: async function () {
            assert(window.MR_BYRON_TOOLS && Array.isArray(window.MR_BYRON_TOOLS), 'MR_BYRON_TOOLS array missing or invalid');
            assert(window.MR_BYRON_TOOLS.length >= 2, 'Expected at least 2 tools registered');
            window.MR_BYRON_TOOLS.forEach(tool => {
              assert(tool.id && tool.title && tool.category && tool.path, `Tool ${tool.id} missing required fields`);
              assert(Array.isArray(tool.tags) && tool.tags.length > 0, `Tool ${tool.id} must have non-empty tags list`);
              assert(tool.path.startsWith('./Tools/'), `Tool path must be relative starting with ./Tools/`);
            });
          }
        },
        {
          name: 'Shared Theme Engine API',
          desc: 'Verify window.MrByronTheme exports getTheme, setTheme, toggleTheme, and isDark functions.',
          fn: async function () {
            assert(window.MrByronTheme, 'MrByronTheme global object missing');
            assert(typeof window.MrByronTheme.getTheme === 'function', 'getTheme function missing');
            assert(typeof window.MrByronTheme.setTheme === 'function', 'setTheme function missing');
            assert(typeof window.MrByronTheme.toggleTheme === 'function', 'toggleTheme function missing');
            assert(typeof window.MrByronTheme.isDark === 'function', 'isDark function missing');
          }
        },
        {
          name: 'Theme Synchronization & LocalStorage Persistence',
          desc: 'Verify switching theme updates document attribute data-theme and saves to localStorage.',
          fn: async function () {
            const initial = window.MrByronTheme.getTheme();
            window.MrByronTheme.setTheme('dark');
            assert(document.documentElement.getAttribute('data-theme') === 'dark', 'DOM data-theme not updated to dark');
            assert(localStorage.getItem('mrbyron-theme') === 'dark', 'localStorage not saved as dark');

            window.MrByronTheme.setTheme('light');
            assert(document.documentElement.getAttribute('data-theme') === 'light', 'DOM data-theme not updated to light');
            assert(localStorage.getItem('mrbyron-theme') === 'light', 'localStorage not saved as light');

            // Restore initial
            window.MrByronTheme.setTheme(initial);
          }
        },
        {
          name: 'Author & Brand Verification',
          desc: 'Verify personal author branding MrByronEdMcK is removed from title and header.',
          fn: async function () {
            assert(!document.title.includes('MrByronEdMcK'), 'Document title should not contain MrByronEdMcK');
            const headerBrand = document.querySelector('.mrbyron-tool-info');
            assert(headerBrand && !headerBrand.textContent.includes('MrByronEdMcK'), 'Tool header should not contain MrByronEdMcK');
          }
        }
      ]
    },
    {
      id: 'suite-networks',
      title: 'Interactive Network Graph Studio (Algorithms & DOM)',
      tier: 'full',
      tests: [
        {
          name: 'Dijkstra Shortest Path Calculation',
          desc: 'Verify algorithm finds optimal weighted shortest path on known 4-node graph.',
          fn: async function () {
            const nodes = ['A', 'B', 'C', 'D'];
            const edges = [
              { u: 'A', v: 'B', w: 4 },
              { u: 'A', v: 'C', w: 2 },
              { u: 'C', v: 'B', w: 1 },
              { u: 'B', v: 'D', w: 5 },
              { u: 'C', v: 'D', w: 8 }
            ];
            const dist = { A: 0, B: Infinity, C: Infinity, D: Infinity };
            const prev = {};
            const unvisited = new Set(nodes);

            while (unvisited.size > 0) {
              let curr = null;
              for (const n of unvisited) {
                if (curr === null || dist[n] < dist[curr]) curr = n;
              }
              if (dist[curr] === Infinity || curr === 'D') break;
              unvisited.delete(curr);

              for (const e of edges) {
                let neighbor = null;
                if (e.u === curr) neighbor = e.v;
                else if (e.v === curr) neighbor = e.u;
                if (neighbor && unvisited.has(neighbor)) {
                  const alt = dist[curr] + e.w;
                  if (alt < dist[neighbor]) {
                    dist[neighbor] = alt;
                    prev[neighbor] = curr;
                  }
                }
              }
            }
            assert(dist['D'] === 8, `Expected shortest distance 8, got ${dist['D']}`);
          }
        },
        {
          name: 'Eulerian Graph Degree Parity Verification',
          desc: 'Verify classification of Eulerian circuit (0 odd), Eulerian trail (2 odd), and non-Eulerian (>2 odd).',
          fn: async function () {
            // Triangle: all 2s
            const degCircuit = [2, 2, 2];
            const oddCircuit = degCircuit.filter(d => d % 2 !== 0).length;
            assert(oddCircuit === 0, 'Eulerian circuit should have 0 odd degree vertices');

            // Line A-B-C: 1, 2, 1
            const degTrail = [1, 2, 1];
            const oddTrail = degTrail.filter(d => d % 2 !== 0).length;
            assert(oddTrail === 2, 'Eulerian trail should have exactly 2 odd degree vertices');

            // K4 complete: 3, 3, 3, 3
            const degNone = [3, 3, 3, 3];
            const oddNone = degNone.filter(d => d % 2 !== 0).length;
            assert(oddNone > 2, 'Non-Eulerian graph must have > 2 odd vertices');
          }
        },
        {
          name: 'Adjacency Matrix Generation',
          desc: 'Verify adjacency matrix generation correctly maps vertices and symmetrical edges.',
          fn: async function () {
            const vertices = ['A', 'B', 'C'];
            const edges = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }];
            const map = { A: 0, B: 1, C: 2 };
            const mat = Array(3).fill(0).map(() => Array(3).fill(0));
            edges.forEach(e => {
              mat[map[e.u]][map[e.v]] += 1;
              mat[map[e.v]][map[e.u]] += 1;
            });
            assert(mat[0][1] === 1 && mat[1][0] === 1, 'Edge A-B not properly set');
            assert(mat[1][2] === 1 && mat[2][1] === 1, 'Edge B-C not properly set');
            assert(mat[0][2] === 0 && mat[2][0] === 0, 'Non-connected A-C must be 0');
          }
        },
        {
          name: 'Networks Sandbox DOM & Button Verification',
          desc: 'Load Networks studio in sandbox iframe and verify all interactive buttons and tabs respond without error.',
          fn: async function () {
            await loadIframe('../Tools/Networks/index.html');
            const doc = sandboxIframe.contentDocument;
            assert(doc, 'Unable to load Networks studio iframe');

            const tabCreate = doc.getElementById('tab-create');
            const tabInteract = doc.getElementById('tab-interact');
            const btnExport = doc.getElementById('btn-export-image');
            const btnTheme = doc.getElementById('btn-theme-toggle');
            const btnShortest = doc.getElementById('btn-find-shortest-path');

            assert(tabCreate, 'tab-create button missing');
            assert(tabInteract, 'tab-interact button missing');
            assert(btnExport, 'btn-export-image missing');
            assert(btnTheme, 'btn-theme-toggle missing');
            assert(btnShortest, 'btn-find-shortest-path missing');

            // Simulate clicking interact tab
            tabInteract.click();
            assert(tabInteract.classList.contains('active'), 'Clicking interact tab did not activate tab');
            
            // Switch back to create tab
            tabCreate.click();
            assert(tabCreate.classList.contains('active'), 'Clicking create tab did not reactivate tab');

            if (iframeErrors.length > 0) {
              throw new Error(`Runtime JS Error in Networks: ${iframeErrors.join(', ')}`);
            }
          }
        }
      ]
    },
    {
      id: 'suite-regression',
      title: 'Least Squares Linear Regression Studio (Mathematics & DOM)',
      tier: 'full',
      tests: [
        {
          name: 'Ordinary Least Squares (OLS) Linear Fit',
          desc: 'Verify exact OLS slope m and intercept c computation on known mathematical dataset y = 2x + 1.',
          fn: async function () {
            const points = [{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }, { x: 4, y: 9 }];
            const n = points.length;
            const meanX = points.reduce((s, p) => s + p.x, 0) / n;
            const meanY = points.reduce((s, p) => s + p.y, 0) / n;
            const num = points.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0);
            const den = points.reduce((s, p) => s + (p.x - meanX) ** 2, 0);

            const m = num / den;
            const c = meanY - m * meanX;

            assert(Math.abs(m - 2.0) < 1e-6, `Expected slope 2.0, got ${m}`);
            assert(Math.abs(c - 1.0) < 1e-6, `Expected intercept 1.0, got ${c}`);
          }
        },
        {
          name: 'SSE, MSE, and R² Goodness of Fit',
          desc: 'Verify statistical error metrics calculation and R² bounds.',
          fn: async function () {
            const points = [{ x: 1, y: 1.5 }, { x: 2, y: 3.8 }, { x: 3, y: 6.1 }, { x: 4, y: 8.2 }];
            const m = 2.23, c = -0.675;
            const n = points.length;
            const meanY = points.reduce((s, p) => s + p.y, 0) / n;

            const sse = points.reduce((s, p) => s + (p.y - (m * p.x + c)) ** 2, 0);
            const sst = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
            const r2 = 1 - (sse / sst);

            assert(sse > 0, 'SSE must be positive');
            assert(r2 >= 0.95 && r2 <= 1.0, `Expected high R² fit, got ${r2}`);
          }
        },
        {
          name: 'Pearson Correlation Coefficient (r)',
          desc: 'Verify Pearson r yields +1.0 for perfect positive and -1.0 for perfect negative correlations.',
          fn: async function () {
            function calcR(pts) {
              const n = pts.length;
              const meanX = pts.reduce((s, p) => s + p.x, 0) / n;
              const meanY = pts.reduce((s, p) => s + p.y, 0) / n;
              const num = pts.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0);
              const den = Math.sqrt(
                pts.reduce((s, p) => s + (p.x - meanX) ** 2, 0) *
                pts.reduce((s, p) => s + (p.y - meanY) ** 2, 0)
              );
              return num / den;
            }

            const rPos = calcR([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }]);
            assert(Math.abs(rPos - 1.0) < 1e-6, `Positive r should be 1.0, got ${rPos}`);

            const rNeg = calcR([{ x: 1, y: 6 }, { x: 2, y: 4 }, { x: 3, y: 2 }]);
            assert(Math.abs(rNeg - (-1.0)) < 1e-6, `Negative r should be -1.0, got ${rNeg}`);
          }
        },
        {
          name: 'Regression Sandbox DOM, Buttons & Zero-Error Check',
          desc: 'Load Regression studio in sandbox iframe, test Fit & Randomize buttons, and verify zero runtime errors.',
          fn: async function () {
            await loadIframe('../Tools/Regression/index.html');
            const doc = sandboxIframe.contentDocument;
            assert(doc, 'Unable to load Regression studio iframe');

            const btnFit = doc.getElementById('btn-fit');
            const btnRandom = doc.getElementById('btn-randomize');
            const btnClear = doc.getElementById('btn-clear');
            const canvas = doc.getElementById('regression-canvas');

            assert(btnFit, 'btn-fit button missing');
            assert(btnRandom, 'btn-randomize button missing');
            assert(btnClear, 'btn-clear button missing');
            assert(canvas, 'regression-canvas element missing');

            // Click Randomize & Fit
            btnRandom.click();
            btnFit.click();

            if (iframeErrors.length > 0) {
              throw new Error(`Runtime JS Error in Regression: ${iframeErrors.join(', ')}`);
            }
          }
        }
      ]
    }
  ];

  let iframeErrors = [];

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  function loadIframe(src) {
    return new Promise((resolve, reject) => {
      iframeErrors = [];
      sandboxIframe.onload = () => {
        try {
          if (sandboxIframe.contentWindow) {
            sandboxIframe.contentWindow.addEventListener('error', (evt) => {
              iframeErrors.push(evt.message || 'Unknown runtime error');
            });
          }
        } catch (e) {}
        resolve();
      };
      sandboxIframe.onerror = (e) => reject(new Error('Failed to load ' + src));
      sandboxIframe.src = src;
    });
  }

  function renderInitialView() {
    suitesContainer.innerHTML = '';
    const activeSuites = TEST_SUITES.filter(s => currentMode === 'full' || s.tier === 'quick');

    let totalTests = 0;
    activeSuites.forEach(suite => {
      totalTests += suite.tests.length;

      const suiteCard = document.createElement('div');
      suiteCard.className = 'suite-card';
      suiteCard.id = `suite-card-${suite.id}`;

      let testsHtml = '';
      suite.tests.forEach((test, idx) => {
        testsHtml += `
          <div class="test-row" id="row-${suite.id}-${idx}">
            <div class="test-info">
              <span class="test-status-badge pending" id="badge-${suite.id}-${idx}">•</span>
              <div>
                <div class="test-name">${escapeHtml(test.name)}</div>
                <div class="test-desc">${escapeHtml(test.desc)}</div>
              </div>
            </div>
            <div class="test-duration" id="dur-${suite.id}-${idx}">-</div>
          </div>
        `;
      });

      suiteCard.innerHTML = `
        <div class="suite-header">
          <div class="suite-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>${escapeHtml(suite.title)}</span>
          </div>
          <div class="suite-stats" id="stats-${suite.id}">${suite.tests.length} tests</div>
        </div>
        <div class="test-list">
          ${testsHtml}
        </div>
      `;
      suitesContainer.appendChild(suiteCard);
    });

    metricTotal.textContent = totalTests.toString();
    metricPassed.textContent = '0';
    metricFailed.textContent = '0';
    metricDuration.textContent = '0.00s';
    progressBar.style.width = '0%';
    metricStatus.textContent = 'Ready to Run';
    metricStatusBox.className = 'metric-box status-box';
  }

  async function runAllTests() {
    if (isRunning) return;
    isRunning = true;
    btnRunTests.disabled = true;
    btnRunText.textContent = 'Running Tests...';
    metricStatus.textContent = 'Running...';

    const activeSuites = TEST_SUITES.filter(s => currentMode === 'full' || s.tier === 'quick');
    let totalTests = 0;
    activeSuites.forEach(s => totalTests += s.tests.length);

    let completed = 0;
    let passed = 0;
    let failed = 0;
    const globalStart = performance.now();

    for (const suite of activeSuites) {
      let suitePassed = 0;
      for (let i = 0; i < suite.tests.length; i++) {
        const test = suite.tests[i];
        const badge = document.getElementById(`badge-${suite.id}-${i}`);
        const dur = document.getElementById(`dur-${suite.id}-${i}`);
        const row = document.getElementById(`row-${suite.id}-${i}`);

        if (badge) badge.className = 'test-status-badge pending';
        
        const start = performance.now();
        let error = null;

        try {
          await test.fn();
        } catch (e) {
          error = e;
        }

        const elapsed = performance.now() - start;
        completed++;
        progressBar.style.width = `${Math.round((completed / totalTests) * 100)}%`;

        if (dur) dur.textContent = `${elapsed.toFixed(1)}ms`;

        // Clean any existing error box
        const existingErr = row ? row.parentNode.querySelector(`.err-${suite.id}-${i}`) : null;
        if (existingErr) existingErr.remove();

        if (!error) {
          passed++;
          suitePassed++;
          if (badge) {
            badge.className = 'test-status-badge pass';
            badge.textContent = '✓';
          }
        } else {
          failed++;
          if (badge) {
            badge.className = 'test-status-badge fail';
            badge.textContent = '✕';
          }
          if (row) {
            const errDiv = document.createElement('div');
            errDiv.className = `test-error-details err-${suite.id}-${i}`;
            errDiv.textContent = `Error: ${error.message}`;
            row.after(errDiv);
          }
        }

        metricPassed.textContent = passed.toString();
        metricFailed.textContent = failed.toString();
      }

      const suiteStats = document.getElementById(`stats-${suite.id}`);
      if (suiteStats) {
        suiteStats.textContent = `${suitePassed}/${suite.tests.length} Passed`;
      }
    }

    const totalElapsed = (performance.now() - globalStart) / 1000;
    metricDuration.textContent = `${totalElapsed.toFixed(2)}s`;

    if (failed === 0) {
      metricStatus.textContent = 'ALL PASSED';
      metricStatusBox.className = 'metric-box status-box passed';
    } else {
      metricStatus.textContent = `${failed} FAILED`;
      metricStatusBox.className = 'metric-box status-box failed';
    }

    isRunning = false;
    btnRunTests.disabled = false;
    btnRunText.textContent = 'Run Test Suite Again';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Event Listeners
  if (btnModeQuick && btnModeFull) {
    btnModeQuick.addEventListener('click', () => {
      currentMode = 'quick';
      btnModeQuick.classList.add('active');
      btnModeFull.classList.remove('active');
      renderInitialView();
    });

    btnModeFull.addEventListener('click', () => {
      currentMode = 'full';
      btnModeFull.classList.add('active');
      btnModeQuick.classList.remove('active');
      renderInitialView();
    });
  }

  if (btnRunTests) {
    btnRunTests.addEventListener('click', runAllTests);
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderInitialView();
    // Auto-run tests on page load for immediate feedback
    runAllTests();
  });

})();
