# Wetter-App Redesign – Gesamtplan

## 1. Gesamtziel der App

- Mobile-first PWA, die sich wie eine native Android-Wetter-App anfühlt.
- Klare, intuitive Informationshierarchie mit Fokus auf „Jetzt“ und „Heute“.
- Stilistisch an der Google-Wetter-App und Material-You orientiert.
- Minimalistisch, lesbar, nicht überladen; keine Desktop-Layouts.
- Alle UI-Elemente konsistent skalierend, einhändig gut bedienbar.
- Funktional vollständig: aktuelles Wetter, Vorhersagen, Karten, Historie, Health & Safety, Settings.

---

## 2. Informationsarchitektur & Screens

### 2.1 Haupt-Screens (logische Views)

1. **Home (Heute)**

   - Hero-Bereich für aktuelles Wetter.
   - Einsichten & Tagesübersicht.
   - Stündliche Vorhersage.
   - Nächste Tage.
   - Metrik-Karten (Niederschlag, Wind, UV, AQI, Sichtweite, Sonne/Wolken, Temperaturverlauf).
   - Health-&-Safety-Vorschau.
   - Karten-/Historie-Previews.

2. **HealthSafetyView**

   - Kontextbasierte Empfehlungen zu Regenschirm, Draußen, Kleidung, Fahrsicherheit, Hitze, UV.
   - Microcharts (z.B. Draußen-Score pro Stunde).
   - Optional Pollen-Infos.

3. **RadarView (Karten)**

   - Vollbildähnliche Kartenansicht mit Radar und Layern.
   - Floating Controls (Zoom, Standort, Layer-Button).
   - Bottom-Sheet für Layer-Auswahl.
   - Timeline/Playback für Radar.

4. **HistoryView (Historische Daten)**

   - Scrollbare Ansicht mit Temperatur-/Niederschlags-Verlauf.
   - Zeitauswahl: Tag / Woche / Monat.
   - Text-Insights (wärmster Monat etc.).

5. **SettingsHome**
   - Übergeordnete Einstellungsübersicht.
   - Sub-Sheets für Theme, Einheiten, Sprache, Standorte, Datenschutz & APIs.

### 2.2 Navigation

- **Primär**: Scrollbare Home-Seite mit Sektionen.
- **Sekundär**: Bottom-Navigation mit 3–4 Tabs:
  - Heute (Home)
  - Karten (RadarView)
  - Health (HealthSafetyView)
  - Einstellungen (SettingsHome)
- Kein komplexer Router – Views sind Sections, die ein-/ausgeblendet werden.

---

## 3. Home-Screen im Detail

### 3.1 AppBar (Top-Bar)

- Links: Standort-Icon + Ortsname.
- Rechts: Settings-Icon.
- Unterzeile: „Aktualisiert vor X Min“ oder „Gerade aktualisiert“.
- Sticky, halbtransparent mit Blur.

### 3.2 WeatherHero

- Sehr große aktuelle Temperatur.
- Wetter-Icon im Google-Stil.
- Kurzbeschreibung (z.B. „Bedeckt“).
- Feels-like („Gefühlt 0°“).
- Tagesband: High/Low, optionale Regenwahrscheinlichkeit.
- Chips: Luftfeuchtigkeit, Wind (Speed + Einheiten), UV.
- Optionaler „Frosch“-/Illustrationsbereich unter den Werten.

### 3.3 Card-Gruppe „Einsichten & Tagesübersicht“

- **Einsichten-Card**
  - Titel „Einsichten“.
  - 2–3 dynamische Sätze (Temperaturschwankungen, hohe Feuchte, Komfort-Hinweise).
- **Tagesübersicht-Card**
  - Titel „Tagesübersicht“.
  - 3–4 Stichpunkte (Tageslänge, Regenwahrscheinlichkeit, Temperaturbereich, besondere Zeitpunkte).

### 3.4 Card-Gruppe „Vorhersagen“

