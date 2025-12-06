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
    return testAdminLogin();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

async function testAdminLogin() {
  try {
    const email = 'katkotlive0@gmail.com';
    const password = 'Admin123456';

    console.log('\n📋 Step 1: Finding admin in database...');
    const admin = await Admin.findOne({ email: email });
    
    if (!admin) {
      console.log('❌ Admin not found in database');
      process.exit(1);
    }

    console.log('✅ Admin found!');
    console.log('   Email:', admin.email);
    console.log('   ID:', admin._id);
    console.log('   Created At:', admin.createdAt);

    console.log('\n🔐 Step 2: Verifying password...');
    const isPasswordCorrect = bcrypt.compareSync(password, admin.password);
    
    if (!isPasswordCorrect) {
      console.log('❌ Password does NOT match');
      console.log('   Entered password:', password);
      console.log('   Stored hash:', admin.password);
      process.exit(1);
    }

    console.log('✅ Password matches!');

    console.log('\n📝 Step 3: Admin data ready for login response:');
    console.log({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      image: admin.image,
    });

    console.log('\n✅ LOGIN TEST PASSED - Admin can now login!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
