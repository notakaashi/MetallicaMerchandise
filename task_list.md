# Metallica Merchandise Store - Comprehensive Task List

This task list is based on the combined functional requirements from both the project specifications and the professor's grading rubrics. It divides the work between 2 members to ensure all requirements (APIs, Sequelize ORM, jQuery frontend, PDF generation, UI/UX, etc.) are fulfilled.

## Member A: Backend, APIs, & Database

**1. Database & ORM setup (mp7 - 20pts)**
- [x] Implement Sequelize ORM for all database operations instead of raw SQL queries.
- [x] Define models and relationships for Users, Products, Product Images, and Transactions.

**2. Authentication System (mp5 - 20pts | mp6 - 20pts)**
- [x] Build User Registration & Login APIs.
- [x] Generate authentication tokens manually and send them to the client.
- [x] Save the generated token directly into the `users` table.

**3. Security & Route Protection (quiz 6 - 15pts)**
- [ ] Create custom Node.js middleware to check user roles.
- [ ] Protect all Admin CRUD APIs to ensure only 'admin' roles can access them.

**4. Products CRUD & File Uploads (mp1/mp2 - 40pts | mp3 - 20pts)**
- [ ] Build Node.js CRUD APIs for Metallica merchandise.
- [ ] Implement multi-photo upload capability on product creation (saving multiple image paths for one product).

**5. Transactions CRUD API (Term Test - 25pts)**
- [ ] Build the dedicated Node.js CRUD API to manage customer transactions and orders.

**6. Notifications & PDFs (Term Test - 15pts)**
- [ ] Implement an automated email notification system that triggers when an admin updates a transaction status.
- [ ] Generate a PDF receipt containing a detailed order breakdown (quantities, totals) and attach it to the automated email.

**7. Search & Analytics Data Providers (quiz 5 - 15pts | quiz 7 - 15pts)**
- [ ] Build an API endpoint specifically to feed data for the homepage search/autocomplete feature.
- [ ] Build API endpoints to supply aggregated data for the admin analytics charts (bar, line, and pie).

---

## Member B: Frontend, UI/UX, & jQuery Integrations

**1. UI/UX Design & Responsiveness (unit test 1 - 20pts)**
- [ ] Implement a strict, modern, mobile-responsive UI/UX design across the entire application using standard CSS/frameworks.

**2. Forms & jQuery Validation (quiz 4 - 15pts)**
- [ ] Build User Registration and Login forms.
- [ ] Build Product CRUD forms and Checkout interfaces.
- [ ] Implement strict frontend **jQuery validation** for all forms (do not rely solely on HTML5 validation attributes).

**3. User Management Interface (mp6 - 20pts)**
- [ ] Build the Admin view to list all registered users inside a **jQuery DataTable**.
- [ ] Integrate AJAX actions to allow admins to update user roles and deactivate user accounts.

**4. Products & Upload UI (mp3 - 20pts | mp4)**
- [ ] Build the Admin Merchandise Product interface using **jQuery DataTables**.
- [ ] Create a frontend file upload interface capable of handling multiple file selections for a single product.

**5. Storefront Dynamic Loading (unit test 2 - 35pts)**
- [ ] Build the customer-facing product display page.
- [ ] Implement custom **jQuery pagination** for the product catalog. (Do not use DataTables here).
- [ ] Implement a custom **jQuery infinite scroll** mechanic for dynamically loading products. (Do not use DataTables here).

**6. Search & Autocomplete (quiz 5 - 15pts)**
- [ ] Implement a search bar on the homepage.
- [ ] Bind the search bar to a **jQuery UI autocomplete** (or similar jQuery-based API) that fetches live results from the backend.

**7. Shopping Cart & Checkout (Term Test - 25pts)**
- [ ] Build the frontend checkout and order placement system utilizing asynchronous jQuery AJAX requests to communicate with the transaction API.

**8. Analytical Dashboards (quiz 7 - 15pts)**
- [ ] Integrate three distinct JavaScript charts on the Admin Dashboard: a **Bar chart**, a **Line chart**, and a **Pie chart** to visualize the e-commerce data fetched from the API.
