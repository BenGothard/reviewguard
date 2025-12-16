(function(){
  const STORAGE_KEYS = {
    config: 'reviewguard:config',
    email: 'reviewguard:email',
    rateLimit: 'reviewguard:lastFeedback'
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

  function parseConfigFromQuery() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('p')) {
      const decoded = base64UrlDecode(params.get('p'));
      if (decoded && decoded.b && decoded.g && decoded.e) return decoded;
    }
    const b = params.get('b');
    const g = params.get('g');
    const e = params.get('e');
    if (b && g && e) {
      return {
        b: decodeURIComponent(b),
        g: decodeURIComponent(g),
        e: decodeURIComponent(e),
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

  function sendFeedbackEmail(payload, onStatus) {
    const emailConfig = loadEmailConfig();
    if (!emailConfig || !emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
      onStatus(false, 'Email is not configured. Add EmailJS keys in the admin page.');
      return;
    }

    if (!window.emailjs) {
      onStatus(false, 'Email service unavailable. Check your connection.');
      return;
    }

    try {
      window.emailjs.init(emailConfig.publicKey);
    } catch (err) {
      console.warn('emailjs init failed', err);
      onStatus(false, 'Unable to initialize email. Check your public key.');
      return;
    }

    const templateParams = {
      business_name: payload.businessName,
      rating: payload.rating,
      feedback: payload.feedback,
      customer_name: payload.name,
      customer_phone: payload.phone,
      customer_email: payload.email,
      notification_email: payload.notificationEmail,
      page_url: payload.pageUrl,
      submitted_at: payload.timestamp
    };

    window.emailjs.send(emailConfig.serviceId, emailConfig.templateId, templateParams)
      .then(() => onStatus(true))
      .catch((err) => {
        console.warn('email send failed', err);
        onStatus(false, 'Could not send email. Verify your EmailJS settings.');
      });
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
    sendFeedbackEmail,
    loadEmailConfig,
    saveEmailConfig
  };
})();
