require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const mysql2 = require('mysql2/promise');
const path = require('path');

// Setup product images first
console.log('\n📸 Setting up product images...');
require('./setupImages');

const products = [
  {
    name: 'Master of Puppets Tour Tee',
    description: 'Classic black tour tee featuring the iconic Master of Puppets album artwork. 100% heavy cotton. Available in all sizes.',
    price: 39.99,
    stock: 150,
    images: ['product1_1.jpg', 'product1_2.jpg'],
  },
  {
    name: 'Black Album Hoodie',
    description: 'Premium heavyweight hoodie with embroidered Metallica logo and the Black Album cover art on the back. Kangaroo pocket, adjustable drawstring.',
    price: 74.99,
    stock: 80,
    images: ['product2_1.jpg', 'product2_2.jpg'],
  },
  {
    name: 'Skull Snake Baseball Cap',
    description: 'Structured snap-back cap with embroidered snake and skull design. One size fits most. Black with silver stitching.',
    price: 29.99,
    stock: 200,
    images: ['product3_1.jpg'],
  },
  {
    name: 'Metallica Vinyl Record Box Set',
    description: 'Limited edition vinyl box set featuring remastered pressings of Master of Puppets, ...And Justice For All, and The Black Album. 180g audiophile vinyl.',
    price: 129.99,
    stock: 30,
    images: ['product4_1.jpg', 'product4_2.jpg'],
  },
  {
    name: 'Ride The Lightning Enamel Pin Set',
    description: 'Set of 5 high-quality enamel pins featuring iconic Metallica imagery. Lightning bolt, skull, snake, and more. Gold and silver finishes.',
    price: 19.99,
    stock: 500,
    images: ['product5_1.jpg'],
  },
  {
    name: 'Master of Puppets Guitar Strap',
    description: 'Heavy-duty 2" wide guitar strap with full-color Master of Puppets artwork. Adjustable 40"-58". Compatible with all standard guitars.',
    price: 44.99,
    stock: 60,
    images: ['product6_1.jpg', 'product6_2.jpg'],
  },
  {
    name: 'Metallica Coffee Mug (15oz)',
    description: 'Large ceramic mug featuring a wraparound Metallica logo with crimson and silver design. Dishwasher safe. 15oz capacity.',
    price: 16.99,
    stock: 300,
    images: ['product7_1.jpg'],
  },
  {
    name: 'Justice For All Patch Jacket',
    description: 'Pre-distressed denim jacket with embroidered ...And Justice For All artwork, back patches, and studded collar. Sizes S-3XL.',
    price: 159.99,
    stock: 25,
    images: ['product8_1.jpg', 'product8_2.jpg', 'product8_3.jpg'],
  },
  {
    name: 'Metallica Bandana',
    description: 'Classic 22" square bandana with Metallica logo and skulls pattern. 100% cotton. Black background with white and red print.',
    price: 12.99,
    stock: 400,
    images: ['product9_1.jpg'],
  },
  {
    name: 'Enter Sandman Wristband Set',
    description: 'Set of 3 silicone wristbands featuring Enter Sandman lyrics and Metallica branding. Black, red, and silver. One size fits most.',
    price: 9.99,
    stock: 600,
    images: ['product10_1.jpg'],
  },
];

async function seed() {
  let sequelize, User, Product, ProductImage, Transaction, TransactionItem;

  try {
    // Step 1: Create DB if not exists
    console.log('🔄 Creating database if not exists...');
    const connection = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    const dbName = process.env.DB_NAME || 'metallica_merch';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database '${dbName}' is ready.`);
    await connection.end();

    // Step 2: Load models (now DB exists)
    const models = require('../models');
    sequelize = models.sequelize;
    User = models.User;
    Product = models.Product;
    ProductImage = models.ProductImage;
    Transaction = models.Transaction;
    TransactionItem = models.TransactionItem;

    console.log('🔄 Syncing tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables synced.');

    // Seed admin
    const adminPass = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin Metallica',
      email: 'admin@metallica.store',
      password: adminPass,
      role: 'admin',
      status: 'active',
    });
    console.log(`✅ Admin user created: ${admin.email}`);

    // Seed customer
    const customerPass = await bcrypt.hash('customer123', 10);
    const customer = await User.create({
      name: 'James Hetfield Fan',
      email: 'customer@metallica.store',
      password: customerPass,
      role: 'customer',
      status: 'active',
    });
    console.log(`✅ Customer user created: ${customer.email}`);

    // Seed products
    const createdProducts = [];
    for (const p of products) {
      const product = await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
      });

      for (const img of p.images) {
        await ProductImage.create({
          product_id: product.id,
          image_path: img,
        });
      }

      createdProducts.push(product);
      console.log(`✅ Product created: ${product.name}`);
    }

    // Seed transactions
    const tx1 = await Transaction.create({
      user_id: customer.id,
      status: 'completed',
      total_price: 114.97,
    });
    await TransactionItem.create({ transaction_id: tx1.id, product_id: createdProducts[0].id, quantity: 2, price: 39.99 });
    await TransactionItem.create({ transaction_id: tx1.id, product_id: createdProducts[2].id, quantity: 1, price: 29.99 });

    const tx2 = await Transaction.create({
      user_id: customer.id,
      status: 'pending',
      total_price: 204.98,
    });
    await TransactionItem.create({ transaction_id: tx2.id, product_id: createdProducts[3].id, quantity: 1, price: 129.99 });
    await TransactionItem.create({ transaction_id: tx2.id, product_id: createdProducts[1].id, quantity: 1, price: 74.99 });

    const tx3 = await Transaction.create({
      user_id: customer.id,
      status: 'cancelled',
      total_price: 159.99,
    });
    await TransactionItem.create({ transaction_id: tx3.id, product_id: createdProducts[7].id, quantity: 1, price: 159.99 });

    console.log('✅ Test transactions created.');
    console.log('\n🎸 Seed complete! Login credentials:');
    console.log('   Admin:    admin@metallica.store   / admin123');
    console.log('   Customer: customer@metallica.store / customer123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message || err);
    process.exit(1);
  }
}

seed();
