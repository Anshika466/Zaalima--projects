const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['superadmin', 'vendor', 'customer'],
        message: '{VALUE} is not a valid role',
      },
      default: 'customer',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'suspended'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
      required: true,
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    businessDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Business description cannot exceed 1000 characters'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index on role + status for admin queries (finding pending vendors, etc.)
// Note: email index is auto-created by the 'unique: true' constraint above
userSchema.index({ role: 1, status: 1 });

/**
 * Pre-save hook: Hash password before saving to database.
 * Only runs if the password field has been modified (not on every save).
 * Uses Bcrypt with 12 salt rounds as specified in PRD Section 9.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 
 * @param {string} enteredPassword - Plain text password from login form
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('validate', function (next) {
  if (this.role === 'vendor' && !this.businessName) {
    this.invalidate('businessName', 'Business name is required for vendors');
  }
  next();
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
