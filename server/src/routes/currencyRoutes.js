const express = require('express');

// Currency controller
const {
  getCurrencies,
  getCurrencyById,
  createCurrency,
  updateCurrency,
  deleteCurrency
} = require('../controllers/currencyController');

const router = express.Router();

// Get all currencies
router.get('/currencies', getCurrencies);

// Get a currency by ID
router.get('/currencies/:id', getCurrencyById);

// Create a new currency (Admin only)
router.post('/currencies', createCurrency);

// Update a currency (Admin only)
router.put('/currencies/:id', updateCurrency);

// Delete a currency (Admin only)
router.delete('/currencies/:id', deleteCurrency);

module.exports = router;
