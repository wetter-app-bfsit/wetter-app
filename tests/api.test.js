// API formatting tests (offline sample data)
(function(){
  const results = [];
  function assert(condition, msg){
    results.push({ok: !!condition, msg});
    console[condition ? 'log' : 'error']((condition? 'PASS':'FAIL')+': '+msg);
  }

  try {
    // Sample Open-Meteo-like payload
    const sampleOpen = {
      hourly: {
        time: ['2025-11-15T12:00', '2025-11-15T13:00'],
        temperature_2m: [10.5, 11.2],
        weathercode: [0, 3],
        windspeed_10m: [5.3, 6.1],
        relativehumidity_2m: [70, 65]
      },
      daily: {
        time: ['2025-11-15', '2025-11-16'],
        weathercode: [1, 2],
        temperature_2m_max: [12.3, 13.4],
        temperature_2m_min: [3.2, 4.1]
      },
      timezone: 'Europe/Berlin'
    };

    const hourly = openMeteoAPI.formatHourlyData(sampleOpen, 2);
    assert(Array.isArray(hourly) && hourly.length === 2, 'OpenMeteo formatHourlyData returns array of length 2');
    assert(typeof hourly[0].temperature === 'number', 'hourly temp is number');

    const daily = openMeteoAPI.formatDailyData(sampleOpen, 2);
    assert(Array.isArray(daily) && daily.length === 2, 'OpenMeteo formatDailyData returns array of length 2');

    // BrightSky formatting (uses .formatWeatherData)
    const sampleBright = { weather: [
      { timestamp: '2025-11-15T12:00', temperature: 10.2, feels_like: 9.5, windspeed: 4.2, wind_direction: 180, relative_humidity: 72, precipitation: 0, precipitation_probability: 5, icon: 'clear-day' }
    ] };

    const bFormatted = brightSkyAPI.formatWeatherData(sampleBright, 1);
    assert(Array.isArray(bFormatted) && bFormatted.length === 1, 'BrightSky formatWeatherData returns array');

  } catch (err) {
    console.error('API test error', err);
    results.push({ok:false, msg: 'Exception: '+err.message});
  }

  // Render results
  const container = document.createElement('div');
  container.style.fontFamily = 'monospace';
  container.innerHTML = '<h2>API Formatting Tests</h2>' + results.map(r=>`<div style="color:${r.ok?'green':'red'}">${r.ok? 'PASS':'FAIL'} - ${r.msg}</div>`).join('');
  document.body.appendChild(container);
})();