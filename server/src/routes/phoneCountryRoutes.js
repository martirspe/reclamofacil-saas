const express = require('express');
const router = express.Router();
const phoneCountryController = require('../controllers/phoneCountryController');

router.get('/', phoneCountryController.getAllPhoneCountries);

module.exports = router;