const express = require('express');

// Document type controller
const {
  createDocumentType,
  getDocumentTypes,
  getDocumentTypeById,
  updateDocumentType,
  deleteDocumentType
} = require('../controllers/documentTypeController');

const router = express.Router();

// Create a new document type
router.post('/document_types', createDocumentType);

// Get all document types
router.get('/document_types', getDocumentTypes);

// Get a document type by ID
router.get('/document_types/:id', getDocumentTypeById);

// Update a document type
router.put('/document_types/:id', updateDocumentType);

// Delete a document type
router.delete('/document_types/:id', deleteDocumentType);

module.exports = router;
