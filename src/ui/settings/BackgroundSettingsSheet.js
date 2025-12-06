/**
 * BackgroundSettingsSheet.js - Hintergrundaktualisierungen & Systemhinweise
 */
(function (global) {
  const STORAGE_KEYS = {
    notifications: "wetter_notifications_allowed",
    releaseNotes: "wetter_release_notes_toast",
    refresh: "wetter_refresh_interval",
  };

  const INTERVALS = [
    { value: "off", label: "Aus" },
    { value: "0.5h", label: "30 Minuten" },
    { value: "1h", label: "1 Stunde" },
    { value: "1.5h", label: "1.5 Stunden" },
    { value: "3h", label: "3 Stunden" },
  ];

  function readBool(key, fallback = false) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return raw === "true" || raw === true;
    } catch (e) {
      return fallback;
    }
  }

  function renderBackgroundSheet(appState) {
    const container = document.getElementById("settings-background-body");
    if (!container) return;

    const notificationsAllowed = readBool(STORAGE_KEYS.notifications, false);
    const releaseNotesToast = readBool(STORAGE_KEYS.releaseNotes, true);
    const refreshValue =
      appState?.backgroundRefresh ||
      localStorage.getItem(STORAGE_KEYS.refresh) ||
      "off";

    container.innerHTML = `
      <div class="background-settings">
        <div class="background-card background-card--alert">
          <div>
            <p class="background-card__title">Erlaube Benachrichtigungen</p>
            <p class="background-card__subtitle">Benachrichtigungen werden für Hintergrundaktualisierungen benötigt</p>
          </div>
          <button type="button" class="pill-switch" data-action="toggle-notifications" aria-pressed="${notificationsAllowed}">
            <span class="pill-switch__knob"></span>
          </button>
        </div>

        <div class="background-card background-card--primary">
          <div>
            <p class="background-card__title">Aktualisierungen im Hintergrund</p>
            <p class="background-card__subtitle">Widget-Updates und geplante Checks</p>
          </div>
          <button type="button" class="pill-switch" data-action="toggle-refresh" aria-pressed="${
            refreshValue !== "off"
          }">
            <span class="pill-switch__knob"></span>
          </button>
        </div>

        <div class="background-section">
          <p class="background-section__title">Sonstige</p>
          <div class="background-list">
            <div class="background-list__row">
              <span>
                <span class="background-list__title">Aktualisierungsintervall</span>
                <span class="background-list__subtitle">${formatInterval(
                  refreshValue
                )}</span>
              </span>
            </div>
            <div class="background-intervals">
              ${INTERVALS.map(
                (opt) => `
                  <button type="button" class="chip ${
                    refreshValue === opt.value ? "chip--active" : ""
                  }" data-refresh-value="${opt.value}">${opt.label}</button>
                `
              ).join("")}
            </div>

            <div class="background-list__row background-list__row--warning">
              <div>
                <span class="background-list__title">Akkuoptimierungen deaktivieren</span>
                <span class="background-list__subtitle">Damit Hintergrundaktualisierungen funktionieren, muss die Akkuoptimierung deaktiviert werden.</span>
              </div>
              <span class="background-list__chevron">›</span>
            </div>

            <div class="background-list__row">
              <div>
                <span class="background-list__title">Kurze Nachricht anzeigen, wenn eine neue Version veröffentlicht wird</span>
              </div>
              <button type="button" class="pill-switch" data-action="toggle-release-notes" aria-pressed="${releaseNotesToast}">
                <span class="pill-switch__knob"></span>
              </button>
            </div>

            <div class="background-list__row">
              <div>
                <span class="background-list__title">Funktionieren die Aktualisierungen im Hintergrund nicht?</span>
                <span class="background-list__subtitle">Manche Anbieter beschränken Anwendungen im Hintergrund. Prüfe dontkillmyapp.com.</span>
              </div>
              <span class="background-list__chevron">›</span>
            </div>
          </div>
        </div>
      </div>
    `;

    wireEvents(container, appState);
  }

  function wireEvents(container, appState) {
    const toggle = (btn, active) => {
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.classList.toggle("pill-switch--on", !!active);
    };

    container
      .querySelectorAll(".pill-switch")
      .forEach((btn) =>
        toggle(btn, btn.getAttribute("aria-pressed") === "true")
      );

    const notifBtn = container.querySelector(
      '[data-action="toggle-notifications"]'
    );
    if (notifBtn) {
      notifBtn.addEventListener("click", () => {
        const next = !(notifBtn.getAttribute("aria-pressed") === "true");
        toggle(notifBtn, next);
        try {
          localStorage.setItem(STORAGE_KEYS.notifications, String(next));
        } catch (e) {}
      });
    }

    const refreshBtn = container.querySelector(
      '[data-action="toggle-refresh"]'
    );
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        const current = refreshBtn.getAttribute("aria-pressed") === "true";
        const next = !current;
        const nextValue = next ? "1.5h" : "off";
        toggle(refreshBtn, next);
        persistRefresh(appState, nextValue);
        renderBackgroundSheet(appState);
      });
    }

    container.querySelectorAll("[data-refresh-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.getAttribute("data-refresh-value") || "off";
        persistRefresh(appState, value);
        renderBackgroundSheet(appState);
      });
    });

    const releaseBtn = container.querySelector(
      '[data-action="toggle-release-notes"]'
    );
    if (releaseBtn) {
      releaseBtn.addEventListener("click", () => {
        const next = !(releaseBtn.getAttribute("aria-pressed") === "true");
        toggle(releaseBtn, next);
        try {
          localStorage.setItem(STORAGE_KEYS.releaseNotes, String(next));
        } catch (e) {}
      });
    }
  }

  function persistRefresh(appState, value) {
    if (!value) return;
    if (appState?.setBackgroundRefresh) {
      appState.setBackgroundRefresh(value);
    } else {
      try {
        localStorage.setItem(STORAGE_KEYS.refresh, value);
      } catch (e) {}
    }
  }

  function formatInterval(value) {
    const match = INTERVALS.find((opt) => opt.value === value);
    return match ? match.label : "Aus";
  }

  global.BackgroundSettingsSheet = { renderBackgroundSheet };
})(window);
