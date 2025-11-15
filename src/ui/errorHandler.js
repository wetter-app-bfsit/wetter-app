/* Error-Messages Handling Component */

class ErrorHandler {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.errorStack = [];
    this.autoHideTimeout = UI_CONFIG.ERROR_DISPLAY_TIME;
  }

  /**
   * Zeigt Error an
   * @param {string} message - Error-Meldung
   * @param {string} type - Error-Type (error, warning, info)
   * @param {number} duration - Auto-Hide Dauer in ms (null = manual)
   */
  show(message, type = 'error', duration = null) {
    if (!this.container) return;

    const errorId = `error_${Date.now()}`;
    const displayDuration = duration || this.autoHideTimeout;

    // Erstelle Error-Element
    const errorEl = document.createElement('div');
    errorEl.className = `error-alert error-${type}`;
    errorEl.id = errorId;
    errorEl.innerHTML = `
      <div class="error-content">
        <span class="error-icon">${this._getIcon(type)}</span>
        <span class="error-message">${this._escapeHtml(message)}</span>
        <button class="error-close" data-error-id="${errorId}">✕</button>
      </div>
    `;

    // Füge zum Container hinzu
    this.container.appendChild(errorEl);
    this.errorStack.push(errorId);

    // Animation
    setTimeout(() => errorEl.classList.add('show'), 10);

    // Close-Button Event
    errorEl.querySelector('.error-close').addEventListener('click', () => {
      this.hide(errorId);
    });

    // Auto-Hide
    if (displayDuration > 0) {
      setTimeout(() => this.hide(errorId), displayDuration);
    }

    return errorId;
  }

  /**
   * Versteckt Error
   * @param {string} errorId - Error-Element ID
   */
  hide(errorId) {
    const errorEl = document.getElementById(errorId);
    if (!errorEl) return;

    errorEl.classList.remove('show');
    setTimeout(() => {
      errorEl.remove();
      this.errorStack = this.errorStack.filter(id => id !== errorId);
    }, 300);
  }

  /**
   * Zeigt Error-Benachrichtigung
   */
  showError(message, duration) {
    return this.show(message, 'error', duration);
  }

  /**
   * Zeigt Warning-Benachrichtigung
   */
  showWarning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Zeigt Info-Benachrichtigung
   */
  showInfo(message, duration) {
    return this.show(message, 'info', duration);
  }

  /**
   * Zeigt Success-Benachrichtigung
   */
  showSuccess(message, duration) {
    return this.show(message, 'success', duration);
  }

  /**
   * Zeigt API-spezifischen Error mit Details
   */
  showApiError(apiSource, errorMessage) {
    const message = `
      <strong>${apiSource} Fehler:</strong><br>
      ${errorMessage}
    `;
    return this.showError(message);
  }

  /**
   * Zeigt Error mit Retry-Button
   */
  showWithRetry(message, onRetry) {
    if (!this.container) return;

    const errorId = `error_${Date.now()}`;
    const errorEl = document.createElement('div');
    errorEl.className = 'error-alert error-error';
    errorEl.id = errorId;
    errorEl.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${this._escapeHtml(message)}</span>
        <div class="error-actions">
          <button class="btn-retry" data-error-id="${errorId}">🔄 Erneut versuchen</button>
          <button class="error-close" data-error-id="${errorId}">✕</button>
        </div>
      </div>
    `;

    this.container.appendChild(errorEl);
    this.errorStack.push(errorId);

    setTimeout(() => errorEl.classList.add('show'), 10);

    // Retry Button
    errorEl.querySelector('.btn-retry').addEventListener('click', () => {
      this.hide(errorId);
      onRetry();
    });

    // Close Button
    errorEl.querySelector('.error-close').addEventListener('click', () => {
      this.hide(errorId);
    });

    return errorId;
  }

  /**
   * Zeigt mehrzeiligen Error
   */
  showDetailed(title, details, errorCode = null) {
    let message = `<strong>${title}</strong>`;
    
    if (details) {
      message += `<br><small>${details}</small>`;
    }
    
    if (errorCode) {
      message += `<br><code style="font-size: 0.8em; opacity: 0.7;">Code: ${errorCode}</code>`;
    }

    return this.showError(message, null); // Manual dismiss
  }

  /**
   * Löscht alle Errors
   */
  clearAll() {
    this.errorStack.forEach(errorId => {
      const el = document.getElementById(errorId);
      if (el) el.remove();
    });
    this.errorStack = [];
  }

  /**
   * Gibt Icon basierend auf Type zurück
   * @private
   */
  _getIcon(type) {
    const icons = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || '🔔';
  }

  /**
   * HTML-Escape für Sicherheit
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Gibt Anzahl aktiver Errors
   */
  getErrorCount() {
    return this.errorStack.length;
  }

  /**
   * Setzt Auto-Hide Timeout
   */
  setAutoHideTimeout(ms) {
    this.autoHideTimeout = ms;
  }
}

/**
 * Globale Error-Handler Instanz
 */
let errorHandler;

/**
 * Initialisiert Error-Handler (wird in app.js aufgerufen)
 */
function initErrorHandler(containerSelector = '#error-container') {
  errorHandler = new ErrorHandler(containerSelector);
  return errorHandler;
}

/**
 * Shortcut-Funktionen
 */
function showError(message, duration) {
  return errorHandler?.showError(message, duration);
}

function showWarning(message, duration) {
  return errorHandler?.showWarning(message, duration);
}

function showInfo(message, duration) {
  return errorHandler?.showInfo(message, duration);
}

function showSuccess(message, duration) {
  return errorHandler?.showSuccess(message, duration);
}