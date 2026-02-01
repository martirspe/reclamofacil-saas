const bcrypt = require('bcrypt');
const { sequelize } = require('../config/db');
const { Tenant, Subscription, User, UserTenant } = require('../models');
const { generateTokenPair, verifyRefreshToken } = require('../utils/refreshTokenUtils');
const { generateJWT } = require('../utils/jwtUtils');
const { 
  generateVerificationCode, 
  storeVerificationCode, 
  verifyCode, 
  sendVerificationEmail,
  checkVerificationRateLimit
} = require('../utils/emailVerificationUtils');
const {
  checkLoginLockout,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  getRemainingAttempts,
  LOCKOUT_DURATION
} = require('../utils/loginSecurityUtils');
const {
  generateResetToken,
  storeResetToken,
  verifyResetToken,
  sendPasswordResetEmail
} = require('../utils/passwordResetUtils');

const normalizeSlug = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return `La contraseña debe tener al menos ${minLength} caracteres`;
  }
  if (!hasUpperCase || !hasLowerCase) {
    return 'La contraseña debe contener mayúsculas y minúsculas';
  }
  if (!hasNumber) {
    return 'La contraseña debe contener al menos un número';
  }
  if (!hasSpecialChar) {
    return 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)';
  }
  return null;
};

// Public signup: creates only a user admin account (no tenant).
exports.publicSignup = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'email y password son requeridos' });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Este correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name: first_name || 'Admin',
      last_name: last_name || 'User',
      email,
      password: hashedPassword,
      role: 'admin',
      email_verified: false
    });

    // Generate and send verification code
    const verificationCode = generateVerificationCode();
    await storeVerificationCode(user.id, verificationCode);
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    try {
      await sendVerificationEmail(user, null, verificationCode, baseUrl);
    } catch (emailError) {
      req.log?.warn({ emailError }, 'No se pudo enviar email de verificación');
    }

    // Don't return JWT until email is verified
    return res.status(201).json({
      message: 'Usuario registrado exitosamente. Por favor verifica tu correo electrónico.',
      userId: user.id,
      email: user.email,
      email_verification_required: true,
      next_step: 'Verifica tu correo y luego podrás crear tu primer tenant'
    });
  } catch (err) {
    req.log?.error({ err }, 'Error en signup público');
    return res.status(500).json({ message: 'Error al registrar el usuario', error: err.message });
  }
};

