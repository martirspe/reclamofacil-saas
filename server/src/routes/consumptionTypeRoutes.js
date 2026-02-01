const express = require('express');

// Consumption type controller
const {
  createConsumptionType,
  getConsumptionTypes,
  getConsumptionTypeById,
  updateConsumptionType,
  deleteConsumptionType
} = require('../controllers/consumptionTypeController');

const router = express.Router();

// Create a new type of consumption
router.post('/consumption_types', createConsumptionType);

// Get all consumption types
router.get('/consumption_types', getConsumptionTypes);

// Get a consumption type by ID
router.get('/consumption_types/:id', getConsumptionTypeById);

// Update a consumption type
router.put('/consumption_types/:id', updateConsumptionType);

// Delete a type of consumption
router.delete('/consumption_types/:id', deleteConsumptionType);

module.exports = router;