- **Stündliche Vorhersage**
  - Horizontale Chips: Uhrzeit, Icon, Temperatur.
  - 12–24 Stunden, scroll-/swipebar.
- **Die nächsten Tage**
  - 4–5 Tagesspalten: Tag, Icon, High/Low, Niederschlagschance.

### 3.5 Card-Gruppe „Metriken heute“

Jede Card öffnet ein entsprechendes Bottom-Sheet.

- Temperaturverlauf-Card: Sparkline Tag/Nacht, Min/Max.
- Niederschlags-Card: aktuelle Intensität, Regenchance, kurzer Einzeiler.
- Wind-Card: Geschwindigkeit, Böen, Richtung.
- UV-Card: UV-Wert + Stufe.
- Luftqualitäts-Card: AQI, verbale Kategorie, EU/US Hinweis.
- Sichtweite-Card: km + Text („Gute Sicht“, „Nebel“).
- Sonne/Wolken-Card: Auf-/Untergangszeiten, Bewölkungsgrad.

### 3.6 Health-&-Safety-Preview

- Kleine Card mit 2–3 Statuschips:
  - „Regenschirm: nicht notwendig“.
  - „Draußen: gut“.
  - „Kleidung: dicke Jacke“.
- Tap → vollständiger HealthSafetyView.

---

## 4. Detail-Bottom-Sheets (Kategorien)

Einheitliches Bottom-Sheet-Pattern (Material-You-Stil):

- Slide-in von unten, Overlay, Drag-to-Close.
- Header mit Icon, Titel, Untertitel.
- Scrollbarer Content.
- Optional Footer mit passenden CTAs.

### 4.1 WindDetailSheet

- Aktueller Wind, Böen, Richtung.
- Kompass-Rose.
- 12–24h-Linienchart.
- Kurztext zur Einordnung („starker/gemäßigter Wind“).

### 4.2 PrecipitationDetailSheet

- Regen-/Schneewahrscheinlichkeit (aktuell, nächste Stunden).
- Balkendiagramm für 0–24h.
- Radar-Mini-Preview.
- CTA „Karten öffnen“.

### 4.3 UVDetailSheet

- Aktueller UV-Wert, Tagesmaximalwert, Zeitfenster hoher UV.
- Klare Schutzempfehlungen (Schatten, Sonnencreme, Hut, etc.).

### 4.4 AQIDetailSheet

- EU & US AQI, kategorische Einordnung.
- Hauptschadstoff und Health-Impact-Text.

### 4.5 TemperatureTrendDetailSheet

- Glatte Temp-Kurve Tag/Nacht.
- Aufbereitete Aussagen („Höchstwert gegen X Uhr“).

### 4.6 SunCloudDetailSheet

- Sun-Track-Visualisierung.
- Auf-/Untergang, Dämmerung.
- Bewölkungsverlauf.

---

## 5. Health & Safety View

### 5.1 Inhaltliche Struktur

- Linke Spalte (Empfehlungskarten):
  - Regenschirm: ja/nein + Grund.
  - Draußen: gut/mäßig/kritisch.
  - Kleidung: keine/leichte/dicke Jacke oder Regenmantel.
  - Fahrsicherheit: gut/vorsichtig/kritisch (Sichtweite, Regen, Nebel, Wind).
  - Hitzerisiko: gering/mittel/hoch (im Sommer aktiv).
  - UV & Sonnencreme: Empfehlung + Zeitfenster.
- Rechte Spalte (Microcharts):
  - Balken-Chart „Draußen-Score“ pro Stunde.
  - Komfort-Kurve (Temp vs. gefühlte Temp).
  - Optional Pollen-Ringe (API-optional).

### 5.2 Logik (healthSafetyEngine)

- Input:
  - Aktuelle Werte und Vorhersagen: Temp, Feels-like, Wind, Feuchte, Niederschlags-Wahrscheinlichkeit, UV, AQI, Sichtweite.
