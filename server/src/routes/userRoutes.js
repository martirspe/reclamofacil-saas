const express = require('express');

// User controller
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { authMiddleware, tenantMiddleware, membershipMiddleware, requireTenantRole, rateLimitTenant, auditMiddleware } = require('../middlewares');

const router = express.Router();

// Create a new user (tenant scoped)
router.post('/tenants/:slug/users', authMiddleware, tenantMiddleware, membershipMiddleware, rateLimitTenant, requireTenantRole('admin'), auditMiddleware('user:create'), createUser);

// Get all users for tenant
router.get('/tenants/:slug/users', authMiddleware, tenantMiddleware, membershipMiddleware, rateLimitTenant, requireTenantRole('admin'), getUsers);

// Get a user by ID (tenant scoped)
router.get('/tenants/:slug/users/:id', authMiddleware, tenantMiddleware, membershipMiddleware, rateLimitTenant, requireTenantRole('admin'), getUserById);

// Update a user
router.put('/tenants/:slug/users/:id', authMiddleware, tenantMiddleware, membershipMiddleware, rateLimitTenant, requireTenantRole('admin'), auditMiddleware('user:update'), updateUser);

// Delete a user
router.delete('/tenants/:slug/users/:id', authMiddleware, tenantMiddleware, membershipMiddleware, rateLimitTenant, requireTenantRole('admin'), auditMiddleware('user:delete'), deleteUser);

module.exports = router;
