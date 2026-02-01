// Data Model
const { DocumentType } = require('../models');

// Create a new document type
exports.createDocumentType = async (req, res) => {
  try {
    const { name } = req.body;
    const newDocumentType = await DocumentType.create({ name });
    res.status(201).json({ message: 'Tipo de documento registrado correctamente', data: newDocumentType });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el tipo de documento: ' + error.message });
  }
};

// Get all document types
exports.getDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await DocumentType.findAll();

    // Check if there are registered document types
    if (documentTypes.length === 0) {
      return res.status(404).json({ message: 'No hay tipos de documento registrados' });
    }

    res.status(200).json(documentTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tipos de documento: ' + error.message });
  }
};

// Get a document type by ID
exports.getDocumentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const documentType = await DocumentType.findByPk(id);
    if (!documentType) {
      return res.status(404).json({ message: 'El tipo de documento no fue encontrado' });
    }
    res.status(200).json(documentType);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el tipo de documento: ' + error.message });
  }
};

// Update a document type
exports.updateDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const documentType = await DocumentType.findByPk(id);
    if (!documentType) {
      return res.status(404).json({ message: 'El tipo de documento no fue encontrado' });
    }
    documentType.name = name;
    await documentType.save();
    res.status(200).json({ message: 'Tipo de documento actualizado correctamente', data: documentType });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el tipo de documento: ' + error.message });
  }
};

// Delete a document type
exports.deleteDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DocumentType.destroy({ where: { id } });
    if (deleted) {
      return res.status(200).json({ message: "El tipo de documento fue eliminado correctamente" });
    }
    throw new Error("Document type not found");
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el tipo de documento: ' + error.message });
  }
};