// Data Models
const { User, Customer, Tutor, ConsumptionType, ClaimType, Currency, Claim, UserTenant } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { Location } = require('../models');

// Utilities
const { formatDate, prepareEmailData } = require('../utils/emailUtils');
const { normalizeOriginalName } = require('../utils/filenameUtils');

// Email Notifications
const claimNotifier = require('../services/notifications/email/claimNotifier');
const inAppNotificationService = require('../services/notifications/inAppNotificationService');

const SLA_DAYS = 15;
const SLA_WARNING_DAYS = 2;
const SLA_ESCALATION_DAYS = SLA_DAYS - SLA_WARNING_DAYS;


// Create a new claim (requires existing customer/tutor IDs)
exports.createClaim = async (req, res) => {
  let transaction;
  try {
    const { customer_id, tutor_id, claim_type_id, consumption_type_id, currency_id, ...claimData } = req.body;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    // Find all related records at once (customer and tutor must belong to the same tenant)
    const [customer, tutor, consumptionType, claimType, currency] = await Promise.all([
      Customer.findOne({ where: { id: customer_id, tenant_id: tenantId } }),
      tutor_id ? Tutor.findOne({ where: { id: tutor_id, tenant_id: tenantId } }) : null,
      ConsumptionType.findByPk(consumption_type_id),
      ClaimType.findByPk(claim_type_id),
      Currency.findByPk(currency_id)
    ]);

    // Check if all necessary records exist and belong to the tenant
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado en este tenant' });
    }
    if (tutor_id && !tutor) {
      return res.status(404).json({ message: 'Tutor no encontrado en este tenant' });
    }
    if (!consumptionType || !claimType || !currency) {
      return res.status(404).json({ message: 'Uno o más registros de catálogo no fueron encontrados' });
    }

    // Handle attachment with original filename
    if (req.fileInfo && req.file) {
      claimData.attachment = req.fileInfo.filePath;
      claimData.attachment_original_name = normalizeOriginalName(req.file.originalname);
    }

    // Validar y procesar ubicación ANTES de crear el reclamo
    let location = null;
    if (claimData.location_id) {
      // Si se proporciona location_id, validar que existe
      location = await Location.findByPk(claimData.location_id);
      if (!location) {
        return res.status(404).json({ message: 'La ubicación especificada no existe' });
      }
    } else if (claimData.district && claimData.province && claimData.department) {
      // Si se proporciona district/province/department (búsqueda por nombre), encontrar location
      location = await Location.findOne({
        where: {
          district: claimData.district,
          province: claimData.province,
          department: claimData.department
        }
      });
    }

    // Si encontramos location, usar su ID y denormalizar datos antes de crear el claim
    if (location) {
      claimData.location_id = location.id;
      claimData.district = location.district;
      claimData.province = location.province;
      claimData.department = location.department;
    }

    transaction = await sequelize.transaction();

    // Create the claim inside a transaction
    const claim = await Claim.create({
      customer_id,
      tutor_id,
      consumption_type_id,
      claim_type_id,
      currency_id,
      tenant_id: tenantId,
      ...claimData
    }, { transaction });

    // Generate and persist the claim code atomically
    const currentYear = new Date().getFullYear();
    const prefix = claimType.name.substring(0, 3).toUpperCase();
    const sequential = String(claim.id).padStart(6, '0'); // human-friendly, fixed width
    claim.code = `${prefix}-${currentYear}-${sequential}`;
    await claim.save({ transaction });

    await transaction.commit();

    // Reload the claim with relations to prepare email data
    const completeClaim = await Claim.findByPk(claim.id, {
      include: [{ model: Customer }, { model: ConsumptionType }, { model: ClaimType }, { model: Currency }]
    });
    const emailData = {
      ...prepareEmailData(completeClaim),
      creationDate: formatDate(completeClaim.creation_date),
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/claims/${claim.code}`
    };

    // Prepare attachments for email with proper encoding for special characters
    const attachments = [];
    if (req.fileInfo && req.file) {
      const filename = normalizeOriginalName(req.file.originalname);
      attachments.push({
        filename,
        path: req.fileInfo.filePath,
        encoding: 'utf-8'
      });
    }

    await claimNotifier.notifyClaimCreated({
      tenant: req.tenant,
      customer,
      claim,
      emailData,
      attachments
    });

    await inAppNotificationService.notifyNewClaim({
      tenantId,
      claim,
      customer,
      preferredUserIds: claim.assigned_user ? [claim.assigned_user] : []
    });

    res.status(201).json({
      message: 'Tu reclamo fue registrado correctamente',
      fileInfo: req.fileInfo
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        req.log?.error({ rollbackError }, 'Error realizando rollback de createClaim');
      }
    }

    // Handle unique constraint violation on code (rare with id-based generation)
    if (error.name === 'SequelizeUniqueConstraintError' && error.fields?.code) {
      req.log?.error({ error, tenant_id: req.tenant?.id }, 'Colisión de código de reclamo');
      return res.status(409).json({ message: 'Error: código de reclamo duplicado. Intente nuevamente.' });
    }

    req.log?.error({ error, tenant_id: req.tenant?.id }, 'Error creando reclamo');
    res.status(500).json({ message: error.message });
  }
};

// Get all claims
exports.getClaims = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const status = typeof req.query.status === 'string' ? req.query.status.toLowerCase() : null;
    const searchTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const where = { tenant_id: tenantId };
    const andConditions = [];
    const ageDaysExpr = sequelize.fn('DATEDIFF', sequelize.fn('NOW'), sequelize.col('creation_date'));

    if (status && status !== 'all') {
      switch (status) {
        case 'resolved':
          andConditions.push({ resolved: true });
          break;
        case 'pending':
          andConditions.push({ resolved: false });
          andConditions.push({ assigned_user: null });
          andConditions.push(sequelize.where(ageDaysExpr, { [Op.lt]: SLA_ESCALATION_DAYS }));
          break;
        case 'in-progress':
          andConditions.push({ resolved: false });
          andConditions.push({ assigned_user: { [Op.not]: null } });
          andConditions.push(sequelize.where(ageDaysExpr, { [Op.lt]: SLA_ESCALATION_DAYS }));
          break;
        case 'escalated':
          andConditions.push({ resolved: false });
          andConditions.push(sequelize.where(ageDaysExpr, { [Op.gte]: SLA_ESCALATION_DAYS }));
          break;
        default:
          break;
      }
    }

    if (searchTerm) {
      const likeTerm = `%${searchTerm.replace(/[%_]/g, '\\$&')}%`;
      andConditions.push({
        [Op.or]: [
          { code: { [Op.like]: likeTerm } },
          { '$Customer.first_name$': { [Op.like]: likeTerm } },
          { '$Customer.last_name$': { [Op.like]: likeTerm } },
          { '$Customer.document_number$': { [Op.like]: likeTerm } }
        ]
      });
    }

    if (andConditions.length) {
      where[Op.and] = andConditions;
    }

    const { rows, count } = await Claim.findAndCountAll({
      where,
      include: [{ model: Customer }, { model: Tutor }, { model: ConsumptionType }, { model: ClaimType }, { model: Currency }, { model: Location, as: 'location' }],
      distinct: true,
      order: [['creation_date', 'DESC']],
      limit,
      offset
    });

    res.status(200).json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a claim by ID
exports.getClaimById = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }
    const claim = await Claim.findOne({
      where: { id: req.params.id, tenant_id: tenantId },
      include: [{ model: Customer }, { model: Tutor }, { model: ConsumptionType }, { model: ClaimType }, { model: Currency }, { model: Location, as: 'location' }]
    });

    if (!claim) {
      return res.status(404).json({ message: 'El reclamo no fue encontrado' });
    }

    res.status(200).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a claim
exports.updateClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }
    const claimData = req.body;

    // Handle attachment with original filename
    if (req.fileInfo && req.file) {
      claimData.attachment = req.fileInfo.filePath;
      claimData.attachment_original_name = normalizeOriginalName(req.file.originalname);
    }
    // Load original claim to compute changes
    const originalClaim = await Claim.findOne({ where: { id, tenant_id: tenantId } });
    if (!originalClaim) {
      return res.status(404).json({ message: 'El reclamo no fue encontrado' });
    }

    const [updated] = await Claim.update(claimData, { where: { id, tenant_id: tenantId } });
    if (!updated) {
      return res.status(404).json({ message: 'El reclamo no fue encontrado' });
    }

    const updatedClaim = await Claim.findOne({
      where: { id, tenant_id: tenantId },
      include: [{ model: Customer }, { model: ConsumptionType }, { model: ClaimType }, { model: Currency }]
    });

    // Compute a human-readable summary of what changed
    const fieldLabels = {
      description: 'Descripción',
      detail: 'Detalle',
      request: 'Solicitud',
      claimed_amount: 'Monto reclamado',
      order_number: 'Número de orden',
      attachment: 'Adjunto',
      response_attachment: 'Adjunto de respuesta',
      consumption_type_id: 'Tipo de consumo',
      claim_type_id: 'Tipo de reclamo',
      currency_id: 'Moneda',
      tutor_id: 'Tutor'
    };

    const formatVal = (val) => {
      if (val === null || val === undefined) return '—';
      if (typeof val === 'string') return val.trim() || '—';
      return String(val);
    };

    const changes = [];
    for (const key of Object.keys(fieldLabels)) {
      const oldVal = originalClaim[key];
      const newVal = updatedClaim[key];
      if (newVal !== undefined && oldVal !== newVal) {
        changes.push(`${fieldLabels[key]}: ${formatVal(oldVal)} → ${formatVal(newVal)}`);
      }
    }

    const emailData = {
      ...prepareEmailData(updatedClaim),
      updateDate: formatDate(updatedClaim.update_date),
      updateDescription: changes.length ? changes.join('; ') : 'Se actualizaron los datos del reclamo.',
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/claims/${updatedClaim.code}`
    };

    // Prepare attachments for email
    const attachments = req.fileInfo
      ? [{ filename: normalizeOriginalName(req.file.originalname), path: req.fileInfo.filePath }]
      : [];

    await claimNotifier.notifyClaimUpdated({
      tenant: req.tenant,
      claim: updatedClaim,
      emailData,
      attachments
    });

    return res.status(200).json({
      message: 'Tu reclamo fue actualizado correctamente',
      fileInfo: req.fileInfo
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a claim
exports.deleteClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }
    const deleted = await Claim.destroy({ where: { id, tenant_id: tenantId } });
    if (deleted) {
      return res.status(200).json({ message: 'El reclamo fue eliminado correctamente' });
    }
    throw new Error('Claim not found');
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el reclamo: ' + error.message });
  }
};

