const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Admin model
const Admin = require('./server/admin/admin.model');

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://katkotlive0_db_user:katkotlive0_db_user@katkotlive0.b81i8rt.mongodb.net/?appName=katkotlive0';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB connected');
    return resetPassword();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

async function resetPassword() {
  try {
    const email = 'katkotlive0@gmail.com';
    const newPassword = 'Admin123456';

    // Find the admin
    const admin = await Admin.findOne({ email: email });
    
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      process.exit(1);
    }

    console.log('📝 Found admin:', admin.email);
    console.log('🔄 Resetting password...');

    // Hash and update password
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', newPassword);

    // Verify the password works
    const isPasswordCorrect = bcrypt.compareSync(newPassword, admin.password);
    console.log('✅ Password verification:', isPasswordCorrect ? 'PASSED' : 'FAILED');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
