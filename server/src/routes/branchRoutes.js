const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const membershipMiddleware = require('../middlewares/membershipMiddleware');
const requireTenantRole = require('../middlewares/requireTenantRole');

// Apply authentication, tenant, and membership validation before role checks
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(membershipMiddleware);

router.get('/', requireTenantRole('owner', 'admin'), branchController.getAll);
router.get('/:id', requireTenantRole('owner', 'admin'), branchController.getById);
router.post('/', requireTenantRole('owner', 'admin'), branchController.create);
router.put('/:id', requireTenantRole('owner', 'admin'), branchController.update);
router.delete('/:id', requireTenantRole('owner', 'admin'), branchController.remove);

module.exports = router;
