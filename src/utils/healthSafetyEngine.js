(function (global) {
  function healthSafetyEngine(appState) {
    const current = appState.current || {};
    const daily = (appState.daily && appState.daily[0]) || {};

    const temp = current.temperature;
    const feels = current.apparentTemperature || current.feelsLike || temp;
    const precipProb = current.precipProb || daily.precipProbMax || 0;
    const wind = current.windSpeed || 0;
    const humidity = current.humidity || 0;
    const hourly = appState.hourly || [];

    let umbrellaLabel = "Regenschirm: nicht notwendig";
    if (precipProb >= 60) umbrellaLabel = "Regenschirm: empfohlen";
    if (precipProb >= 85) umbrellaLabel = "Regenschirm: dringend empfohlen";

    let outdoorLabel = "Draußen: gut";
    if (feels <= -5 || feels >= 32 || wind >= 50)
      outdoorLabel = "Draußen: kritisch";
    else if (feels <= 0 || feels >= 28 || wind >= 35)
      outdoorLabel = "Draußen: mäßig";

    let clothingLabel = "Kleidung: keine Jacke";
    if (feels <= 4) clothingLabel = "Kleidung: dicke Jacke";
    else if (feels <= 12) clothingLabel = "Kleidung: leichte Jacke";
    if (precipProb >= 70) clothingLabel = "Kleidung: Regenmantel";

    let drivingLabel = "Fahrsicherheit: gut";
    if (wind >= 50 || precipProb >= 80 || humidity >= 95) {
      drivingLabel = "Fahrsicherheit: kritisch";
    } else if (wind >= 35 || precipProb >= 60) {
      drivingLabel = "Fahrsicherheit: vorsichtig";
    }

    let heatLabel = "Hitzerisiko: gering";
    if (feels >= 35) heatLabel = "Hitzerisiko: hoch";
    else if (feels >= 30) heatLabel = "Hitzerisiko: mittel";

    let uvProtectionLabel = "UV-Schutz: normal";
    const maxUv = hourly.reduce(
      (max, h) => Math.max(max, h.uvIndex != null ? h.uvIndex : h.uv || 0),
      0
    );
    if (maxUv >= 8) uvProtectionLabel = "UV-Schutz: sehr hoch";
    else if (maxUv >= 5) uvProtectionLabel = "UV-Schutz: erhöht";

    const outdoorScoreTimeline = hourly.slice(0, 24).map((h) => {
      const hourTemp = h.temperature != null ? h.temperature : temp;
      const hourFeels =
        h.apparentTemperature != null
          ? h.apparentTemperature
          : h.feelsLike != null
          ? h.feelsLike
          : feels;
      const hourWind = h.windSpeed != null ? h.windSpeed : wind;
      const hourPrecipProb =
        h.precipitationProbability != null
          ? h.precipitationProbability
          : h.precipProb != null
          ? h.precipProb
          : precipProb;

      let score = 100;
      const coldStress = Math.max(0, 5 - hourFeels);
      const heatStress = Math.max(0, hourFeels - 28);
      const tempPenalty = (coldStress + heatStress) * 4;
      const windPenalty = Math.max(0, hourWind - 15) * 1.5;
      const rainPenalty = (hourPrecipProb / 100) * 35;

      score -= tempPenalty + windPenalty + rainPenalty;
      score = Math.max(0, Math.min(100, Math.round(score)));

      return {
        time: h.time || h.timeLabel,
        score,
      };
    });

    return {
      umbrellaLabel,
      outdoorLabel,
      clothingLabel,
      drivingLabel,
      heatLabel,
      uvProtectionLabel,
      outdoorScoreTimeline,
      raw: { temp, feels, precipProb, wind, humidity },
    };
  }

  global.healthSafetyEngine = healthSafetyEngine;
})(window);
