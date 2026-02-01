const express = require('express');

// Claim type controller
const {
  createClaimType,
  getClaimTypes,
  getClaimTypeById,
  updateClaimType,
  deleteClaimType
} = require('../controllers/claimTypeController');

const router = express.Router();

// Create a new claim type
router.post('/claim_types', createClaimType);

// Get all claim types
router.get('/claim_types', getClaimTypes);

// Get a claim type by ID
router.get('/claim_types/:id', getClaimTypeById);

// Update a claim type
router.put('/claim_types/:id', updateClaimType);

// Delete a claim type
router.delete('/claim_types/:id', deleteClaimType);

module.exports = router;
