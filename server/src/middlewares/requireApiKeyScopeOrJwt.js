// If an API key is present, enforce required scopes; otherwise, skip (JWT path handled by roles/membership).
const requireApiKeyScopeOrJwt = (...requiredScopes) => {
  return (req, res, next) => {
    if (!req.apiKey) return next();

    const scopesStr = req.apiKey.scopes || '';
    const scopes = scopesStr.split(',').map(s => s.trim()).filter(Boolean);
    const missing = requiredScopes.filter(r => !scopes.includes(r));
    if (missing.length > 0) {
      return res.status(403).json({ message: 'La API key no tiene los scopes requeridos', missing_scopes: missing });
    }

    next();
  };
};

module.exports = requireApiKeyScopeOrJwt;
