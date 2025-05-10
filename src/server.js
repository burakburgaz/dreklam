const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const { connectDB, initializeDB } = require('./db');

// Import route modules
const adminRoutes = require('./routes/admin');
const facilityRoutes = require('./routes/facility');

// Load environment variables if .env file exists
try {
  dotenv.config();
} catch (error) {
  console.log('No .env file found. Using default values.');
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory at:', uploadsDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize app.locals.facilitiesStore with empty array
// Will be properly populated after loading from file
app.locals.facilitiesStore = [];

// Mount API routes (this is important to use the router modules correctly)
app.use('/api/admin', adminRoutes);
app.use('/api/facilities', facilityRoutes);

// Also map /api/admin/login directly to the login route
app.post('/api/admin/login', (req, res) => {
  console.log('Login request received at /api/admin/login, forwarding to admin router');
  
  // Forward to the admin login route handler
  const loginRoute = adminRoutes.stack.find(layer => 
    layer.route && layer.route.path === '/login' && layer.route.methods.post);
  
  if (loginRoute && loginRoute.route.stack[0].handle) {
    loginRoute.route.stack[0].handle(req, res);
  } else {
    console.error('Admin login route not found');
    res.status(500).json({
      success: false,
      message: 'Internal server error: Login route not found'
    });
  }
});

// Add a route to check server status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize active clients tracker for form structure broadcasts
const activeClients = new Map(); // Map kullanarak daha fazla bilgi saklayabiliriz (ID -> {lastseen, sessionInfo})

// Store form structure
let formStructure = null;

// WebSocket-like mechanism for tracking active clients and broadcasting updates
// Update form structure and broadcast to active clients
app.post('/api/form-structure', async (req, res) => {
  try {
    // Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Update the form structure
    formStructure = req.body;
    
    // Ensure form has an ID
    if (!formStructure.formId) {
      formStructure.formId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Ensure form has a timestamp
    if (!formStructure.lastModified) {
      formStructure.lastModified = new Date().toISOString();
    }
    
    // Save to a local file for persistence - use formId in filename
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Create both a standard file and a versioned file with formId
    const standardFilePath = path.join(dataDir, 'form-structure.json');
    const versionedFilePath = path.join(dataDir, `form-structure-${formStructure.formId}.json`);
    
    // Save both files
    fs.writeFileSync(standardFilePath, JSON.stringify(formStructure, null, 2));
    fs.writeFileSync(versionedFilePath, JSON.stringify(formStructure, null, 2));
    
    console.log(`Form structure saved with ID: ${formStructure.formId}`);
    
    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Form structure updated successfully',
      formId: formStructure.formId
    });
  } catch (error) {
    console.error('Error updating form structure:', error);
    res.status(500).json({ success: false, message: 'Error updating form structure' });
  }
});

