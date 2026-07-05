const { sequelize } = require('./src/models');

async function runMigration() {
  try {
    console.log('Adding columns to users table...');
    // We use try-catch for each alter so if it already exists, we just ignore and proceed.
    try {
      await sequelize.query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL");
      console.log('Added avatar column to users');
    } catch (e) { console.log('Column avatar might already exist'); }

    try {
      await sequelize.query("ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL");
      console.log('Added phone column to users');
    } catch (e) { console.log('Column phone might already exist'); }

    try {
      await sequelize.query("ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL");
      console.log('Added address column to users');
    } catch (e) { console.log('Column address might already exist'); }

    try {
      await sequelize.query("ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL");
      console.log('Added city column to users');
    } catch (e) { console.log('Column city might already exist'); }

    try {
      await sequelize.query("ALTER TABLE users ADD COLUMN zip VARCHAR(20) NULL");
      console.log('Added zip column to users');
    } catch (e) { console.log('Column zip might already exist'); }

    console.log('Adding columns to transactions table...');
    try {
      await sequelize.query("ALTER TABLE transactions ADD COLUMN payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'card'");
      console.log('Added payment_method column to transactions');
    } catch (e) { console.log('Column payment_method might already exist'); }

    console.log('DB MIGRATION COMPLETED SUCCESSFULLY');
    process.exit(0);
  } catch (err) {
    console.error('DB MIGRATION ERROR', err);
    process.exit(1);
  }
}

runMigration();
