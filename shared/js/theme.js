/**
 * MrByronEdMcK Educational Tools Hub - Shared Theme Manager
 * Supports Light Theme (Default) and Dark Mode with localStorage persistence.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'mrbyron-theme';
  const DEFAULT_THEME = 'light';

  // SVG Icons
  const SUN_ICON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const MOON_ICON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for theme preference:', e);
    }
    return DEFAULT_THEME;
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    
    if (document.body) {
      document.body.classList.toggle('theme-dark', isDark);
      document.body.classList.toggle('theme-light', !isDark);
      // For backwards compatibility with older network tools using theme-monochrome
      document.body.classList.toggle('theme-monochrome', !isDark);
    }

    updateToggleButtons(theme);

    // Dispatch event so tools (e.g. canvas visualizers) can react
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme, isDark } }));
  }

  function updateToggleButtons(theme) {
    const isDark = theme === 'dark';
    const buttons = document.querySelectorAll('.btn-theme-toggle, #btn-theme-toggle');
    buttons.forEach((btn) => {
      const iconWrap = btn.querySelector('.theme-icon') || btn;
      const textWrap = btn.querySelector('.theme-label');
      
      if (textWrap) {
        textWrap.textContent = isDark ? 'Light' : 'Dark';
      }
      
      const iconSpan = btn.querySelector('#theme-icon');
      if (iconSpan) {
        iconSpan.innerHTML = isDark ? SUN_ICON : MOON_ICON;
      } else if (!textWrap) {
        btn.innerHTML = isDark ? `${SUN_ICON} <span>Light</span>` : `${MOON_ICON} <span>Dark</span>`;
      }
      
      btn.setAttribute('aria-label', isDark ? 'Switch to Light theme' : 'Switch to Dark theme');
      btn.setAttribute('title', isDark ? 'Switch to Light theme' : 'Switch to Dark theme');
    });
  }

  function setTheme(theme) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch (e) {
      console.warn('Unable to save theme preference:', e);
    }
    applyTheme(normalized);
  }

  function toggleTheme() {
    const current = getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  }

  // Initial immediate application to avoid FOUC
  const initialTheme = getSavedTheme();
  document.documentElement.setAttribute('data-theme', initialTheme);

  // Hook up when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getSavedTheme());

    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.btn-theme-toggle, #btn-theme-toggle');
      if (toggleBtn) {
        e.preventDefault();
        toggleTheme();
      }
    });
  });

  // Global API
  window.MrByronTheme = {
    getTheme: getSavedTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    applyTheme: applyTheme,
    isDark: () => getSavedTheme() === 'dark'
  };
})();
