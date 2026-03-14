const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
  },
  { timestamps: true }
);

// Hash password before saving to database
// Using callback style to avoid Kareem/Mongoose async conflict
userSchema.pre('save', function(next) {
  const user = this;

  // If password was not changed skip hashing
  if (!user.isModified('password')) {
    return next();
  }

  // Generate salt
  bcrypt.genSalt(10, function(saltErr, salt) {
    if (saltErr) {
      return next(saltErr);
    }

    // Hash password with salt
    bcrypt.hash(user.password, salt, function(hashErr, hash) {
      if (hashErr) {
        return next(hashErr);
      }

      // Replace plain password with hashed password
      user.password = hash;
      next();
    });
  });
});

// Method to compare entered password with hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
