const express = require('express');

// Location controller
const {
  createLocation,
  getLocations,
  getDepartments,
  getProvincesByDepartment,
  getDistrictsByProvince,
  getLocationById,
  getLocationByUbigeo,
  updateLocation,
  deleteLocation
} = require('../controllers/locationController');

// Middlewares
const authMiddleware = require('../middlewares/authMiddleware');
const superadminMiddleware = require('../middlewares/superadminMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');

const router = express.Router();

// Public routes (for complaint form)
// Note: Dynamic search queries should NOT be cached
router.get('/locations', getLocations); // No cache para búsquedas dinámicas
router.get('/locations/departments', cacheMiddleware(3600), getDepartments);
router.get('/locations/departments/:department/provinces', cacheMiddleware(3600), getProvincesByDepartment);
router.get('/locations/departments/:department/provinces/:province/districts', cacheMiddleware(3600), getDistrictsByProvince);
router.get('/locations/:id', cacheMiddleware(3600), getLocationById);
router.get('/locations/ubigeo/:ubigeo', cacheMiddleware(3600), getLocationByUbigeo);

// Protected routes (admin only)
router.post('/locations', authMiddleware, superadminMiddleware, createLocation);
router.put('/locations/:id', authMiddleware, superadminMiddleware, updateLocation);
router.delete('/locations/:id', authMiddleware, superadminMiddleware, deleteLocation);

module.exports = router;