// Assign a claim
exports.assignClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_user } = req.body;
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    // Find the claim and assigned user simultaneously
    const [claim, user] = await Promise.all([
      Claim.findOne({
        where: { id, tenant_id: tenantId },
        include: [{ model: Customer }, { model: ConsumptionType }, { model: ClaimType }, { model: Currency }]
      }),
      User.findByPk(assigned_user)
    ]);

    if (!claim) {
      return res.status(404).json({ message: 'El reclamo no fue encontrado' });
    }

    if (!user) {
      return res.status(404).json({ message: 'El usuario no fue encontrado' });
    }

    const assigneeMembership = await UserTenant.findOne({ where: { user_id: user.id, tenant_id: tenantId } });
    if (!assigneeMembership) {
      return res.status(403).json({ message: 'El usuario asignado no pertenece a este tenant' });
    }

    claim.assigned_user = assigned_user;
    claim.assignment_date = new Date(); // Save the assignment date
    await claim.save();

    inAppNotificationService.notifyClaimAssigned({
      tenantId,
      userId: user.id,
      claim
    }).catch((err) => req.log?.error({ err }, 'Error creando notificacion de asignacion'));

    // Prepare data for email sending
    const emailData = {
      ...prepareEmailData(claim),
      assignedName: user.first_name,
      creationDate: formatDate(claim.creation_date),
      assignmentDate: formatDate(claim.assignment_date),
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/claims/${claim.code}`
    };

    await claimNotifier.notifyClaimAssigned({
      tenant: req.tenant,
      claim,
      assignee: user,
      emailData
    });

    res.status(200).json({
      message: `El reclamo ha sido asignado a ${user.first_name} ${user.last_name}`,
      assignedUser: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al asignar el reclamo: ' + error.message });
  }
};

// Resolve a claim
exports.resolveClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, resolved } = req.body;
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const claim = await Claim.findOne({
      where: { id, tenant_id: tenantId },
      include: [{ model: Customer }, { model: ConsumptionType }, { model: ClaimType }, { model: Currency }]
    });

    if (!claim) {
      return res.status(404).json({ message: 'El reclamo no fue encontrado' });
    }

    claim.response = response;
    claim.resolved = resolved;
    claim.response_date = new Date(); // Make sure to set the response date

    // Handle attachment
    if (req.fileInfo) {
      claim.response_attachment = req.fileInfo.filePath;
    }

    await claim.save();

    if (claim.assigned_user) {
      inAppNotificationService.notifyClaimResolved({
        tenantId,
        userId: claim.assigned_user,
        claim
      }).catch((err) => req.log?.error({ err }, 'Error creando notificacion de resolucion'));
    }

    // Prepare data for email sending
    const emailData = {
      ...prepareEmailData(claim),
      claimResponse: claim.response,
      creationDate: formatDate(claim.creation_date),
      responseDate: formatDate(claim.response_date),
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/claims/${claim.code}`
    };

    // Prepare attachments for email
    const attachments = req.fileInfo
      ? [{ filename: normalizeOriginalName(req.file.originalname), path: req.fileInfo.filePath }]
      : [];

    await claimNotifier.notifyClaimResolved({
      tenant: req.tenant,
      claim,
      emailData,
      attachments
    });

    res.status(200).json({
      message: 'Tu reclamo ha sido resuelto correctamente',
      fileInfo: req.fileInfo
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al resolver el reclamo: ' + error.message });
  }
};

