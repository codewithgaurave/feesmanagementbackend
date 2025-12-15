const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  class: { type: String, required: true },
  section: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  parentName: { type: String, required: true },
  parentPhone: { type: String, required: true },
  admissionDate: { type: Date, required: true },
  totalFee: { type: Number, required: true },
  feeType: { type: String, required: true, default: 'Annual' },
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);