const axios = require('axios');

// reCAPTCHA Middleware
module.exports = async function recaptchaMiddleware(req, res, next) {
  try {
    const secret = process.env.RECAPTCHA_SECRET;
    const env = (process.env.NODE_ENV || 'development').toLowerCase();

    // In development, allow skipping reCAPTCHA if token is missing
    if (env !== 'production' && !req.body.recaptcha) {
      return next();
    }

    if (!secret) {
      if (env === 'production') {
        return res.status(500).json({ message: 'reCAPTCHA is not configured (missing RECAPTCHA_SECRET)' });
      }
      // In non-production environments, allow skipping for local testing
      return next();
    }

    const token = req.body.recaptcha;
    if (!token) {
      return res.status(400).json({ message: 'Missing reCAPTCHA token' });
    }

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({ secret, response: token }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const data = response.data || {};

    if (!data.success) {
      return res.status(400).json({ message: 'Invalid reCAPTCHA', codes: data['error-codes'] });
    }

    // Optional v3 validations
    const minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');
    const expectedAction = process.env.RECAPTCHA_EXPECTED_ACTION || 'claim_submit';
    const allowedHostnames = String(process.env.RECAPTCHA_ALLOWED_HOSTNAMES || '')
      .split(',')
      .map(h => h.trim())
      .filter(Boolean);

    if (typeof data.score === 'number' && data.score < minScore) {
      return res.status(400).json({ message: 'reCAPTCHA score too low', score: data.score, threshold: minScore });
    }

    if (data.action && expectedAction && data.action !== expectedAction) {
      return res.status(400).json({ message: 'Unexpected reCAPTCHA action', action: data.action, expected: expectedAction });
    }

    if (allowedHostnames.length > 0) {
      const hostname = data.hostname || '';
      const match = allowedHostnames.includes(hostname);
      if (!match) {
        return res.status(400).json({ message: 'Untrusted reCAPTCHA hostname', hostname, allowed: allowedHostnames });
      }
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: 'reCAPTCHA verification failed', error: err.message });
  }
}
