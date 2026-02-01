const { body, param, validationResult } = require('express-validator');

// Common error handler for validations
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(422).json({
    message: 'Validación fallida. Por favor revisa los campos',
    errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
  });
};

// Regex helpers
const DIGITS = count => new RegExp(`^\\d{${count}}$`);
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;

// Customer validators
const validateCustomerCreate = [
  body('document_type_id').isInt().withMessage('document_type_id must be an integer').toInt(),
  body('document_number').custom(val => DIGITS(8).test(String(val))).withMessage('document_number must have 8 digits'),
  body('first_name').isString().isLength({ min: 1 }).withMessage('first_name is required').matches(NAME_REGEX).withMessage('first_name contains invalid characters'),
  body('last_name').isString().isLength({ min: 1 }).withMessage('last_name is required').matches(NAME_REGEX).withMessage('last_name contains invalid characters'),
  body('email').isEmail().withMessage('email must be valid').normalizeEmail(),
  body('phone').custom(val => DIGITS(9).test(String(val))).withMessage('phone must have 9 digits'),
  body('address').isString().isLength({ min: 15 }).withMessage('address must be at least 15 characters'),
  body('is_younger').optional().isBoolean().withMessage('is_younger must be boolean').toBoolean(),
  handleValidationErrors,
];

const validateCustomerUpdate = [
  param('id').isInt().withMessage('id param must be integer').toInt(),
  body('document_type_id').optional().isInt().withMessage('document_type_id must be an integer').toInt(),
  body('document_number').optional().custom(val => DIGITS(8).test(String(val))).withMessage('document_number must have 8 digits'),
  body('first_name').optional().isString().matches(NAME_REGEX).withMessage('first_name contains invalid characters'),
  body('last_name').optional().isString().matches(NAME_REGEX).withMessage('last_name contains invalid characters'),
  body('email').optional().isEmail().withMessage('email must be valid').normalizeEmail(),
  body('phone').optional().custom(val => DIGITS(9).test(String(val))).withMessage('phone must have 9 digits'),
  body('address').optional().isString().isLength({ min: 15 }).withMessage('address must be at least 15 characters'),
  body('is_younger').optional().isBoolean().withMessage('is_younger must be boolean').toBoolean(),
  handleValidationErrors,
];

// Tutor validators
const validateTutorCreate = [
  body('document_type_id').isInt().withMessage('document_type_id must be an integer').toInt(),
  body('document_number').custom(val => DIGITS(8).test(String(val))).withMessage('document_number must have 8 digits'),
  body('first_name').isString().isLength({ min: 1 }).withMessage('first_name is required').matches(NAME_REGEX).withMessage('first_name contains invalid characters'),
  body('last_name').isString().isLength({ min: 1 }).withMessage('last_name is required').matches(NAME_REGEX).withMessage('last_name contains invalid characters'),
  body('email').isEmail().withMessage('email must be valid').normalizeEmail(),
  body('phone').custom(val => DIGITS(9).test(String(val))).withMessage('phone must have 9 digits'),
  handleValidationErrors,
];

const validateTutorUpdate = [
  param('id').isInt().withMessage('id param must be integer').toInt(),
  body('document_type_id').optional().isInt().withMessage('document_type_id must be an integer').toInt(),
  body('document_number').optional().custom(val => DIGITS(8).test(String(val))).withMessage('document_number must have 8 digits'),
  body('first_name').optional().isString().matches(NAME_REGEX).withMessage('first_name contains invalid characters'),
  body('last_name').optional().isString().matches(NAME_REGEX).withMessage('last_name contains invalid characters'),
  body('email').optional().isEmail().withMessage('email must be valid').normalizeEmail(),
  body('phone').optional().custom(val => DIGITS(9).test(String(val))).withMessage('phone must have 9 digits'),
  handleValidationErrors,
];

// Claim validators
const validateClaimCreate = [
  body('customer_id').isInt().withMessage('customer_id must be integer').toInt(),
  body('tutor_id').optional({ nullable: true }).isInt().withMessage('tutor_id must be integer').toInt(),
  body('claim_type_id').isInt().withMessage('claim_type_id must be integer').toInt(),
  body('consumption_type_id').isInt().withMessage('consumption_type_id must be integer').toInt(),
  body('currency_id').optional({ nullable: true }).isInt().withMessage('currency_id must be integer').toInt(),
  body('order_number').optional().isInt().withMessage('order_number must be integer').toInt(),
  body('claimed_amount').optional({ nullable: true }).isFloat().withMessage('claimed_amount must be a number').toFloat(),
  body('description').isString().isLength({ min: 100, max: 3000 }).withMessage('description must be between 100 and 3000 characters'),
  body('detail').isString().isLength({ min: 50, max: 1000 }).withMessage('detail must be between 50 and 1000 characters'),
  body('request').isString().isLength({ min: 50, max: 1000 }).withMessage('request must be between 50 and 1000 characters'),
  body('address').optional({ nullable: true }).isString().isLength({ min: 15, max: 150 }).withMessage('address must be between 15 and 150 characters'),
  handleValidationErrors,
];

