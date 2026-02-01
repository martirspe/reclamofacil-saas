const sendEmail = require('./emailService');

/**
 * Envío centralizado de notificaciones de reclamos.
 * Cada método atrapa sus propios errores para no bloquear el flujo de negocio.
 */

const safeSend = async (fn) => {
  try {
    await fn();
  } catch (err) {
    console.error('Error enviando notificación de reclamo:', err);
  }
};

exports.notifyClaimCreated = async ({ tenant, customer, claim, emailData, attachments = [] }) => {
  await safeSend(async () => {
    await sendEmail({
      to: customer.email,
      subject: `Reclamo Registrado - ${claim.code}`,
      text: `Hola ${customer.first_name}, se ha registrado su reclamo con el código: ${claim.code}.`,
      templateName: 'newClaim',
      templateType: 'customer',
      replacements: emailData,
      attachments,
      tenant
    });

    if (tenant?.contact_email) {
      await sendEmail({
        to: tenant.contact_email,
        subject: `[NUEVO] Reclamo Registrado - ${claim.code}`,
        text: `Se ha registrado un nuevo reclamo. Código: ${claim.code}. Cliente: ${customer.first_name} ${customer.last_name}. Monto: ${emailData.claimedAmount}`,
        templateName: 'newClaimAlert',
        templateType: 'staff',
        replacements: emailData,
        attachments: [],
        tenant
      });
    }
  });
};

exports.notifyClaimAssigned = async ({ tenant, claim, assignee, emailData }) => {
  await safeSend(async () => {
    await sendEmail({
      to: assignee.email,
      subject: `[ASIGNADO] Reclamo Asignado - ${claim.code}`,
      text: `Hola ${assignee.first_name}, se le ha asignado el reclamo con el código: ${claim.code}.`,
      templateName: 'claimAssigned',
      templateType: 'staff',
      replacements: emailData,
      attachments: [],
      tenant
    });

    if (tenant?.contact_email) {
      await sendEmail({
        to: tenant.contact_email,
        subject: `[ASIGNADO] Reclamo Asignado - ${claim.code}`,
        text: `El reclamo ${claim.code} ha sido asignado a ${assignee.first_name} ${assignee.last_name}.`,
        templateName: 'claimAssigned',
        templateType: 'staff',
        replacements: emailData,
        attachments: [],
        tenant
      });
    }

    // Notificar al cliente que su reclamo fue asignado
    if (claim?.Customer?.email) {
      await sendEmail({
        to: claim.Customer.email,
        subject: `Reclamo Asignado - ${claim.code}`,
        text: `Hola ${claim.Customer.first_name}, tu reclamo con el código ${claim.code} fue asignado a un miembro del equipo.`,
        templateName: 'claimAssigned',
        templateType: 'customer',
        replacements: emailData,
        attachments: [],
        tenant
      });
    }
  });
};

exports.notifyClaimResolved = async ({ tenant, claim, emailData, attachments = [] }) => {
  await safeSend(async () => {
    await sendEmail({
      to: claim.Customer.email,
      subject: `Reclamo Resuelto - ${claim.code}`,
      text: `Hola ${claim.Customer.first_name}, su reclamo con el código: ${claim.code} ha sido resuelto.`,
      templateName: 'claimResolved',
      templateType: 'customer',
      replacements: emailData,
      attachments,
      tenant
    });

    if (tenant?.contact_email) {
      await sendEmail({
        to: tenant.contact_email,
        subject: `[RESUELTO] Reclamo Resuelto - ${claim.code}`,
        text: `El reclamo ${claim.code} del cliente ${claim.Customer.first_name} ${claim.Customer.last_name} ha sido resuelto.`,
        templateName: 'claimResolved',
        templateType: 'staff',
        replacements: emailData,
        attachments: [],
        tenant
      });
    }
  });
};

exports.notifyClaimUpdated = async ({ tenant, claim, emailData, attachments = [] }) => {
  await safeSend(async () => {
    await sendEmail({
      to: claim.Customer.email,
      subject: `Reclamo Actualizado - ${claim.code}`,
      text: `Hola ${claim.Customer.first_name}, su reclamo con el código: ${claim.code} ha sido actualizado.`,
      templateName: 'updatedClaim',
      templateType: 'customer',
      replacements: emailData,
      attachments,
      tenant
    });

    if (tenant?.contact_email) {
      await sendEmail({
        to: tenant.contact_email,
        subject: `[ACTUALIZADO] Reclamo Actualizado - ${claim.code}`,
        text: `El reclamo ${claim.code} del cliente ${claim.Customer.first_name} ${claim.Customer.last_name} fue actualizado.`,
        templateName: 'updatedClaim',
        templateType: 'staff',
        replacements: emailData,
        attachments: [],
        tenant
      });
    }
  });
};
