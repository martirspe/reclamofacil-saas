const express = require('express');
const router = express.Router();
const phoneCountryController = require('../controllers/phoneCountryController');
const authMiddleware = require('../middlewares/authMiddleware');
const superadminMiddleware = require('../middlewares/superadminMiddleware');

router.get('/', phoneCountryController.getAllPhoneCountries);
router.get('/:id', phoneCountryController.getById);

router.post('/', authMiddleware, superadminMiddleware, phoneCountryController.create);
router.put('/:id', authMiddleware, superadminMiddleware, phoneCountryController.update);
router.delete('/:id', authMiddleware, superadminMiddleware, phoneCountryController.remove);

module.exports = router;