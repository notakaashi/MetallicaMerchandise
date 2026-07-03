// =============================================
// CONFIG — change this if your API port differs
// =============================================
const API_BASE = 'http://localhost:3001';

// =============================================
// TOAST NOTIFICATIONS
// =============================================
window.showToast = function (message, type = 'info', title = '') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons  = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'Info'}</span>
    <div class="toast-content">
      <div class="toast-title">${title || titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// =============================================
// AUTH HELPERS
// =============================================
window.Auth = {
  getToken:    () => localStorage.getItem('mm_token'),
  getUser:     () => { try { return JSON.parse(localStorage.getItem('mm_user')); } catch { return null; } },
  setSession:  (token, user) => { localStorage.setItem('mm_token', token); localStorage.setItem('mm_user', JSON.stringify(user)); },
  clearSession:() => { localStorage.removeItem('mm_token'); localStorage.removeItem('mm_user'); },
  isLoggedIn:  () => !!localStorage.getItem('mm_token'),
  isAdmin:     () => { const u = window.Auth.getUser(); return u && u.role === 'admin'; },
  authHeaders: () => { const t = window.Auth.getToken(); return t ? { 'Authorization': `Bearer ${t}` } : {}; },
  requireAuth: (redirectTo = '/login.html') => {
    if (!window.Auth.isLoggedIn()) { window.location.href = redirectTo; return false; }
    return true;
  },
  requireAdmin: (redirectTo = '/index.html') => {
    if (!window.Auth.isLoggedIn()) { window.location.href = '/login.html'; return false; }
    if (!window.Auth.isAdmin())    { window.location.href = redirectTo;    return false; }
    return true;
  },
};

// =============================================
// NAVBAR RENDERER (injected via JS into pages)
// =============================================
window.renderNavbar = function (opts = {}) {
  const { showCart = true, showSearch = true } = opts;
  const user = window.Auth.getUser();

  const searchHtml = showSearch ? `
    <div class="navbar-search" style="margin-left: 24px">
      <svg class="navbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="text" id="navbar-search" placeholder="Search Metallica merch..." autocomplete="off" aria-label="Search products">
    </div>` : '';

  let userHtml;
  if (user && window.Auth.isLoggedIn()) {
    userHtml = `
      <div style="position:relative" id="user-dropdown-container">
        <button id="user-dropdown-btn" style="background:transparent;border:none;color:var(--text-primary);font-family:'Inter',sans-serif;font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:4px">
          ${user.name}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div id="user-dropdown-menu" style="display:none;position:absolute;top:100%;right:0;margin-top:8px;background:#1e1e1e;border:1px solid rgba(255,255,255,0.1);min-width:140px;box-shadow:0 10px 25px rgba(0,0,0,0.5);z-index:100">
          ${user.role === 'admin' 
            ? `<a href="/admin/dashboard.html" style="display:block;padding:10px 16px;color:#e0e0e0;text-decoration:none;font-size:14px;transition:background 0.2s" onmouseover="this.style.background='var(--accent-red)'" onmouseout="this.style.background='transparent'">Admin Panel</a>` 
            : ``}
          <a href="/orders.html" style="display:block;padding:10px 16px;color:#e0e0e0;text-decoration:none;font-size:14px;transition:background 0.2s" onmouseover="this.style.background='var(--accent-red)'" onmouseout="this.style.background='transparent'">My Orders</a>
          <div style="height:1px;background:rgba(255,255,255,0.1);margin:4px 0"></div>
          <button id="logout-btn" style="display:block;width:100%;text-align:left;background:transparent;border:none;padding:10px 16px;color:#e0e0e0;font-family:'Inter',sans-serif;font-size:14px;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='var(--accent-red)'" onmouseout="this.style.background='transparent'">Logout</button>
        </div>
      </div>`;
  } else {
    userHtml = `
      <a href="/login.html" class="btn btn-ghost btn-sm">Login</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Join Now</a>`;
  }

  const isAdminPage = window.location.pathname.startsWith('/admin');

  const cartHtml = showCart ? `
    <button class="cart-btn" id="cart-open-btn" aria-label="Open cart">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      Cart
      <span class="cart-badge" style="display:none">0</span>
    </button>` : '';

  const productsLinkHtml = !isAdminPage ? `
    <a href="/products.html" style="margin-left:32px;color:var(--text-primary);text-decoration:none;font-weight:600;font-size:14px;transition:color 0.2s" onmouseover="this.style.color='var(--accent-red)'" onmouseout="this.style.color='var(--text-primary)'">PRODUCTS</a>
  ` : '';

  const navHtml = `
    <nav class="navbar" id="main-navbar">
      <div class="navbar-inner">
        <a href="/index.html" class="navbar-brand">
          <span class="navbar-logo">METALLICA</span>
          <span class="navbar-tagline">Merch Store</span>
        </a>
        ${productsLinkHtml}
        ${searchHtml}
        <div class="navbar-actions">
          <div id="navbar-user-area" style="display:flex;align-items:center;gap:8px">
            ${userHtml}
          </div>
          ${cartHtml}
        </div>
      </div>
    </nav>
    <div class="cart-overlay" id="cart-overlay"></div>
    <aside class="cart-drawer" id="cart-drawer" aria-label="Shopping cart">
      <div class="cart-drawer-header">
        <div class="cart-drawer-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          Your Cart
        </div>
        <button class="modal-close" id="cart-close-btn" aria-label="Close cart">×</button>
      </div>
      <div class="cart-drawer-body" id="cart-drawer-body">
        <div class="cart-empty">
          <span class="cart-empty-icon"></span>
          <p>Your cart is empty</p>
          <p style="font-size:13px;color:var(--text-muted)">Add some merch to get started!</p>
        </div>
      </div>
      <div class="cart-drawer-footer">
        <div class="cart-total">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-value" id="cart-total-value">$0.00</span>
        </div>
        <a href="/checkout.html" class="btn btn-primary w-full btn-lg">Checkout</a>
        <button id="cart-clear-btn" class="btn btn-ghost w-full btn-sm" style="margin-top:8px">Clear Cart</button>
      </div>
    </aside>
    <div class="toast-container" id="toast-container"></div>`;

  document.body.insertAdjacentHTML('afterbegin', navHtml);

  // Dropdown toggle logic
  document.addEventListener('click', function(e) {
    const dropdownBtn = document.getElementById('user-dropdown-btn');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    
    if (dropdownBtn && dropdownMenu) {
      if (dropdownBtn.contains(e.target)) {
        const isVisible = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = isVisible ? 'none' : 'block';
      } else if (!dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    }
  });

  // Wire up logout
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'logout-btn') {
      $.ajax({
        url: `${API_BASE}/api/auth/logout`,
        method: 'POST',
        headers: window.Auth.authHeaders(),
        complete: function () {
          window.Auth.clearSession();
          window.Cart && window.Cart.clear();
          window.showToast('Logged out. See you in the pit!', 'info');
          setTimeout(() => window.location.href = '/index.html', 800);
        },
      });
    }
  });
  
  // Wire up search bar redirect to products page
  document.addEventListener('keydown', function(e) {
    if (e.target && e.target.id === 'navbar-search' && e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) {
        window.location.href = `/products?q=${encodeURIComponent(q)}`;
      }
    }
  });
};

