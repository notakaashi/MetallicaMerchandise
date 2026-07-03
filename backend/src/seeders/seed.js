const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runSeeder() {
  try {
    console.log('Starting seeder...');

    // Path to the SQL file
    const sqlPath = path.join(__dirname, '../../../metallica.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`SQL file not found at: ${sqlPath}`);
      process.exit(1);
    }
    
    const sqlFile = fs.readFileSync(sqlPath, 'utf8');

    // Create a database connection
    // Note: multipleStatements is required to run a full SQL dump file
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true
    });

    console.log('Connected to the database server.');

    // Execute the SQL statements
    console.log('Executing metallica.sql...');
    await connection.query(sqlFile);

    console.log('Seeding completed successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error running seeder:', error);
    process.exit(1);
  }
}

runSeeder();
