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

  if (page === 'dashboard')    loadDashboard();
  if (page === 'users')        initUsersTable();
  if (page === 'products')     initProductsTable();
  if (page === 'transactions') initTransactionsTable();
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
    $el.text(isCurrency ? `$${current.toFixed(2)}` : Math.round(current).toLocaleString());
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
      plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: (ctx) => `Revenue: $${salesData[ctx.dataIndex].total_revenue.toFixed(2)}` } } },
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
        y: { ticks: { color: '#8a8a8a', font: { size: 11 }, callback: v => `$${v}` }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
      },
    }),
  });
}

function renderPieChart(statusData) {
  const ctx = document.getElementById('pie-chart');
  if (!ctx) return;
  const colors = { pending: '#ff9f43', completed: '#28c76f', cancelled: '#ea5455' };
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statusData.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
      datasets: [{ data: statusData.map(s => s.count), backgroundColor: statusData.map(s => colors[s.status] || '#8a8a8a'), borderColor: '#1e1e1e', borderWidth: 3, hoverOffset: 8 }],
    },
    options: chartDefaults({ cutout: '65%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#a0a0a0', padding: 16, usePointStyle: true } } } }),
  });
}

// =============================================
// USERS TABLE
// =============================================
function initUsersTable() {
  $.ajax({
    url: `${API_BASE}/api/users`,
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

  $(document).on('click', '#add-user-btn', function () {
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

  $(document).on('click', '.edit-user-btn', function () {
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

  $(document).on('click', '#user-form-modal-close, #user-modal-overlay-bg', function () {
    $('#user-form-modal').removeClass('open');
  });

  $(document).on('submit', '#user-form', function (e) {
    e.preventDefault();
    const data = {
      name: $('#edit-user-name').val().trim(),
      email: $('#edit-user-email').val().trim(),
      role: $('#edit-user-role').val(),
      status: $('#edit-user-status').val()
    };
    if (!editingUserId) data.password = $('#edit-user-password').val();

    const url    = editingUserId ? `${API_BASE}/api/users/${editingUserId}` : `${API_BASE}/api/users`;
    const method = editingUserId ? 'PUT' : 'POST';

    $.ajax({ url, method, contentType: 'application/json', headers: window.Auth.authHeaders(), data: JSON.stringify(data),
      success: () => {
        window.showToast(editingUserId ? 'User updated!' : 'User created!', 'success');
        $('#user-form-modal').removeClass('open');
        initUsersTable();
      },
      error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to save user', 'error'),
    });
  });

  $(document).on('click', '.delete-user-btn', function () {
    const id = $(this).data('id');
    const name = $(this).data('name');
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    $.ajax({ url: `${API_BASE}/api/users/${id}`, method: 'DELETE', headers: window.Auth.authHeaders(),
      success: () => { window.showToast('User deleted', 'success'); initUsersTable(); },
      error:   (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to delete user', 'error'),
    });
  });
}

// =============================================
// PRODUCTS TABLE
// =============================================
let editingProductId = null;

function initProductsTable() {
  $.get(`${API_BASE}/api/products?limit=100`, function (data) {
    if ($.fn.DataTable.isDataTable('#products-table')) $('#products-table').DataTable().destroy();
    $('#products-table').DataTable({
      data: data.products,
      columns: [
        { data: 'id', title: '#', width: '50px' },
        { data: 'images', title: 'Image', orderable: false, render: (imgs) => imgs && imgs.length ? `<img src="${API_BASE}/uploads/${imgs[0].image_path}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'">` : '<span style="font-size:24px">Merch</span>' },
        { data: 'name', title: 'Product Name' },
        { data: 'price', title: 'Price', render: (d) => `<strong style="color:var(--accent-red)">$${parseFloat(d).toFixed(2)}</strong>` },
        { data: 'stock', title: 'Stock', render: (d) => d > 10 ? `<span class="badge badge-success">${d}</span>` : d > 0 ? `<span class="badge badge-warning">${d}</span>` : `<span class="badge badge-danger">0</span>` },
        { data: 'id', title: 'Actions', orderable: false, render: (id) => `<div style="display:flex;gap:6px"><button class="btn btn-sm btn-secondary edit-product-btn" data-id="${id}">Edit</button><button class="btn btn-sm btn-danger delete-product-btn" data-id="${id}">Delete</button></div>` },
      ],
      pageLength: 10,
      dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
      language: { search: '', searchPlaceholder: 'Search products...' },
      order: [[0, 'desc']],
    });
  });

  $(document).on('click', '#add-product-btn', function () {
    editingProductId = null;
    $('#product-form')[0].reset();
    $('#image-preview-grid').html('');
    $('#product-modal-title').text('Add Product');
    $('#product-form-modal').addClass('open');
  });

  $(document).on('click', '.edit-product-btn', function () {
    const id = $(this).data('id');
    editingProductId = id;
    $.get(`${API_BASE}/api/products/${id}`, function (data) {
      const p = data.product;
      $('#edit-name').val(p.name);
      $('#edit-description').val(p.description);
      $('#edit-price').val(p.price);
      $('#edit-stock').val(p.stock);
      let imgHtml = (p.images || []).map(img => `
        <div class="image-preview-item" data-img-id="${img.id}">
          <img src="${img.image_path}" alt="Product image">
          <button type="button" class="image-preview-remove remove-existing-img" data-img-id="${img.id}">×</button>
        </div>`).join('');
      $('#image-preview-grid').html(imgHtml);
      $('#product-modal-title').text('Edit Product');
      $('#product-form-modal').addClass('open');
    });
  });

  $(document).on('click', '.delete-product-btn', function () {
    const id = $(this).data('id');
    if (!confirm('Delete this product? This cannot be undone.')) return;
    $.ajax({ url: `${API_BASE}/api/products/${id}`, method: 'DELETE', headers: window.Auth.authHeaders(),
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

  $(document).on('click', '#product-form-modal-close, #product-modal-overlay-bg', function () {
    $('#product-form-modal').removeClass('open');
    editingProductId = null;
  });

  $(document).on('change', '#edit-images', function () {
    for (const file of this.files) {
      const reader = new FileReader();
      reader.onload = (e) => $('#image-preview-grid').append(`<div class="image-preview-item new-preview"><img src="${e.target.result}" alt="preview"></div>`);
      reader.readAsDataURL(file);
    }
  });

  $(document).on('click', '.remove-existing-img', function () {
    const imgId = $(this).data('img-id');
    $(this).closest('.image-preview-item').remove();
    $('<input>').attr({ type: 'hidden', name: 'removeImages[]', value: imgId }).appendTo('#product-form');
  });

  $(document).on('submit', '#product-form', function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const url    = editingProductId ? `${API_BASE}/api/products/${editingProductId}` : `${API_BASE}/api/products`;
    const method = editingProductId ? 'PUT' : 'POST';
    $.ajax({ url, method, headers: window.Auth.authHeaders(), data: formData, processData: false, contentType: false,
      success: () => { window.showToast(editingProductId ? 'Product updated!' : 'Product created!', 'success'); $('#product-form-modal').removeClass('open'); editingProductId = null; initProductsTable(); },
      error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to save product', 'error'),
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
          { data: 'id', title: '#', width: '50px' },
          { data: 'user', title: 'Customer', render: (u) => u ? `<div>${u.name}</div><div style="font-size:12px;color:var(--text-muted)">${u.email}</div>` : '—' },
          { data: 'items', title: 'Items', orderable: false, render: (items) => items ? `${items.length} item(s)` : '—' },
          { data: 'total_price', title: 'Total', render: (d) => `<strong style="color:var(--accent-red)">$${parseFloat(d).toFixed(2)}</strong>` },
          {
            data: 'status', title: 'Status',
            render: (d, _, row) => {
              const colors = { pending: '#ff9f43', completed: '#28c76f', cancelled: '#ea5455' };
              return `<select class="form-control status-select" data-id="${row.id}" style="padding:5px 10px;font-size:13px;border-color:${colors[d]}">
                <option value="pending"   ${d === 'pending'   ? 'selected' : ''}>Pending</option>
                <option value="completed" ${d === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="cancelled" ${d === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>`;
            },
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
      $('#count-completed').text(rows.filter(r => r.status === 'completed').length);
      $('#count-cancelled').text(rows.filter(r => r.status === 'cancelled').length);
    },
    error: () => window.showToast('Failed to load transactions', 'error'),
  });

  $(document).on('change', '.status-select', function () {
    const id = $(this).data('id'), status = $(this).val(), $select = $(this);
    $.ajax({ url: `${API_BASE}/api/transactions/${id}/status`, method: 'PATCH', contentType: 'application/json', headers: window.Auth.authHeaders(), data: JSON.stringify({ status }),
      success: () => {
        window.showToast(`Order #${id} marked as ${status}`, 'success');
        if (status === 'completed') window.showToast('Receipt email sent to customer', 'info');
        const colors = { pending: '#ff9f43', completed: '#28c76f', cancelled: '#ea5455' };
        $select.css('border-color', colors[status] || '');
      },
      error: (xhr) => window.showToast(xhr.responseJSON ? xhr.responseJSON.error : 'Failed to update status', 'error'),
    });
  });
}
