const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'facility'],
    default: 'facility'
  },
  facilityCode: {
    type: String,
    required: function() {
      return this.role === 'facility';
    }
  }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Dummy User model since we don't have actual MongoDB connection
const User = {
  findOne: (query) => {
    console.log('User.findOne() called with query:', query);
    return Promise.resolve(null);
  },
  
  findById: (id) => {
    console.log('User.findById() called with ID:', id);
    return Promise.resolve(null);
  }
};

module.exports = User; 