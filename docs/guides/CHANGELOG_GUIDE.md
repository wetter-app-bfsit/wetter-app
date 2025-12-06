# Changelog-Verwaltung

Diese Dokumentation erklärt, wie du Neuigkeiten-Nachrichten für das "Was ist neu" Modal bearbeitest.

## Datei-Speicherort

Die Changelog-Konfiguration befindet sich in:

```
src/config/changelog.js
```

## Struktur

Die Datei enthält zwei wichtige Teile:

### 1. App-Version

```javascript
const APP_VERSION = "1.0.0";
```

Ändere diese Zeile für neue Releases.

### 2. Changelog-Array

Das `CHANGELOG` Array enthält alle Versionen. **Die neueste Version steht immer zuerst!**

## Neue Version hinzufügen

### Schritt 1: Öffne `src/config/changelog.js`

### Schritt 2: Ändere `APP_VERSION` auf die neue Versionsnummer

### Schritt 3: Füge einen neuen Eintrag am ANFANG des `CHANGELOG` Arrays hinzu:

```javascript
const CHANGELOG = [
  // NEUE VERSION HIER EINFÜGEN ↓
  {
    version: "1.1.0",
    date: "2025-12-15",
    isLatest: true,  // NUR bei der neuesten Version true!
    title: "🎉 Neues Feature Release",
    changes: [
      { emoji: "✨", type: "Added", text: "Neue Funktion XY hinzugefügt" },
      { emoji: "🐛", type: "Fixed", text: "Bug in Feature Z behoben" },
      { emoji: "🔄", type: "Changed", text: "Verhalten von ABC geändert" },
      { emoji: "🗑️", type: "Removed", text: "Veraltete Funktion entfernt" }
    ]
  },
  // Vorherige Version - setze isLatest auf false!
  {
    version: "1.0.0",
    date: "2025-12-07",
    isLatest: false,  // ← Auf false setzen!
    title: "🎉 Erster Release",
    changes: [...]
  }
];
```

### Schritt 4: Setze `isLatest: false` bei der vorherigen Version

## Felder erklärt

| Feld       | Beschreibung                  | Beispiel             |
| ---------- | ----------------------------- | -------------------- |
| `version`  | Versionsnummer                | `"1.2.0"`            |
| `date`     | Datum (YYYY-MM-DD)            | `"2025-12-15"`       |
| `isLatest` | Ist dies die neueste Version? | `true` oder `false`  |
| `title`    | Titel mit Emoji               | `"🎉 Großes Update"` |
| `changes`  | Array mit Änderungen          | Siehe unten          |

## Change-Typen

| Type      | Bedeutung       | Empfohlene Emojis |
| --------- | --------------- | ----------------- |
| `Added`   | Neue Funktionen | ✨ 🚀 📍 🎨       |
| `Fixed`   | Bugfixes        | 🐛 🔧 🩹          |
| `Changed` | Änderungen      | 🔄 ♻️ 📝          |
| `Removed` | Entferntes      | 🗑️ ❌             |

## Beispiel: Vollständiger Eintrag

```javascript
{
  version: "1.2.0",
  date: "2025-12-20",
  isLatest: true,
  title: "🌟 Weihnachts-Update",
  changes: [
    { emoji: "❄️", type: "Added", text: "Winterliches Theme hinzugefügt" },
    { emoji: "🎄", type: "Added", text: "Festliche Animationen" },
    { emoji: "🐛", type: "Fixed", text: "Ladezeiten verbessert" },
    { emoji: "🔄", type: "Changed", text: "Neues Icon-Design" }
  ]
}
```

## Tipps

1. **Chronologisch**: Neueste Version immer zuerst
2. **Emojis**: Machen die Einträge lesbarer
3. **Kurz & knapp**: Jeder Change sollte in einem Satz erklärbar sein
4. **Konsistenz**: Verwende ähnliche Formulierungen
5. **Testen**: Nach Änderungen in der App prüfen

## Programmatischer Zugriff

Falls du im Code auf die Changelog-Daten zugreifen möchtest:

```javascript
// Aktuelle Version
const version = window.APP_VERSION;

// Neueste Änderungen
const latest = window.ChangelogManager.getLatestChanges();

// Alle Versionen
const allVersions = window.ChangelogManager.getAllVersions();

// Änderungen einer bestimmten Version
const v1Changes = window.ChangelogManager.getVersionChanges("1.0.0");
```