// Get form structure
app.get('/api/form-structure', async (req, res) => {
  try {
    // Register this client as active for potential broadcasts
    const clientId = req.query.clientId || req.headers['x-client-id'] || generateUniqueID();
    const clientType = req.query.clientType || 'user'; // 'user' veya 'admin'
    const timestamp = new Date().toISOString();
    const forceRefresh = req.query.forceRefresh === 'true';
    
    // Store client info
    activeClients.set(clientId, {
      lastSeen: timestamp,
      clientType: clientType,
      userAgent: req.headers['user-agent']
    });
    
    console.log(`Client registered: ${clientId} (${clientType}) - Active clients: ${activeClients.size}`);
    
    // If form structure is already loaded in memory and no forced refresh
    if (formStructure && !forceRefresh) {
      // Check if form has a valid ID
      if (!formStructure.formId || formStructure.formId === 'Default') {
        console.log('Current form has invalid/Default ID, loading updated form');
        formStructure = await getFormStructure();
      }
      
      return res.status(200).json({ 
        success: true, 
        data: formStructure,
        clientId: clientId
      });
    }
    
    // Load fresh form structure
    console.log('Loading fresh form structure');
    formStructure = await getFormStructure();
    
    if (formStructure) {
      return res.status(200).json({ 
        success: true, 
        data: formStructure,
        clientId: clientId
      });
    }
    
    // If we get here, no form structure exists yet
    res.status(404).json({ 
      success: false, 
      message: 'Form structure not found',
      clientId: clientId
    });
  } catch (error) {
    console.error('Error getting form structure:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Broadcast form updates to active clients
app.post('/api/broadcast-form-update', (req, res) => {
  try {
    const adminClientId = req.body.adminClientId;
    const timestamp = req.body.timestamp || new Date().toISOString();
    
    // Gerçek bir uygulamada WebSocket kullanılır, burada simülasyon yapıyoruz
    const clientCount = activeClients.size;
    let adminCount = 0;
    let userCount = 0;
    
    // Log active clients
    activeClients.forEach((info, id) => {
      if (info.clientType === 'admin') {
        adminCount++;
      } else {
        userCount++;
      }
    });
    
    console.log(`Form update broadcast: ${timestamp}`);
    console.log(`Active clients: ${clientCount} (${adminCount} admins, ${userCount} users)`);
    
    // Gerçek bir uygulamada burada tüm istemcilere mesaj gönderilir
    
    res.status(200).json({ 
      success: true, 
      message: 'Broadcast initiated', 
      clientCount: clientCount,
      adminCount: adminCount,
      userCount: userCount,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Error broadcasting form update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Client heartbeat endpoint to maintain active status
app.post('/api/client-heartbeat', (req, res) => {
  try {
    const clientId = req.body.clientId;
    const clientType = req.body.clientType || 'user';
    
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'No client ID provided' });
    }
    
    const timestamp = new Date().toISOString();
    
    // Update client last seen time or add new client
    const clientInfo = activeClients.get(clientId) || {};
    activeClients.set(clientId, {
      ...clientInfo,
      lastSeen: timestamp,
      clientType: clientType
    });
    
    // Check for form updates if requested
    const checkForUpdates = req.body.checkForUpdates === true;
    let hasUpdates = false;
    
    if (checkForUpdates && formStructure && formStructure.lastModified) {
      const lastKnownUpdate = req.body.lastKnownUpdate;
      
      if (lastKnownUpdate && formStructure.lastModified > lastKnownUpdate) {
        hasUpdates = true;
      }
    }
    
    res.status(200).json({ 
      success: true,
      hasUpdates: hasUpdates
    });
  } catch (error) {
    console.error('Error processing client heartbeat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Periodically clean up inactive clients (every 5 minutes)
setInterval(() => {
  const now = new Date();
  let removedCount = 0;
  
  // Clean up clients that haven't sent a heartbeat in 5 minutes
  activeClients.forEach((info, id) => {
    const lastSeen = new Date(info.lastSeen);
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes > 5) {
      activeClients.delete(id);
      removedCount++;
    }
  });
  
  if (removedCount > 0 || activeClients.size > 0) {
    console.log(`Active clients cleanup: Removed ${removedCount}, remaining ${activeClients.size}`);
  }
}, 5 * 60 * 1000);

// Debug route to reset session
app.get('/api/debug/reset-session', (req, res) => {
  console.log('Debug endpoint: Session reset requested');
  res.status(200).json({
    success: true,
    message: 'Oturum sıfırlandı. Lütfen tekrar giriş yapın.',
    action: 'Tarayıcı konsolunda localStorage.removeItem("adminToken") çalıştırıp sayfayı yenileyin'
  });
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    try {
      // Create upload directories if they don't exist
      const uploadsDir = path.join(__dirname, 'uploads');
      const galleryDir = path.join(uploadsDir, 'gallery');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      if (!fs.existsSync(galleryDir) && (file.fieldname.startsWith('gallery_') || file.fieldname === 'gallery[]')) {
        fs.mkdirSync(galleryDir, { recursive: true });
      }
      
      if (file.fieldname.startsWith('gallery_') || file.fieldname === 'gallery[]') {
        cb(null, path.join(__dirname, 'uploads/gallery'));
      } else {
        cb(null, path.join(__dirname, 'uploads'));
      }
    } catch (error) {
      console.error('Error creating upload directories:', error);
      // In case of error, fallback to the system's temporary directory
      cb(null, os.tmpdir());
    }
  },
  filename: function(req, file, cb) {
    // Generate unique filename with timestamp
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFieldname = file.fieldname.replace('[]', '');
      cb(null, sanitizedFieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    } catch (error) {
      console.error('Error generating filename:', error);
      // In case of error, use a simple timestamp-based name
      cb(null, 'file-' + Date.now() + path.extname(file.originalname));
    }
  }
});

// File filter function to check allowed file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'facilityImage' || file.fieldname === 'facilityLogo' || file.fieldname.startsWith('gallery_') || file.fieldname === 'gallery[]') {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Sadece resim dosyaları yükleyebilirsiniz!'), false);
    }
  } else if (file.fieldname === 'authorizationDocument' || file.fieldname === 'facilityLicense') {
    // Accept PDFs only
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Sadece PDF dosyaları yükleyebilirsiniz!'), false);
    }
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Set the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory:', dataDir);
}

// Define the data file path for persistent storage
const DATA_FILE_PATH = path.join(__dirname, 'data', 'facilities.json');

// In-memory data store for demo (keep it as fallback)
// Initialize facilitiesStore from file if it exists
let facilitiesStore = [];
try {
  if (fs.existsSync(DATA_FILE_PATH)) {
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    if (data && data.trim().length > 0) {
      try {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData)) {
          facilitiesStore = parsedData;
          console.log(`Loaded ${facilitiesStore.length} facilities from persistent storage`);
          
          // Update app.locals.facilitiesStore after loading the data
          app.locals.facilitiesStore = facilitiesStore;
        } else {
          console.error('Invalid facilities data file format, expected array but got:', typeof parsedData);
          console.log('Resetting facilities data file with empty array');
          fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
        }
      } catch (parseError) {
        console.error('Error parsing facilities data file:', parseError);
        console.log('Resetting facilities data file with empty array');
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
      }
    } else {
      console.log('Empty facilities data file found, initializing with empty array');
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
    }
  } else {
    console.log('No existing facilities data file found, creating with empty array');
    // Create an empty file
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
    console.log('Created empty facilities data file at:', DATA_FILE_PATH);
  }
} catch (error) {
  console.error('Error initializing facilities store from file:', error);
  console.log('Starting with empty facilities store');
  
  // Try to create the file if it doesn't exist
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
    console.log('Created empty facilities data file after error');
  } catch (writeError) {
    console.error('Failed to create facilities data file:', writeError);
  }
}

// Helper function to save facilities to file
function saveFacilitiesToFile() {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log(`Data directory doesn't exist, creating: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if facilitiesStore is valid
    if (!Array.isArray(facilitiesStore)) {
      console.error('Invalid facilitiesStore, not an array:', typeof facilitiesStore);
      facilitiesStore = [];
    }
    
    // Write to temporary file first, then rename
    const tempFilePath = `${DATA_FILE_PATH}.tmp`;
    fs.writeFileSync(tempFilePath, JSON.stringify(facilitiesStore, null, 2));
    fs.renameSync(tempFilePath, DATA_FILE_PATH);
    
    console.log(`Saved ${facilitiesStore.length} facilities to persistent storage: ${DATA_FILE_PATH}`);
    
    // Update app.locals.facilitiesStore
    app.locals.facilitiesStore = facilitiesStore;
  } catch (error) {
    console.error('Error saving facilities to file:', error);
    
    // Try direct write as fallback
    try {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(facilitiesStore || [], null, 2));
      console.log('Saved facilities using fallback method');
      
      // Update app.locals even in fallback case
      app.locals.facilitiesStore = facilitiesStore;
    } catch (fallbackError) {
      console.error('Fatal error: Failed to save facilities with fallback method:', fallbackError);
    }
  }
}

// Add this function after the saveFacilitiesToFile function
// Validate facilities data file
function validateFacilitiesDataFile() {
  try {
    console.log('Validating facilities data file...');
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      console.log('Creating data directory:', dataDir);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Check if facilities.json exists
    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.log('Creating empty facilities file:', DATA_FILE_PATH);
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
      return true;
    }
    
    // Read the file and validate content
    try {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      
      // Check if file is empty
      if (!data || data.trim() === '') {
        console.log('Facilities file is empty, initializing with empty array');
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
        return true;
      }
      
      // Try to parse the JSON
      try {
        const parsed = JSON.parse(data);
        
        // Check if it's an array
        if (!Array.isArray(parsed)) {
          console.error('Facilities file contains invalid data (not an array), resetting');
          fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
          return true;
        }
        
        // File is valid, initialize facilitiesStore with the data
        facilitiesStore = parsed;
        console.log(`Loaded ${facilitiesStore.length} facilities from validated file`);
        return true;
      } catch (parseError) {
        console.error('Facilities file contains invalid JSON:', parseError.message);
        
        // Create backup of corrupted file
        const backupPath = `${DATA_FILE_PATH}.backup.${Date.now()}`;
        fs.copyFileSync(DATA_FILE_PATH, backupPath);
        console.log(`Created backup of corrupted file: ${backupPath}`);
        
        // Reset the file
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
        console.log('Reset facilities file to empty array');
        return true;
      }
    } catch (readError) {
      console.error('Error reading facilities file:', readError);
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
      return false;
    }
  } catch (error) {
    console.error('Fatal error validating facilities file:', error);
    return false;
  }
}

// MongoDB connection state flag
let mongoDBConnected = false;

// Function to check if MongoDB is connected
function isMongoDBConnected() {
  return mongoDBConnected;
}

// Database Connection using db module
connectDB()
  .then((connection) => {
    if (connection && mongoose.connection.readyState === 1) {
      console.log('Connected to MongoDB');
      mongoDBConnected = true;
      initializeDB()
        .then(initialized => {
          if (initialized) {
            console.log('Database initialized successfully');
          } else {
            console.warn('Database initialization skipped');
          }
        })
        .catch(error => {
          console.error('Error initializing database:', error);
        });
    } else {
      console.log('MongoDB connection returned null or is not ready, running in fallback mode');
    }
  })
  .catch(error => {
    console.error('Error connecting to database, running in fallback mode:', error);
  });

// Generate a unique ID for applications
function generateUniqueID() {
  // Get current timestamp
  const timestamp = new Date().getTime();
  
  // Generate 4 random bytes
  const randomBytes = crypto.randomBytes(4).toString('hex');
  
  // Format with prefix: "SA" (Sağlık Alanı) + YearMonth + Random 8 chars
  const prefix = "SA";
  const yearMonth = new Date().toISOString().slice(2, 7).replace(/-/g, "");
  
  // Format the ID
  return `${prefix}-${yearMonth}-${randomBytes}`.toUpperCase();
}

// Define Facility Schema with applicationId field
const facilitySchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  facilityName: { type: String, required: true },
  facilityTitle: String,
  ckyscode: { type: String, required: true },
  institutionType: String,
  city: String,
  district: String,
  foundationYear: Number,
  staffCount: Number,
  email: String,
  address: String,
  authorizedPhone: String,
  website: String,
  authorizationNumber: String,
  healthServices: [String],
  facilityType: String,
  group: String,
  // Services and amenities
  services: [String],
  paymentMethods: [String],
  medicalBranches: [String],
  specializedTreatments: [String],
  facilityAmenities: [String],
  supportServices: [String],
  serviceLanguages: [String],
  facilityImage: String,
  facilityLogo: String,
  authorizationDocument: String,
  facilityLicense: String,
  galleryImages: [String],
  status: { type: String, default: 'Bekliyor' },
  adminNotes: String,
  createdAt: { type: Date, default: Date.now }
});

// Create Facility model
const Facility = mongoose.model('Facility', facilitySchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/yonetim_paneli', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Get form structure from file or memory
async function getFormStructure() {
  try {
    // First check if we have it in memory
    if (formStructure) {
      return formStructure;
    }

    // Look for any form-structure*.json files in the data directory
    const dataDir = path.join(__dirname, 'data');
    let formFiles = [];
    
    try {
      // Read data directory
      const files = fs.readdirSync(dataDir);
      
      // Filter form structure files
      formFiles = files.filter(file => 
        file.startsWith('form-structure') && file.endsWith('.json')
      );
      
      console.log(`Found ${formFiles.length} form structure files`);
    } catch (readError) {
      console.error('Error reading data directory:', readError);
    }
    
    // If we have multiple form files, find the latest one based on lastModified field
    if (formFiles.length > 0) {
      let latestForm = null;
      let latestTimestamp = null;
      let latestFilePath = null;
      
      // Check each form file to find the most recent one
      for (const file of formFiles) {
        const filePath = path.join(dataDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const formData = JSON.parse(content);
          
          // Ensure every form has a formId
          if (!formData.formId) {
            formData.formId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            // Save updated form with ID
            fs.writeFileSync(filePath, JSON.stringify(formData, null, 2));
            console.log(`Added missing formId to form file: ${file}`);
          }
          
          // Check if this form has lastModified timestamp
          if (formData.lastModified) {
            const timestamp = new Date(formData.lastModified).getTime();
            
            // Update latest if this is newer or if we don't have a latest yet
            if (!latestTimestamp || timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              latestForm = formData;
              latestFilePath = filePath;
            }
          }
        } catch (fileError) {
          console.error(`Error reading form file ${file}:`, fileError);
        }
      }
      
      // Delete all other form files except the latest one
      if (latestFilePath) {
        for (const file of formFiles) {
          const filePath = path.join(dataDir, file);
          if (filePath !== latestFilePath) {
            try {
              fs.unlinkSync(filePath);
              console.log(`Deleted older form file: ${file}`);
            } catch (deleteError) {
              console.error(`Error deleting old form file ${file}:`, deleteError);
            }
          }
        }
        
        // Make sure the latest file is named consistently
        const standardPath = path.join(dataDir, 'form-structure.json');
        if (latestFilePath !== standardPath) {
          try {
            // Copy content to standard filename
            fs.writeFileSync(standardPath, JSON.stringify(latestForm, null, 2));
            // Delete original file
            fs.unlinkSync(latestFilePath);
            console.log(`Renamed latest form file to standard name: form-structure.json`);
          } catch (renameError) {
            console.error('Error standardizing form filename:', renameError);
          }
        }
        
        // Set the form structure in memory
        formStructure = latestForm;
        return formStructure;
      }
    }
    
    // If no files found or no valid latest, try the standard path
    const formStructurePath = path.join(__dirname, 'data', 'form-structure.json');
    if (fs.existsSync(formStructurePath)) {
      try {
        const data = fs.readFileSync(formStructurePath, 'utf8');
        formStructure = JSON.parse(data);
        return formStructure;
      } catch (error) {
        console.error('Error reading form structure file:', error);
      }
    }

    // If no form structure exists, return a default one
    return {
      sections: [
        {
          id: 'general-info',
          title: 'Genel Bilgiler',
          order: 1
        }
      ],
      fields: [],
      lastModified: new Date().toISOString(),
      formId: `form_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    };
  } catch (error) {
    console.error('Error getting form structure:', error);
    return null;
  }
}

// Handle form submission - new /submit-application route
app.post('/submit-application', upload.any(), async (req, res) => {
  try {
    console.log('Form verisi alındı:', req.body);
    console.log('Yüklenen dosyalar:', req.files ? req.files.length : 'Yok');

    // Get form structure
    const formStructure = await getFormStructure();
    if (!formStructure) {
      console.error('Form yapısı bulunamadı');
      return res.status(500).json({
        success: false,
        message: 'Form yapısı bulunamadı. Lütfen daha sonra tekrar deneyin.',
        error: 'Form Structure Not Found',
        errorCode: 'FS-001',
        details: 'Form yapısı dosyası bulunamadı veya okunamadı'
      });
    }

    // Validate required fields from form structure
    const requiredFields = formStructure.fields.filter(field => field.required);
    for (const field of requiredFields) {
      if (!req.body[field.id] || req.body[field.id].trim() === '') {
        console.error(`Zorunlu alan eksik: ${field.label}`);
        return res.status(400).json({
          success: false,
          message: `${field.label} alanı zorunludur.`,
          error: 'Validation Error',
          errorCode: 'VAL-001',
          details: `Zorunlu alan eksik: ${field.id}`
        });
      }
    }

    // Başvuru numarası oluştur
    let applicationId;
    try {
      applicationId = generateApplicationId();
      console.log('Oluşturulan başvuru numarası:', applicationId);
    } catch (idError) {
      console.error('Başvuru numarası oluşturma hatası:', idError);
      return res.status(500).json({
        success: false,
        message: 'Başvuru numarası oluşturulamadı.',
        error: 'ID Generation Error',
        errorCode: 'ID-001',
        details: idError.message
      });
    }

    // Form verilerini hazırla
    const formData = {
      applicationId: applicationId,
      facilityName: req.body.facilityName || '',
      ckyscode: req.body.ckyscode || '',
      institutionType: req.body.institutionType || '',
      city: req.body.city || '',
      district: req.body.district || '',
      foundationYear: req.body.foundationYear ? parseInt(req.body.foundationYear, 10) : null,
      staffCount: req.body.staffCount ? parseInt(req.body.staffCount, 10) : null,
      email: req.body.email || '',
      address: req.body.address || '',
      postalCode: req.body.postalCode || '',
      coordinates: req.body.coordinates || '',
      authorizedPhone: req.body.authorizedPhone || '',
      website: req.body.website || '',
      group: req.body.group || '',
      
      // Process checkbox data safely
      certifications: Array.isArray(req.body.certifications)
        ? req.body.certifications
        : (typeof req.body.certifications === 'string' ? req.body.certifications.split(',') : []),

      // Add metadata
      status: 'Bekliyor',
      createdAt: new Date(),
      adminNotes: '',
      
      // Add form info
      formId: formStructure.formId || 'unknown',
      formVersion: formStructure.lastModified || new Date().toISOString()
    };

    // Handle file uploads
    try {
      if (req.files && req.files.length > 0) {
        console.log('Dosya bilgileri:', req.files.map(f => `${f.fieldname}: ${f.filename}`));
        req.files.forEach(file => {
          const fieldName = file.fieldname;
          formData[fieldName] = '/uploads/' + file.filename;
        });
      } else {
        console.log('Dosya yüklemesi yok');
      }
    } catch (fileError) {
      console.error('Dosya işleme hatası:', fileError);
      return res.status(500).json({
        success: false,
        message: 'Dosya yükleme işlemi başarısız oldu.',
        error: 'File Upload Error',
        errorCode: 'FILE-001',
        details: fileError.message
      });
    }

    console.log('Veriler hazırlandı:', JSON.stringify(formData, null, 2));

    // MongoDB bağlantısı varsa kaydet, yoksa doğrudan facilitiesStore'a ekle
    let result;
    let savedToMongo = false;

    if (isMongoDBConnected()) {
      try {
        const facility = new Facility(formData);
        result = await facility.save();
        console.log('MongoDB\'ye kaydedildi:', result);
        savedToMongo = true;
      } catch (dbError) {
        console.error('MongoDB kayıt hatası:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Veritabanına kayıt işlemi başarısız oldu.',
          error: 'Database Error',
          errorCode: 'DB-001',
          details: dbError.message
        });
      }
    } 
    
    // MongoDB bağlantısı yoksa veya hata oluştuysa dosya depolamaya geç
    if (!savedToMongo) {
      try {
        console.log('MongoDB bağlantısı yok veya hata oluştu, dosya depolamaya geçiliyor...');
        
        if (!Array.isArray(facilitiesStore)) {
          console.warn('facilitiesStore bir dizi değil, yeniden oluşturuluyor');
          facilitiesStore = [];
        }
        
        facilitiesStore.push(formData);
        result = formData;
        
        saveFacilitiesToFile();
        console.log('Tesis dosyaya kaydedildi');
      } catch (fileError) {
        console.error('Dosya depolama hatası:', fileError);
        return res.status(500).json({
          success: false,
          message: 'Dosya depolama işlemi başarısız oldu.',
          error: 'File Storage Error',
          errorCode: 'FS-002',
          details: fileError.message
        });
      }
    }

    // Return successful response with application ID
    return res.status(201).json({
      success: true,
      message: 'Başvurunuz başarıyla alındı.',
      applicationId: applicationId,
      data: {
        applicationId: applicationId
      }
    });
  } catch (error) {
    console.error('Form gönderimi genel hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin.',
      error: error.message || 'Bilinmeyen hata',
      errorCode: 'GEN-001',
      details: error.stack
    });
  }
});

