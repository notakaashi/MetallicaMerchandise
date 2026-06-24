# 🎸 Metallica Merch Store

A full-stack Metallica Merchandise E-Commerce System built with Node.js, Express, EJS, MySQL, and Sequelize.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express.js |
| **Views** | EJS (Server-Side Rendering) |
| **Database** | MySQL via Sequelize ORM |
| **Auth** | Custom SHA256 token-based auth |
| **File Uploads** | Multer (multi-image, up to 5 per product) |
| **Email** | Nodemailer (Ethereal fallback for dev) |
| **PDF Receipts** | PDFKit |
| **Frontend** | jQuery, jQuery Validation, jQuery DataTables, jQuery UI Autocomplete, Chart.js |
| **Build Tool** | Vite (bundles `src/frontend` → `public/`) |

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL server running locally

### 1. Configure Environment

Edit `.env` and fill in your MySQL credentials:

```env
PORT=3000
DB_HOST=localhost
DB_NAME=metallica_merch
DB_USER=root
DB_PASS=yourpassword
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

> **Note:** If `SMTP_USER` is empty, the app automatically creates an [Ethereal](https://ethereal.email) test account. Check console output for the preview URL after sending a receipt email.

### 2. Create the MySQL Database

```sql
CREATE DATABASE metallica_merch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Install & Run

```bash
npm install
npm run build    # Bundle frontend assets with Vite
npm run seed     # Create tables + seed data
npm start        # Start the Express server
```

Or for development with hot-reloading:
```bash
npm run dev
```

Then open http://localhost:3000

## Demo Credentials

| Role | Email | Password |
|------|-------|---------|
| **Admin** | admin@metallica.store | admin123 |
| **Customer** | customer@metallica.store | customer123 |

## Features

### Customer-Facing
- 🎸 **Storefront** — Product grid with infinite scroll toggle
- 🔍 **Search** — jQuery UI Autocomplete + full-text search
- 🛒 **Cart Drawer** — Slide-in cart, persisted to localStorage
- 📦 **Checkout** — Validated form, order placed via AJAX
- 📋 **Order History** — View all past orders

### Admin Panel (`/admin`)
- 📊 **Dashboard** — Chart.js Bar, Line, and Doughnut charts
- 👥 **Users** — DataTables table, AJAX role/status toggling
- 🛍️ **Products** — DataTables with CRUD modal, multi-image upload
- 💳 **Transactions** — Status management, auto PDF receipt + email

### API Endpoints

#### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

#### Products
- `GET /api/products?page=&limit=`
- `GET /api/products/search?q=`
- `GET /api/products/autocomplete?q=`
- `GET /api/products/:id`
- `POST /api/products` *(admin)*
- `PUT /api/products/:id` *(admin)*
- `DELETE /api/products/:id` *(admin)*

#### Transactions
- `POST /api/transactions`
- `GET /api/transactions/my`
- `GET /api/transactions` *(admin)*
- `PATCH /api/transactions/:id/status` *(admin)*

#### Dashboard
- `GET /api/dashboard/metrics` *(admin)*

## Project Structure

```
metallica-merch-store/
├── app.js                    # Express entry point
├── .env                      # Environment config
├── vite.config.js            # Frontend bundler config
├── src/
│   ├── models/               # Sequelize models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── ProductImage.js
│   │   ├── Transaction.js
│   │   ├── TransactionItem.js
│   │   └── index.js
│   ├── middleware/
│   │   ├── auth.js           # Bearer token + cookie auth
│   │   └── admin.js          # Admin role guard
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── transactions.js
│   │   ├── dashboard.js
│   │   └── pages.js          # EJS page renderer
│   ├── services/
│   │   ├── pdfService.js     # PDFKit receipt generator
│   │   └── emailService.js   # Nodemailer
│   ├── seeders/
│   │   ├── seed.js
│   │   └── setupImages.js
│   └── frontend/
│       ├── css/main.css      # Metallica dark theme
│       └── js/
│           ├── main.js       # Customer entrypoint
│           ├── auth.js       # Login/register
│           ├── cart.js       # Cart + catalog
│           └── admin.js      # Admin tables + charts
├── views/
│   ├── layout/
│   │   ├── navbar.ejs
│   │   └── sidebar.ejs
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   ├── users.ejs
│   │   ├── products.ejs
│   │   └── transactions.ejs
│   ├── index.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── checkout.ejs
│   ├── orders.ejs
│   └── 404.ejs
└── public/
    ├── css/                  # Bundled CSS output
    ├── js/                   # Bundled JS output
    └── uploads/              # Product images
```

## Authentication Flow

- On login: server generates a `crypto.createHash('sha256')` token, stores it in `users.token`
- Token is returned in the JSON response **and** set as an `HttpOnly` cookie
- AJAX calls send `Authorization: Bearer <token>` header
- Page navigation uses the cookie fallback
- Logout clears the token in DB and clears the cookie

## Receipt Email + PDF

When an admin changes a transaction status to `completed`:
1. **PDFKit** generates a styled A4 receipt PDF (Metallica dark theme)
2. **Nodemailer** sends it to the customer's email as an attachment
3. If no SMTP configured, Ethereal test account is used (check console for preview URL)

---

🤘 **For The Love of Metal** — Built with Node.js, Express & lots of 🎸
