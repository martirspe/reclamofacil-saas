// Utility to normalize uploaded filenames to UTF-8, avoiding latin1 mojibake (e.g., CotizaciÃ³n -> Cotización)
function normalizeOriginalName(name = '') {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch (_) {
    return name;
  }
}

module.exports = { normalizeOriginalName };
