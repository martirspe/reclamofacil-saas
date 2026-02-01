const express = require('express');

// Tutor controller
const {
  createTutor,
  getTutors,
  getTutorByDocument,
  getTutorById,
  updateTutor,
  deleteTutor
} = require('../controllers/tutorController');

const router = express.Router();
const { validateTutorCreate, validateTutorUpdate } = require('../middlewares/validationMiddleware');
const { apiKeyOrJwt, auditMiddleware, limitResourceCreation } = require('../middlewares');

// All tutor routes require authentication and tenant context
// Public-facing (can be accessed via API key or JWT)
// Routes are scoped by tenant slug in URL

// Create a new tutor
// Priority 2: Audit middleware logs tutor creation
// Priority 3: Resource limit checks free tier quota (max 5 tutors)
router.post('/tenants/:slug/tutors', 
  apiKeyOrJwt, 
  limitResourceCreation('maxTutors', 'Tutor'),
  auditMiddleware('CREATE', 'Tutor'),
  validateTutorCreate, 
  createTutor
);

// Get all tutors (scoped to tenant)
router.get('/tenants/:slug/tutors', apiKeyOrJwt, getTutors);

// Get a tutor by document number (scoped to tenant)
router.get('/tenants/:slug/tutors/document/:document_number', apiKeyOrJwt, getTutorByDocument);

// Get a tutor by ID (scoped to tenant)
router.get('/tenants/:slug/tutors/:id', apiKeyOrJwt, getTutorById);

// Update a tutor
// Priority 2: Audit middleware logs tutor modifications
router.put('/tenants/:slug/tutors/:id', 
  apiKeyOrJwt, 
  auditMiddleware('UPDATE', 'Tutor'),
  validateTutorUpdate, 
  updateTutor
);

// Delete a tutor
// Priority 2: Audit middleware logs tutor deletion
router.delete('/tenants/:slug/tutors/:id', 
  apiKeyOrJwt, 
  auditMiddleware('DELETE', 'Tutor'),
  deleteTutor
);

module.exports = router;
