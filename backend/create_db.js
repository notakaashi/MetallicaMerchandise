const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'metallica_merch'}\`;`);
    console.log(`Database '${process.env.DB_NAME || 'metallica_merch'}' created or already exists.`);
    
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  }
}

createDatabase();
