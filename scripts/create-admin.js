require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('❌ Admin already exists with email: admin@test.com');
      process.exit(1);
    }

    // Create new admin
    const admin = new Admin({
      email: 'admin@test.com',
      password: 'admin123'
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('Email: admin@test.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();