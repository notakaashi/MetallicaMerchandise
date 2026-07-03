$(document).ready(function () {
  let currentCategory = 'all';
  let currentSort = 'newest';
  let currentPage = 1;
  let totalPages = 1;
  let isLoading = false;
  let searchQuery = new URLSearchParams(window.location.search).get('q') || '';

  if (searchQuery) {
    $('#navbar-search').val(searchQuery);
  }

  function fetchProducts(append = false) {
    if (isLoading) return;
    isLoading = true;

    let url = `${API_BASE}/api/products?page=${currentPage}&limit=12&sort=${currentSort}`;
    if (currentCategory !== 'all') url += `&category=${currentCategory}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

    if (!append) {
      $('#products-grid').html('<div style="grid-column:1/-1;text-align:center;color:#8a8a8a;padding:40px">Loading products...</div>');
    }
    
    $.ajax({
      url: url,
      method: 'GET',
      success: function(data) {
        totalPages = data.pagination.pages;
        renderProducts(data.products, append);
        renderPagination(data.pagination);
        $('#result-count').text(`Showing ${$('#products-grid .product-card').length} of ${data.pagination.total} products`);
      },
      error: function() {
        if (!append) $('#products-grid').html('<div class="empty-state">Failed to load products. Please try again later.</div>');
        $('#result-count').text('');
        $('#pagination').html('');
      },
      complete: function() {
        isLoading = false;
      }
    });
  }

  function renderProducts(products, append = false) {
    const $grid = $('#products-grid');
    if (!append) $grid.empty();

    if (products.length === 0 && !append) {
      $grid.html('<div class="empty-state">No products found in this category.</div>');
      return;
    }

    products.forEach(p => {
      let imgPath = p.images && p.images.length ? `${API_BASE}/uploads/${p.images[0].image_path}` : 'https://via.placeholder.com/400x400/121212/8a8a8a?text=No+Image';
      let stockBadge = p.stock > 0 
        ? `<span class="stock-badge in-stock">In Stock</span>` 
        : `<span class="stock-badge out-stock">Out of Stock</span>`;
      
      let html = `
        <div class="product-card" data-product='${JSON.stringify(p).replace(/'/g, "&apos;")}'>
          <div class="product-img-wrap open-modal">
            <img src="${imgPath}" class="product-img" alt="${p.name}">
          </div>
          <div class="product-info">
            <div class="product-name open-modal">${p.name}</div>
            <div class="product-price">₱${parseFloat(p.price).toFixed(2)}</div>
            <div class="product-footer">
              ${stockBadge}
              <button class="btn btn-primary btn-sm add-to-cart-quick" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
      $grid.append(html);
    });
  }

  function renderPagination(pg) {
    const $pag = $('#pagination');
    $pag.html(
      pg.page < pg.pages
        ? `<div style="text-align:center;padding:20px;color:#8a8a8a">Scroll for more...</div>`
        : `<p style="color:#8a8a8a;text-align:center">You've seen it all!</p>`
    );
  }

  // Event Listeners
  let scrollTimeout;
  $(window).on('scroll', function () {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
      if ($(window).scrollTop() + $(window).height() >= $(document).height() - 300) {
        if (!isLoading && currentPage < totalPages) {
          currentPage++;
          fetchProducts(true);
        }
      }
    }, 150);
  });

  $('.category-pill').on('click', function() {
    $('.category-pill').removeClass('active');
    $(this).addClass('active');
    currentCategory = $(this).data('category');
    currentPage = 1;
    fetchProducts();
  });

  $('#sort-dropdown').on('change', function() {
    currentSort = $(this).val();
    currentPage = 1;
    fetchProducts();
  });

  // Modal logic
  $(document).on('click', '.open-modal', function() {
    let p = $(this).closest('.product-card').data('product');
    $('#detail-name').text(p.name);
    $('#detail-price').text(`₱${parseFloat(p.price).toFixed(2)}`);
    $('#detail-desc').text(p.description || 'No description available.');
    $('#detail-qty').val(1);
    
    let badge = p.stock > 0 
        ? `<span class="stock-badge in-stock">In Stock (${p.stock} available)</span>` 
        : `<span class="stock-badge out-stock">Out of Stock</span>`;
    $('#detail-stock-badge').html(badge);
    
    $('#detail-add-btn').data('id', p.id).data('product', p).prop('disabled', p.stock <= 0);

    let galleryHtml = '';
    if (p.images && p.images.length) {
      p.images.forEach(img => {
        galleryHtml += `<img src="${API_BASE}/uploads/${img.image_path}" alt="Product Image">`;
      });
    } else {
      galleryHtml = `<img src="https://via.placeholder.com/400x400/121212/8a8a8a?text=No+Image" alt="No Image">`;
    }
    $('#detail-gallery').html(galleryHtml);

    $('#product-detail-modal').addClass('open');
  });

  $(document).on('click', '#detail-add-btn', function() {
    let p = $(this).data('product');
    let qty = parseInt($('#detail-qty').val());
    if (window.Cart && p) {
      window.Cart.add({ id: p.id, name: p.name, price: p.price, images: p.images || [] }, qty);
      $('#product-detail-modal').removeClass('open');
    }
  });

  $(document).on('click', '.add-to-cart-quick', function(e) {
    e.stopPropagation();
    let p = $(this).closest('.product-card').data('product');
    if (window.Cart && p) {
      window.Cart.add({ id: p.id, name: p.name, price: p.price, images: p.images || [] }, 1);
    }
  });

  // Initial fetch
  fetchProducts();
});
