// Simple test runner for validation functions
(function(){
  const results = [];
  function assert(condition, msg){
    results.push({ok: !!condition, msg});
    console[condition ? 'log' : 'error']((condition? 'PASS':'FAIL')+': '+msg);
  }

  // Tests
  try {
    // validateCityInput
    let r = validateCityInput('Berlin');
    assert(r.valid, 'validateCityInput: Berlin should be valid');

    r = validateCityInput('');
    assert(!r.valid, 'validateCityInput: empty should be invalid');

    // sanitizeInput
    const s = sanitizeInput('<script>alert(1)</script>');
    assert(!s.includes('<') && !s.includes('>'), 'sanitizeInput removes angle brackets');

    // validateCoordinates
    let c = validateCoordinates(52.52, 13.405);
    assert(c.valid, 'validateCoordinates: Berlin coords valid');

    c = validateCoordinates(999, 999);
    assert(!c.valid, 'validateCoordinates: out-of-range coords invalid');

  } catch (err) {
    console.error('Test runner error', err);
    results.push({ok:false, msg: 'Test runner exception: '+err.message});
  }

  // Render results
  const container = document.createElement('div');
  container.style.fontFamily = 'monospace';
  container.innerHTML = '<h2>Validation Tests</h2>' + results.map(r=>`<div style="color:${r.ok?'green':'red'}">${r.ok? 'PASS':'FAIL'} - ${r.msg}</div>`).join('');
  document.body.appendChild(container);
})();