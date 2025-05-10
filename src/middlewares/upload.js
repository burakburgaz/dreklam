const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    // Generate safe filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    const cleanFileName = file.fieldname + '-' + uniqueSuffix + fileExt;
    cb(null, cleanFileName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log('Checking file:', file);
  
  // Check file types based on fieldname
  if (file.fieldname === 'facilityImage' || 
      file.fieldname === 'facilityLogo' || 
      file.fieldname === 'file' && (req.body.fieldName === 'facilityImage' || req.body.fieldName === 'facilityLogo' || req.body.fieldName === 'galleryImage')) {
    // For images
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(new Error('Resim dosyaları için sadece JPG, PNG veya GIF formatları desteklenmektedir.'), false);
    }
  } else if (file.fieldname === 'authorizationDocument' || 
             file.fieldname === 'facilityLicense' ||
             file.fieldname === 'file' && (req.body.fieldName === 'authorizationDocument' || req.body.fieldName === 'facilityLicense')) {
    // For documents
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Belge dosyaları için sadece PDF, DOC veya DOCX formatları desteklenmektedir.'), false);
    }
  } else {
    // Default allow common formats
    if (file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya formatı! Lütfen JPG, PNG veya PDF yükleyiniz.'), false);
    }
  }
};

// Initialize upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Admin single file upload
const adminSingleUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
}).single('file');

// Export upload fields
module.exports = {
  facilityUpload: upload.fields([
    { name: 'facilityImage', maxCount: 1 },
    { name: 'authorizationDocument', maxCount: 1 },
    { name: 'facilityLicense', maxCount: 1 },
    { name: 'facilityLogo', maxCount: 1 }
  ]),
  adminSingleUpload: adminSingleUpload,
  handleAdminUpload: function(req, res, next) {
    console.log('Starting file upload with multer...');
    console.log('Request body before multer:', req.body);
    console.log('Request headers:', req.headers);
    
    // Ensure request body parsing
    if (!req.body || Object.keys(req.body).length === 0) {
      console.warn('Empty request body - may indicate a Content-Type issue');
    }
    
    adminSingleUpload(req, res, function(err) {
      console.log('Multer upload completed, checking for errors...');
      
      if (err instanceof multer.MulterError) {
        // Log detailed error information
        console.error('Multer error during upload:', err);
        
        // A Multer error occurred (e.g. limit exceeded)
        return res.status(400).json({
          success: false,
          message: `Dosya yükleme hatası: ${err.message}`,
          error: {
            code: err.code,
            field: err.field,
            message: err.message,
            type: 'MULTER_ERROR'
          }
        });
      } else if (err) {
        // Log detailed error information
        console.error('Unknown error during upload:', err);
        
        // An unknown error occurred
        return res.status(400).json({
          success: false,
          message: `Dosya yükleme hatası: ${err.message}`,
          error: {
            message: err.message,
            type: 'UNKNOWN_ERROR'
          }
        });
      }
      
      // Log the file upload success
      console.log('File upload successful:', req.file);
      console.log('Request body after multer:', req.body);
      
      // Check if file was properly uploaded
      if (!req.file) {
        console.error('No file was found in the request after multer processing');
        return res.status(400).json({
          success: false,
          message: 'Dosya yüklenemedi veya eksik'
        });
      }
      
      // Everything went fine
      next();
    });
  }
}; 