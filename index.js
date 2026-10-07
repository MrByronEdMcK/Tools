/**
 * MrByronEdMcK Educational Tools Hub - Homepage Controller
 */

(function () {
  'use strict';

  let allTools = [];
  let currentCategory = 'all';
  let searchQuery = '';

  const toolsGrid = document.getElementById('tools-grid');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const categoryFilters = document.getElementById('category-filters');
  const toolsCounter = document.getElementById('tools-counter');
  const noResults = document.getElementById('no-results');
  const btnReset = document.getElementById('btn-reset-filters');

  // Arrow Icon SVG
  const ARROW_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

  async function loadTools() {
    // 1. Check offline fallback
    if (window.MR_BYRON_TOOLS && Array.isArray(window.MR_BYRON_TOOLS)) {
      allTools = window.MR_BYRON_TOOLS;
    }

    // 2. Try fetching tools.json (for dynamic server/GitHub Pages updates)
    try {
      const res = await fetch('./tools.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          allTools = data;
        }
      }
    } catch (e) {
      // Offline file:// protocol fallback is already loaded
    }

    renderCategoryFilters();
    renderTools();
  }

  function renderCategoryFilters() {
    if (!categoryFilters) return;

    const categories = Array.from(new Set(allTools.map(t => t.category))).filter(Boolean);
    
    let html = `<button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">All Tools (${allTools.length})</button>`;
    
    categories.forEach(cat => {
      const count = allTools.filter(t => t.category === cat).length;
      html += `<button class="filter-btn ${currentCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
    });

    categoryFilters.innerHTML = html;
  }

  function filterTools() {
    return allTools.filter(tool => {
      const matchesCategory = currentCategory === 'all' || tool.category === currentCategory;
      if (!matchesCategory) return false;

      if (!searchQuery) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = (tool.title || '').toLowerCase().includes(q);
      const matchShort = (tool.shortTitle || '').toLowerCase().includes(q);
      const matchDesc = (tool.description || '').toLowerCase().includes(q);
      const matchCurriculum = (tool.curriculum || '').toLowerCase().includes(q);
      const matchCategory = (tool.category || '').toLowerCase().includes(q);
      const matchTags = Array.isArray(tool.tags) && tool.tags.some(tag => tag.toLowerCase().includes(q));

      return matchTitle || matchShort || matchDesc || matchCurriculum || matchCategory || matchTags;
    });
  }

  function renderTools() {
    const filtered = filterTools();

    if (toolsCounter) {
      toolsCounter.innerHTML = `Showing <strong>${filtered.length}</strong> of ${allTools.length} educational tools`;
    }

    if (filtered.length === 0) {
      if (toolsGrid) toolsGrid.innerHTML = '';
      if (noResults) noResults.style.display = 'flex';
      return;
    }

    if (noResults) noResults.style.display = 'none';

    const cardsHtml = filtered.map(tool => {
      const tagsHtml = (tool.tags || [])
        .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join('');

      return `
        <article class="tool-card" data-id="${escapeHtml(tool.id)}">
          <div class="tool-card-top">
            <div class="tool-card-icon">
              ${tool.icon || '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>'}
            </div>
            <div class="tool-card-badges">
              <span class="badge badge-primary">${escapeHtml(tool.category)}</span>
              ${tool.badge ? `<span class="badge badge-secondary">${escapeHtml(tool.badge)}</span>` : ''}
            </div>
          </div>

          <div class="tool-card-body">
            <h2 class="tool-card-title">${escapeHtml(tool.title)}</h2>
            ${tool.curriculum ? `<div class="tool-card-curriculum">${escapeHtml(tool.curriculum)}</div>` : ''}
            <p class="tool-card-desc">${escapeHtml(tool.description)}</p>
            <div class="tool-card-tags">
              ${tagsHtml}
            </div>
          </div>

          <div class="tool-card-footer">
            <a href="${escapeHtml(tool.path)}" class="btn btn-primary btn-launch-tool">
              <span>Launch Studio</span>
              ${ARROW_ICON}
            </a>
          </div>
        </article>
      `;
    }).join('');

    if (toolsGrid) {
      toolsGrid.innerHTML = cardsHtml;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (searchClear) {
        searchClear.style.display = searchQuery ? 'block' : 'none';
      }
      renderTools();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        searchInput.focus();
        renderTools();
      }
    });
  }

  if (categoryFilters) {
    categoryFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn) {
        currentCategory = btn.getAttribute('data-category');
        categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTools();
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      currentCategory = 'all';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.style.display = 'none';
      renderCategoryFilters();
      renderTools();
    });
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', () => {
    loadTools();
    console.info(
      '%c MrByronEdMcK Educational Tools Hub %c\n' +
      'To integrate a new educational tool:\n' +
      ' 1. Create a folder in Tools/<YourToolName>/ with index.html, styles.css, and app.js\n' +
      ' 2. Link ../../shared/css/theme.css and ../../shared/js/theme.js in the head\n' +
      ' 3. Register the metadata in tools.json & shared/js/tools-data.js\n' +
      'Run automated tests anytime at: /tests/index.html or via `python tests/run_tests.py`',
      'background: #4f46e5; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
      'color: inherit;'
    );
  });
})();
