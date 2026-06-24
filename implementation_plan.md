# Metallica Merchandise E-Commerce System - Implementation Plan

This implementation plan outlines the steps, roles, and daily schedule for 2 members to design and develop the Metallica Merchandise E-Commerce System. The project aligns with both the functional requirements and the professor's grading rubrics for Laravel (with NodeJS equivalents covered where specified).

---

## User Review Required

> [!IMPORTANT]
> **Tech Stack Clarification**: The requirements mention both Laravel and Node.js (e.g., NodeJS CRUD APIs, custom Node.js middleware, Sequelize ORM). Based on your request to "start a Laravel project", this plan outlines building the system in **Laravel** first. However, we have designed the architecture so that the frontend communicates with the backend via API endpoints. This makes it very easy to swap or run Laravel and NodeJS backend APIs in parallel if you need to submit both.
> 
> **Database Structure**: Token-based authentication requires saving the generated token directly in the `users` table. We will use custom headers (`Authorization: Bearer <token>`) to send this token via jQuery AJAX.

---

## Technical Architecture

### 1. Database Schema
- **`users` Table**:
  - `id` (Primary Key)
  - `name`, `email`, `password`
  - `role` (enum: `'admin'`, `'customer'`)
  - `status` (enum: `'active'`, `'inactive'`)
  - `token` (VARCHAR, nullable) -> Store authentication tokens directly here
  - `timestamps`
- **`products` Table**:
  - `id` (Primary Key)
  - `name`, `description`, `price` (decimal), `stock` (integer)
  - `timestamps`
- **`product_images` Table**: (Handles Multi-Photo Capability)
  - `id` (Primary Key)
  - `product_id` (Foreign Key referencing `products.id`)
  - `image_path` (string)
  - `timestamps`
- **`transactions` Table**:
  - `id` (Primary Key)
  - `user_id` (Foreign Key referencing `users.id`)
  - `status` (enum: `'pending'`, `'completed'`, `'cancelled'`)
  - `total_price` (decimal)
  - `timestamps`
- **`transaction_items` Table**:
  - `id` (Primary Key)
  - `transaction_id` (Foreign Key referencing `transactions.id`)
  - `product_id` (Foreign Key referencing `products.id`)
  - `quantity` (integer)
  - `price` (decimal - snapshot of product price at checkout)
  - `timestamps`

### 2. Middleware & Protection
- **`AdminMiddleware` (Laravel)**: Custom middleware checking if the authenticated user has the `admin` role and is `active`. Restricts non-admin users from accessing Admin CRUD APIs, returning a JSON `403 Forbidden` response.
- **NodeJS Custom Middleware (Optional Companion)**: A custom Express middleware function matching the role check logic.

---

## Daily Schedule (2-Member Division)

### **Day 1: Project Initiation, DB Design & Theme System**
* **Member A (Backend/API)**:
  - Install and initialize Laravel project.
  - Configure database connection in `.env`.
  - Create migrations for `users`, `products`, `product_images`, `transactions`, and `transaction_items`.
  - Define Eloquent Models, Relationships, and a Database Seeder (seeding an Admin user, default products, and test transaction records).
* **Member B (Frontend/UI)**:
  - Set up CSS design system with a premium "Metallica" theme: Dark mode base (`#121212`), crimson/red accents (`#DE0A26`), silver/charcoal gradients, and premium typography (e.g., *Outfit* or *Inter* fonts).
  - Design the main page layout (navigation header with cart badge, sidebar for admin portal, layout container, footer).
  - Setup frontend asset structures (jQuery, standard CSS, font libraries).

---

### **Day 2: Authentication System & User Management API**
* **Member A (Backend/API)**:
  - Implement registration API: validates user input, hashes passwords, saves user.
  - Implement login API: verifies credentials, generates a custom token (e.g., SHA256 string), saves it directly to the user's `token` field, and returns it.
  - Write custom Laravel Role Middleware to restrict admin routes.
  - Implement User Management CRUD APIs (list all users, update user role, deactivate/activate user accounts).
* **Member B (Frontend/UI)**:
  - Design user registration and login modals/forms.
  - Implement frontend form validation using the **jQuery Validation Plugin** (rules: required fields, email format, minimum password length).
  - Implement login/registration handlers using `$.ajax`. Upon successful login, save the returned token to `localStorage` and redirect.

---

