// =============================================
// ADMIN JS — Charts + DataTables
// Requires: auth.js (for API_BASE + Auth)
// =============================================

$(document).ready(function () {
  // Guard: admin only
  if (!window.Auth.requireAdmin('/index.html')) return;

  // Render sidebar based on data-page attribute
  const page = $('body').data('page');
  if (window.renderAdminSidebar) window.renderAdminSidebar(page);

  if (page === 'dashboard') loadDashboard();
  if (page === 'users') initUsersTable();
  if (page === 'products') initProductsTable();
  if (page === 'transactions') initTransactionsTable();
  if (page === 'reviews') initReviewsTable();
});

// =============================================
// DASHBOARD
// =============================================
function loadDashboard() {
  $.ajax({
    url: `${API_BASE}/api/dashboard/metrics`,
    headers: window.Auth.authHeaders(),
    success: function (data) {
      animateNumber('#kpi-revenue', data.kpis.totalRevenue, true);
      animateNumber('#kpi-orders', data.kpis.totalOrders, false);
      animateNumber('#kpi-products', data.kpis.totalProducts, false);
      renderBarChart(data.salesPerProduct);
      renderLineChart(data.dailyRevenue);
      renderPieChart(data.statusDistribution);
    },
    error: () => window.showToast('Failed to load dashboard metrics', 'error'),
  });
}

function animateNumber(selector, value, isCurrency) {
  const $el = $(selector);
  if (!$el.length) return;
  const end = parseFloat(value) || 0;
  const step = end / (1200 / 16);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, end);
    $el.text(isCurrency ? `₱${current.toFixed(2)}` : Math.round(current).toLocaleString());
    if (current >= end) clearInterval(timer);
  }, 16);
}

function chartDefaults(extra = {}) {
  return {
    responsive: true, maintainAspectRatio: true,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      tooltip: { backgroundColor: '#1e1e1e', titleColor: '#f0f0f0', bodyColor: '#a0a0a0', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12, cornerRadius: 8 },
      legend: { labels: { color: '#a0a0a0', font: { family: 'Inter' } } },
    },
    ...extra,
  };
}

function truncateLabel(str, len) { return str && str.length > len ? str.substring(0, len) + '…' : str; }

function renderBarChart(salesData) {
  const ctx = document.getElementById('bar-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: salesData.map(s => truncateLabel(s.product, 18)),
      datasets: [{ label: 'Units Sold', data: salesData.map(s => s.total_sold), backgroundColor: 'rgba(222, 10, 38, 0.7)', borderColor: '#DE0A26', borderWidth: 2, borderRadius: 6, borderSkipped: false }],
    },
    options: chartDefaults({
      plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: (ctx) => `Revenue: ₱${salesData[ctx.dataIndex].total_revenue.toFixed(2)}` } } },
      scales: {
        x: { ticks: { color: '#8a8a8a', font: { size: 11 }, maxRotation: 30 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8a8a8a', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
      },
    }),
  });
}

function renderLineChart(dailyData) {
  const ctx = document.getElementById('line-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dailyData.map(d => d.date),
      datasets: [{ label: 'Revenue ($)', data: dailyData.map(d => d.revenue), borderColor: '#DE0A26', backgroundColor: 'rgba(222, 10, 38, 0.1)', borderWidth: 2.5, fill: true, tension: 0.4, pointBackgroundColor: '#DE0A26', pointRadius: 4, pointHoverRadius: 6 }],
    },
    options: chartDefaults({
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8a8a8a', font: { size: 11 }, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8a8a8a', font: { size: 11 }, callback: v => `₱${v}` }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
      },
    }),
  });
}

function renderPieChart(statusData) {
  const ctx = document.getElementById('pie-chart');
  if (!ctx) return;
  const colors = { pending: '#ff9f43', shipped: '#00cfe8', delivering: '#7367f0', completed: '#28c76f', cancelled: '#ea5455' };
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: statusData.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
      datasets: [{ data: statusData.map(s => s.count), backgroundColor: statusData.map(s => colors[s.status] || '#8a8a8a'), borderColor: '#1e1e1e', borderWidth: 3, hoverOffset: 8 }],
    },
    options: chartDefaults({ plugins: { legend: { display: true, position: 'bottom', labels: { color: '#a0a0a0', padding: 16, usePointStyle: true } } } }),
  });
}

