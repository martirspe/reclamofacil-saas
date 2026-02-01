// Data Models
const { Tutor, DocumentType } = require('../models');

// Create a new tutor
exports.createTutor = async (req, res) => {
  try {
    const { document_type_id, document_number, email, phone } = req.body;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    // Verify if document_type_id exists in document_types
    const existingDocumentType = await DocumentType.findByPk(document_type_id);
    if (!existingDocumentType) {
      return res.status(404).json({ message: "El tipo de documento no existe" });
    }

    // Verify if document_number already exists in another tutor in this tenant
    const existingDocumentNumber = await Tutor.findOne({ where: { document_number, tenant_id: tenantId } });
    if (existingDocumentNumber) {
      return res.status(409).json({ message: 'Este número de documento ya está registrado' });
    }

    // Verify if email already exists in another tutor in this tenant
    const existingEmail = await Tutor.findOne({ where: { email, tenant_id: tenantId } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Este correo electrónico ya está registrado' });
    }

    // Verify if phone already exists in another tutor in this tenant
    const existingPhone = await Tutor.findOne({ where: { phone, tenant_id: tenantId } });
    if (existingPhone) {
      return res.status(409).json({ message: 'Este número de teléfono ya está registrado' });
    }

    // Create the tutor if no duplicates exist
    const tutor = await Tutor.create({ ...req.body, tenant_id: tenantId });
    res.status(201).json({ message: 'Tutor registrado correctamente', data: tutor });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el tutor: ' + error.message });
  }
};

// Get all tutors
exports.getTutors = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const tutors = await Tutor.findAll({
      where: { tenant_id: tenantId },
      include: [{ model: DocumentType }]
    });

    // Verify if there are registered tutors
    if (tutors.length === 0) {
      return res.status(404).json({ message: 'No hay tutores registrados' });
    }

    res.status(200).json(tutors);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tutores: ' + error.message });
  }
};

// Get a tutor by document number
exports.getTutorByDocument = async (req, res) => {
  try {
    const { document_number } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const tutor = await Tutor.findOne({
      where: { document_number, tenant_id: tenantId },
      include: [{ model: DocumentType }]
    });

    if (!tutor) {
      return res.status(404).json({ message: "El tutor no fue encontrado" });
    }

    res.status(200).json(tutor);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el tutor: ' + error.message });
  }
};

// Get a tutor by ID
exports.getTutorById = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const tutor = await Tutor.findOne({
      where: { id: req.params.id, tenant_id: tenantId },
      include: [{ model: DocumentType }]
    });

    // Verify if the tutor exists
    if (!tutor) {
      return res.status(404).json({ message: "El tutor no fue encontrado" });
    }

    res.status(200).json(tutor);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el tutor: ' + error.message });
  }
};

// Update a tutor
exports.updateTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const { document_number, email, phone } = req.body;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    // Verify if the tutor exists in this tenant
    const tutor = await Tutor.findOne({ where: { id, tenant_id: tenantId } });
    if (!tutor) {
      return res.status(404).json({ message: 'El tutor no fue encontrado' });
    }

    // Verify if document_number is already in use by another tutor (if provided)
    if (document_number) {
      const existingDocumentNumber = await Tutor.findOne({ where: { document_number, tenant_id: tenantId } });
      if (existingDocumentNumber && existingDocumentNumber.id !== parseInt(id)) {
        return res.status(409).json({ message: 'Este número de documento ya está registrado' });
      }
    }

    // Verify if email is already in use by another tutor (if provided)
    if (email) {
      const existingEmail = await Tutor.findOne({ where: { email, tenant_id: tenantId } });
      if (existingEmail && existingEmail.id !== parseInt(id)) {
        return res.status(409).json({ message: 'Este correo electrónico ya está registrado' });
      }
    }

    // Verify if phone is already in use by another tutor (if provided)
    if (phone) {
      const existingPhone = await Tutor.findOne({ where: { phone, tenant_id: tenantId } });
      if (existingPhone && existingPhone.id !== parseInt(id)) {
        return res.status(409).json({ message: 'Este número de teléfono ya está registrado' });
      }
    }

    // Update the tutor if no duplicates exist
    const [updated] = await Tutor.update(req.body, { where: { id, tenant_id: tenantId } });
    if (updated) {
      const updatedTutor = await Tutor.findOne({ where: { id, tenant_id: tenantId } });
      return res.status(200).json({ message: 'Tutor actualizado correctamente', data: updatedTutor });
    }

    return res.status(404).json({ message: "El tutor no fue encontrado" });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el tutor: ' + error.message });
  }
};

// Delete a tutor
exports.deleteTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant context requerido' });
    }

    const deleted = await Tutor.destroy({ where: { id, tenant_id: tenantId } });

    // Show a message if the tutor is deleted
    if (deleted) {
      return res.status(200).json({ message: "El tutor fue eliminado correctamente" });
    }

    throw new Error("Tutor not found");
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el tutor: ' + error.message });
  }
};
