const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create function for dynamic multer configuration
const createUpload = (uploadPath, allowedTypes, errorMessage) => {
  // Storage configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Derive tenant slug from route params/header/context; fallback to default
      const tenantSlug = (req.params?.slug || req.tenant?.slug || req.apiKey?.Tenant?.slug || 'default').toString();
      const targetPath = path.join(uploadPath, tenantSlug);

      // Ensure directory exists
      fs.mkdirSync(targetPath, { recursive: true });
      cb(null, targetPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = uuidv4();
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueName}${extension}`);
    }
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error(errorMessage));
  };

  // File size limit (in bytes)
  const limits = {
    fileSize: 1024 * 1024 * 5 // 5 MB
  };

  return multer({
    storage,
    fileFilter,
    limits
  });
};

module.exports = createUpload;