### **Day 3: User Management Board & Product CRUD API**
* **Member A (Backend/API)**:
  - Build Merchandise Product CRUD APIs (Index, Show, Store, Update, Destroy).
  - Add multi-photo upload handler on Product creation: validates uploaded images array, saves files to storage, and writes paths to `product_images`.
* **Member B (Frontend/UI)**:
  - Build Admin User Management view.
  - Integrate **jQuery DataTables** for the users table, populating it via AJAX.
  - Add quick action buttons to change user roles and toggle account status (Active/Inactive) using jQuery AJAX calls.

---

### **Day 4: Product Management UI & Autocomplete Search**
* **Member A (Backend/API)**:
  - Add search and autocomplete API endpoints (`/api/products/search` & `/api/products/autocomplete`) returning JSON list matching terms.
* **Member B (Frontend/UI)**:
  - Build Admin Product Management view with **jQuery DataTables**.
  - Integrate a multi-file upload form (e.g. using a styled HTML5 file input with jQuery-rendered image previews) to upload multiple views of a merchandise item.
  - Implement **jQuery Validation** rules for the Product Create/Update forms.
  - Build the homepage search bar and wire it to the autocomplete API using jQuery UI Autocomplete (or a custom lightweight AJAX dropdown).

---

### **Day 5: Customer Catalog, Custom Pagination & Shopping Cart**
* **Member A (Backend/API)**:
  - Build transaction endpoints: `/api/transactions` (create orders), `/api/my-transactions` (for customer history).
* **Member B (Frontend/UI)**:
  - Build the main storefront page displaying Metallica merchandise.
  - Implement **custom jQuery pagination** (dynamic page numbers, next/prev triggers) for the storefront page (no DataTables pagination allowed here).
  - Implement **jQuery infinite scroll** mechanic as an optional view toggle (loads next batch of items on scroll boundary).
  - Implement local shopping cart operations in jQuery (add to cart, update quantities, remove items, local storage persistence).

---

### **Day 6: Transactions Management, PDF Receipts & Email Notifications**
* **Member A (Backend/API)**:
  - Set up email templates. Create a Mailable in Laravel.
  - Add endpoint to update order status. When status updates, trigger an email notification.
  - Install a PDF package (e.g. `barryvdh/laravel-dompdf`) to compile a detailed transaction receipt (listing order breakdown, quantities, taxes, totals) and attach it to the notification email.
* **Member B (Frontend/UI)**:
  - Design Checkout and Shopping Cart page (validating input with jQuery validation).
  - Create customer order history and transaction tracking page.
  - Build Admin Transaction log list where status can be updated via dropdowns.

---

### **Day 7: Analytics Dashboards, Verification, & Final Polish**
* **Member A (Backend/API)**:
  - Create admin dashboard aggregate endpoint (returns sales by product category, sales numbers over time, product stock status).
* **Member B (Frontend/UI)**:
  - Build the Admin Analytical Dashboard.
  - Integrate three distinct charts using Chart.js or ApexCharts:
    1. **Bar Chart**: Sales performance per product.
    2. **Line Chart**: Transaction volume/revenue over time.
    3. **Pie Chart**: Product category sales distribution.
* **Both Members**:
  - Perform integration tests: Auth tokens, custom middlewares, validation rules, multi-photo storage, email notifications, dynamic scroll, and PDF checks.
  - Fine-tune CSS styling (responsive layout, responsive tables, animations).

---

## Verification Plan

### Automated Tests (Member A)
We will define key PHPUnit API endpoint checks:
- `tests/Feature/AuthApiTest.php`: Tests registration, login, token generation, and token save.
- `tests/Feature/ProductApiTest.php`: Tests CRUD operations and multiple file uploads.
- `tests/Feature/RoleMiddlewareTest.php`: Ensures only admin tokens can perform modifications.
- `tests/Feature/TransactionApiTest.php`: Verification of order generation, email dispatching, and receipt attachment.

To execute tests:
```powershell
php artisan test
```

### Manual Verification (Member B)
- **UI Responsiveness Check**: Test storefront on mobile sizes.
- **Form Verification**: Attempt to submit invalid formats to confirm jQuery validation triggers before backend calls.
- **Charts check**: Verify that charts render correctly with realistic seeded data.
- **PDF & Email Check**: Change transaction status in dashboard, verify receipt attachment in Mailpit or log driver.
