const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@growthvalley.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Performance Marketer',
    email: 'marketer@growthvalley.com',
    password: 'marketer123',
    role: 'performance_marketer',
  },
  {
    name: 'Content Writer One',
    email: 'contentwriter@growthvalley.com',
    password: 'content123',
    role: 'content_writer',
  },
  {
    name: 'Designer One',
    email: 'designer@growthvalley.com',
    password: 'design123',
    role: 'designer',
  },
];

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.error('MONGODB_URI environment variable is not defined');
      process.exit(1);
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create new users
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('  Admin: admin@growthvalley.com / admin123');
    console.log('  Marketer: marketer@growthvalley.com / marketer123');
    console.log('  Content Writer: contentwriter@growthvalley.com / content123');
    console.log('  Designer: designer@growthvalley.com / design123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();