const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Facility = require('../models/Facility');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Admin API: ${req.method} ${req.originalUrl}`);
  next();
});

// TEMPORARY: Skip authentication for debugging
// const { protect, adminOnly } = require('../middlewares/auth');
// Geçici çözüm olarak boş middleware'ler tanımlayalım
const protect = (req, res, next) => {
  // Get the token from the header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token found in request, bypassing authentication for debugging');
    req.user = { 
      _id: 'debug-admin-id',
      username: 'admin',
      role: 'admin'
    };
    return next();
  }
  
  // Extract the token without 'Bearer '
  const token = authHeader.split(' ')[1];
  
  console.log('Token found in request:', token);
  
  // For demo purposes, simply checking if token includes 'admin-token'
  if (token && token.includes('admin-token')) {
    console.log('DEBUG: Valid admin token found');
    req.user = { 
      _id: 'debug-admin-id',
      username: 'admin',
      role: 'admin'
    };
  } else {
    console.log('DEBUG: Invalid token, but bypassing authentication for debugging');
    req.user = { 
      _id: 'debug-admin-id',
      username: 'admin',
      role: 'admin'
    };
  }
  
  next();
};

const adminOnly = (req, res, next) => {
  // Herhangi bir yetki kontrolü yapmadan geçiyoruz
  console.log('DEBUG: Admin check bypassed');
  next();
};

// Set up uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + fileExt);
  }
});

const upload = multer({ storage: storage });

// Admin login - demo version without db
router.post('/login', (req, res) => {
  try {
    console.log('Admin login attempt:', req.body);
    
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
      const token = 'admin-token-' + Date.now();
      
      return res.status(200).json({
        success: true,
        message: 'Giriş başarılı',
        token: token,
        user: {
          username: 'admin',
          role: 'admin'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Geçersiz kullanıcı adı veya şifre'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında bir hata oluştu'
    });
  }
});

// Admin test endpoint
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin API test endpoint is working'
  });
});

// Create a local function to check MongoDB connection
function isMongoDBConnected() {
  return mongoose.connection.readyState === 1;
}

// Get all facilities
router.get('/facilities', protect, adminOnly, async (req, res) => {
  try {
    console.log('Get all facilities requested');
    
    let facilities = [];
    let errors = [];
    let source = 'unknown';
    
    // Use the Facility model to get data
    if (isMongoDBConnected()) {
      try {
        facilities = await Facility.find({});
        console.log(`${facilities.length} tesis bulundu (MongoDB)`);
        source = 'mongodb';
      } catch (dbError) {
        console.error('Facility.find() hatası:', dbError);
        errors.push(`MongoDB error: ${dbError.message}`);
        // Continue to fallback
      }
    } else {
      console.log('MongoDB is not connected, using file storage');
      source = 'file';
    }
    
    // If MongoDB failed or is not connected, load from file
    if (facilities.length === 0) {
      // Try to access facilitiesStore from app.locals
      if (req.app && req.app.locals && Array.isArray(req.app.locals.facilitiesStore)) {
        facilities = req.app.locals.facilitiesStore;
        console.log(`${facilities.length} tesis bulundu (app.locals.facilitiesStore)`);
        source = 'app.locals';
      } else {
        // Eğer veritabanından okuma başarısız olursa, dosyadan okuma yap
        const dataPath = path.join(__dirname, '..', 'data', 'facilities.json');
        console.log('Attempting to load from file path:', dataPath);
        
        if (fs.existsSync(dataPath)) {
          try {
            console.log('Data file exists, reading content...');
            const data = fs.readFileSync(dataPath, 'utf8');
            
            if (!data || data.trim().length === 0) {
              console.error('Data file is empty');
              errors.push('Data file is empty');
              // Create empty array for empty file
              facilities = [];
            } else {
              try {
                const parsedData = JSON.parse(data);
                if (!Array.isArray(parsedData)) {
                  console.error('Data file does not contain a valid array');
                  errors.push('Data file does not contain a valid array');
                  // Create an empty facilities array so we don't return null
                  facilities = [];
                } else {
                  facilities = parsedData;
                  console.log(`Dosyadan ${facilities.length} tesis yüklendi`);
                  source = 'file';
                  
                  // Update app.locals.facilitiesStore if possible
                  if (req.app && req.app.locals) {
                    req.app.locals.facilitiesStore = facilities;
                  }
                }
              } catch (parseError) {
                console.error('JSON parse error:', parseError);
                errors.push(`JSON parse error: ${parseError.message}`);
                // Try to recover by initializing an empty array
                facilities = [];
                
                // Try to repair the JSON file
                try {
                  console.log('Attempting to repair the facilities.json file');
                  fs.writeFileSync(dataPath, JSON.stringify([], null, 2));
                  errors.push('Facilities file was corrupted and has been reset');
                } catch (writeError) {
                  console.error('Failed to repair facilities.json:', writeError);
                  errors.push(`Failed to repair facilities file: ${writeError.message}`);
                }
              }
            }
          } catch (fileError) {
            console.error('Dosya okuma hatası:', fileError);
            errors.push(`File read error: ${fileError.message}`);
          }
        } else {
          console.error('Data file does not exist:', dataPath);
          errors.push(`Data file does not exist: ${dataPath}`);
          
          // Create an empty file to prevent future errors
          try {
            // Ensure directory exists
            fs.mkdirSync(path.dirname(dataPath), { recursive: true });
            fs.writeFileSync(dataPath, JSON.stringify([], null, 2));
            console.log('Created empty facilities.json file');
            errors.push('Created empty facilities file for future use');
            facilities = []; // Set to empty array
          } catch (createError) {
            console.error('Failed to create empty data file:', createError);
            errors.push(`Failed to create data file: ${createError.message}`);
          }
        }
      }
    }
    
    // Ensure facilities is an array even if something went wrong
    if (!Array.isArray(facilities)) {
      console.error('Facilities is not an array, resetting to empty array');
      errors.push('Facilities data was corrupted and has been reset');
      facilities = [];
    }
    
    // Return the facilities, even if it's an empty array
    return res.status(200).json({
      success: true,
      count: facilities.length,
      data: facilities,
      source: source,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting facilities:', error);
    return res.status(500).json({
      success: false,
      message: 'Tesisler getirilirken hata oluştu',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get facility by ID
router.get('/facilities/:id', protect, adminOnly, async (req, res) => {
  try {
    console.log('Get facility details for ID:', req.params.id);
    const facilityId = req.params.id;
    
    let facility = null;
    
    // Use the Facility model to get real data
    try {
      facility = await Facility.findOne({
        $or: [
          { _id: facilityId },
          { applicationId: facilityId }
        ]
      });
    } catch (dbError) {
      console.error('Facility.findOne() hatası:', dbError);
    }
    
    // Eğer veritabanından bulunamadıysa, dosyadan okuma yap
    if (!facility) {
      const dataPath = path.join(__dirname, '..', 'data', 'facilities.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = fs.readFileSync(dataPath, 'utf8');
          const facilities = JSON.parse(data);
          
          if (Array.isArray(facilities)) {
            facility = facilities.find(f => 
              f._id === facilityId || 
              f.id === facilityId || 
              f.applicationId === facilityId
            );
          }
        } catch (fileError) {
          console.error('Dosya okuma hatası:', fileError);
        }
      }
    }
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Tesis bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: facility
    });
  } catch (error) {
    console.error('Error getting facility:', error);
    res.status(500).json({
      success: false,
      message: 'Tesis bilgileri getirilirken hata oluştu'
    });
  }
});

// Update facility field
router.patch('/facilities/:id/field', protect, adminOnly, (req, res) => {
  console.log('Update field request received:', {
    params: req.params,
    body: req.body
  });
  
  try {
    const { fieldName, value } = req.body;
    
    if (!fieldName || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Alan adı ve değeri gereklidir'
      });
    }
    
    // Geçerli alan adları
    const validFields = [
      'facilityName', 'facilityTitle', 'facilityType', 'institutionType', 'group',
      'city', 'district', 'foundationYear', 'staffCount', 'email', 'website',
      'phone', 'authorizedPhone', 'address', 'authorizationNumber',
      'ckyscode', 'medicalBranches', 'specializedTreatments',
      'facilityAmenities', 'supportServices', 'serviceLanguages', 'services',
      'paymentMethods'
    ];
    
    if (!validFields.includes(fieldName)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz alan adı'
      });
    }
    
    // Demo version - always returns success
    const updatedFacility = {
      _id: req.params.id,
      [fieldName]: value
    };
    
    res.status(200).json({
      success: true,
      message: 'Alan başarıyla güncellendi',
      data: updatedFacility
    });
  } catch (error) {
    console.error('Field update error:', error);
    res.status(500).json({
      success: false,
      message: 'Alan güncellenirken bir hata oluştu'
    });
  }
});

// Upload file
router.post('/facilities/:id/upload', protect, adminOnly, upload.single('file'), (req, res) => {
  console.log('File upload requested for facility:', req.params.id);
  console.log('Request body:', req.body);
  console.log('File:', req.file);
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya seçilmedi'
      });
    }
    
    const { fieldName } = req.body;
    
    if (!fieldName) {
      return res.status(400).json({
        success: false,
        message: 'Alan adı belirtilmedi'
      });
    }
    
    // Valid file fields
    const validFileFields = [
      'facilityImage', 'facilityLogo', 'authorizationDocument', 
      'facilityLicense', 'galleryImage'
    ];
    
    if (!validFileFields.includes(fieldName)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dosya alanı'
      });
    }
    
    // File path to store in database
    const filePath = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      filePath: filePath,
      message: 'Dosya başarıyla yüklendi'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken bir hata oluştu'
    });
  }
});

// Get facility details by applicationId for admin
router.get('/facilities/app/:applicationId', protect, adminOnly, async (req, res) => {
  try {
    const facility = await Facility.findOne({ applicationId: req.params.applicationId });
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Sağlık tesisi bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: facility
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Update facility status by admin
router.patch('/facilities/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes, noteObject } = req.body;
    const facilityId = req.params.id;
    
    // Check if valid status
    const validStatuses = ['Bekliyor', 'Onaylandı', 'Tamamlandı', 'Belge Bekleniyor', 'Bakanlıkta', 'İptal Edildi'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }
    
    let facility = null;
    
    if (isMongoDBConnected()) {
      try {
        // MongoDB'den tesis ara ve güncelle
        facility = await Facility.findOneAndUpdate(
          {
            $or: [
              { _id: facilityId },
              { applicationId: facilityId }
            ]
          },
          { status, adminNotes: adminNotes || undefined },
          { new: true }
        );
      } catch (err) {
        console.error('MongoDB tesis durum güncelleme hatası:', err);
      }
    }
    
    // MongoDB'den facility bulunamadıysa dosya sisteminden deneyelim
    if (!facility) {
      console.log('Dosya bazlı depolamada tesis aranıyor...');
      // Dosyadan tüm tesisleri yükle
      const dataPath = path.join(__dirname, '..', 'data', 'facilities.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = fs.readFileSync(dataPath, 'utf8');
          const facilities = JSON.parse(data);
          
          const facilityIndex = facilities.findIndex(f => 
            f.id === facilityId || 
            f._id === facilityId || 
            f.applicationId === facilityId
          );
          
          if (facilityIndex === -1) {
            return res.status(404).json({
              success: false,
              message: 'Tesis bulunamadı'
            });
          }
          
          // Tesisi güncelle
          facilities[facilityIndex].status = status;
          if (adminNotes) {
            facilities[facilityIndex].adminNotes = adminNotes;
          }
          
          // Dosyaya kaydet
          fs.writeFileSync(dataPath, JSON.stringify(facilities, null, 2));
          
          facility = facilities[facilityIndex];
        } catch (error) {
          console.error('Dosya işleme hatası:', error);
          return res.status(500).json({
            success: false,
            message: 'Dosya okuma hatası'
          });
        }
      }
    }
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Tesis bulunamadı'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Durum güncellendi',
      data: facility
    });
  } catch (error) {
    console.error('Durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Get facility details by ID for admin
router.get('/facilities/:id', protect, adminOnly, async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Sağlık tesisi bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: facility
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Delete facility 
router.delete('/facilities/:id', protect, adminOnly, async (req, res) => {
  try {
    const facilityId = req.params.id;
    let deleted = false;
    
    // MongoDB'den silme
    if (isMongoDBConnected()) {
      try {
        // Modern metod FindOneAndDelete kullanımı
        const deletedFacility = await Facility.findOneAndDelete({
          $or: [
            { _id: facilityId },
            { applicationId: facilityId }
          ]
        });
        
        if (deletedFacility) {
          deleted = true;
          return res.status(200).json({
            success: true,
            message: 'Sağlık tesisi başarıyla silindi',
            data: deletedFacility
          });
        }
      } catch (dbError) {
        console.error('MongoDB silme hatası:', dbError);
      }
    }
    
    // MongoDB'den silinemezse dosyadan sil
    if (!deleted) {
      const dataPath = path.join(__dirname, '..', 'data', 'facilities.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = fs.readFileSync(dataPath, 'utf8');
          const facilities = JSON.parse(data);
          
          const facilityIndex = facilities.findIndex(f => 
            f.id === facilityId || 
            f._id === facilityId || 
            f.applicationId === facilityId
          );
          
          if (facilityIndex === -1) {
            return res.status(404).json({
              success: false,
              message: 'Tesis bulunamadı'
            });
          }
          
          // Tesisi diziden çıkar
          const deletedFacility = facilities.splice(facilityIndex, 1)[0];
          
          // Dosyaya kaydet
          fs.writeFileSync(dataPath, JSON.stringify(facilities, null, 2));
          
          return res.status(200).json({
            success: true,
            message: 'Sağlık tesisi başarıyla silindi',
            data: deletedFacility
          });
        } catch (fileError) {
          console.error('Dosya işleme hatası:', fileError);
          return res.status(500).json({
            success: false,
            message: 'Dosya işleme hatası',
            error: fileError.message
          });
        }
      }
    }
    
    return res.status(404).json({
      success: false,
      message: 'Sağlık tesisi bulunamadı'
    });
  } catch (error) {
    console.error('Silme işlemi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Create admin user
router.post('/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin kullanıcı zaten mevcut'
      });
    }
    
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      password: 'admin123', // This will be hashed by mongoose middleware
      role: 'admin'
    });
    
    res.status(201).json({
      success: true,
      message: 'Admin kullanıcı oluşturuldu',
      data: {
        username: admin.username
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Generate PDF file for facility
router.get('/facilities/:id/pdf', protect, adminOnly, async (req, res) => {
  try {
    console.log('PDF generation requested for facility ID:', req.params.id);
    const facilityId = req.params.id;
    
    if (!facilityId) {
      console.error('Invalid facility ID provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Geçersiz tesis ID' 
      });
    }
    
    let facility = null;
    
    // Try to get facility from MongoDB
    if (isMongoDBConnected()) {
      try {
        facility = await Facility.findOne({
          $or: [
            { _id: facilityId },
            { applicationId: facilityId }
          ]
        });
        console.log('MongoDB search result:', facility ? 'Found' : 'Not found');
      } catch (err) {
        console.error('MongoDB tesis arama hatası:', err);
      }
    } else {
      console.log('MongoDB not connected, using file storage');
    }
    
    // If not found in MongoDB, try file storage
    if (!facility) {
      console.log('Facility not found in MongoDB, trying file storage');
      const dataPath = path.join(__dirname, '..', 'data', 'facilities.json');
      
      if (fs.existsSync(dataPath)) {
        try {
          const data = fs.readFileSync(dataPath, 'utf8');
          const facilities = JSON.parse(data);
          
          if (Array.isArray(facilities)) {
            facility = facilities.find(f => 
              f._id === facilityId || 
              f.id === facilityId || 
              f.applicationId === facilityId
            );
            console.log('File storage search result:', facility ? 'Found' : 'Not found');
          } else {
            console.error('Invalid facilities data format');
          }
        } catch (fileError) {
          console.error('Dosya okuma hatası:', fileError);
          return res.status(500).json({
            success: false,
            message: 'Dosya okuma hatası',
            error: fileError.message
          });
        }
      } else {
        console.error('Facilities data file not found:', dataPath);
        return res.status(500).json({
          success: false,
          message: 'Tesis verileri dosyası bulunamadı'
        });
      }
    }
    
    if (!facility) {
      console.log('Facility not found with ID:', facilityId);
      return res.status(404).json({
        success: false,
        message: 'Tesis bulunamadı'
      });
    }
    
    console.log('Generating PDF for facility:', facility.facilityName);
    
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('Created temp directory:', tempDir);
      }
      
      // Generate PDF filename
      const safeName = facility.facilityName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeName}_${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Pipe the PDF to a file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Add content to PDF
      doc.fontSize(25).text('Tesis Bilgileri Raporu', { align: 'center' });
      doc.moveDown();
      
      // Add facility details
      doc.fontSize(18).text('Temel Bilgiler');
      doc.moveDown();
      
      doc.fontSize(12).text(`Tesis Adı: ${facility.facilityName || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Başvuru ID: ${facility.applicationId || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`ÇKYS Kodu: ${facility.ckyscode || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Kurum Tipi: ${facility.institutionType || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Tesis Türü: ${facility.facilityType || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Grup: ${facility.group || 'Belirtilmemiş'}`);
      doc.moveDown();
      
      // Add location details
      doc.fontSize(18).text('Konum Bilgileri');
      doc.moveDown();
      
      doc.fontSize(12).text(`Şehir: ${facility.city || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`İlçe: ${facility.district || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Adres: ${facility.address || 'Belirtilmemiş'}`);
      doc.moveDown();
      
      // Add contact details
      doc.fontSize(18).text('İletişim Bilgileri');
      doc.moveDown();
      
      doc.fontSize(12).text(`E-posta: ${facility.email || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Telefon: ${facility.phone || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Yetkili Telefon: ${facility.authorizedPhone || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Web Sitesi: ${facility.website || 'Belirtilmemiş'}`);
      doc.moveDown();
      
      // Add other details
      doc.fontSize(18).text('Diğer Bilgiler');
      doc.moveDown();
      
      doc.fontSize(12).text(`Kuruluş Yılı: ${facility.foundationYear || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Personel Sayısı: ${facility.staffCount || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Ruhsat Numarası: ${facility.authorizationNumber || 'Belirtilmemiş'}`);
      doc.fontSize(12).text(`Durum: ${facility.status || 'Belirtilmemiş'}`);
      doc.moveDown();
      
      // Add arrays as lists if they exist
      const listFields = [
        { title: 'Sunulan Hizmetler', data: facility.services },
        { title: 'Ödeme Metotları', data: facility.paymentMethods },
        { title: 'Tıbbi Branşlar', data: facility.medicalBranches },
        { title: 'Özellikli Tedaviler', data: facility.specializedTreatments },
        { title: 'Tesis Olanakları', data: facility.facilityAmenities },
        { title: 'Destek Hizmetleri', data: facility.supportServices },
        { title: 'Hizmet Dilleri', data: facility.serviceLanguages }
      ];
      
      listFields.forEach(field => {
        if (field.data && Array.isArray(field.data) && field.data.length > 0) {
          doc.fontSize(18).text(field.title);
          doc.moveDown();
          
          field.data.forEach(item => {
            doc.fontSize(12).text(`• ${item}`);
          });
          
          doc.moveDown();
        }
      });
      
      // Add admin notes if they exist
      if (facility.adminNotes) {
        doc.fontSize(18).text('Yönetici Notları');
        doc.moveDown();
        doc.fontSize(12).text(facility.adminNotes);
        doc.moveDown();
      }
      
      // Add footer with timestamp
      doc.fontSize(10).text(`Bu belge ${new Date().toLocaleString('tr-TR')} tarihinde otomatik olarak oluşturulmuştur.`, 
        { align: 'center' });
      
      // Finalize PDF
      doc.end();
      
      // Wait for stream to finish before sending file
      stream.on('finish', () => {
        console.log('PDF file created:', filePath);
        
        // Send file as attachment
        const downloadName = `${facility.facilityName.replace(/[^a-z0-9]/gi, '_')}_Rapor.pdf`;
        res.download(filePath, downloadName, (err) => {
          if (err) {
            console.error('PDF download error:', err);
            if (!res.headersSent) {
              return res.status(500).json({
                success: false,
                message: 'PDF dosyası indirilirken hata oluştu',
                error: err.message
              });
            }
          }
          
          // Delete temporary file
          try {
            fs.unlinkSync(filePath);
            console.log('Temporary PDF file deleted');
          } catch (unlinkErr) {
            console.error('Failed to delete temporary PDF:', unlinkErr);
          }
        });
      });
      
      // Handle stream errors
      stream.on('error', (streamErr) => {
        console.error('PDF stream error:', streamErr);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'PDF dosyası oluşturulurken bir hata oluştu',
            error: streamErr.message
          });
        }
      });
    } catch (pdfErr) {
      console.error('PDF generation error:', pdfErr);
      return res.status(500).json({
        success: false,
        message: 'PDF dosyası oluşturulurken bir hata oluştu',
        error: pdfErr.message
      });
    }
  } catch (error) {
    console.error('Error in PDF route:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Generate ZIP file for facility
router.get('/facilities/:id/zip', protect, adminOnly, async (req, res) => {
  try {
    console.log('ZIP generation requested for facility ID:', req.params.id);
    const facilityId = req.params.id;
    
    if (!facilityId) {
      console.error('Invalid facility ID provided');
      return res.status(400).json({ 
        success: false, 
        message: 'Geçersiz tesis ID' 
      });
    }
    
    let facility = null;
    
    // Try to get facility from MongoDB
    if (isMongoDBConnected()) {
      try {
        facility = await Facility.findOne({
          $or: [
            { _id: facilityId },
            { applicationId: facilityId }
          ]
        });
        console.log('MongoDB search result:', facility ? 'Found' : 'Not found');
      } catch (err) {
        console.error('MongoDB tesis arama hatası:', err);
      }
    } else {
      console.log('MongoDB not connected, using file storage');
    }
    
    // If not found in MongoDB, try file storage
    if (!facility) {
      console.log('Facility not found in MongoDB, trying file storage');
      const dataPath = path.join(__dirname, '..', 'data', 'facilities.json');
      
      if (fs.existsSync(dataPath)) {
        try {
          const data = fs.readFileSync(dataPath, 'utf8');
          const facilities = JSON.parse(data);
          
          if (Array.isArray(facilities)) {
            facility = facilities.find(f => 
              f._id === facilityId || 
              f.id === facilityId || 
              f.applicationId === facilityId
            );
            console.log('File storage search result:', facility ? 'Found' : 'Not found');
          } else {
            console.error('Invalid facilities data format');
          }
        } catch (fileError) {
          console.error('Dosya okuma hatası:', fileError);
          return res.status(500).json({
            success: false,
            message: 'Dosya okuma hatası',
            error: fileError.message
          });
        }
      } else {
        console.error('Facilities data file not found:', dataPath);
        return res.status(500).json({
          success: false,
          message: 'Tesis verileri dosyası bulunamadı'
        });
      }
    }
    
    if (!facility) {
      console.log('Facility not found with ID:', facilityId);
      return res.status(404).json({
        success: false,
        message: 'Tesis bulunamadı'
      });
    }
    
    console.log('Generating ZIP for facility:', facility.facilityName);
    
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '..', '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('Created temp directory:', tempDir);
      }
      
      // Generate ZIP filename
      const safeName = facility.facilityName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const zipFileName = `${safeName}_${Date.now()}.zip`;
      const zipFilePath = path.join(tempDir, zipFileName);
      
      // Create a file to stream archive data to
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });
      
      // Listen for all archive data to be written
      // 'close' event is fired only when a file descriptor is involved
      output.on('close', function() {
        console.log('ZIP file created:', zipFilePath);
        console.log('Archive size:', archive.pointer() + ' total bytes');
        
        // Send file as attachment
        const downloadName = `${facility.facilityName.replace(/[^a-z0-9]/gi, '_')}_Dosyalar.zip`;
        res.download(zipFilePath, downloadName, (err) => {
          if (err) {
            console.error('ZIP download error:', err);
            if (!res.headersSent) {
              return res.status(500).json({
                success: false,
                message: 'ZIP dosyası indirilirken hata oluştu',
                error: err.message
              });
            }
          }
          
          // Delete temporary file
          try {
            fs.unlinkSync(zipFilePath);
            console.log('Temporary ZIP file deleted');
          } catch (unlinkErr) {
            console.error('Failed to delete temporary ZIP:', unlinkErr);
          }
        });
      });
      
      // Handle archive warnings
      archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
          console.warn('Archive warning:', err);
        } else {
          console.error('Archive error:', err);
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message: 'ZIP dosyası oluşturulurken bir hata oluştu',
              error: err.message
            });
          }
        }
      });
      
      // Handle archive errors
      archive.on('error', function(err) {
        console.error('Archive error:', err);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'ZIP dosyası oluşturulurken bir hata oluştu',
            error: err.message
          });
        }
      });
      
      // Pipe archive data to the file
      archive.pipe(output);
      
      // Create a JSON file with facility data
      const facilityDataStr = JSON.stringify(facility, null, 2);
      archive.append(facilityDataStr, { name: 'facility-data.json' });
      
      // Create a text file with basic info
      const infoText = `
Tesis Bilgileri
===============

Tesis Adı: ${facility.facilityName || 'Belirtilmemiş'}
ÇKYS Kodu: ${facility.ckyscode || 'Belirtilmemiş'}
Kurum Tipi: ${facility.institutionType || 'Belirtilmemiş'}
Sağlık Tesisi Türü: ${facility.facilityType || 'Belirtilmemiş'}
Şehir: ${facility.city || 'Belirtilmemiş'}
İlçe: ${facility.district || 'Belirtilmemiş'}
Adres: ${facility.address || 'Belirtilmemiş'}

İletişim Bilgileri
-----------------
E-posta: ${facility.email || 'Belirtilmemiş'}
Telefon: ${facility.phone || 'Belirtilmemiş'}
Yetkili Telefon: ${facility.authorizedPhone || 'Belirtilmemiş'}
Web Sitesi: ${facility.website || 'Belirtilmemiş'}

Diğer Bilgiler
-------------
Kuruluş Yılı: ${facility.foundationYear || 'Belirtilmemiş'}
Personel Sayısı: ${facility.staffCount || 'Belirtilmemiş'}
Ruhsat Numarası: ${facility.authorizationNumber || 'Belirtilmemiş'}
Durum: ${facility.status || 'Belirtilmemiş'}
Oluşturulma Tarihi: ${facility.createdAt ? new Date(facility.createdAt).toLocaleString('tr-TR') : 'Belirtilmemiş'}
      `;
      
      archive.append(infoText, { name: 'facility-info.txt' });
      
      // Add facility images and documents if they exist
      const fileFields = [
        { fieldName: 'facilityImage', fileName: 'Tesis-Resmi' },
        { fieldName: 'facilityLogo', fileName: 'Tesis-Logo' },
        { fieldName: 'authorizationDocument', fileName: 'Ruhsat-Belgesi' },
        { fieldName: 'facilityLicense', fileName: 'Tesis-Lisansi' }
      ];
      
      // Look for any uploaded files in the uploads directory
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      let foundFiles = false;
      
      for (const field of fileFields) {
        if (facility[field.fieldName]) {
          const filePath = facility[field.fieldName];
          const fileName = filePath.split('/').pop();
          
          // Extract the extension
          const ext = path.extname(fileName);
          const fullFilePath = path.join(uploadsDir, fileName);
          
          // Check if file exists and add to archive
          if (fs.existsSync(fullFilePath)) {
            archive.file(fullFilePath, { name: `${field.fileName}${ext}` });
            foundFiles = true;
            console.log(`Added file to archive: ${field.fileName}${ext}`);
          } else {
            console.warn(`File referenced in facility data but not found: ${fullFilePath}`);
          }
        }
      }
      
      // Handle gallery images if they exist
      if (facility.galleryImages && Array.isArray(facility.galleryImages) && facility.galleryImages.length > 0) {
        facility.galleryImages.forEach((imagePath, index) => {
          const fileName = imagePath.split('/').pop();
          const fullFilePath = path.join(uploadsDir, fileName);
          
          if (fs.existsSync(fullFilePath)) {
            archive.file(fullFilePath, { name: `Galeri/Resim-${index + 1}${path.extname(fileName)}` });
            foundFiles = true;
            console.log(`Added gallery image to archive: Resim-${index + 1}${path.extname(fileName)}`);
          } else {
            console.warn(`Gallery image referenced but not found: ${fullFilePath}`);
          }
        });
      }
      
      // If no files were found, add a README to explain
      if (!foundFiles) {
        const readmeText = `
Bu ZIP dosyası "${facility.facilityName}" tesisine ait veri dosyalarını içermektedir.

Not: Bu tesise ait yüklenmiş herhangi bir dosya/belge bulunamadı.
        `;
        archive.append(readmeText, { name: 'README.txt' });
      }
      
      // Generate a PDF summary with PDFKit and add to the archive
      try {
        // Create a PDF in memory
        const pdfPath = path.join(tempDir, `${safeName}_ozet.pdf`);
        const pdfDoc = new PDFDocument({ margin: 50 });
        const pdfStream = fs.createWriteStream(pdfPath);
        
        pdfDoc.pipe(pdfStream);
        
        // Add content to PDF
        pdfDoc.fontSize(25).text('Tesis Bilgileri Özeti', { align: 'center' });
        pdfDoc.moveDown();
        
        pdfDoc.fontSize(12).text(`Tesis Adı: ${facility.facilityName || 'Belirtilmemiş'}`);
        pdfDoc.fontSize(12).text(`Başvuru ID: ${facility.applicationId || 'Belirtilmemiş'}`);
        pdfDoc.fontSize(12).text(`ÇKYS Kodu: ${facility.ckyscode || 'Belirtilmemiş'}`);
        pdfDoc.fontSize(12).text(`Şehir: ${facility.city || 'Belirtilmemiş'}, ${facility.district || ''}`);
        pdfDoc.fontSize(12).text(`Durum: ${facility.status || 'Belirtilmemiş'}`);
        pdfDoc.moveDown();
        
        pdfDoc.fontSize(10).text(`Bu özet dosyası ${new Date().toLocaleString('tr-TR')} tarihinde otomatik olarak oluşturulmuştur.`, 
          { align: 'center' });
        
        // Finalize PDF
        pdfDoc.end();
        
        // Wait for PDF to finish before adding to archive
        pdfStream.on('finish', function() {
          archive.file(pdfPath, { name: 'Tesis-Ozet.pdf' });
          console.log('Added PDF summary to archive');
          
          // Finalize the archive
          archive.finalize();
          
          // Delete temporary PDF file
          try {
            fs.unlinkSync(pdfPath);
            console.log('Temporary PDF summary deleted');
          } catch (unlinkErr) {
            console.error('Failed to delete temporary PDF summary:', unlinkErr);
          }
        });
      } catch (pdfErr) {
        console.error('Error creating PDF summary for ZIP:', pdfErr);
        
        // Continue with archive finalization even if PDF creation fails
        archive.finalize();
      }
    } catch (zipErr) {
      console.error('ZIP generation error:', zipErr);
      return res.status(500).json({
        success: false,
        message: 'ZIP dosyası oluşturulurken bir hata oluştu',
        error: zipErr.message
      });
    }
  } catch (error) {
    console.error('Error in ZIP route:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Get facility field by ID
router.get('/facilities/:id/field/:fieldName', protect, adminOnly, async (req, res) => {
  try {
    const facilityId = req.params.id;
    const fieldName = req.params.fieldName;
    
    let facility = null;
    
    // Try to get facility from MongoDB
    if (isMongoDBConnected()) {
      try {
        facility = await Facility.findOne({
          $or: [
            { _id: facilityId },
            { applicationId: facilityId }
          ]
        });
      } catch (err) {
        console.error('MongoDB tesis arama hatası:', err);
      }
    }
    
    // If not found in MongoDB, try file storage
    if (!facility) {
      console.log('Facility not found in MongoDB, trying file storage');
      const dataPath = path.join(__dirname, '..', 'data', 'facilities.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = fs.readFileSync(dataPath, 'utf8');
          const facilities = JSON.parse(data);
          
          facility = facilities.find(f => 
            f._id === facilityId || 
            f.id === facilityId || 
            f.applicationId === facilityId
          );
        } catch (error) {
          console.error('Dosya işleme hatası:', error);
        }
      }
    }
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Tesis bulunamadı'
      });
    }
    
    if (!facility[fieldName]) {
      return res.status(404).json({
        success: false,
        message: `Tesisin ${fieldName} alanı bulunamadı`
      });
    }
    
    res.status(200).json({
      success: true,
      data: facility[fieldName]
    });
  } catch (error) {
    console.error('Tesis alanı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

module.exports = router;