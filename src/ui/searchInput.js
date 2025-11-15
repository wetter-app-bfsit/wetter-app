/* Stadt-Suche Component */

class SearchInputComponent {
  constructor(inputSelector, buttonSelector, recentListSelector) {
    this.input = document.querySelector(inputSelector);
    this.button = document.querySelector(buttonSelector);
    this.recentList = document.querySelector(recentListSelector);
    this.recentCities = this._loadRecentCities();

    this._setupEventListeners();
    this._renderRecentCities();
  }

  /**
   * Setup Event-Listener
   * @private
   */
  _setupEventListeners() {
    // Enter-Taste
    this.input?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.onSearch();
      }
    });

    // Button-Click
    this.button?.addEventListener("click", () => this.onSearch());

    // Input-Änderungen (für Auto-Complete später)
    this.input?.addEventListener("input", (e) => {
      this._handleInputChange(e.target.value);
    });
  }

  /**
   * Holt und validiert Search-Input
   * @returns {object} - {valid: boolean, value: string, error: string|null}
   */
  getSearchInput() {
    const value = this.input?.value || "";

    // Sanitize
    const sanitized = sanitizeInput(value);

    // Validiere
    const validation = validateCityInput(sanitized);

    if (!validation.valid) {
      return {
        valid: false,
        value: sanitized,
        error: validation.error,
      };
    }

    return {
      valid: true,
      value: sanitized,
      error: null,
    };
  }

  /**
   * Search triggern (wird vom Parent überschrieben)
   */
  onSearch() {
    const input = this.getSearchInput();

    if (!input.valid) {
      showError(input.error);
      return;
    }

    // Füge zu Recent hinzu
    this._addToRecentCities(input.value);

    // Trigger Event
    const event = new CustomEvent("search", {
      detail: { city: input.value },
    });
    window.dispatchEvent(event);
  }

  /**
   * Behandelt Input-Änderungen
   * @private
   */
  _handleInputChange(value) {
    if (value.length === 0) {
      this._showRecentCities();
      return;
    }

    // Hier könnte Auto-Complete implementiert werden
    console.log("Auto-Complete für:", value);
  }

  /**
   * Zeigt zuletzt gesuchte Städte
   * @private
   */
  _showRecentCities() {
    this._renderRecentCities();
  }

  /**
   * Fügt Stadt zu Recent-Liste hinzu
   * @private
   */
  _addToRecentCities(city) {
    // Entferne falls schon vorhanden
    this.recentCities = this.recentCities.filter(
      (c) => c.toLowerCase() !== city.toLowerCase()
    );

    // Füge am Anfang ein
    this.recentCities.unshift(city);

    // Begrenzte auf MAX_RECENT_CITIES
    this.recentCities = this.recentCities.slice(0, UI_CONFIG.MAX_RECENT_CITIES);

    // Speichere
    this._saveRecentCities();
  }

  /**
   * Rendert Recent-Städte-Liste
   * @private
   */
  _renderRecentCities() {
    if (!this.recentList) return;

    if (this.recentCities.length === 0) {
      this.recentList.innerHTML =
        '<p class="text-muted">Keine zuletzt gesuchten Orte</p>';
      return;
    }

    this.recentList.innerHTML = `
      <div class="recent-header">
        <span>🕐 Zuletzt gesucht</span>
        <button class="btn-small" onclick="window.searchComponent.clearRecent()">✕ Löschen</button>
      </div>
      <div class="recent-items">
        ${this.recentCities
          .map(
            (city, idx) => `
          <div class="recent-item" data-city="${city}">
            <span>${city}</span>
            <button class="btn-remove" data-idx="${idx}">✕</button>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    // Event-Listener für Recent-Items
    this.recentList.querySelectorAll(".recent-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.classList.contains("btn-remove")) {
          this.input.value = item.dataset.city;
          this.onSearch();
        }
      });
    });

    // Event-Listener für Remove-Buttons
    this.recentList.querySelectorAll(".btn-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._removeFromRecentCities(parseInt(btn.dataset.idx));
      });
    });
  }

  /**
   * Entfernt eine Stadt aus Recent
   * @private
   */
  _removeFromRecentCities(index) {
    this.recentCities.splice(index, 1);
    this._saveRecentCities();
    this._renderRecentCities();
  }

  /**
   * Löscht alle Recent-Städte
   */
  clearRecent() {
    const removedCount = this.recentCities.length;
    this.recentCities = [];
    this._saveRecentCities();
    this._renderRecentCities();
    if (
      removedCount > 0 &&
      typeof window !== "undefined" &&
      window.logAnalyticsEvent
    ) {
      window.logAnalyticsEvent("settings_action", {
        action: "clear_recent",
        removedCount,
      });
    }
    return removedCount > 0;
  }

  /**
   * Lädt Recent-Städte aus localStorage
   * @private
   */
  _loadRecentCities() {
    try {
      const stored = localStorage.getItem("wetter_recent_cities");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("Fehler beim Laden von Recent-Städten:", e);
      return [];
    }
  }

  /**
   * Speichert Recent-Städte in localStorage
   * @private
   */
  _saveRecentCities() {
    try {
      localStorage.setItem(
        "wetter_recent_cities",
        JSON.stringify(this.recentCities)
      );
    } catch (e) {
      console.warn("Fehler beim Speichern von Recent-Städten:", e);
    }
  }

  /**
   * Setzt Input zurück
   */
  clear() {
    this.input.value = "";
    this.input.focus();
  }

  /**
   * Aktiviert/Deaktiviert das Input
   */
  setEnabled(enabled) {
    this.input.disabled = !enabled;
    this.button.disabled = !enabled;
  }

  /**
   * Zeigt Loading-State
   */
  setLoading(loading) {
    if (loading) {
      this.button.textContent = "⏳ Laden...";
      this.button.disabled = true;
      this.input.disabled = true;
    } else {
      this.button.textContent = "🔍 Suchen";
      this.button.disabled = false;
      this.input.disabled = false;
    }
  }
}
