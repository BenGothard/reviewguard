(function(){
  const STORAGE_KEYS = {
    config: 'reviewguard:config',
    email: 'reviewguard:email',
    rateLimit: 'reviewguard:lastFeedback',
    inbox: 'reviewguard:inbox',
    theme: 'reviewguard:theme'
  };

  function base64UrlEncode(obj) {
    const json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function base64UrlDecode(str) {
    try {
      const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
      const normalized = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
      const json = decodeURIComponent(escape(atob(normalized)));
      return JSON.parse(json);
    } catch (err) {
      console.warn('Unable to decode payload', err);
      return null;
    }
  }

  function escapeHTML(str = '') {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function loadStoredConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.config);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function loadEmailConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.email);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
  }

  function saveEmailConfig(config) {
    localStorage.setItem(STORAGE_KEYS.email, JSON.stringify(config));
  }

  function clearConfig() {
    localStorage.removeItem(STORAGE_KEYS.config);
    localStorage.removeItem(STORAGE_KEYS.email);
  }

  function loadInbox() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.inbox);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveInbox(entries) {
    localStorage.setItem(STORAGE_KEYS.inbox, JSON.stringify(entries));
  }

  function addToInbox(payload) {
    const entries = loadInbox();
    entries.unshift(payload);
    saveInbox(entries);
  }

  function clearInbox() {
    localStorage.removeItem(STORAGE_KEYS.inbox);
  }

  function parseConfigFromQuery() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('p')) {
      const decoded = base64UrlDecode(params.get('p'));
      if (decoded && decoded.b && decoded.g) {
        return {
          b: decoded.b,
          g: decoded.g,
          e: decoded.e || '',
          t: decoded.t || '',
          l: decoded.l || ''
        };
      }
    }
    const b = params.get('b');
    const g = params.get('g');
    const e = params.get('e');
    if (b && g) {
      return {
        b: decodeURIComponent(b),
        g: decodeURIComponent(g),
        e: e ? decodeURIComponent(e) : '',
        t: params.get('t') ? decodeURIComponent(params.get('t')) : '',
        l: params.get('l') ? decodeURIComponent(params.get('l')) : ''
      };
    }
    return null;
  }

  function getActiveConfig() {
    const fromQuery = parseConfigFromQuery();
    if (fromQuery) return fromQuery;
    return loadStoredConfig();
  }

  function getThankYouMessage(config) {
    return config?.t || 'Thanks for your feedback.';
  }

  function isValidUrl(value) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  function isValidEmail(value) {
    return /\S+@\S+\.\S+/.test(value);
  }

  function rateLimitOkay() {
    const now = Date.now();
    const last = sessionStorage.getItem(STORAGE_KEYS.rateLimit);
    if (last && now - Number(last) < 30000) {
      return false;
    }
    sessionStorage.setItem(STORAGE_KEYS.rateLimit, String(now));
    return true;
  }

  function storeFeedback(payload, onStatus) {
    try {
      addToInbox(payload);
      onStatus(true, 'Saved privately on this device.');
    } catch (err) {
      console.warn('Unable to store feedback', err);
      onStatus(false, 'Unable to save feedback right now.');
    }
  }

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEYS.theme, next);
    applyTheme(next);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function initTheme() {
    applyTheme(getPreferredTheme());
  }

  window.ReviewGuard = {
    STORAGE_KEYS,
    base64UrlEncode,
    base64UrlDecode,
    escapeHTML,
    loadStoredConfig,
    saveConfig,
    clearConfig,
    getActiveConfig,
    isValidUrl,
    isValidEmail,
    getThankYouMessage,
    rateLimitOkay,
    storeFeedback,
    loadEmailConfig,
    saveEmailConfig,
    loadInbox,
    clearInbox,
    applyTheme,
    toggleTheme,
    setTheme,
    initTheme,
    STORAGE_KEYS
  };

  initTheme();
})();
