// Requires apiKeyMiddleware to have set req.apiKey; checks that required scopes are present.
const requireApiKeyScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ message: 'API key requerida para esta operación' });
    }

    const scopesStr = req.apiKey.scopes || '';
    const scopes = scopesStr.split(',').map(s => s.trim()).filter(Boolean);
    const missing = requiredScopes.filter(r => !scopes.includes(r));
    if (missing.length > 0) {
      return res.status(403).json({ message: 'La API key no tiene los scopes requeridos', missing_scopes: missing });
    }

    next();
  };
};

module.exports = requireApiKeyScope;