// =============================================
// USERS TABLE
// =============================================
function initUsersTable(showDeleted = false) {
  const endpoint = showDeleted ? `${API_BASE}/api/users/deleted` : `${API_BASE}/api/users`;
  $.ajax({
    url: endpoint,
    headers: window.Auth.authHeaders(),
    success: function (data) {
      if ($.fn.DataTable.isDataTable('#users-table')) $('#users-table').DataTable().destroy();
      $('#users-table').DataTable({
        data: data.users,
        columns: [
          { data: 'id', title: '#', width: '50px' },
          { data: 'name', title: 'Name' },
          { data: 'email', title: 'Email' },
          { data: 'role', title: 'Role', render: (d) => `<span class="badge ${d === 'admin' ? 'badge-danger' : 'badge-info'}">${d}</span>` },
          { data: 'status', title: 'Status', render: (d) => `<span class="badge ${d === 'active' ? 'badge-success' : 'badge-silver'}">${d}</span>` },
          { data: 'createdAt', title: 'Joined', render: (d) => new Date(d).toLocaleDateString() },
          {
            data: 'id', title: 'Actions', orderable: false,
            render: (id, _, row) => {
              if (showDeleted) {
                return `<button class="btn btn-sm btn-success restore-user-btn" data-id="${id}" data-name="${row.name}">Restore</button>`;
              }
              const rowDataStr = encodeURIComponent(JSON.stringify(row));
              return `<div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-secondary edit-user-btn" data-user="${rowDataStr}">Edit</button>
                <button class="btn btn-sm btn-danger delete-user-btn" data-id="${id}" data-name="${row.name}">Delete</button>
              </div>`;
            },
          },
        ],
        pageLength: 10,
        dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
        language: { search: '', searchPlaceholder: 'Search users...' },
        order: [[0, 'asc']],
      });
    },
    error: () => window.showToast('Failed to load users', 'error'),
  });

  let editingUserId = null;

  $(document).off('click', '#add-user-btn').on('click', '#add-user-btn', function () {
    editingUserId = null;
    $('#user-form')[0].reset();
    $('#user-modal-title').text('Add User');
    $('#role-option-admin').show();
    $('#role-option-customer').hide();
    $('#edit-user-role').val('admin');
    $('#edit-user-status-group').hide();
    $('#edit-user-password-group').show();
    $('#edit-user-password').prop('required', true);
    $('#user-form-modal').addClass('open');
  });

  $(document).off('click', '.edit-user-btn').on('click', '.edit-user-btn', function () {
    const user = JSON.parse(decodeURIComponent($(this).data('user')));
    editingUserId = user.id;
    $('#user-form')[0].reset();
    $('#user-modal-title').text('Edit User');
    $('#edit-user-name').val(user.name);
    $('#edit-user-email').val(user.email);
    $('#edit-user-status').val(user.status);
    $('#edit-user-status-group').show();
    $('#edit-user-password-group').hide();
    $('#edit-user-password').prop('required', false);

    if (user.role === 'customer') {
      $('#role-option-admin').hide();
      $('#role-option-customer').show();
      $('#edit-user-role').val('customer');
    } else {
      $('#role-option-admin').show();
      $('#role-option-customer').show();
      $('#edit-user-role').val(user.role);
    }

    $('#user-form-modal').addClass('open');
  });

  $(document).off('click', '#user-form-modal-close, #user-modal-overlay-bg').on('click', '#user-form-modal-close, #user-modal-overlay-bg', function () {
    $('#user-form-modal').removeClass('open');
  });

  $('#user-form').validate({
    rules: {
      name: { required: true, minlength: 2 },
      email: { required: true, email: true },
      password: { minlength: 6 },
    },
    submitHandler: function (form) {
      const data = {
        name: $('#edit-user-name').val().trim(),
        email: $('#edit-user-email').val().trim(),
        role: $('#edit-user-role').val(),
        status: $('#edit-user-status').val()
      };
      if (!editingUserId) data.password = $('#edit-user-password').val();

      const url = editingUserId ? `${API_BASE}/api/users/${editingUserId}` : `${API_BASE}/api/users`;
      const method = editingUserId ? 'PUT' : 'POST';

      $.ajax({
        url, method, contentType: 'application/json', headers: window.Auth.authHeaders(), data: JSON.stringify(data),
        success: () => {
          window.showToast(editingUserId ? 'User updated!' : 'User created!', 'success');
          $('#user-form-modal').removeClass('open');
          initUsersTable();
        },
        error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to save user', 'error'),
      });
    }
  });

  $(document).off('click', '.delete-user-btn').on('click', '.delete-user-btn', function () {
    const id = $(this).data('id');
    const name = $(this).data('name');
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    $.ajax({
      url: `${API_BASE}/api/users/${id}`, method: 'DELETE', headers: window.Auth.authHeaders(),
      success: () => { window.showToast('User deleted', 'success'); initUsersTable(); },
      error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to delete user', 'error'),
    });
  });

  $(document).off('click', '#toggle-deleted-users-btn').on('click', '#toggle-deleted-users-btn', function () {
    const isDeletedView = $(this).data('view') === 'deleted';
    if (isDeletedView) {
      $(this).data('view', 'active').text('View Trash').removeClass('btn-danger').addClass('btn-secondary');
      initUsersTable(false);
    } else {
      $(this).data('view', 'deleted').text('View Active').removeClass('btn-secondary').addClass('btn-danger');
      initUsersTable(true);
    }
  });

  $(document).off('click', '.restore-user-btn').on('click', '.restore-user-btn', function () {
    const id = $(this).data('id');
    const name = $(this).data('name');
    if (!confirm(`Are you sure you want to restore ${name}?`)) return;
    $.ajax({
      url: `${API_BASE}/api/users/${id}/restore`, method: 'PUT', headers: window.Auth.authHeaders(),
      success: () => { window.showToast('User restored', 'success'); initUsersTable(true); },
      error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to restore user', 'error'),
    });
  });
}

