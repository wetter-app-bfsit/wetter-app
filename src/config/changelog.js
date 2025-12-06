/**
 * changelog.js - Changelog-Konfiguration für "Was ist neu" Modal
 *
 * ANLEITUNG ZUM BEARBEITEN:
 * -------------------------
 * 1. Um eine neue Version hinzuzufügen, füge ein neues Objekt am ANFANG des CHANGELOG Arrays hinzu
 * 2. Die neueste Version sollte immer zuerst stehen
 * 3. Jede Version hat: version, date, isLatest (nur bei der neuesten true), title, und changes Array
 * 4. Jeder change hat: emoji, type (Added/Fixed/Changed/Removed), und text
 *
 * Beispiel zum Hinzufügen einer neuen Version:
 * {
 *   version: "1.1.0",
 *   date: "2025-01-15",
 *   isLatest: true,  // Setze isLatest bei der vorherigen Version auf false!
 *   title: "Neues Feature Release",
 *   changes: [
 *     { emoji: "✨", type: "Added", text: "Neue Funktion XY" },
 *     { emoji: "🐛", type: "Fixed", text: "Bug in Feature Z behoben" }
 *   ]
 * }
 */

(function (global) {
  // App Version - Ändere diese Zeile für neue Releases
  const APP_VERSION = "1.0.0";

  // Changelog Einträge - Neueste Version zuerst!
  const CHANGELOG = [
    {
      version: "1.0.0",
      date: "27.01.2026",
      isLatest: true,
      title: "🎉 Erster offizieller Release von Calchas - BFS-IT OpenDay 2026",
      changes: [
        {
          emoji: "🌤️",
          type: "Added",
          text: "Aktuelle Wetterdaten mit Open-Meteo & BrightSky & mehr",
        },
        { emoji: "📍", type: "Added", text: "Standortbasierte Wetterabfrage" },
        {
          emoji: "⭐",
          type: "Added",
          text: "Favoriten und Heimatort-Funktion",
        },
        {
          emoji: "🗺️",
          type: "Added",
          text: "Interaktive Wetterkarte mit Radar",
        },
        {
          emoji: "📊",
          type: "Added",
          text: "7-Tage Vorhersage mit Detailansicht",
        },
        {
          emoji: "🌡️",
          type: "Added",
          text: "Anpassbare Einheiten (Temperatur, Wind, etc.)",
        },
        { emoji: "🎨",
          type: "Added",
          text: "Dunkles & helles Theme" },
        {
          emoji: "🌍",
          type: "Added",
          text: "Deutsch & Englisch Sprachunterstützung",
        },
        {
          emoji: "💾",
          type: "Added",
          text: "Offline-Caching der letzten Wetterdaten",
        },
        {
          emoji: "📊",
          type: "Added",
          text: "Historische Wetterdaten Ansicht + Statistiken",
        },
        {
          emoji: "♥️",
          type: "Added",
          text: "Helth - Gesundheitsbezogene Wetterinformationen",
        },
        {
          emoji: "📰",
          type: "Added",
          text: "Einsichten und Tagesübersicht",
        },
        {
          emoji: "🌿",
          type: "Added",
          text: "Pollenflug und Informationen",
        },
        {
          emoji: "🏞️",
          type: "Added",
          text: "Dynamische Landschaften basierend auf Wetter",
        },
      ],
    },
    // Füge hier zukünftige Versionen hinzu (über diesem Kommentar)
    // Vergiss nicht isLatest: false bei der alten Version zu setzen!
  ];

  // Exportiere für globalen Zugriff
  global.APP_VERSION = APP_VERSION;
  global.CHANGELOG = CHANGELOG;

  // Hilfsfunktionen für Changelog-Management
  global.ChangelogManager = {
    getVersion: () => APP_VERSION,
    getChangelog: () => CHANGELOG,
    getLatestChanges: () => CHANGELOG.find((c) => c.isLatest) || CHANGELOG[0],
    getVersionChanges: (version) =>
      CHANGELOG.find((c) => c.version === version),
    getAllVersions: () => CHANGELOG.map((c) => c.version),
  };
})(window);
