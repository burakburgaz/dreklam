// Dummy Facility model since we don't have actual MongoDB connection
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Define path to facilities data file
const DATA_FILE_PATH = path.join(__dirname, '..', 'data', 'facilities.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE_PATH);
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory for Facility model:', dataDir);
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }
}

// Helper function to read facilities from file
function readFacilitiesFromFile() {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      console.log('Facilities file does not exist, creating empty file');
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
      return [];
    }
    
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    
    if (!data || data.trim() === '') {
      console.log('Facilities file is empty, returning empty array');
      return [];
    }
    
    const facilities = JSON.parse(data);
    
    if (!Array.isArray(facilities)) {
      console.error('Facilities data is not an array, resetting file');
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
      return [];
    }
    
    return facilities;
  } catch (error) {
    console.error('Error reading facilities from file:', error);
    
    // Try to repair the file
    try {
      // Create backup if file exists
      if (fs.existsSync(DATA_FILE_PATH)) {
        const backupPath = `${DATA_FILE_PATH}.backup.${Date.now()}`;
        fs.copyFileSync(DATA_FILE_PATH, backupPath);
        console.log(`Created backup of corrupted file: ${backupPath}`);
      }
      
      // Reset the file
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2));
      console.log('Reset facilities file to empty array after error');
    } catch (writeError) {
      console.error('Failed to repair facilities file:', writeError);
    }
    
    return [];
  }
}

// Helper function to save facilities to file
function saveFacilitiesToFile(facilities) {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Validate facilities is an array
    const validFacilities = Array.isArray(facilities) ? facilities : [];
    
    // Write to temporary file first, then rename for atomic operation
    const tempFilePath = `${DATA_FILE_PATH}.tmp`;
    fs.writeFileSync(tempFilePath, JSON.stringify(validFacilities, null, 2));
    fs.renameSync(tempFilePath, DATA_FILE_PATH);
    
    console.log(`Saved ${validFacilities.length} facilities to file`);
    return true;
  } catch (error) {
    console.error('Error saving facilities to file:', error);
    
    // Try direct write as fallback
    try {
      const validFacilities = Array.isArray(facilities) ? facilities : [];
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(validFacilities, null, 2));
      console.log('Saved facilities using fallback method');
      return true;
    } catch (fallbackError) {
      console.error('Fatal error: Failed to save facilities with fallback method:', fallbackError);
      return false;
    }
  }
}

// Create a proper mongoose schema
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
  status: { type: String, default: 'Bekliyor' },
  createdAt: { type: Date, default: Date.now },
  adminNotes: String
});

// Create a model only if mongoose is connected
let FacilityModel;
try {
  if (mongoose.connection.readyState === 1) {
    FacilityModel = mongoose.model('Facility', facilitySchema);
  }
} catch (error) {
  console.error('Error creating Facility model:', error);
}