// =============================================
// PRODUCTS TABLE
// =============================================
let editingProductId = null;

function initProductsTable(showDeleted = false) {
  const endpoint = showDeleted ? `${API_BASE}/api/products/deleted` : `${API_BASE}/api/products?limit=100`;
  $.ajax({
    url: endpoint,
    headers: window.Auth.authHeaders(),
    success: function (data) {
      if ($.fn.DataTable.isDataTable('#products-table')) $('#products-table').DataTable().destroy();
      $('#products-table').DataTable({
        data: data.products,
        columns: [
          { data: 'id', title: '#', width: '50px' },
          { data: 'images', title: 'Image', orderable: false, render: (imgs) => imgs && imgs.length ? `<img src="${API_BASE}/uploads/${imgs[0].image_path}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'">` : '<span style="font-size:24px">Merch</span>' },
          { data: 'name', title: 'Product Name' },
          { data: 'category', title: 'Category', render: (d) => `<span style="text-transform:capitalize;color:var(--text-secondary)">${d || 'other'}</span>` },
          { data: 'price', title: 'Price', render: (d) => `<strong style="color:var(--accent-red)">₱${parseFloat(d).toFixed(2)}</strong>` },
          { data: 'stock', title: 'Stock', render: (d) => d > 10 ? `<span class="badge badge-success">${d}</span>` : d > 0 ? `<span class="badge badge-warning">${d}</span>` : `<span class="badge badge-danger">0</span>` },
          { data: 'id', title: 'Actions', orderable: false, render: (id) => {
              if (showDeleted) return `<button class="btn btn-sm btn-success restore-product-btn" data-id="${id}">Restore</button>`;
              return `<div style="display:flex;gap:6px"><button class="btn btn-sm btn-secondary edit-product-btn" data-id="${id}">Edit</button><button class="btn btn-sm btn-danger delete-product-btn" data-id="${id}">Delete</button></div>`;
            } 
          },
        ],
        pageLength: 10,
        dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
        language: { search: '', searchPlaceholder: 'Search products...' },
        order: [[0, 'desc']],
      });
    }
  });

  $(document).off('click', '#add-product-btn').on('click', '#add-product-btn', function () {
    editingProductId = null;
    $('#product-form')[0].reset();
    $('#image-preview-grid').html('');
    $('#product-modal-title').text('Add Product');
    $('#product-form-modal').addClass('open');
  });

  $(document).off('click', '.edit-product-btn').on('click', '.edit-product-btn', function () {
    const id = $(this).data('id');
    editingProductId = id;
    $.get(`${API_BASE}/api/products/${id}`, function (data) {
      const p = data.product;
      $('#edit-name').val(p.name);
      $('#edit-description').val(p.description);
      $('#edit-price').val(p.price);
      $('#edit-stock').val(p.stock);
      $('#edit-category').val(p.category || 'other');
      let imgHtml = (p.images || []).map(img => `
        <div class="image-preview-item" data-img-id="${img.id}">
          <img src="${API_BASE}/uploads/${img.image_path}" alt="Product image">
          <button type="button" class="image-preview-remove remove-existing-img" data-img-id="${img.id}">×</button>
        </div>`).join('');
      $('#image-preview-grid').html(imgHtml);
      $('#product-modal-title').text('Edit Product');
      $('#product-form-modal').addClass('open');
    });
  });

  $(document).off('click', '.delete-product-btn').on('click', '.delete-product-btn', function () {
    const id = $(this).data('id');
    if (!confirm('Delete this product? This cannot be undone.')) return;
    $.ajax({
      url: `${API_BASE}/api/products/${id}`, method: 'DELETE', headers: window.Auth.authHeaders(),
      success: () => { window.showToast('Product deleted', 'success'); initProductsTable(); },
      error: (xhr) => {
        if (xhr.status === 200 || xhr.status === 204) {
          window.showToast('Product deleted', 'success');
          initProductsTable();
        } else {
          window.showToast(xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Failed to delete product', 'error');
        }
      },
    });
  });

  $(document).off('click', '#product-form-modal-close, #product-modal-overlay-bg').on('click', '#product-form-modal-close, #product-modal-overlay-bg', function () {
    $('#product-form-modal').removeClass('open');
    editingProductId = null;
  });

  $(document).off('change', '#edit-images').on('change', '#edit-images', function () {
    for (const file of this.files) {
      const reader = new FileReader();
      reader.onload = (e) => $('#image-preview-grid').append(`<div class="image-preview-item new-preview"><img src="${e.target.result}" alt="preview"></div>`);
      reader.readAsDataURL(file);
    }
  });

  $(document).off('click', '.remove-existing-img').on('click', '.remove-existing-img', function () {
    const imgId = $(this).data('img-id');
    $(this).closest('.image-preview-item').remove();
    $('<input>').attr({ type: 'hidden', name: 'removeImages[]', value: imgId }).appendTo('#product-form');
  });

  $('#product-form').validate({
    rules: {
      name: { required: true },
      price: { required: true, number: true, min: 0 },
      category: { required: true },
      stock: { required: true, digits: true, min: 0 }
    },
    submitHandler: function (form) {
      const formData = new FormData(form);
      const url = editingProductId ? `${API_BASE}/api/products/${editingProductId}` : `${API_BASE}/api/products`;
      const method = editingProductId ? 'PUT' : 'POST';
      $.ajax({
        url, method, headers: window.Auth.authHeaders(), data: formData, processData: false, contentType: false,
        success: () => { window.showToast(editingProductId ? 'Product updated!' : 'Product created!', 'success'); $('#product-form-modal').removeClass('open'); editingProductId = null; initProductsTable(); },
        error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to save product', 'error'),
      });
    }
  });

  $(document).off('click', '#toggle-deleted-products-btn').on('click', '#toggle-deleted-products-btn', function () {
    const isDeletedView = $(this).data('view') === 'deleted';
    if (isDeletedView) {
      $(this).data('view', 'active').text('View Trash').removeClass('btn-danger').addClass('btn-secondary');
      initProductsTable(false);
    } else {
      $(this).data('view', 'deleted').text('View Active').removeClass('btn-secondary').addClass('btn-danger');
      initProductsTable(true);
    }
  });

  $(document).off('click', '.restore-product-btn').on('click', '.restore-product-btn', function () {
    const id = $(this).data('id');
    if (!confirm('Restore this product?')) return;
    $.ajax({
      url: `${API_BASE}/api/products/${id}/restore`, method: 'PUT', headers: window.Auth.authHeaders(),
      success: () => { window.showToast('Product restored', 'success'); initProductsTable(true); },
      error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to restore product', 'error'),
    });
  });
}

// =============================================
// TRANSACTIONS TABLE
// =============================================
function initTransactionsTable() {
  $.ajax({
    url: `${API_BASE}/api/transactions`,
    headers: window.Auth.authHeaders(),
    success: function (data) {
      if ($.fn.DataTable.isDataTable('#transactions-table')) $('#transactions-table').DataTable().destroy();
      $('#transactions-table').DataTable({
        data: data.transactions,
        columns: [
          { data: null, title: '#', width: '80px', render: (row) => row.order_number || ('ORD-' + String(row.id).padStart(3, '0')) },
          { data: 'user', title: 'Customer', render: (u) => u ? `<div>${u.name}</div><div style="font-size:12px;color:var(--text-muted)">${u.email}</div>` : '—' },
          { data: 'items', title: 'Items', orderable: false, render: (items) => items ? `${items.length} item(s)` : '—' },
          { data: 'total_price', title: 'Total', render: (d) => `<strong style="color:var(--accent-red)">₱${parseFloat(d).toFixed(2)}</strong>` },
          {
            data: 'status', title: 'Status',
            render: (d, _, row) => {
              const colors = { pending: '#ff9f43', shipped: '#00cfe8', delivering: '#7367f0', completed: '#28c76f', cancelled: '#ea5455' };
              return `
                <select class="status-select" data-id="${row.id}" style="border:2px solid ${colors[d]};border-radius:4px;padding:4px 8px;background:#1a1a1a;color:#fff;outline:none;">
                  <option value="pending"   ${d === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="shipped"   ${d === 'shipped' ? 'selected' : ''}>Shipped</option>
                  <option value="delivering" ${d === 'delivering' ? 'selected' : ''}>Delivering</option>
                  <option value="completed" ${d === 'completed' ? 'selected' : ''}>Completed</option>
                  <option value="cancelled" ${d === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              `;},
          },
          { data: 'createdAt', title: 'Date', render: (d) => new Date(d).toLocaleDateString() },
        ],
        pageLength: 15,
        dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
        language: { search: '', searchPlaceholder: 'Search transactions...' },
        order: [[0, 'desc']],
      });

      // Update status counters
      const rows = data.transactions;
      $('#count-pending').text(rows.filter(r => r.status === 'pending').length);
      $('#count-shipped').text(rows.filter(r => r.status === 'shipped').length);
      $('#count-delivering').text(rows.filter(r => r.status === 'delivering').length);
      $('#count-completed').text(rows.filter(r => r.status === 'completed').length);
      $('#count-cancelled').text(rows.filter(r => r.status === 'cancelled').length);
    },
    error: () => window.showToast('Failed to load transactions', 'error'),
  });

  $(document).on('change', '.status-select', function () {
    const id = $(this).data('id'), status = $(this).val(), $select = $(this);
    $.ajax({
      url: `${API_BASE}/api/transactions/${id}/status`, method: 'PATCH', contentType: 'application/json', headers: window.Auth.authHeaders(), data: JSON.stringify({ status }),
      success: (res) => {
        window.showToast(`Order #${res.transaction.order_number || res.transaction.id} marked as ${status}`, 'success');
        const colors = { pending: '#ff9f43', shipped: '#00cfe8', delivering: '#7367f0', completed: '#28c76f', cancelled: '#ea5455' };
        $select.css('border-color', colors[status] || '');
      },
      error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to update status', 'error'),
    });
  });
}

// =============================================
// REVIEWS TABLE
// =============================================
function initReviewsTable() {
  $.ajax({
    url: `${API_BASE}/api/reviews`,
    headers: window.Auth.authHeaders(),
    success: function (data) {
      if ($.fn.DataTable.isDataTable('#reviews-table')) $('#reviews-table').DataTable().destroy();
      $('#reviews-table').DataTable({
        data: data.reviews,
        columns: [
          { data: 'id', title: '#', width: '50px' },
          { data: 'user', title: 'User', render: (u) => u ? u.name : 'Unknown' },
          { data: 'product', title: 'Product', render: (p) => p ? p.name : 'Unknown' },
          { data: 'rating', title: 'Rating', render: (d) => `${d} Stars` },
          { data: 'comment', title: 'Comment', render: (d) => d ? (d.length > 30 ? d.substring(0,30)+'...' : d) : '-' },
          { data: 'createdAt', title: 'Date', render: (d) => new Date(d).toLocaleDateString() },
          {
            data: 'id', title: 'Actions', orderable: false,
            render: (id, _, row) => {
              return `<div style="display:flex;gap:6px">
                <button class="btn btn-sm btn-danger delete-review-btn" data-id="${id}">Delete</button>
              </div>`;
            },
          },
        ],
        pageLength: 10,
        dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
        language: { search: '', searchPlaceholder: 'Search reviews...' },
        order: [[5, 'desc']],
      });
    },
    error: () => window.showToast('Failed to load reviews', 'error'),
  });

  $(document).on('click', '.delete-review-btn', function () {
    const id = $(this).data('id');
    if (confirm(`Are you sure you want to delete review #${id}?`)) {
      $.ajax({
        url: `${API_BASE}/api/reviews/${id}`,
        method: 'DELETE',
        headers: window.Auth.authHeaders(),
        success: () => {
          window.showToast('Review deleted', 'success');
          initReviewsTable();
        },
        error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to delete review', 'error'),
      });
    }
  });
}