- Output (Scores & Labels):
  - `umbrellaLabel`, `outdoorLabel`, `clothingLabel`, `drivingLabel`, `heatLabel`, `uvProtectionLabel`.
  - Stundenslots mit „Outdoor-Score“ (0–100).

---

## 6. Radar- / Kartenansicht (RadarView)

### 6.1 Layout

- Vollbild-artige Section:
  - `MapContainer` (Leaflet-Host) füllt den Screen.
  - Oben: Floating Controls (Layer-Button, Standort-Zentrieren, ggf. kompakte Toolbar).
  - Unten: Timeline/Playback + „Jetzt“-Button.
  - Seite/unten: Legenden-Strip.

### 6.2 Layer-Auswahl (LayerBottomSheet)

- Gruppen:
  - Niederschlag & Radar: Radar, Regen, Schnee.
  - Temperatur & Wind: Flächentemp., Windvektoren.
  - Wolken & Sicht.
  - UV & Luftqualität.
- Je Layer: Icon, Titel, kurzer Text.

### 6.3 Technische Architektur

- `MapContainer.js` kapselt Leaflet-Init & Grund-View.
- `LayerManager.js` orchestriert RainViewer & OWM-Layer (Refaktor von `weatherMap.js`).
- `RadarController.js` steuert Frames, Preload, Play/Pause, „Jetzt“.

---

## 7. Historische Daten (HistoryView)

### 7.1 UI

- Zeitauswahl (Segmented Control): Tag / Woche / Monat.
- Hauptchart (Temperatur / Niederschlag / ggf. Wind):
  - Temperatur: Min/Max-Fläche, Durchschnittslinie, Trend.
  - Niederschlag: Balken.
- Insights-Boxen:
  - Wärmster/kältester/feuchtester/windigster Monat.
  - Tages-/Monatsdurchschnitt, Minimum, Maximum.

### 7.2 Datenaufbereitung

- `historyTransformer.js`:
  - Aggregiert API-Rohdaten (Meteostat/VisualCrossing) in Buckets.
  - Berechnet Min/Max/Avg/Trend.
- `HistoricalChart.js` wird weiterverwendet, API jedoch gesäubert.

---

## 8. Einstellungen (Settings)

### 8.1 SettingsHome

- Gruppen-Cards:
  - Erscheinungsbild.
  - Einheiten.
  - Sprache & Region.
  - Standorte.
  - Datenschutz & APIs.
- Jede Card → eigenes Bottom-Sheet.

### 8.2 Sub-Sheets

1. **ThemeSelectorSheet**

   - System / Hell / Dunkel.
   - Live-Preview.

2. **UnitsSelectorSheet**

   - Temperatur: °C / °F.
   - Wind: km/h / m/s / mph.
   - Druck: hPa / mmHg / inHg.
   - Niederschlag: mm / in.
   - AQI: EU / US.

3. **LanguageSelectorSheet**

   - Deutsch, Englisch.
   - Hinweis auf UI-Sprache & Datumsformate.

4. **LocationManagementSheet**

   - Heimatort setzen/entfernen.
   - Favoritenliste verwalten.

5. **PrivacyApiInfoSheet**
   - Kurze Erklärung zu gespeicherten Daten (Favorites, Settings, Cache).
   - Auflistung der genutzten APIs.
   - Links zu `privacy.html`, `terms.html`.

---

## 9. Komponenten- & Dateistruktur

### 9.1 Zielstruktur unter `src/`

- `app.js` – Bootstrapping & Orchestrierung.
- `features.js` – Feature Flags / Progressive Enhancements.

