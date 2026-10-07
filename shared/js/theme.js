/**
 * Tools Hub - Shared Theme & Accent Manager
 * Supports Light / Dark mode + 7 User Selectable Accent Themes (matching FlashCards app)
 * Automatically syncs preferences across all tools via localStorage
 */

(function () {
  'use strict';

  const STORAGE_KEY_THEME = 'tools-theme';
  const STORAGE_KEY_LEGACY = 'mrbyron-theme';
  const STORAGE_KEY_ACCENT = 'tools-accent';

  const DEFAULT_THEME = 'light';
  const DEFAULT_ACCENT = 'orange';

  const ACCENTS = [
    { id: 'orange', name: 'Terracotta', color: '#c05638' },
    { id: 'green',  name: 'Sage',       color: '#38734e' },
    { id: 'blue',   name: 'Slate Blue', color: '#366482' },
    { id: 'pink',   name: 'Dusty Rose', color: '#b84e72' },
    { id: 'yellow', name: 'Amber Ochre',color: '#b87320' },
    { id: 'red',    name: 'Brick Red',  color: '#b83a3a' },
    { id: 'purple', name: 'Plum Violet',color: '#7d4e8d' }
  ];

  // SVG Icons
  const SUN_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const MOON_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) || localStorage.getItem(STORAGE_KEY_LEGACY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {
      // Storage access blocked or unavailable
    }
    return DEFAULT_THEME;
  }

  function getSavedAccent() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCENT);
      if (ACCENTS.some(a => a.id === saved)) {
        return saved;
      }
    } catch (e) {
      // Storage access blocked
    }
    return DEFAULT_ACCENT;
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    if (document.body) {
      document.body.classList.toggle('theme-dark', isDark);
      document.body.classList.toggle('theme-light', !isDark);
      // Backwards compatibility for legacy tools
      document.body.classList.toggle('theme-monochrome', !isDark);
    }

    updateToggleButtons(theme);

    // Dispatch event so tools (e.g. canvas visualizers) can react
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { 
        theme, 
        isDark,
        accent: getSavedAccent()
      } 
    }));
  }

  function applyAccent(accent) {
    document.documentElement.setAttribute('data-accent', accent);
    updateAccentUI(accent);

    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { 
        theme: getSavedTheme(), 
        isDark: getSavedTheme() === 'dark',
        accent 
      } 
    }));
  }

  function updateToggleButtons(theme) {
    const isDark = theme === 'dark';
    const buttons = document.querySelectorAll('.btn-theme-toggle, #btn-theme-toggle, #nav-theme-toggle');
    buttons.forEach((btn) => {
      const textWrap = btn.querySelector('.theme-label');
      if (textWrap) {
        textWrap.textContent = isDark ? 'Light' : 'Dark';
      }

      const iconSpan = btn.querySelector('#theme-icon');
      if (iconSpan) {
        iconSpan.innerHTML = isDark ? SUN_ICON : MOON_ICON;
      } else {
        const existingSvg = btn.querySelector('svg');
        if (existingSvg) {
          existingSvg.outerHTML = isDark ? SUN_ICON : MOON_ICON;
        } else if (!textWrap) {
          btn.innerHTML = isDark ? SUN_ICON : MOON_ICON;
        }
      }

      btn.setAttribute('aria-label', isDark ? 'Switch to Light mode' : 'Switch to Dark mode');
      btn.setAttribute('title', isDark ? 'Switch to Light mode' : 'Switch to Dark mode');
    });

    // Sync in modal if present
    const segButtons = document.querySelectorAll('.theme-seg-btn');
    segButtons.forEach(btn => {
      const mode = btn.getAttribute('data-theme-mode');
      btn.classList.toggle('active', mode === theme);
    });
  }

  function updateAccentUI(accent) {
    const radios = document.querySelectorAll('input[name="accent-color"]');
    radios.forEach(radio => {
      radio.checked = (radio.value === accent);
    });
  }

  function setTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY_THEME, normalized);
      localStorage.setItem(STORAGE_KEY_LEGACY, normalized);
    } catch (e) {
      console.warn('Unable to persist theme:', e);
    }
    applyTheme(normalized);
  }

  function setAccent(accent) {
    if (!ACCENTS.some(a => a.id === accent)) return;
    try {
      localStorage.setItem(STORAGE_KEY_ACCENT, accent);
    } catch (e) {
      console.warn('Unable to persist accent:', e);
    }
    applyAccent(accent);
  }

  function toggleTheme() {
    const current = getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  // Settings Modal Creation & Logic
  function ensureSettingsModal() {
    let modal = document.getElementById('settings-modal');
    if (!modal) {
      const currentAccent = getSavedAccent();
      const currentTheme = getSavedTheme();

      const swatchesHtml = ACCENTS.map(a => `
        <label class="accent-swatch-option" title="${a.name}">
          <input type="radio" name="accent-color" value="${a.id}" ${a.id === currentAccent ? 'checked' : ''}>
          <span class="accent-swatch" style="--swatch-color: ${a.color};"></span>
          <span class="accent-swatch-label">${a.name}</span>
        </label>
      `).join('');

      modal = document.createElement('div');
      modal.id = 'settings-modal';
      modal.className = 'modal-overlay';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-card">
          <div class="modal-header">
            <h2>Appearance Settings</h2>
            <button class="btn-close" id="btn-close-settings" aria-label="Close settings">&times;</button>
          </div>
          <div class="modal-body">
            <div class="setting-row">
              <span class="setting-title">Color Mode</span>
              <span class="setting-sub">Choose warm light stationery or high-contrast night study</span>
              <div class="theme-segmented-control" style="margin-top: 0.5rem;">
                <button class="theme-seg-btn ${currentTheme === 'light' ? 'active' : ''}" data-theme-mode="light">
                  ${SUN_ICON} Light Mode
                </button>
                <button class="theme-seg-btn ${currentTheme === 'dark' ? 'active' : ''}" data-theme-mode="dark">
                  ${MOON_ICON} Dark Mode
                </button>
              </div>
            </div>

            <div class="setting-row" style="margin-top: 0.5rem;">
              <span class="setting-title">Accent Theme</span>
              <span class="setting-sub">Select an earthy accent tone applied across all tools</span>
              <div class="accent-color-picker" id="accent-swatches-container">
                ${swatchesHtml}
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Event bindings inside modal
      modal.querySelector('#btn-close-settings').addEventListener('click', () => {
        closeSettingsModal();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeSettingsModal();
        }
      });

      modal.querySelectorAll('.theme-seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-theme-mode');
          setTheme(mode);
        });
      });

      modal.querySelectorAll('input[name="accent-color"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          setAccent(e.target.value);
        });
      });
    }
    return modal;
  }

  function openSettingsModal() {
    const modal = ensureSettingsModal();
    updateToggleButtons(getSavedTheme());
    updateAccentUI(getSavedAccent());
    modal.style.display = 'flex';
  }

  function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Check for URL query parameter overrides (e.g. ?theme=dark&accent=blue)
  let initialTheme = getSavedTheme();
  let initialAccent = getSavedAccent();
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTheme = urlParams.get('theme');
    const urlAccent = urlParams.get('accent');
    if (urlTheme === 'dark' || urlTheme === 'light') {
      initialTheme = urlTheme;
      localStorage.setItem(STORAGE_KEY_THEME, urlTheme);
      localStorage.setItem(STORAGE_KEY_LEGACY, urlTheme);
    }
    if (urlAccent && ACCENTS.some(a => a.id === urlAccent)) {
      initialAccent = urlAccent;
      localStorage.setItem(STORAGE_KEY_ACCENT, urlAccent);
    }
  } catch (e) {
    // Ignore URL parse or storage errors
  }

  // Immediate early initialisation to prevent FOUC
  document.documentElement.setAttribute('data-theme', initialTheme);
  document.documentElement.setAttribute('data-accent', initialAccent);

  // Hook up event listeners on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(initialTheme);
    applyAccent(initialAccent);

    // Theme toggle button clicks
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.btn-theme-toggle, #btn-theme-toggle, #nav-theme-toggle');
      if (toggleBtn) {
        e.preventDefault();
        toggleTheme();
        return;
      }

      const settingsBtn = e.target.closest('#btn-settings-toggle, #nav-btn-settings, .btn-settings');
      if (settingsBtn) {
        e.preventDefault();
        openSettingsModal();
        return;
      }
    });

    // Keyboard support for ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSettingsModal();
      }
    });
  });

  // Global APIs
  const api = {
    getTheme: getSavedTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    getAccent: getSavedAccent,
    setAccent: setAccent,
    applyTheme: applyTheme,
    applyAccent: applyAccent,
    isDark: () => getSavedTheme() === 'dark',
    openSettings: openSettingsModal,
    closeSettings: closeSettingsModal,
    accents: ACCENTS
  };

  window.ToolsTheme = api;
  // Backward compatibility alias for existing code & unit tests
  window.MrByronTheme = api;
})();
