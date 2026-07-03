const { sequelize } = require('./src/models');
sequelize.query("ALTER TABLE transactions MODIFY COLUMN status ENUM('pending', 'completed', 'cancelled', 'shipped', 'delivering') NOT NULL DEFAULT 'pending'")
  .then(() => {
    console.log('DB ALTERED SUCCESSFULLY');
    process.exit(0);
  })
  .catch(e => {
    console.error('DB ERROR', e);
    process.exit(1);
  });
