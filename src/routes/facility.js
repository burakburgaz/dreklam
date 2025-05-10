const express = require('express');
const router = express.Router();
const { protect, facilityOnly } = require('../middlewares/auth');
const { facilityUpload } = require('../middlewares/upload');
const Facility = require('../models/Facility');

// Create new facility
router.post('/', facilityUpload, async (req, res) => {
  try {
    // Process uploaded files
    const files = {};
    if (req.files) {
      if (req.files.facilityImage) {
        files.facilityImage = `/uploads/${req.files.facilityImage[0].filename}`;
      }
      if (req.files.authorizationDocument) {
        files.authorizationDocument = `/uploads/${req.files.authorizationDocument[0].filename}`;
      }
      if (req.files.facilityLicense) {
        files.facilityLicense = `/uploads/${req.files.facilityLicense[0].filename}`;
      }
      if (req.files.facilityLogo) {
        files.facilityLogo = `/uploads/${req.files.facilityLogo[0].filename}`;
      }
    }

    // Process payment methods
    const paymentMethods = {
      cash: req.body.cash === 'on',
      eft: req.body.eft === 'on',
      wire: req.body.wire === 'on',
      visa: req.body.visa === 'on',
      mastercard: req.body.mastercard === 'on',
      amex: req.body.amex === 'on',
      visaElectron: req.body.visaElectron === 'on',
      debitCard: req.body.debitCard === 'on',
      maestroDebitCard: req.body.maestroDebitCard === 'on'
    };

    // Create facility with form data and files
    const facility = await Facility.create({
      facilityName: req.body.facilityName,
      facilityTitle: req.body.facilityTitle,
      ckyscode: req.body.ckyscode,
      institutionType: req.body.institutionType,
      facilityType: req.body.facilityType,
      city: req.body.city,
      foundationYear: req.body.foundationYear,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      group: req.body.group,
      address: req.body.address,
      postalCode: req.body.postalCode,
      authorizationNumber: req.body.authorizationNumber,
      healthServices: Array.isArray(req.body.healthServices) 
        ? req.body.healthServices 
        : req.body.healthServices ? [req.body.healthServices] : [],
      staffCount: req.body.staffCount,
      email: req.body.email,
      website: req.body.website,
      ...files,
      paymentMethods
    });

    res.status(201).json({
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

// Get all facilities
router.get('/', protect, facilityOnly, async (req, res) => {
  try {
    const facilities = await Facility.find({ ckyscode: req.user.facilityCode });
    
    res.status(200).json({
      success: true,
      data: facilities
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

// Get facility by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Sağlık tesisi bulunamadı'
      });
    }

    // Check if user is admin or if this is their facility
    if (req.user.role !== 'admin' && req.user.facilityCode !== facility.ckyscode) {
      return res.status(403).json({
        success: false,
        message: 'Bu tesise erişim izniniz yok'
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

// Update facility
router.put('/:id', protect, facilityOnly, facilityUpload, async (req, res) => {
  try {
    let facility = await Facility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Sağlık tesisi bulunamadı'
      });
    }

    // Check if user is from this facility
    if (req.user.facilityCode !== facility.ckyscode) {
      return res.status(403).json({
        success: false,
        message: 'Bu tesisi güncelleme izniniz yok'
      });
    }

    // Process uploaded files
    const files = {};
    if (req.files) {
      if (req.files.facilityImage) {
        files.facilityImage = `/uploads/${req.files.facilityImage[0].filename}`;
      }
      if (req.files.authorizationDocument) {
        files.authorizationDocument = `/uploads/${req.files.authorizationDocument[0].filename}`;
      }
      if (req.files.facilityLicense) {
        files.facilityLicense = `/uploads/${req.files.facilityLicense[0].filename}`;
      }
      if (req.files.facilityLogo) {
        files.facilityLogo = `/uploads/${req.files.facilityLogo[0].filename}`;
      }
    }

    // Process payment methods
    const paymentMethods = {
      cash: req.body.cash === 'on',
      eft: req.body.eft === 'on',
      wire: req.body.wire === 'on',
      visa: req.body.visa === 'on',
      mastercard: req.body.mastercard === 'on',
      amex: req.body.amex === 'on',
      visaElectron: req.body.visaElectron === 'on',
      debitCard: req.body.debitCard === 'on',
      maestroDebitCard: req.body.maestroDebitCard === 'on'
    };

    // Update facility
    facility = await Facility.findByIdAndUpdate(req.params.id, {
      facilityName: req.body.facilityName,
      facilityTitle: req.body.facilityTitle,
      institutionType: req.body.institutionType,
      facilityType: req.body.facilityType,
      city: req.body.city,
      foundationYear: req.body.foundationYear,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      group: req.body.group,
      address: req.body.address,
      postalCode: req.body.postalCode,
      authorizationNumber: req.body.authorizationNumber,
      healthServices: Array.isArray(req.body.healthServices) 
        ? req.body.healthServices 
        : req.body.healthServices ? [req.body.healthServices] : [],
      staffCount: req.body.staffCount,
      email: req.body.email,
      website: req.body.website,
      ...files,
      paymentMethods
    }, { new: true });

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

// Test endpoint
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Facility API test endpoint is working'
  });
});

// Demo facility data
router.get('/', (req, res) => {
  const facilities = [
    {
      id: 'facility-1',
      name: 'Demo Facility 1',
      city: 'Istanbul'
    },
    {
      id: 'facility-2',
      name: 'Demo Facility 2',
      city: 'Ankara'
    }
  ];
  
  res.status(200).json({
    success: true,
    count: facilities.length,
    data: facilities
  });
});

module.exports = router; 