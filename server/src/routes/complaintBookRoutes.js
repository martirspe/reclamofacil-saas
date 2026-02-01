const express = require('express');
const router = express.Router();
const complaintBookController = require('../controllers/complaintBookController');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const membershipMiddleware = require('../middlewares/membershipMiddleware');
const requireTenantRole = require('../middlewares/requireTenantRole');

// Ruta pública para obtener el primer libro de reclamaciones del tenant
router.get('/public/active', tenantMiddleware, complaintBookController.getActiveComplaintBook);

// Rutas protegidas (requieren autenticación y rol)
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(membershipMiddleware);

router.get('/', requireTenantRole('owner', 'admin'), complaintBookController.getAll);
router.get('/:id', requireTenantRole('owner', 'admin'), complaintBookController.getById);
router.post('/', requireTenantRole('owner', 'admin'), complaintBookController.create);
router.put('/:id', requireTenantRole('owner', 'admin'), complaintBookController.update);
router.delete('/:id', requireTenantRole('owner', 'admin'), complaintBookController.remove);

module.exports = router;
