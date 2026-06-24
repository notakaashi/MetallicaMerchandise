const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { sequelize, User, Product, ProductImage, Transaction, TransactionItem } = require('../models');

async function seed() {
  try {
    // 1. Sync DB with force: true
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // 2. Create 1 admin, 1 customer
    const adminHashed = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@metallica.store',
      password: adminHashed,
      role: 'admin',
      status: 'active'
    });

    const customerHashed = await bcrypt.hash('customer123', 10);
    const customerUser = await User.create({
      name: 'Customer User',
      email: 'customer@metallica.store',
      password: customerHashed,
      role: 'customer',
      status: 'active'
    });
    console.log('Users created');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 3. Create 10 realistic products
    const productsData = [
      { name: 'Master of Puppets Tour T-Shirt', description: 'Classic black tee featuring the iconic album art.', price: 1800.00, stock: 50, category: 'shirts' },
      { name: 'Ride the Lightning Hoodie', description: 'Warm pullover hoodie with electric blue graphics.', price: 3500.00, stock: 30, category: 'hoodies' },
      { name: 'Metallica Logo Guitar Picks (6-Pack)', description: 'Set of 6 premium guitar picks with the M logo.', price: 500.00, stock: 100, category: 'accessories' },
      { name: 'Kill \'Em All Vinyl Record', description: 'Remastered 180g vinyl of the debut album.', price: 1500.00, stock: 20, category: 'vinyl' },
      { name: 'Black Album Beanie', description: 'Cozy knit beanie with embroidered snake.', price: 1200.00, stock: 45, category: 'accessories' },
      { name: 'Justice for All Tour Poster', description: 'Limited edition 18x24 tour poster.', price: 1000.00, stock: 15, category: 'posters' },
      { name: 'Ninja Star Belt Buckle', description: 'Heavy metal belt buckle featuring the Ninja Star logo.', price: 1100.00, stock: 25, category: 'accessories' },
      { name: 'Seek & Destroy Coffee Mug', description: 'Ceramic mug for your morning fuel.', price: 800.00, stock: 60, category: 'accessories' },
      { name: 'Metallica World Tour Cap', description: 'Adjustable snapback cap.', price: 1500.00, stock: 40, category: 'accessories' },
      { name: 'Death Magnetic Flag', description: 'Large wall flag measuring 3x5 feet.', price: 900.00, stock: 35, category: 'posters' }
    ];

    const imageMap = [
      'product1_1.jpg',
      'product1_2.jpg',
      'product3_1.jpg',
      'product4_1.jpg',
      'product5_1.jpg',
      'product6_1.jpg',
      'product7_1.jpg',
      'product8_1.jpg',
      'product9_1.jpg',
      'product4_2.jpg'
    ];

    const createdProducts = [];
    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      const product = await Product.create(p);
      createdProducts.push(product);
      
      const realFilename = imageMap[i];

      await ProductImage.create({
        product_id: product.id,
        image_path: realFilename
      });
    }
    console.log('Products & images created');

    // 5. Insert sample transactions
    const transaction1 = await Transaction.create({
      user_id: customerUser.id,
      status: 'completed',
      total_price: 2300.00
    });
    await TransactionItem.create({
      transaction_id: transaction1.id,
      product_id: createdProducts[0].id, // T-Shirt
      quantity: 1,
      price: 1800.00
    });
    await TransactionItem.create({
      transaction_id: transaction1.id,
      product_id: createdProducts[2].id, // Picks
      quantity: 1,
      price: 500.00
    });

    const transaction2 = await Transaction.create({
      user_id: customerUser.id,
      status: 'pending',
      total_price: 3500.00
    });
    await TransactionItem.create({
      transaction_id: transaction2.id,
      product_id: createdProducts[1].id, // Hoodie
      quantity: 1,
      price: 3500.00
    });

    console.log('Transactions created');
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
