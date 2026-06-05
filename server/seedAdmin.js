const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');



dotenv.config();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
   
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('MongoDB Connected for seeding...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@zaalima.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';

    
    const existingAdmin = await User.findOne({ role: 'superadmin' });

    if (existingAdmin) {
      console.log('Super Admin already exists:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name:  ${existingAdmin.name}`);
      console.log('\nNo changes made.');
    } else {
      
      const admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword, 
        role: 'superadmin',
        status: 'active',
      });

      console.log('✅ Super Admin created successfully!');
      console.log(`  Email:    ${admin.email}`);
      console.log(`  Name:     ${admin.name}`);
      console.log(`  Role:     ${admin.role}`);
      console.log(`  Status:   ${admin.status}`);
      console.log('\n⚠️  Save these credentials securely!');
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected. Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
