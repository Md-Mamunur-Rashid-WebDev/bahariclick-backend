// The User model defines what a "user" looks like in our database.
// Each user has a name, email, password, and a role (customer or admin).

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['customer', 'admin'], // Only these two values allowed
    default: 'customer',
  },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// BEFORE saving to DB, hash the password if it was modified
// This means we never store plain text passwords
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare entered password with stored hash
// Called during login: user.matchPassword('enteredPassword')
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);