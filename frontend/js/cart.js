// =============================================
// CART MODULE
// =============================================
window.Cart = {
  STORAGE_KEY: 'mm_cart',

  get: function () {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; }
    catch { return []; }
  },

  save: function (items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.updateBadge();
    this.renderDrawer();
  },

  add: function (product, qty = 1) {
    const items = this.get();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, 99);
    } else {
      items.push({
        id:       product.id,
        name:     product.name,
        price:    parseFloat(product.price),
        image:    product.images && product.images.length ? product.images[0].image_path : null,
        quantity: qty,
      });
    }
    this.save(items);
    window.showToast(`"${product.name}" added to cart`, 'success');
  },

  remove: function (productId) {
    const items = this.get().filter(i => i.id !== productId);
    this.save(items);
  },

  updateQty: function (productId, qty) {
    const items = this.get();
    const item = items.find(i => i.id === productId);
    if (item) {
      if (qty <= 0) return this.remove(productId);
      item.quantity = Math.min(qty, 99);
    }
    this.save(items);
  },

  clear: function () {
    localStorage.removeItem(this.STORAGE_KEY);
    this.updateBadge();
    this.renderDrawer();
  },

  total: function () { return this.get().reduce((s, i) => s + i.price * i.quantity, 0); },
  count: function () { return this.get().reduce((s, i) => s + i.quantity, 0); },

  updateBadge: function () {
    const count = this.count();
    $('.cart-badge').text(count).toggle(count > 0);
  },

  renderDrawer: function () {
    const items = this.get();
    const $body = $('#cart-drawer-body');
    if (!$body.length) return;

    if (items.length === 0) {
      $body.html(`
        <div class="cart-empty">
          <span class="cart-empty-icon">Cart</span>
          <p>Your cart is empty</p>
          <p style="font-size:13px;color:var(--text-muted)">Add some merch to get started!</p>
        </div>`);
      $('#cart-total-value').text('₱0.00');
      return;
    }

    let html = '';
    for (const item of items) {
      const imgTag = item.image
        ? `<img class="cart-item-image" src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">`
        : `<div class="cart-item-image" style="background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:24px;border-radius:6px;">Merch</div>`;

      html += `
        <div class="cart-item" data-id="${item.id}">
          ${imgTag}
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₱${(item.price * item.quantity).toFixed(2)}</div>
            <div class="cart-qty-control">
              <button class="cart-qty-btn" data-action="dec" data-id="${item.id}">−</button>
              <span class="cart-qty-value">${item.quantity}</span>
              <button class="cart-qty-btn" data-action="inc" data-id="${item.id}">+</button>
            </div>
          </div>
          <button class="cart-remove-btn" data-id="${item.id}" title="Remove">✕</button>
        </div>`;
    }

    $body.html(html);
    $('#cart-total-value').text(`₱${this.total().toFixed(2)}`);
  },

  open:  function () { $('#cart-overlay, #cart-drawer').addClass('open'); $('body').css('overflow', 'hidden'); this.renderDrawer(); },
  close: function () { $('#cart-overlay, #cart-drawer').removeClass('open'); $('body').css('overflow', ''); },
};

// =============================================
// PRODUCT CATALOG
// =============================================
let currentPage = 1;
let currentSearch = '';
let totalPages = 1;
let infiniteScrollEnabled = true;
let isLoading = false;

window.loadProducts = function (page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;

  const url = currentSearch
    ? `${API_BASE}/api/products/search?q=${encodeURIComponent(currentSearch)}&page=${page}&limit=12`
    : `${API_BASE}/api/products?page=${page}&limit=12`;

  if (!append) {
    $('#product-grid').html(`
      <div style="grid-column:1/-1;text-align:center;padding:60px 0">
        <div class="spinner"></div>
        <p style="color:var(--text-muted);margin-top:16px">Loading merch...</p>
      </div>`);
    $('#pagination').html('');
  }

  $.get(url, function (data) {
    const { products, pagination } = data;
    totalPages   = pagination.pages;
    currentPage  = pagination.page;

    if (products.length === 0 && !append) {
      $('#product-grid').html(`
        <div style="grid-column:1/-1;text-align:center;padding:80px 0">
          <div style="font-size:56px;margin-bottom:16px">Merch</div>
          <h3 style="color:var(--text-secondary)">No products found</h3>
          <p style="color:var(--text-muted)">Try a different search term</p>
        </div>`);
      return;
    }

    let html = '';
    for (const p of products) {
      const img = p.images && p.images.length
        ? `<img class="product-card-image" src="${API_BASE}/uploads/${p.images[0].image_path}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'product-card-image-placeholder\\'>Merch</div>'">`
        : `<div class="product-card-image-placeholder">Merch</div>`;

      const stockBadge = p.stock > 10
        ? `<span class="badge badge-success">In Stock</span>`
        : p.stock > 0
          ? `<span class="badge badge-warning">Low Stock</span>`
          : `<span class="badge badge-danger">Sold Out</span>`;

      html += `
        <div class="product-card" data-id="${p.id}">
          <div class="product-card-image-wrap">
            ${img}
            <div class="product-card-overlay">
              <button class="btn btn-primary btn-sm w-full quick-view-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>Quick View</button>
            </div>
          </div>
          <div class="product-card-body">
            <div class="product-card-name">${p.name}</div>
            <div class="product-card-price">₱${parseFloat(p.price).toFixed(2)}</div>
            <div style="margin-top:6px">${stockBadge}</div>
          </div>
          <div class="product-card-footer">
            <button class="btn btn-primary btn-sm w-full add-to-cart-btn"
              data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" ${p.stock === 0 ? 'disabled' : ''}>
              ${p.stock === 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
          </div>
        </div>`;
    }

    append ? $('#product-grid').append(html) : $('#product-grid').html(html);
    renderPagination(pagination);
  }).fail(function () {
    window.showToast('Failed to load products', 'error');
  }).always(function () { isLoading = false; });
};

function renderPagination(pagination) {
  if (infiniteScrollEnabled) {
    $('#pagination').html(
      pagination.page < pagination.pages
        ? `<div style="text-align:center;padding:20px;color:var(--text-muted)">Scroll for more...</div>`
        : `<p style="color:var(--text-muted);text-align:center">You've seen it all!</p>`
    );
    return;
  }
  if (pagination.pages <= 1) { $('#pagination').html(''); return; }

  const p = pagination;
  let html = `<button class="pagination-btn" ${p.page <= 1 ? 'disabled' : ''} data-page="${p.page - 1}">&#8249;</button>`;
  const delta = 2;
  for (let i = 1; i <= p.pages; i++) {
    if (i === 1 || i === p.pages || (i >= p.page - delta && i <= p.page + delta)) {
      html += `<button class="pagination-btn ${i === p.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === p.page - delta - 1 || i === p.page + delta + 1) {
      html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
    }
  }
  html += `<button class="pagination-btn" ${p.page >= p.pages ? 'disabled' : ''} data-page="${p.page + 1}">&#8250;</button>`;
  $('#pagination').html(html);
}

// =============================================
// PRODUCT MODAL
// =============================================
window.openProductModal = function (productId) {
  $('#product-modal-overlay').addClass('open');
  $('body').css('overflow', 'hidden');
  $('#product-modal-body').html('<div style="text-align:center;padding:60px"><div class="spinner"></div></div>');

  $.get(`${API_BASE}/api/products/${productId}`, function (data) {
    const p = data.product;
    const images = p.images || [];

    let imagesHtml = images.length
      ? `<div class="product-images-grid">${images.map(img => `<img src="${API_BASE}/uploads/${img.image_path}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">`).join('')}</div>`
      : `<div style="background:var(--bg-tertiary);border-radius:12px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:72px">Merch</div>`;

    const stockBadge = p.stock > 10
      ? `<span class="badge badge-success">✓ In Stock (${p.stock})</span>`
      : p.stock > 0
        ? `<span class="badge badge-warning">Low Stock (${p.stock} left)</span>`
        : `<span class="badge badge-danger">✗ Sold Out</span>`;

    $('#product-modal-body').html(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start">
        <div>${imagesHtml}</div>
        <div>
          <h2 style="font-size:24px;font-weight:800;margin-bottom:12px">${p.name}</h2>
          <div style="font-size:32px;font-weight:900;color:var(--accent-red);font-family:'Outfit',sans-serif;margin-bottom:12px">₱${parseFloat(p.price).toFixed(2)}</div>
          <div style="margin-bottom:16px">${stockBadge}</div>
          <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;margin-bottom:24px">${p.description || ''}</p>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <label style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase">Qty</label>
            <div class="cart-qty-control">
              <button class="cart-qty-btn" id="modal-qty-dec">−</button>
              <span class="cart-qty-value" id="modal-qty">1</span>
              <button class="cart-qty-btn" id="modal-qty-inc">+</button>
            </div>
          </div>
          <button class="btn btn-primary btn-lg w-full" id="modal-add-to-cart"
            data-id="${p.id}" data-name="${p.name}" data-price="${p.price}"
            ${p.stock === 0 ? 'disabled' : ''} style="margin-bottom:10px">
            ${p.stock === 0 ? 'Sold Out' : 'Add to Cart'}
          </button>
          <a href="/checkout.html" class="btn btn-secondary btn-lg w-full" style="text-align:center">Checkout →</a>
        </div>
      </div>`);
  }).fail(function () {
    $('#product-modal-body').html('<p style="text-align:center;color:var(--danger)">Failed to load product details.</p>');
  });
};

// =============================================
// CHECKOUT HELPERS
// =============================================
window.renderCheckoutSummary = function () {
  const items = window.Cart.get();
  const $summary = $('#checkout-items');
  if (!$summary.length) return;

  if (items.length === 0) { window.location.href = '/index.html'; return; }

  let html = items.map(item => `
    <div class="order-item-row">
      <div style="flex:1">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-meta">Qty: ${item.quantity} × ₱${item.price.toFixed(2)}</div>
      </div>
      <div style="font-weight:700;color:var(--accent-red)">₱${(item.price * item.quantity).toFixed(2)}</div>
    </div>`).join('');

  html += `
    <div class="order-total-row">
      <span class="order-total-label">Total</span>
      <span class="order-total-value">₱${window.Cart.total().toFixed(2)}</span>
    </div>`;

  $summary.html(html);
};

// =============================================
// MY ORDERS LOADER
// =============================================
window.loadMyOrders = function () {
  if (!$('#orders-container').length) return;
  $('#orders-container').html('<div style="text-align:center;padding:60px"><div class="spinner"></div></div>');

  $.ajax({
    url: `${API_BASE}/api/transactions/my`,
    headers: window.Auth.authHeaders(),
    success: function (data) {
      const txs = data.transactions;
      if (!txs.length) {
        $('#orders-container').html(`
          <div style="text-align:center;padding:80px 0;color:var(--text-muted)">
            <div style="font-size:56px;margin-bottom:16px">Box</div>
            <h3>No orders yet</h3>
            <p>Start shopping and place your first order!</p>
            <a href="/index.html" class="btn btn-primary mt-3">Shop Now</a>
          </div>`);
        return;
      }

      let html = '';
      for (const tx of txs) {
        const statusBadge = { pending: 'badge-warning', completed: 'badge-success', cancelled: 'badge-danger' }[tx.status] || 'badge-silver';
        let itemsHtml = '';
        for (const item of tx.items || []) {
          const img = item.product && item.product.images && item.product.images.length
            ? `<img class="order-item-img" src="${API_BASE}/uploads/${item.product.images[0].image_path}" alt="${item.product.name}">`
            : `<div class="order-item-img" style="display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--bg-tertiary);border-radius:6px">Merch</div>`;

          itemsHtml += `
            <div class="order-item-row">
              ${img}
              <div style="flex:1">
                <div class="order-item-name">${item.product ? item.product.name : 'Product'}</div>
                <div class="order-item-meta">Qty: ${item.quantity} × ₱${parseFloat(item.price).toFixed(2)}</div>
              </div>
              <div style="font-weight:700;color:var(--accent-red)">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
            </div>`;
        }

        html += `
          <div class="order-card">
            <div class="order-card-header">
              <div>
                <div class="order-id">Order <span>#${tx.id}</span></div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <span class="badge ${statusBadge}">${tx.status}</span>
            </div>
            <div class="order-card-body">
              ${itemsHtml}
              <div class="order-total-row">
                <span class="order-total-label">Order Total</span>
                <span class="order-total-value">₱${parseFloat(tx.total_price).toFixed(2)}</span>
              </div>
            </div>
          </div>`;
      }
      $('#orders-container').html(html);
    },
    error: function () {
      window.showToast('Failed to load orders', 'error');
      $('#orders-container').html('<p style="text-align:center;color:var(--danger)">Failed to load orders.</p>');
    },
  });
};

// =============================================
// DOM READY — GLOBAL EVENT LISTENERS
// =============================================
$(document).ready(function () {
  window.Cart.updateBadge();

  // Cart open/close
  $(document).on('click', '#cart-open-btn',              () => window.Cart.open());
  $(document).on('click', '#cart-overlay, #cart-close-btn', () => window.Cart.close());

  // Cart qty controls
  $(document).on('click', '.cart-qty-btn', function () {
    const id     = parseInt($(this).data('id'));
    const action = $(this).data('action');
    const item   = window.Cart.get().find(i => i.id === id);
    if (!item) return;
    window.Cart.updateQty(id, action === 'inc' ? item.quantity + 1 : item.quantity - 1);
  });

  // Cart remove
  $(document).on('click', '.cart-remove-btn', function () {
    window.Cart.remove(parseInt($(this).data('id')));
  });

  // Add to cart (product grid)
  $(document).on('click', '.add-to-cart-btn', function (e) {
    e.stopPropagation();
    window.Cart.add({ id: parseInt($(this).data('id')), name: $(this).data('name'), price: parseFloat($(this).data('price')), images: [] });
  });

  // Quick view / product card click
  $(document).on('click', '.quick-view-btn, .product-card', function (e) {
    if ($(e.target).hasClass('add-to-cart-btn') || $(e.target).closest('.add-to-cart-btn').length) return;
    const id = $(this).data('id') || $(this).closest('.product-card').data('id');
    if (id) window.openProductModal(id);
  });

  // Product modal close
  $(document).on('click', '#product-modal-overlay', function (e) {
    if ($(e.target).is('#product-modal-overlay') || $(e.target).is('#product-modal-close')) {
      $('#product-modal-overlay').removeClass('open');
      $('body').css('overflow', '');
    }
  });

  // Modal qty controls
  $(document).on('click', '#modal-qty-dec', function () { const $q = $('#modal-qty'); const v = parseInt($q.text()); if (v > 1) $q.text(v - 1); });
  $(document).on('click', '#modal-qty-inc', function () { const $q = $('#modal-qty'); $q.text(parseInt($q.text()) + 1); });

  // Modal add to cart
  $(document).on('click', '#modal-add-to-cart', function () {
    const qty = parseInt($('#modal-qty').text());
    window.Cart.add({ id: parseInt($(this).data('id')), name: $(this).data('name'), price: parseFloat($(this).data('price')), images: [] }, qty);
    $('#product-modal-overlay').removeClass('open');
    $('body').css('overflow', '');
    window.Cart.open();
  });

  // Pagination
  $(document).on('click', '.pagination-btn', function () {
    if ($(this).prop('disabled') || $(this).hasClass('active')) return;
    currentPage = parseInt($(this).data('page'));
    window.loadProducts(currentPage, false);
    window.scrollTo({ top: document.querySelector('.catalog-section')?.offsetTop - 80 || 0, behavior: 'smooth' });
  });

  // Infinite Scroll Listener (Throttled)
  let scrollTimeout;
  $(window).on('scroll', function () {
    if (!infiniteScrollEnabled) return;
    
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      if ($(window).scrollTop() + $(window).height() >= $(document).height() - 300) {
        if (!isLoading && currentPage < totalPages) {
          window.loadProducts(currentPage + 1, true);
        }
      }
    }, 150);
  });

  // Infinite scroll toggle
  $(document).on('click', '.scroll-toggle', function () {
    infiniteScrollEnabled = !infiniteScrollEnabled;
    $('.toggle-switch').toggleClass('on', infiniteScrollEnabled);
    window.loadProducts(1, false);
  });

  // Navbar search + autocomplete
  if ($('#navbar-search').length) {
    $('#navbar-search').autocomplete({
      source: function (req, res) { $.get(`${API_BASE}/api/products/autocomplete?q=${encodeURIComponent(req.term)}`, res); },
      minLength: 2, delay: 250,
      select: function (e, ui) {
        currentSearch = ui.item.value; currentPage = 1;
        if ($('#product-grid').length) window.loadProducts(1, false);
        else window.location.href = `/index.html?q=${encodeURIComponent(ui.item.value)}`;
      },
    });
    $('#navbar-search').on('keydown', function (e) {
      if (e.key === 'Enter') {
        currentSearch = $(this).val().trim(); currentPage = 1;
        if ($('#product-grid').length) window.loadProducts(1, false);
        else window.location.href = `/index.html?q=${encodeURIComponent(currentSearch)}`;
      }
    });
  }

  // Homepage init
  if ($('#product-grid').length) {
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ) { currentSearch = urlQ; $('#navbar-search').val(urlQ); }
    window.loadProducts(1, false);
  }

  // Checkout init
  if ($('#checkout-form').length) {
    window.renderCheckoutSummary();

    // Pre-fill email from logged-in user
    const user = window.Auth.getUser();
    if (user) $('#checkout-email').val(user.email);

    $('#checkout-form').validate({
      rules: {
        full_name: { required: true, minlength: 2 },
        email:     { required: true, email: true },
        address:   { required: true, minlength: 5 },
        city:      { required: true },
        zip:       { required: true },
      },
      submitHandler: function () {
        if (!window.Auth.isLoggedIn()) {
          window.showToast('Please log in to complete checkout', 'warning');
          window.location.href = '/login.html?redirect=/checkout.html';
          return;
        }
        const cartItems = window.Cart.get();
        if (!cartItems.length) { window.showToast('Your cart is empty!', 'warning'); return; }

        const $btn = $('#checkout-submit-btn');
        $btn.prop('disabled', true).html('<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span> Processing...');

        $.ajax({
          url: `${API_BASE}/api/transactions`,
          method: 'POST',
          contentType: 'application/json',
          headers: window.Auth.authHeaders(),
          data: JSON.stringify({ items: cartItems.map(i => ({ product_id: i.id, quantity: i.quantity })) }),
          success: function (data) {
            window.Cart.clear();
            window.showToast(`Order #${data.transaction.id} placed!`, 'success', 'Order Confirmed');
            setTimeout(() => window.location.href = '/orders.html', 1500);
          },
          error: function (xhr) {
            const msg = xhr.responseJSON ? xhr.responseJSON.error : 'Checkout failed';
            window.showToast(msg, 'error');
            $btn.prop('disabled', false).html('Place Order');
          },
        });
      },
    });
  }

  // Orders page init
  if ($('#orders-container').length) window.loadMyOrders();

  // ESC to close modals
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      $('#product-modal-overlay').removeClass('open');
      window.Cart.close();
      $('body').css('overflow', '');
    }
  });
});