// Public claim validators (no auth, includes customer/tutor data)
const validatePublicClaim = [
  body('person_type').isIn(['natural', 'legal']).withMessage('person_type must be natural or legal'),
  body('document_type_id').isInt().withMessage('document_type_id must be an integer').toInt(),
  body('document_number').isString().isLength({ min: 6, max: 20 }).withMessage('document_number is required'),
  body('first_name').isString().isLength({ min: 1 }).withMessage('first_name is required').matches(NAME_REGEX).withMessage('first_name contains invalid characters'),
  body('last_name').isString().isLength({ min: 1 }).withMessage('last_name is required').matches(NAME_REGEX).withMessage('last_name contains invalid characters'),
  body('email').isEmail().withMessage('email must be valid').normalizeEmail(),
  body('celphone').isString().isLength({ min: 9, max: 15 }).withMessage('celphone must have at least 9 digits'),
  body('address').isString().isLength({ min: 15 }).withMessage('address must be at least 15 characters'),
  body('is_younger').optional().isBoolean().withMessage('is_younger must be boolean').toBoolean(),
  // company_document = RUC (Perú specific). If expanding to other countries, add company_document_type field
  body('company_document')
    .if(body('person_type').equals('legal'))
    .notEmpty()
    .withMessage('company_document (RUC) is required for legal persons')
    .isLength({ min: 11, max: 11 })
    .withMessage('RUC must have 11 digits (Perú)')
    .isNumeric()
    .withMessage('RUC must contain only numbers'),
  body('company_name').if(body('person_type').equals('legal')).notEmpty().withMessage('company_name is required for legal persons'),

  body('claim_type_id').isInt().withMessage('claim_type_id must be integer').toInt(),
  body('consumption_type_id').isInt().withMessage('consumption_type_id must be integer').toInt(),
  body('currency_id').optional({ nullable: true }).isInt().withMessage('currency_id must be integer').toInt(),
  body('order_number').optional().isInt().withMessage('order_number must be integer').toInt(),
  body('claimed_amount').optional().isFloat().withMessage('claimed_amount must be a number').toFloat(),
  body('description').isString().isLength({ min: 100 }).withMessage('description must be at least 100 characters'),
  body('detail').isString().isLength({ min: 50 }).withMessage('detail must be at least 50 characters'),
  body('request').isString().isLength({ min: 50 }).withMessage('request must be at least 50 characters'),

  // Tutor data optional
  body('document_type_tutor_id').optional().isInt().withMessage('document_type_tutor_id must be integer').toInt(),
  body('document_number_tutor').optional().isString().isLength({ min: 6, max: 20 }).withMessage('document_number_tutor is invalid'),
  body('first_name_tutor').optional().isString().matches(NAME_REGEX).withMessage('first_name_tutor contains invalid characters'),
  body('last_name_tutor').optional().isString().matches(NAME_REGEX).withMessage('last_name_tutor contains invalid characters'),
  body('email_tutor').optional().isEmail().withMessage('email_tutor must be valid').normalizeEmail(),
  body('celphone_tutor').optional().isString().isLength({ min: 9, max: 15 }).withMessage('celphone_tutor must have at least 9 digits'),

  handleValidationErrors,
];

const validateClaimUpdate = [
  param('id').isInt().withMessage('id param must be integer').toInt(),
  body('claim_type_id').optional().isInt().withMessage('claim_type_id must be integer').toInt(),
  body('consumption_type_id').optional().isInt().withMessage('consumption_type_id must be integer').toInt(),
  body('currency_id').optional({ nullable: true }).isInt().withMessage('currency_id must be integer').toInt(),
  body('order_number').optional().isInt().withMessage('order_number must be integer').toInt(),
  body('claimed_amount').optional({ nullable: true }).isFloat().withMessage('claimed_amount must be a number').toFloat(),
  body('description').optional().isString().isLength({ min: 100, max: 3000 }).withMessage('description must be between 100 and 3000 characters'),
  body('detail').optional().isString().isLength({ min: 50, max: 1000 }).withMessage('detail must be between 50 and 1000 characters'),
  body('request').optional().isString().isLength({ min: 50, max: 1000 }).withMessage('request must be between 50 and 1000 characters'),
  body('address').optional({ nullable: true }).isString().isLength({ min: 15, max: 150 }).withMessage('address must be between 15 and 150 characters'),
  handleValidationErrors,
];

const validateClaimAssign = [
  param('id').isInt().withMessage('id param must be integer').toInt(),
  body('assigned_user').isInt().withMessage('assigned_user must be integer').toInt(),
  handleValidationErrors,
];

const validateClaimResolve = [
  param('id').isInt().withMessage('id param must be integer').toInt(),
  body('response').isString().isLength({ min: 1 }).withMessage('response is required'),
  body('resolved').isBoolean().withMessage('resolved must be boolean').toBoolean(),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateCustomerCreate,
  validateCustomerUpdate,
  validateTutorCreate,
  validateTutorUpdate,
  validateClaimCreate,
  validatePublicClaim,
  validateClaimUpdate,
  validateClaimAssign,
  validateClaimResolve,
};