// Fallback implementation for when MongoDB is not connected
const Facility = {
  find: async (query = {}) => {
    console.log('Facility.find() called with fallback implementation');
    
    // Load data from file
    const facilities = readFacilitiesFromFile();
    
    // Handle any filtering if provided in query
    if (query && Object.keys(query).length > 0) {
      console.log('Applying query filter:', query);
      
      // Simple filtering logic (can be expanded for more complex queries)
      return facilities.filter(facility => {
        for (const [key, value] of Object.entries(query)) {
          if (facility[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    return facilities;
  },
  
  findById: async (id) => {
    console.log('Facility.findById() called with fallback for ID:', id);
    
    // Load data from file
    const facilities = readFacilitiesFromFile();
    
    // Find facility by ID
    return facilities.find(f => 
      f._id === id || 
      f.id === id || 
      f.applicationId === id
    );
  },
  
  findOne: async (query) => {
    console.log('Facility.findOne() called with fallback for query:', query);
    
    // Load data from file
    const facilities = readFacilitiesFromFile();
    
    if (query._id) {
      return facilities.find(f => f._id === query._id);
    }
    
    if (query.applicationId) {
      return facilities.find(f => f.applicationId === query.applicationId);
    }
    
    if (query.$or) {
      return facilities.find(f => {
        return query.$or.some(condition => {
          const key = Object.keys(condition)[0];
          return f[key] === condition[key];
        });
      });
    }
    
    // Handle general query case
    return facilities.find(f => {
      for (const [key, value] of Object.entries(query)) {
        if (f[key] !== value) {
          return false;
        }
      }
      return true;
    });
  },
  
  findOneAndUpdate: async (query, updates, options) => {
    console.log('Facility.findOneAndUpdate() called with fallback');
    
    // Load data from file
    const facilities = readFacilitiesFromFile();
    
    // Find the facility index
    let facilityIndex = -1;
    
    if (query._id) {
      facilityIndex = facilities.findIndex(f => f._id === query._id);
    } else if (query.applicationId) {
      facilityIndex = facilities.findIndex(f => f.applicationId === query.applicationId);
    } else if (query.$or) {
      facilityIndex = facilities.findIndex(f => {
        return query.$or.some(condition => {
          const key = Object.keys(condition)[0];
          return f[key] === condition[key];
        });
      });
    }
    
    if (facilityIndex === -1) {
      return null;
    }
    
    // Update the facility
    const updatedFacility = { ...facilities[facilityIndex], ...updates };
    facilities[facilityIndex] = updatedFacility;
    
    // Save to file
    saveFacilitiesToFile(facilities);
    
    // Return the updated facility if options.new is true
    if (options && options.new) {
      return updatedFacility;
    }
    
    return facilities[facilityIndex];
  },
  
  findByIdAndUpdate: async (id, updates, options) => {
    console.log('Facility.findByIdAndUpdate() with fallback for ID:', id);
    
    // Load data from file
    const facilities = readFacilitiesFromFile();
    
    // Find the facility index
    const facilityIndex = facilities.findIndex(f => 
      f._id === id || 
      f.id === id || 
      f.applicationId === id
    );
    
    if (facilityIndex === -1) {
      return null;
    }
    
    // Update the facility
    const updatedFacility = { ...facilities[facilityIndex], ...updates };
    facilities[facilityIndex] = updatedFacility;
    
    // Save to file
    saveFacilitiesToFile(facilities);
    
    // Return the updated facility if options.new is true
    if (options && options.new) {
      return updatedFacility;
    }
    
    return facilities[facilityIndex];
  },
  
  findOneAndDelete: async (query) => {
    console.log('Facility.findOneAndDelete() called with fallback');
    
    // Load data from file
    const facilities = readFacilitiesFromFile();
    
    // Find the facility index
    let facilityIndex = -1;
    
    if (query._id) {
      facilityIndex = facilities.findIndex(f => f._id === query._id);
    } else if (query.applicationId) {
      facilityIndex = facilities.findIndex(f => f.applicationId === query.applicationId);
    } else if (query.$or) {
      facilityIndex = facilities.findIndex(f => {
        return query.$or.some(condition => {
          const key = Object.keys(condition)[0];
          return f[key] === condition[key];
        });
      });
    }
    
    if (facilityIndex === -1) {
      return null;
    }
    
    // Remove the facility
    const deletedFacility = facilities.splice(facilityIndex, 1)[0];
    
    // Save to file
    saveFacilitiesToFile(facilities);
    
    return deletedFacility;
  },
  
  create: async (data) => {
    console.log('Facility.create() called with fallback implementation');
    
    // Make sure we have an applicationId
    if (!data.applicationId) {
      data.applicationId = `STB-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    
    // Add timestamps
    data.createdAt = new Date();
    
    // Set initial status
    if (!data.status) {
      data.status = 'Bekliyor';
    }
    
    // Load existing facilities
    const facilities = readFacilitiesFromFile();
    
    // Add the new facility
    facilities.push(data);
    
    // Save to file
    saveFacilitiesToFile(facilities);
    
    return data;
  }
};

// Export the model or fallback implementation
module.exports = FacilityModel || Facility; 