// Create a public claim (no auth): creates/reuses customer/tutor within the tenant
exports.createPublicClaim = async (req, res) => {
  let transaction;
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const b = req.body || {};

    // Normalize types
    const claim_type_id = Number(b.claim_type_id);
    const consumption_type_id = Number(b.consumption_type_id);
    const currency_id = b.currency_id ? Number(b.currency_id) : null;
    const order_number = b.order_number ? Number(b.order_number) : null;
    const claimed_amount = b.claimed_amount ? Number(b.claimed_amount) : null;
    const is_younger = b.is_younger === true || b.is_younger === 'true';
    const person_type = b.person_type || 'natural';

    const customerPayload = {
      document_type_id: Number(b.document_type_id),
      document_number: String(b.document_number || '').trim(),
      first_name: b.first_name,
      last_name: b.last_name,
      email: b.email,
      phone: b.celphone || b.phone,
      address: b.address,
      is_younger,
      person_type,
      company_document: person_type === 'legal' ? b.company_document : null,
      company_name: person_type === 'legal' ? b.company_name : null,
      tenant_id: tenantId,
    };

    const hasTutorData = Boolean(
      b.document_number_tutor || b.first_name_tutor || b.last_name_tutor || b.email_tutor || b.celphone_tutor
    );

    const tutorPayload = hasTutorData || is_younger ? {
      document_type_id: b.document_type_tutor_id ? Number(b.document_type_tutor_id) : null,
      document_number: b.document_number_tutor ? String(b.document_number_tutor).trim() : null,
      first_name: b.first_name_tutor || null,
      last_name: b.last_name_tutor || null,
      email: b.email_tutor || null,
      phone: b.celphone_tutor || null,
      tenant_id: tenantId,
    } : null;

    // Validate required customer fields
    if (!customerPayload.document_type_id || !customerPayload.document_number || !customerPayload.first_name || !customerPayload.last_name || !customerPayload.email || !customerPayload.phone || !customerPayload.address) {
      return res.status(422).json({ message: 'Datos del cliente incompletos' });
    }

    // Validate catalogs
    const [consumptionType, claimType, currency] = await Promise.all([
      ConsumptionType.findByPk(consumption_type_id),
      ClaimType.findByPk(claim_type_id),
      currency_id ? Currency.findByPk(currency_id) : Promise.resolve(null)
    ]);

    if (!consumptionType || !claimType) {
      return res.status(404).json({ message: 'Uno o más registros de catálogo no fueron encontrados' });
    }

    // currency_id es opcional, pero si se envía debe ser válido
    if (currency_id && !currency) {
      return res.status(404).json({ message: 'La moneda especificada no existe' });
    }

    // Si hay claimed_amount, currency_id es requerido
    if (claimed_amount && !currency_id) {
      return res.status(422).json({ message: 'La moneda es obligatoria cuando se reclama un monto' });
    }

    // Find or create customer within tenant
    let customer = await Customer.findOne({ where: { document_number: customerPayload.document_number, tenant_id: tenantId } });
    if (!customer) {
      customer = await Customer.create(customerPayload);
    }

    // Find or create tutor if provided/required
    let tutor = null;
    if (tutorPayload && tutorPayload.document_number) {
      tutor = await Tutor.findOne({ where: { document_number: tutorPayload.document_number, tenant_id: tenantId } });
      if (!tutor) {
        tutor = await Tutor.create(tutorPayload);
      }
    }

    const claimData = {
      customer_id: customer.id,
      tutor_id: tutor ? tutor.id : null,
      consumption_type_id,
      claim_type_id,
      currency_id,
      order_number,
      claimed_amount,
      description: b.description,
      detail: b.detail,
      request: b.request,
      tenant_id: tenantId,
      location_id: b.location_id,
      district: b.district,
      province: b.province,
      department: b.department,
    };

    // Handle attachment
    if (req.fileInfo && req.file) {
      claimData.attachment = req.fileInfo.filePath;
      claimData.attachment_original_name = normalizeOriginalName(req.file.originalname);
    }

    transaction = await sequelize.transaction();

    // Create claim
    const claim = await Claim.create(claimData, { transaction });

    // Generate claim code
    const currentYear = new Date().getFullYear();
    const prefix = claimType.name.substring(0, 3).toUpperCase();
    const sequential = String(claim.id).padStart(6, '0');
    claim.code = `${prefix}-${currentYear}-${sequential}`;
    await claim.save({ transaction });

    await transaction.commit();

    // Reload for email data
    const completeClaim = await Claim.findByPk(claim.id, {
      include: [{ model: Customer }, { model: ConsumptionType }, { model: ClaimType }, { model: Currency }]
    });

    const emailData = {
      ...prepareEmailData(completeClaim),
      creationDate: formatDate(completeClaim.creation_date),
      ctaUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/claims/${claim.code}`,
      attachmentOriginalName: claim.attachment_original_name || ''
    };

    const attachments = req.fileInfo
      ? [{ filename: normalizeOriginalName(req.file.originalname), path: req.fileInfo.filePath }]
      : [];

    await claimNotifier.notifyClaimCreated({
      tenant: req.tenant,
      customer,
      claim,
      emailData,
      attachments
    });

    await inAppNotificationService.notifyNewClaim({
      tenantId,
      claim,
      customer,
      preferredUserIds: claim.assigned_user ? [claim.assigned_user] : []
    });

    res.status(201).json({
      message: 'Tu reclamo fue registrado correctamente',
      code: claim.code,
      fileInfo: req.fileInfo
    });
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        req.log?.error({ rollbackError }, 'Error realizando rollback de createPublicClaim');
      }
    }

    req.log?.error({ error, tenant_id: req.tenant?.id }, 'Error creando reclamo público');
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUBLIC: Get claim by code (tenant scoped)
 * Code pattern: REC-YYYY-###### or QUE-YYYY-######
 */
exports.getPublicClaimByCode = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const code = (req.params.code || '').toUpperCase().trim();
    const codePattern = /^(REC|QUE)-\d{4}-\d{6}$/;
    if (!codePattern.test(code)) {
      return res.status(400).json({ message: 'Código inválido. Formato esperado: REC-YYYY-######' });
    }

    const claim = await Claim.findOne({
      where: { code, tenant_id: tenantId },
      attributes: ['id', 'code', 'status', 'resolved', 'creation_date', 'update_date'],
      include: [{ model: ClaimType, attributes: ['id', 'name'] }]
    });

    if (!claim) {
      return res.status(404).json({ message: 'El reclamo no fue encontrado' });
    }

    return res.status(200).json({
      code: claim.code,
      status: claim.status,
      resolved: claim.resolved,
      createdAt: claim.creation_date,
      updatedAt: claim.update_date,
      claimType: claim.ClaimType?.name || null
    });
  } catch (error) {
    req.log?.error({ error }, 'Error consultando reclamo por código (público)');
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};