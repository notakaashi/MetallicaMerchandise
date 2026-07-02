# Metallica Merchandise Backend

This is the Node.js/Express backend for the Metallica Merchandise E-Commerce store. It uses Sequelize as an ORM and connects to a MySQL database.

## Setup Instructions

1. **Database Configuration**
   Create a `.env` file in the `backend` directory with your database credentials (matching `src/config/database.js`):
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=yourpassword
   DB_NAME=metallica_merch
   PORT=3001
   ```

2. **Import the Database**
   The database schema and sample data are provided in the `metallica.sql` file at the root of the repository. You can import it directly via the MySQL command line (from the root folder). The script automatically creates the `metallica_merch` database, so you don't need to create it manually beforehand:
   ```bash
   mysql -u root -p < metallica.sql
   ```

3. **Install Dependencies and Run**
   Once your `.env` is configured and your database is imported, you can start the backend server:
   ```bash
   npm install
   npm run dev
   ```