- `ui/`

  - `home/`
    - `WeatherHero.js`
    - `WeatherCardGroup.js`
    - `HomeCards.js` (Einsichten, Tagesübersicht, Hourly, Daily, Health-Preview).
  - `modals/`
    - `ModalController.js`
    - `DetailSheets/`
      - `PrecipitationDetailSheet.js`
      - `WindDetailSheet.js`
      - `UVDetailSheet.js`
      - `AQIDetailSheet.js`
      - `TemperatureTrendDetailSheet.js`
      - `SunCloudDetailSheet.js`
  - `map/`
    - `MapContainer.js`
    - `LayerManager.js`
    - `RadarController.js`
  - `health/`
    - `HealthSafetyView.js`
  - `history/`
    - `HistoryView.js`
  - `settings/`
    - `SettingsHome.js`
    - `ThemeSelectorSheet.js`
    - `UnitsSelectorSheet.js`
    - `LanguageSelectorSheet.js`
    - `LocationManagementSheet.js`
    - `PrivacyApiInfoSheet.js`
  - `shared/`
    - `AppBar.js`
    - `BottomNav.js`
    - `Chip.js`
    - `Badge.js`
    - `IconButton.js`

- `utils/`

  - `healthSafetyEngine.js`
  - `historyTransformer.js`
  - vorhandene Utils (`cache.js`, `validation.js`, `iconMapper.js`, etc.)

- `api/`
  - vorhandene Module (`weather.js`, `brightsky.js`, ...), ggf. Fassade `WeatherDataService`.

---

## 10. State-Management & Datenflüsse

### 10.1 Zentraler State

- `AppState` (bestehend, wird strukturiert genutzt):
  - `location`, `coordinates`.
  - `current`, `hourly`, `daily`.
  - `airQuality`, `history`, `mapsConfig`.
  - `settings` (Theme, Units, Locale, HomeLocation, Favorites).

### 10.2 Daten-Layer

- `WeatherDataService` (Fassade):
  - `loadCurrentAndForecast(location)`.
  - `loadHistory(location, range)`.
  - `loadAirQuality(coords)`.
  - `loadMapLayers(coords)`.
- Nutzt bestehende Caching-/Validation-Utils.

### 10.3 UI-Flow

1. User wählt Ort in `searchInput`.
2. `app.js` ruft `WeatherDataService` → befüllt `AppState`.
3. Renderer:
   - `WeatherHero.renderWeatherHero(AppState, helpers)`.
   - `HomeCards.renderHomeCards(AppState, healthSafetyEngine(AppState))`.
   - (später) `HealthSafetyView.render(AppState, healthSafetyEngine(AppState))`.
   - (später) `RadarView.init(AppState)`.
   - (später) `HistoryView.render(AppState.history)`.

---

## 11. Theme-, Layout- und Performance-Aspekte

- Theme über CSS-Variablen (`:root`, `[data-theme=dark]`, `[data-theme=light]`).
- Mobile-first Layout, max. Breite ~480px.
- Lazy-Loading:
  - Radar- und History-Init nur, wenn Tab aktiv.
- Skeleton-States für Hero + wichtige Cards.

---

## 12. Iterative Umsetzung (Empfehlung)

1. **Iteration 1**

   - App-Shell + AppBar + BottomNav.
   - WeatherHero + Einsichten/Tagesübersicht + Vorhersage-Cards + Health-Preview.
   - Einfache `healthSafetyEngine`.

2. **Iteration 2**

   - Detail-Bottom-Sheets (Wind, Niederschlag, UV, AQI, Temperaturtrend, Sonne/Wolken).
   - ModalController.

3. **Iteration 3**

   - HealthSafetyView mit Engine-Integration und Microcharts.

4. **Iteration 4**

   - RadarView (MapContainer, LayerBottomSheet, RadarController).

5. **Iteration 5**

   - HistoryView mit History-Transformer + Chart.

6. **Iteration 6**
   - SettingsHome + Sub-Sheets.
   - Vollständige i18n-Abdeckung.

Dieser Plan ist so strukturiert, dass du in VS Code direkt mit der Implementierung starten oder ihn weiter verfeinern kannst.