// =============================================
// ADMIN SIDEBAR RENDERER
// =============================================
window.renderAdminSidebar = function (activePage) {
  const user = window.Auth.getUser();
  const initial = user ? user.name.charAt(0).toUpperCase() : 'A';
  const name    = user ? user.name : 'Admin';

  const links = [
    { href: '/admin/dashboard.html', label: 'Dashboard',    key: 'dashboard',    icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
    { href: '/admin/users.html',     label: 'Users',        key: 'users',        icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { href: '/admin/products.html',  label: 'Products',     key: 'products',     icon: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
    { href: '/admin/transactions.html', label: 'Transactions', key: 'transactions', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  ];

  const navLinks = links.map(l => `
    <li>
      <a href="${l.href}" class="sidebar-link ${activePage === l.key ? 'active' : ''}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${l.icon}</svg>
        ${l.label}
      </a>
    </li>`).join('');

  const sidebarHtml = `
    <aside class="sidebar" id="admin-sidebar">
      <div style="padding:0 20px;margin-bottom:8px">
        <a href="/index.html" style="font-family:'Outfit',sans-serif;font-weight:900;font-size:20px;color:var(--accent-red);text-decoration:none;display:flex;align-items:center;gap:8px;">METALLICA</a>
        <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-top:2px">Admin Panel</div>
      </div>
      <div style="padding:0 20px;margin:16px 0 8px">
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg-hover);border-radius:var(--radius-md)">
          <div style="width:36px;height:36px;background:var(--accent-red);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;color:#fff">${initial}</div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${name}</div>
            <div style="font-size:11px;color:var(--accent-red);text-transform:uppercase;font-weight:700">Administrator</div>
          </div>
        </div>
      </div>
      <span class="sidebar-section-title">Navigation</span>
      <ul class="sidebar-nav">${navLinks}</ul>
      <span class="sidebar-section-title">Quick Links</span>
      <ul class="sidebar-nav">
        <li>
          <a href="/index.html" class="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            View Store
          </a>
        </li>
        <li>
          <a href="#" class="sidebar-link" id="logout-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </a>
        </li>
      </ul>
      <div style="margin-top:auto;padding:20px;font-size:11px;color:var(--text-muted);text-align:center">
        © 2024 Metallica Merch Store<br>
        <span style="color:var(--accent-red)">For The Love of Metal</span>
      </div>
    </aside>`;

  // Insert before .admin-main or at start of .admin-layout
  const layout = document.querySelector('.admin-layout');
  if (layout) layout.insertAdjacentHTML('afterbegin', sidebarHtml);
};
