UI-Redesign Status – Bezug auf Screenshots, Doku & Google-Icons

Dieser Stand dokumentiert, was für dein Ziel-Design bereits umgesetzt ist und was noch fehlt.

✅ Bereits umgesetzt

- **Home-Screen-Struktur**: In `src/index.html` ist der Home-View mobile-first mit AppBar, Hero-Platzhalter, Einsichten- & Tagesübersicht-Cards, stündlicher / nächster-Tage-Vorhersage, Health-Preview sowie der Section `card-group` mit `#metrics-grid` für „Metriken heute“ angelegt – nah an deinen Screenshots.
- **Metric-Cards & Grid**: In `src/ui/components/MetricCard.js` existiert eine wiederverwendbare MetricCard-Komponente (`MetricCard.renderMetricCards`). `src/style.css` enthält `metric-grid` + `metric-card` inkl. Ripple-Effekt, 2‑Spalten-Grid (3 Spalten ab 480px) und Material-/Google-Look.
- **Metrik-Grid-Logik**: `src/ui/home/HomeCards.js` ruft in `renderHomeCards` zusätzlich `renderMetricGrid(appState)` auf. `buildMetricCards` erzeugt Kacheln für Wind, Niederschlag, UV-Index und Sichtweite aus `appState.current`, `appState.daily[0]`, `appState.hourly[0]`.
- **Bottom-Sheet-Struktur für Metriken**: In `index.html` gibt es leere `bottom-sheet`-Container für `#sheet-metric-wind`, `#sheet-metric-precipitation`, `#sheet-metric-uv`, `#sheet-metric-visibility` sowie ausgearbeitete Sheets (`#sheet-wind`, `#sheet-precipitation`, `#sheet-uv`, `#sheet-aqi`, `#sheet-temperature-trend`, `#sheet-sun-cloud`, `#sheet-map-layers`).
- **ModalController**: `src/ui/modals/ModalController.js` steuert `#bottom-sheet-overlay` und unterstützt jetzt `ModalController.open(idOrMetric)`. Metric-IDs wie `wind`, `precipitation`, `uv`, `visibility`, `aqi`, `temperature-trend`, `sun-cloud` werden über ein Mapping auf die passenden Sheet-IDs (`#sheet-metric-wind`, `#sheet-metric-precipitation`, …) aufgelöst. Trigger werden über `data-bottom-sheet` **oder** `data-bottom-sheet-target` erkannt.
- **Metric-Card-Klicks**: In `HomeCards.js` ruft `handleMetricClick(event, metricId)` `ModalController.open(metricId)` auf, sodass ein Klick auf z.B. die Wind-Kachel das passende Bottom-Sheet öffnet.
- **Google-/Material-Icons**: In `index.html` ist die Material-Symbols-Font eingebunden. AppBar (Location, Settings) und Bottom-Navigation (Home, Karten, Health, Einstellungen) verwenden jetzt Material-Icons (`material-symbols-outlined`) statt Emoji. In `style.css` gibt es eine Basisklasse `.material-symbols-outlined` für konsistente Darstellung.
- **Ripple & Micro-Interactions**: MetricCards besitzen einen leichten Ripple-Effekt (`.metric-card__ripple` + `@keyframes metric-ripple`), Hover- und Focus-States sind implementiert; Bottom-Nav und AppBar nutzen Blur-/Gradient-Hintergründe im Stil deiner Screenshots.

🔧 Noch offene Arbeiten (nächste Ausbaustufen)

**Frog-/Hero-Hintergrund (Google Weather Frog)**

- Froggie-Assets (Scenes + Hintergründe) liegen jetzt unter `src/assets/froggie/hubui` (`mushroom_*`, `hill_*`, `fields_*` jeweils als `*_bg.webp` + `*_frog.flr`).
- In `src/ui/home/FrogHeroPlayer.js` wird aus Zeit (`current.time`) und Wettercode (`current.weatherCode`) eine Szene wie `mushroom_night_rainy` abgeleitet, der passende Hintergrund gesetzt und – falls `Rive` geladen ist – die dazugehörige Frog-Animation auf einem Canvas gestartet.
- `src/ui/home/WeatherHero.js` rendert im Hero-Bereich einen Frog-Container (`#frog-hero-pond` + `#frog-hero-canvas`) und ruft nach dem normalen Hero-Markup `FrogHeroPlayer.renderFrogHero(current)` auf.

- **Detail-Sheets für alle Metriken ausbauen**

  - `src/ui/modals/DetailSheets/` um konkrete Implementierungen ergänzen: mindestens Wind, Niederschlag, UV, Sichtweite – analog zum bereits geplanten Wind-Detail-Sheet (Header mit Icon/Text, aktuelle Kennzahl(en), Platz für 24h-Visualisierung + Kurztexte).
  - Metrik-Sheets in `index.html` mit sinnvollem Default-Content verdrahten (oder rein über JS befüllen), damit Layout + Scrollverhalten konsistent sind.

- **Grafik-/Chart-Layer für 24h-Trends**

  - Neues Utility `src/utils/graphRenderer.js` anlegen, das normalisierte 24h-Zeitreihen (Temperatur, Wind, Niederschlag, UV, Sichtweite …) entgegennimmt und einfache Balken-/Linien-Charts rendert (Canvas oder Inline-SVG im „Google-Weather“-Stil).
  - Integration der Charts in die Metrik-Detail-Sheets (z.B. Wind 24h, Niederschlag 24h, UV-Index-Verlauf) mit klarer Beschriftung und dezenter Animation.

- **Bottom-Sheet-Interaktionen verfeinern**

  - Bestehende Bottom-Sheet-Styles weiter abstrahieren (Header, Drag-Indicator, Body-Scroll), sodass alle Sheets – Karten, Metriken, Settings – dasselbe Motion-Pattern nutzen.
  - Optional Drag-Handling (hoch/runterziehen zum Öffnen/Schließen) ergänzen, um das Google-Style-Bottom-Sheet-Verhalten nachzubilden.

- **Look & Feel Feinschliff**
  - Typografie (Abstände, Zeilenhöhen, Schriftgrößen) entlang der Screens final justieren – v.a. Titel „Einsichten“, „Tagesübersicht“, Section-Header, Metrik-Labels.
  - Farben/Verläufe der Cards leicht anpassen (z.B. unterschiedliche Akzentfarben pro Metrik-Kachel, subtile Glows) und Icons der Metriken (Wind, UV, Sichtweite, Niederschlag) von Emoji auf Material-/Google-Icons oder eigene SVGs umstellen.
  - Sicherstellen, dass alle Views (Home, Health, Radar, Settings) auf 320–480px Breite sauber aussehen und die Sticky-Bottom-Nav nicht mit den Sheets kollidiert.

Sobald Frog-Hero, Metrik-Detail-Sheets und 24h-Charts ergänzt sind, entspricht der Home-Screen mit Metrik-Grid, Hero und Bottom-Sheets visuell und funktional sehr nah deinem referenzierten Screenshot-Design.
