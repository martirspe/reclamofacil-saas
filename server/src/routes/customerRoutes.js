const express = require('express');

// Customer controller
const {
  createCustomer,
  getCustomers,
  getCustomerByDocument,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');

const router = express.Router();
const { validateCustomerCreate, validateCustomerUpdate } = require('../middlewares/validationMiddleware');
const { apiKeyOrJwt, auditMiddleware, limitResourceCreation } = require('../middlewares');

// All customer routes require authentication and tenant context
// Public-facing (can be accessed via API key or JWT)
// Routes are scoped by tenant slug in URL

// Create a new customer
// Priority 2: Audit middleware logs customer creation
// Priority 3: Resource limit checks free tier quota (max 50 customers)
router.post('/tenants/:slug/customers', 
  apiKeyOrJwt, 
  limitResourceCreation('maxCustomers', 'Customer'),
  auditMiddleware('CREATE', 'Customer'),
  validateCustomerCreate, 
  createCustomer
);

// Get all customers (scoped to tenant)
router.get('/tenants/:slug/customers', apiKeyOrJwt, getCustomers);

// Get a customer by document number (scoped to tenant)
router.get('/tenants/:slug/customers/document/:document_number', apiKeyOrJwt, getCustomerByDocument);

// Get a customer by ID (scoped to tenant)
router.get('/tenants/:slug/customers/:id', apiKeyOrJwt, getCustomerById);

// Update a customer
// Priority 2: Audit middleware logs customer modifications
router.put('/tenants/:slug/customers/:id', 
  apiKeyOrJwt, 
  auditMiddleware('UPDATE', 'Customer'),
  validateCustomerUpdate, 
  updateCustomer
);

// Delete a customer
// Priority 2: Audit middleware logs customer deletion
router.delete('/tenants/:slug/customers/:id', 
  apiKeyOrJwt, 
  auditMiddleware('DELETE', 'Customer'),
  deleteCustomer
);

module.exports = router;
