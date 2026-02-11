const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { Tenant } = require('../../../models');

// In-memory cache for default tenant record
let defaultTenantCache = null;
const getDefaultTenant = async () => {
    if (defaultTenantCache) return defaultTenantCache;
    defaultTenantCache = await Tenant.findOne({ where: { slug: 'default' } });
    return defaultTenantCache;
};

// Helper to resolve branding per tenant with fallback to DB default tenant
const resolveBranding = async (tenant) => {
    const fallback = tenant || await getDefaultTenant();
    const legalName = fallback?.legal_name || 'ReclamoFácil';
    const brandName = fallback?.brand_name || fallback?.legal_name || legalName;
    const logoLightUrl = fallback?.logo_light_url || 'assets/default-tenant/logo-light.png';
    const logoDarkUrl = fallback?.logo_dark_url || 'assets/default-tenant/logo-dark.png';
    const contactEmail = fallback?.contact_email;
    return { legalName, brandName, logoLightUrl, logoDarkUrl, contactEmail };
};

// Use light logo path for emails by default (resolved per-tenant later)
const DEFAULT_EMAIL_LOGO_PATH = 'assets/default-tenant/logo-light.png';
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const EMAIL_SECURE = process.env.EMAIL_SECURE;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE === 'true',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    }
});

/**
 * Resuelve la ruta de plantilla según el tipo de notificación
 * @param {string} templateName - Nombre de la plantilla (sin extensión)
 * @param {string} type - Tipo: 'customer' | 'staff' | 'admin'
 * @returns {string} - Ruta completa del archivo
 */
const getTemplatePath = (templateName, type = 'customer') => {
    // Todas las plantillas están en subcarpetas: templates/customer/, templates/staff/, templates/admin/
    return path.join(__dirname, '..', '..', 'templates', type, `${templateName}.html`);
};

/**
 * Envía un email con plantilla HTML
 * @param {Object} options - Opciones de envío
 * @param {string|string[]} options.to - Destinatario/s principal/es
 * @param {string[]} [options.cc] - Copias simples
 * @param {string[]} [options.bcc] - Copias ocultas
 * @param {string} options.subject - Asunto del email
 * @param {string} options.text - Texto plano (fallback)
 * @param {string} options.templateName - Nombre de la plantilla
 * @param {string} [options.templateType='customer'] - Tipo: 'customer' | 'staff' | 'admin'
 * @param {Object} [options.replacements={}] - Datos para reemplazar en plantilla
 * @param {Object[]} [options.attachments=[]] - Archivos adjuntos
 * @param {Object} [options.tenant] - Objeto tenant para branding
 */
const sendEmail = async (options) => {
    try {
        const {
            to,
            cc = [],
            bcc = [],
            subject,
            text,
            templateName,
            templateType = 'customer',
            replacements = {},
            attachments = [],
            tenant
        } = options;

        // Validar parámetros esenciales
        if (!to || !subject || !templateName) {
            throw new Error('Parámetros requeridos faltantes: to, subject, templateName');
        }

        const brand = await resolveBranding(tenant);
        // Validate tenant contact_email for customer templates
        if (!brand.contactEmail) {
            const tenantIdOrSlug = tenant?.slug || tenant?.id || 'unknown-tenant';
            console.warn(`[emailService] Missing tenant contact_email for ${tenantIdOrSlug}. Template variable {{companyContactEmail}} will be empty.`);
            if (templateType === 'customer') {
                throw new Error('El tenant no tiene contact_email configurado. No se puede enviar correo al cliente.');
            }
        }

        // Obtener ruta de plantilla según tipo
        const templatePath = getTemplatePath(templateName, templateType);
        const html = await fs.promises.readFile(templatePath, 'utf8');

        // Añadir datos generales a reemplazos
        replacements.companyName = brand.legalName;
        replacements.currentYear = new Date().getFullYear();
        
        // Email de contacto para plantillas (usar solo el del tenant)
        replacements.companyContactEmail = brand.contactEmail || '';

        // Reemplazar placeholders en HTML
        const replacedHtml = html.replace(/{{([^{}]*)}}/g, (match, key) => {
            return replacements[key.trim()] || '';
        });

        // Preparar attachments con logo y codificación UTF-8 para caracteres especiales
        const encodeFilename = (filename) => {
            // Verificar si el nombre tiene caracteres especiales/tildes
            if (/[^\x20-\x7E]/.test(filename)) {
                // Usar RFC 2231 encoding para caracteres no-ASCII
                return `=?UTF-8?B?${Buffer.from(filename).toString('base64')}?=`;
            }
            return filename;
        };

        const emailAttachments = [...attachments].map(att => ({
            ...att,
            filename: encodeFilename(att.filename)
        }));
        const logoUrlRaw = brand.logoLightUrl || brand.logoDarkUrl || DEFAULT_EMAIL_LOGO_PATH;
        const isHttp = /^https?:\/\//i.test(logoUrlRaw || '');
        
        if (!isHttp && logoUrlRaw) {
            const logoPath = path.join(__dirname, '..', '..', '..', '..', logoUrlRaw);
            if (fs.existsSync(logoPath)) {
                emailAttachments.push({
                    filename: 'logo.png',
                    path: logoPath,
                    cid: 'companylogo'
                });
            } else {
                console.warn(`Logo file not found at path: ${logoPath}`);
            }
        }

        // Resolver emails de copia (garantizar array)
        const toArray = Array.isArray(to) ? to : [to];
        let ccArray = Array.isArray(cc) ? cc : (cc ? [cc] : []);
        let bccArray = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

        // Enviar sin copias para plantillas de cliente y staff
        if (templateType === 'customer' || templateType === 'staff') {
            ccArray = [];
            bccArray = [];
        }

        // Construir opciones de email
        const mailOptions = {
            from: `${brand.brandName} <${EMAIL_USER}>`,
            to: toArray.join(', '),
            subject,
            text,
            html: replacedHtml,
            attachments: emailAttachments
        };

        // Agregar CC si existe
        if (ccArray.length > 0) {
            mailOptions.cc = ccArray.join(', ');
        }

        // Agregar BCC si existe
        if (bccArray.length > 0) {
            mailOptions.bcc = bccArray.join(', ');
        }

        await transporter.sendMail(mailOptions);
        
        return { success: true, recipients: toArray, cc: ccArray, bcc: bccArray };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

sendEmail.sendEmail = sendEmail;
module.exports = sendEmail;
