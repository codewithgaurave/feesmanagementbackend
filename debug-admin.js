require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function debugAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check all admins
    const admins = await Admin.find({});
    console.log('Total admins:', admins.length);
    
    admins.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log('  Email:', admin.email);
      console.log('  Password Hash:', admin.password);
      console.log('  Created:', admin.createdAt);
      console.log('  Updated:', admin.updatedAt);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugAdmin();