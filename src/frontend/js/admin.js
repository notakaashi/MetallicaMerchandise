// =============================================
// ADMIN DASHBOARD — Chart.js + DataTables
// =============================================

$(document).ready(function () {
  const page = $('body').data('page');

  // ——— DASHBOARD ———
  if (page === 'dashboard') {
    loadDashboard();
  }

  // ——— USERS ———
  if (page === 'users') {
    initUsersTable();
  }

  // ——— PRODUCTS ———
  if (page === 'products') {
    initProductsTable();
  }

  // ——— TRANSACTIONS ———
  if (page === 'transactions') {
    initTransactionsTable();
  }
});

// =============================================
// DASHBOARD
// =============================================
function loadDashboard() {
  $.ajax({
    url: '/api/dashboard/metrics',
    headers: window.Auth ? window.Auth.authHeaders() : {},
    success: function (data) {
      // KPIs
      animateNumber('#kpi-revenue', data.kpis.totalRevenue, true);
      animateNumber('#kpi-orders', data.kpis.totalOrders, false);
      animateNumber('#kpi-products', data.kpis.totalProducts, false);

      // Bar chart — Sales per product
      renderBarChart(data.salesPerProduct);

      // Line chart — Daily revenue
      renderLineChart(data.dailyRevenue);

      // Pie chart — Status distribution
      renderPieChart(data.statusDistribution);
    },
    error: function () {
      showToast('Failed to load dashboard metrics', 'error');
    },
  });
}

function animateNumber(selector, value, isCurrency) {
  const $el = $(selector);
  if (!$el.length) return;
  const start = 0;
  const end = parseFloat(value) || 0;
  const duration = 1200;
  const step = end / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current = Math.min(current + step, end);
    $el.text(isCurrency ? `$${current.toFixed(2)}` : Math.round(current).toLocaleString());
    if (current >= end) clearInterval(timer);
  }, 16);
}

function renderBarChart(salesData) {
  const ctx = document.getElementById('bar-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: salesData.map(s => truncateLabel(s.product, 18)),
      datasets: [{
        label: 'Units Sold',
        data: salesData.map(s => s.total_sold),
        backgroundColor: 'rgba(222, 10, 38, 0.7)',
        borderColor: '#DE0A26',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: chartDefaults({
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => `Revenue: $${salesData[ctx.dataIndex].total_revenue.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#8a8a8a', font: { size: 11 }, maxRotation: 30 },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: { color: '#8a8a8a', font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.06)' },
          beginAtZero: true,
        },
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
      datasets: [{
        label: 'Revenue ($)',
        data: dailyData.map(d => d.revenue),
        borderColor: '#DE0A26',
        backgroundColor: 'rgba(222, 10, 38, 0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#DE0A26',
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: chartDefaults({
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#8a8a8a', font: { size: 11 }, maxTicksLimit: 8 },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
        y: {
          ticks: {
            color: '#8a8a8a', font: { size: 11 },
            callback: v => `$${v}`,
          },
          grid: { color: 'rgba(255,255,255,0.06)' },
          beginAtZero: true,
        },
      },
    }),
  });
}

function renderPieChart(statusData) {
  const ctx = document.getElementById('pie-chart');
  if (!ctx) return;

  const colors = {
    pending: '#ff9f43',
    completed: '#28c76f',
    cancelled: '#ea5455',
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statusData.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
      datasets: [{
        data: statusData.map(s => s.count),
        backgroundColor: statusData.map(s => colors[s.status] || '#8a8a8a'),
        borderColor: '#1e1e1e',
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: chartDefaults({
      cutout: '65%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: '#a0a0a0', padding: 16, usePointStyle: true },
        },
      },
    }),
  });
}

function chartDefaults(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#f0f0f0',
        bodyColor: '#a0a0a0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
      legend: {
        labels: { color: '#a0a0a0', font: { family: 'Inter' } },
      },
    },
    ...extra,
  };
}

function truncateLabel(str, len) {
  return str && str.length > len ? str.substring(0, len) + '…' : str;
}

// =============================================
// USERS TABLE
// =============================================
let usersTable;

function initUsersTable() {
  $.ajax({
    url: '/api/users',
    headers: window.Auth ? window.Auth.authHeaders() : {},
    success: function (data) {
      if ($.fn.DataTable.isDataTable('#users-table')) {
        $('#users-table').DataTable().destroy();
      }

      usersTable = $('#users-table').DataTable({
        data: data.users,
        columns: [
          { data: 'id', title: '#', width: '50px' },
          { data: 'name', title: 'Name' },
          { data: 'email', title: 'Email' },
          {
            data: 'role',
            title: 'Role',
            render: (d) => `<span class="badge ${d === 'admin' ? 'badge-danger' : 'badge-info'}">${d}</span>`,
          },
          {
            data: 'status',
            title: 'Status',
            render: (d) => `<span class="badge ${d === 'active' ? 'badge-success' : 'badge-silver'}">${d}</span>`,
          },
          { data: 'createdAt', title: 'Joined', render: (d) => new Date(d).toLocaleDateString() },
          {
            data: 'id',
            title: 'Actions',
            orderable: false,
            render: function (id, _, row) {
              const otherRole = row.role === 'admin' ? 'customer' : 'admin';
              const otherStatus = row.status === 'active' ? 'inactive' : 'active';
              return `
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-sm btn-secondary toggle-role-btn" data-id="${id}" data-role="${otherRole}">
                    → ${otherRole}
                  </button>
                  <button class="btn btn-sm ${row.status === 'active' ? 'btn-danger' : 'btn-success'} toggle-status-btn"
                    data-id="${id}" data-status="${otherStatus}">
                    ${otherStatus}
                  </button>
                </div>
              `;
            },
          },
        ],
        pageLength: 10,
        dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
        language: { search: '', searchPlaceholder: 'Search users...' },
        order: [[0, 'asc']],
      });
    },
    error: () => showToast('Failed to load users', 'error'),
  });

  // Role toggle
  $(document).on('click', '.toggle-role-btn', function () {
    const id = $(this).data('id');
    const role = $(this).data('role');
    $.ajax({
      url: `/api/users/${id}/role`,
      method: 'PATCH',
      contentType: 'application/json',
      headers: window.Auth ? window.Auth.authHeaders() : {},
      data: JSON.stringify({ role }),
      success: function () {
        showToast(`Role updated to ${role}`, 'success');
        initUsersTable();
      },
      error: () => showToast('Failed to update role', 'error'),
    });
  });

  // Status toggle
  $(document).on('click', '.toggle-status-btn', function () {
    const id = $(this).data('id');
    const status = $(this).data('status');
    $.ajax({
      url: `/api/users/${id}/status`,
      method: 'PATCH',
      contentType: 'application/json',
      headers: window.Auth ? window.Auth.authHeaders() : {},
      data: JSON.stringify({ status }),
      success: function () {
        showToast(`Status updated to ${status}`, 'success');
        initUsersTable();
      },
      error: () => showToast('Failed to update status', 'error'),
    });
  });
}

// =============================================
// PRODUCTS TABLE
// =============================================
let productsTable;
let editingProductId = null;

function initProductsTable() {
  $.get('/api/products?limit=100', function (data) {
    if ($.fn.DataTable.isDataTable('#products-table')) {
      $('#products-table').DataTable().destroy();
    }

    productsTable = $('#products-table').DataTable({
      data: data.products,
      columns: [
        { data: 'id', title: '#', width: '50px' },
        {
          data: 'images',
          title: 'Image',
          orderable: false,
          render: (imgs) => {
            if (imgs && imgs.length) {
              return `<img src="${imgs[0].image_path}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'">`;
            }
            return '<span style="font-size:24px">🎸</span>';
          },
        },
        { data: 'name', title: 'Product Name' },
        {
          data: 'price',
          title: 'Price',
          render: (d) => `<strong style="color:var(--accent-red)">$${parseFloat(d).toFixed(2)}</strong>`,
        },
        {
          data: 'stock',
          title: 'Stock',
          render: (d) => {
            if (d > 10) return `<span class="badge badge-success">${d}</span>`;
            if (d > 0) return `<span class="badge badge-warning">${d}</span>`;
            return `<span class="badge badge-danger">0</span>`;
          },
        },
        {
          data: 'id',
          title: 'Actions',
          orderable: false,
          render: (id) => `
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-secondary edit-product-btn" data-id="${id}">Edit</button>
              <button class="btn btn-sm btn-danger delete-product-btn" data-id="${id}">Delete</button>
            </div>
          `,
        },
      ],
      pageLength: 10,
      dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
      language: { search: '', searchPlaceholder: 'Search products...' },
      order: [[0, 'desc']],
    });
  });

  // Open create modal
  $(document).on('click', '#add-product-btn', function () {
    editingProductId = null;
    $('#product-form')[0].reset();
    $('#image-preview-grid').html('');
    $('#product-modal-title').text('Add Product');
    $('#product-form-modal').addClass('open');
  });

  // Edit product
  $(document).on('click', '.edit-product-btn', function () {
    const id = $(this).data('id');
    editingProductId = id;
    $.get(`/api/products/${id}`, function (data) {
      const p = data.product;
      $('#edit-name').val(p.name);
      $('#edit-description').val(p.description);
      $('#edit-price').val(p.price);
      $('#edit-stock').val(p.stock);

      // Show existing images
      let imgHtml = '';
      (p.images || []).forEach(img => {
        imgHtml += `
          <div class="image-preview-item" data-img-id="${img.id}">
            <img src="${img.image_path}" alt="Product image">
            <button type="button" class="image-preview-remove remove-existing-img" data-img-id="${img.id}">×</button>
          </div>
        `;
      });
      $('#image-preview-grid').html(imgHtml);
      $('#product-modal-title').text('Edit Product');
      $('#product-form-modal').addClass('open');
    });
  });

  // Delete product
  $(document).on('click', '.delete-product-btn', function () {
    const id = $(this).data('id');
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) return;

    $.ajax({
      url: `/api/products/${id}`,
      method: 'DELETE',
      headers: window.Auth ? window.Auth.authHeaders() : {},
      success: function () {
        showToast('Product deleted', 'success');
        initProductsTable();
      },
      error: () => showToast('Failed to delete product', 'error'),
    });
  });

  // Close product modal
  $(document).on('click', '#product-form-modal-close, #product-modal-overlay-bg', function () {
    $('#product-form-modal').removeClass('open');
    editingProductId = null;
  });

  // Image preview on file select
  $(document).on('change', '#edit-images', function () {
    const files = this.files;
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        $('#image-preview-grid').append(`
          <div class="image-preview-item new-preview">
            <img src="${e.target.result}" alt="preview">
          </div>
        `);
      };
      reader.readAsDataURL(file);
    }
  });

  // Remove existing image
  $(document).on('click', '.remove-existing-img', function () {
    const imgId = $(this).data('img-id');
    $(this).closest('.image-preview-item').remove();
    $('<input>').attr({ type: 'hidden', name: 'removeImages[]', value: imgId }).appendTo('#product-form');
  });

  // Product form submit
  $(document).on('submit', '#product-form', function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
    const method = editingProductId ? 'PUT' : 'POST';

    const token = window.Auth ? window.Auth.getToken() : null;
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    $.ajax({
      url,
      method,
      headers,
      data: formData,
      processData: false,
      contentType: false,
      success: function (data) {
        showToast(editingProductId ? 'Product updated!' : 'Product created!', 'success');
        $('#product-form-modal').removeClass('open');
        editingProductId = null;
        initProductsTable();
      },
      error: function (xhr) {
        const msg = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to save product';
        showToast(msg, 'error');
      },
    });
  });
}

// =============================================
// TRANSACTIONS TABLE
// =============================================
function initTransactionsTable() {
  $.ajax({
    url: '/api/transactions',
    headers: window.Auth ? window.Auth.authHeaders() : {},
    success: function (data) {
      if ($.fn.DataTable.isDataTable('#transactions-table')) {
        $('#transactions-table').DataTable().destroy();
      }

      $('#transactions-table').DataTable({
        data: data.transactions,
        columns: [
          { data: 'id', title: '#', width: '50px' },
          {
            data: 'user',
            title: 'Customer',
            render: (u) => u ? `<div>${u.name}</div><div style="font-size:12px;color:var(--text-muted)">${u.email}</div>` : '—',
          },
          {
            data: 'items',
            title: 'Items',
            orderable: false,
            render: (items) => items ? `${items.length} item(s)` : '—',
          },
          {
            data: 'total_price',
            title: 'Total',
            render: (d) => `<strong style="color:var(--accent-red)">$${parseFloat(d).toFixed(2)}</strong>`,
          },
          {
            data: 'status',
            title: 'Status',
            render: function (d, _, row) {
              const colors = { pending: '#ff9f43', completed: '#28c76f', cancelled: '#ea5455' };
              return `
                <select class="form-control status-select" data-id="${row.id}" style="padding:5px 10px;font-size:13px;border-color:${colors[d]}">
                  <option value="pending" ${d === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="completed" ${d === 'completed' ? 'selected' : ''}>Completed</option>
                  <option value="cancelled" ${d === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              `;
            },
          },
          { data: 'createdAt', title: 'Date', render: (d) => new Date(d).toLocaleDateString() },
        ],
        pageLength: 15,
        dom: '<"flex justify-between items-center mb-2"lf>t<"flex justify-between items-center mt-2"ip>',
        language: { search: '', searchPlaceholder: 'Search transactions...' },
        order: [[0, 'desc']],
      });
    },
    error: () => showToast('Failed to load transactions', 'error'),
  });

  // Status change
  $(document).on('change', '.status-select', function () {
    const id = $(this).data('id');
    const status = $(this).val();
    const $select = $(this);

    $.ajax({
      url: `/api/transactions/${id}/status`,
      method: 'PATCH',
      contentType: 'application/json',
      headers: window.Auth ? window.Auth.authHeaders() : {},
      data: JSON.stringify({ status }),
      success: function () {
        showToast(`Order #${id} marked as ${status}`, 'success');
        if (status === 'completed') {
          showToast('Receipt email sent to customer 📧', 'info');
        }
        const colors = { pending: '#ff9f43', completed: '#28c76f', cancelled: '#ea5455' };
        $select.css('border-color', colors[status] || '');
      },
      error: function (xhr) {
        const msg = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to update status';
        showToast(msg, 'error');
      },
    });
  });
}