// Başvuru numarası oluşturma fonksiyonu
function generateApplicationId() {
  // Tarih kısmını oluştur (Yıl-Ay-Gün formatında)
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Rastgele 6 haneli bir sayı oluştur
  const random = Math.floor(100000 + Math.random() * 900000); // 100000-999999 arası
  
  // Başvuru numarasını formatla: STB-YYYYMMDD-RANDOM
  const applicationId = `STB-${year}${month}${day}-${random}`;
  
  return applicationId;
}

// Yönetici paneli için tüm tesisleri getir
app.get('/api/admin/facilities', (req, res) => {
  try {
    console.log('Yönetici paneli tesis listesi isteği alındı');
    
    let facilities = [];
    
    // MongoDB bağlantısı varsa oradan, yoksa in-memory veritabanından getir
    if (isMongoDBConnected()) {
      Facility.find({})
        .sort({ applicationId: 1 })
        .then(result => {
          facilities = result;
          sendResponse();
        })
        .catch(err => {
          console.error('MongoDB tesis verisi okuma hatası:', err);
          sendResponse();
        });
    } else {
      // In-memory veritabanından getir
      facilities = facilitiesStore;
      
      // applicationId'ye göre sırala
      facilities.sort((a, b) => {
        if (a.applicationId && b.applicationId) {
          return a.applicationId.localeCompare(b.applicationId);
        }
        return 0;
      });
      
      sendResponse();
    }
    
    function sendResponse() {
      console.log(`${facilities.length} tesis bulundu`);
      
      res.status(200).json({
        success: true,
        count: facilities.length,
        data: facilities
      });
    }
  } catch (error) {
    console.error('Tesis listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Yönetici paneli için tesis detayı getir
app.get('/api/admin/facilities/:id', (req, res) => {
  try {
    const facilityId = req.params.id;
    console.log('Tesis detayı isteği:', facilityId);
    
    if (isMongoDBConnected()) {
      // MongoDB'den tesis ara
      Facility.findOne({
        $or: [
          { _id: facilityId },
          { applicationId: facilityId }
        ]
      })
      .then(facility => {
        if (!facility) {
          // In-memory veritabanında ara
          return findInMemoryFacility();
        }
        
        res.status(200).json({
          success: true,
          data: facility
        });
      })
      .catch(err => {
        console.error('MongoDB tesis detayı okuma hatası:', err);
        findInMemoryFacility();
      });
    } else {
      // MongoDB bağlantısı yoksa direkt in-memory veritabanında ara
      findInMemoryFacility();
    }
    
    // In-memory veritabanında tesis ara
    function findInMemoryFacility() {
      const facility = facilitiesStore.find(f => 
        f.id === facilityId || 
        f._id === facilityId || 
        f.applicationId === facilityId
      );
      
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
    }
  } catch (error) {
    console.error('Tesis detayı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Yönetici paneli için tesis durumu güncelle
app.patch('/api/admin/facilities/:id/status', (req, res) => {
  try {
    const facilityId = req.params.id;
    const { status, adminNotes } = req.body;
    
    console.log('Durum güncelleme isteği:', facilityId, status);
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Durum bilgisi gerekli'
      });
    }
    
    if (isMongoDBConnected()) {
      // MongoDB'den tesis ara ve güncelle
      Facility.findOneAndUpdate(
        {
          $or: [
            { _id: facilityId },
            { applicationId: facilityId }
          ]
        },
        { status, adminNotes: adminNotes || undefined },
        { new: true }
      )
      .then(facility => {
        if (!facility) {
          // In-memory veritabanında ara
          return updateInMemoryFacility();
        }
        
        res.status(200).json({
          success: true,
          message: 'Durum güncellendi',
          data: facility
        });
      })
      .catch(err => {
        console.error('MongoDB tesis durum güncelleme hatası:', err);
        updateInMemoryFacility();
      });
    } else {
      // MongoDB bağlantısı yoksa direkt in-memory veritabanında güncelle
      updateInMemoryFacility();
    }
    
    // In-memory veritabanında tesis güncelle
    function updateInMemoryFacility() {
      const facilityIndex = facilitiesStore.findIndex(f => 
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
      
      facilitiesStore[facilityIndex].status = status;
      if (adminNotes) {
        facilitiesStore[facilityIndex].adminNotes = adminNotes;
      }
      
      // Persist to file after updating a facility
      saveFacilitiesToFile();
      
      res.status(200).json({
        success: true,
        message: 'Durum güncellendi',
        data: facilitiesStore[facilityIndex]
      });
    }
  } catch (error) {
    console.error('Durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Yönetici paneli için tesis silme
app.delete('/api/admin/facilities/:id', (req, res) => {
  try {
    const facilityId = req.params.id;
    
    console.log('Tesis silme isteği:', facilityId);
    
    if (isMongoDBConnected()) {
      // MongoDB'den tesis ara ve sil
      Facility.findOneAndDelete({
        $or: [
          { _id: facilityId },
          { applicationId: facilityId }
        ]
      })
      .then(facility => {
        if (!facility) {
          // In-memory veritabanında ara
          return deleteInMemoryFacility();
        }
        
        res.status(200).json({
          success: true,
          message: 'Tesis silindi',
          data: facility
        });
      })
      .catch(err => {
        console.error('MongoDB tesis silme hatası:', err);
        deleteInMemoryFacility();
      });
    } else {
      // MongoDB bağlantısı yoksa direkt in-memory veritabanında sil
      deleteInMemoryFacility();
    }
    
    // In-memory veritabanında tesis sil
    function deleteInMemoryFacility() {
      const facilityIndex = facilitiesStore.findIndex(f => 
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
      
      const deletedFacility = facilitiesStore.splice(facilityIndex, 1)[0];
      
      // Persist to file after deleting a facility
      saveFacilitiesToFile();
      
      res.status(200).json({
        success: true,
        message: 'Tesis silindi',
        data: deletedFacility
      });
    }
  } catch (error) {
    console.error('Tesis silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Port
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
  console.log(`Visit http://localhost:${PORT}/yonetim_paneli for admin panel`);
  console.log(`Admin login: username "admin", password "admin123"`);
  
  // Validate facilities data file on startup
  if (validateFacilitiesDataFile()) {
    console.log('Facilities data file validated successfully');
  } else {
    console.warn('Failed to validate facilities data file, continuing with empty data');
  }
});

module.exports = app;
module.exports.isMongoDBConnected = isMongoDBConnected;