// Public login: reuse existing login logic
exports.publicLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email y password son requeridos' });
    }

    // Check if email is locked due to too many failed attempts
    const { isLocked, remainingTime } = await checkLoginLockout(email);
    if (isLocked) {
      const minutes = Math.ceil(remainingTime / 60);
      return res.status(429).json({ 
        message: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta nuevamente en ${minutes} minuto(s).`,
        lockout_remaining_seconds: remainingTime
      });
    }

    const user = await User.findOne({ where: { email } });

    // Show a message if user data is incorrect
    if (!user) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos" });
    }

    // Compare the received password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed attempt
      const attemptCount = await recordFailedLoginAttempt(email);
      const remaining = await getRemainingAttempts(email);
      
      if (attemptCount >= 5) {
        return res.status(429).json({ 
          message: `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intenta nuevamente en ${Math.ceil(LOCKOUT_DURATION / 60)} minuto(s).`,
          attempts_remaining: 0,
          locked: true
        });
      }
      
      return res.status(401).json({ 
        message: "Correo o contraseña incorrectos",
        attempts_remaining: remaining
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        message: 'Correo electrónico no verificado. Por favor verifica tu correo antes de iniciar sesión.',
        email_verification_required: true,
        userId: user.id
      });
    }

    // Clear failed login attempts on successful login
    await clearLoginAttempts(email);

    // Generate both access and refresh tokens
    const tenantSlug = req.header('x-tenant') || req.header('x-tenant-slug') || null;
    const { accessToken, refreshToken } = generateTokenPair(user, tenantSlug || null);

    res.status(200).json({ 
      message: 'Sesión iniciada correctamente', 
      access_token: accessToken,
      refresh_token: refreshToken,
      user, 
      tenant_slug: tenantSlug 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión: ' + error.message });
  }
};

// Verify email with code
exports.verifyEmail = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: 'userId y code son requeridos' });
    }

    // Rate limit verification attempts by IP
    const isAllowed = await checkVerificationRateLimit(req.ip);
    if (!isAllowed) {
      return res.status(429).json({ message: 'Demasiados intentos. Intenta nuevamente más tarde.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: 'El correo ya está verificado' });
    }

    const isValid = await verifyCode(userId, code);
    if (!isValid) {
      return res.status(400).json({ message: 'Código de verificación inválido o expirado' });
    }

    // Update user as verified
    user.email_verified = true;
    user.email_verified_at = new Date();
    await user.save();

    // Get user's tenant for JWT
    const membership = await UserTenant.findOne({ where: { user_id: user.id } });
    const tenant = membership ? await Tenant.findByPk(membership.tenant_id) : null;

    // Generate JWT
    const token = generateJWT(user, tenant?.slug || null);

    res.status(200).json({ 
      message: 'Correo verificado exitosamente', 
      token, 
      user,
      tenant_slug: tenant?.slug
    });
  } catch (error) {
    req.log?.error({ error }, 'Error verificando email');
    res.status(500).json({ message: 'Error al verificar el correo: ' + error.message });
  }
};

/**
 * Refresh access token using refresh token
 * Endpoint: POST /api/public/refresh
 * Body: { refresh_token: "..." }
 */
exports.refreshAccessToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ message: 'refresh_token es requerido' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refresh_token);
    
    // Get user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generate new access token
    const tenantSlug = req.header('x-tenant') || req.header('x-tenant-slug') || null;
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user, tenantSlug || null);

    res.status(200).json({
      message: 'Token refreshed successfully',
      access_token: accessToken,
      refresh_token: newRefreshToken,
      user
    });
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token inválido o expirado', error: error.message });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId es requerido' });
    }

    // Rate limit resend attempts by IP
    const isAllowed = await checkVerificationRateLimit(req.ip);
    if (!isAllowed) {
      return res.status(429).json({ message: 'Demasiados intentos. Intenta nuevamente más tarde.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.email_verified) {
      return res.status(400).json({ message: 'El correo ya está verificado' });
    }

    // Get user's tenant
    const membership = await UserTenant.findOne({ where: { user_id: user.id } });
    const tenant = membership ? await Tenant.findByPk(membership.tenant_id) : null;

    // Generate new code and send
    const verificationCode = generateVerificationCode();
    await storeVerificationCode(user.id, verificationCode);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    await sendVerificationEmail(user, tenant, verificationCode, baseUrl);

    res.status(200).json({ 
      message: 'Código de verificación reenviado exitosamente',
      email: user.email
    });
  } catch (error) {
    req.log?.error({ error }, 'Error reenviando verificación');
    res.status(500).json({ message: 'Error al reenviar verificación: ' + error.message });
  }
};

// Forgot password: send reset link (always returns generic message)
exports.forgotPassword = async (req, res) => {
  const genericMessage = 'Si el correo existe, enviaremos un enlace para restablecer tu contraseña.';
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'email es requerido' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    const token = generateResetToken();
    try {
      await storeResetToken(user.id, token);
    } catch (storeError) {
      req.log?.error({ storeError }, 'Error storing reset token in Redis');
      return res.status(500).json({ message: 'Error al procesar la solicitud' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&userId=${user.id}`;

    const membership = await UserTenant.findOne({ where: { user_id: user.id } });
    const tenant = membership ? await Tenant.findByPk(membership.tenant_id) : null;

    try {
      await sendPasswordResetEmail(user, tenant, resetUrl);
    } catch (emailError) {
      req.log?.warn({ emailError }, 'No se pudo enviar email de recuperación');
    }

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    req.log?.error({ error }, 'Error en forgot password');
    return res.status(500).json({ message: 'Error al solicitar el restablecimiento de contraseña' });
  }
};

// Reset password: validates token and updates password
exports.resetPassword = async (req, res) => {
  try {
    const { userId, token, password } = req.body || {};
    if (!userId || !token || !password) {
      return res.status(400).json({ message: 'userId, token y password son requeridos' });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const isValid = await verifyResetToken(user.id, token);
    if (!isValid) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    req.log?.error({ error }, 'Error en reset password');
    return res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};
