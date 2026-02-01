const multer = require('multer');
const createUpload = require('../config/multer');

// Settings for different types of file uploads
const uploadConfigs = {
  logos: { 
    path: 'uploads/logos', 
    fileTypes: /jpeg|jpg|png/, 
    errorMessage: 'Only image files (jpeg, jpg, png) are allowed',
    required: true
  },
  claims: { 
    path: 'uploads/claims', 
    fileTypes: /jpeg|jpg|png|pdf/, 
    errorMessage: 'Only image (jpeg, jpg, png) and PDF files are allowed',
    required: false
  }
};

// Create a middleware to handle file uploads
const createUploadMiddleware = (config, fieldName) => {
  const upload = createUpload(config.path, config.fileTypes, config.errorMessage);

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'The file is too large. The maximum size is 5MB.' });
        } else {
          return res.status(400).json({ message: err.message });
        }
      } else if (err) {
        return res.status(400).json({ message: config.errorMessage });
      }

      if (req.file) {
        req.fileInfo = {
          message: 'File uploaded successfully',
          filePath: req.file.path
        };
      } else if (config.required) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      next();
    });
  };
};

// Middleware to load company logos
const uploadLogo = createUploadMiddleware(uploadConfigs.logos, 'file');

// Middleware for uploading claim attachments
const uploadClaim = createUploadMiddleware(uploadConfigs.claims, 'attachment');

// Middleware for uploading attachments in claim responses
const uploadResolveClaim = createUploadMiddleware(uploadConfigs.claims, 'response_attachment');

// Middleware for tenant assets (logos, favicon) — optional files
const uploadBranding = (() => {
  const upload = createUpload(uploadConfigs.logos.path, uploadConfigs.logos.fileTypes, uploadConfigs.logos.errorMessage);
  return upload.fields([
    { name: 'logo_light', maxCount: 1 },
    { name: 'logo_dark', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
  ]);
})();

module.exports = { uploadLogo, uploadClaim, uploadResolveClaim, uploadBranding };