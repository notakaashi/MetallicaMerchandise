$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  let productData = null;

  if (!productId || productId === 'undefined' || productId === 'null') {
    $('#product-loading').text('Product not found.');
    return;
  }

  function fetchProduct() {
    $.ajax({
      url: `${API_BASE}/api/products/${productId}`,
      method: 'GET',
      success: function(response) {
        productData = response.product;
        renderProduct(response.product);
        fetchReviews();
        checkEligibility();
      },
      error: function() {
        $('#product-loading').text('Failed to load product details.');
      }
    });
  }

  function fetchReviews() {
    $.ajax({
      url: `${API_BASE}/api/products/${productId}/reviews`,
      method: 'GET',
      success: function(data) {
        renderReviews(data);
      },
      error: function() {
        $('#reviews-list').html('<p style="color:red">Failed to load reviews.</p>');
      }
    });
  }

  function checkEligibility() {
    if (!window.Auth.isLoggedIn()) {
      $('#review-msg').text('Log in and purchase this product to leave a review.').show();
      $('#review-form-container').hide();
      return;
    }

    $.ajax({
      url: `${API_BASE}/api/products/${productId}/reviews/eligibility`,
      method: 'GET',
      headers: window.Auth.authHeaders(),
      success: function(data) {
        if (data.eligible) {
          $('#review-msg').hide();
          $('#review-form-container').show();
        } else {
          $('#review-form-container').hide();
          if (data.reason === 'already_reviewed') {
            $('#review-msg').text("You've already reviewed this product.").show();
          } else if (data.reason === 'not_purchased') {
            $('#review-msg').text("Only customers who have purchased and received this product can leave a review.").show();
          } else {
            $('#review-msg').text("You are not eligible to review this product at this time.").show();
          }
        }
      },
      error: function() {
        $('#review-msg').text('Failed to check review eligibility.').show();
      }
    });
  }

  function renderProduct(p) {
    $('#product-loading').hide();
    $('#product-content').show();
    
    $('#detail-name').text(p.name);
    $('#detail-price').text(`₱${parseFloat(p.price).toFixed(2)}`);
    $('#detail-desc').text(p.description || 'No description available.');
    
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
  }

  function renderReviews(data) {
    const $stats = $('#reviews-stats');
    const $list = $('#reviews-list');
    
    if (data.count === 0) {
      $stats.text('No reviews yet. Be the first to review this product!');
      $list.empty();
      return;
    }
    
    $stats.text(`${data.averageRating.toFixed(1)} out of 5 stars (${data.count} review${data.count === 1 ? '' : 's'})`);
    
    let html = '';
    data.reviews.forEach(r => {
      let date = new Date(r.createdAt).toLocaleDateString();
      let stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      html += `
        <div class="review-item">
          <div class="review-header">
            <span class="reviewer-name">${r.user ? r.user.name : 'Unknown User'}</span>
            <span class="review-date">${date}</span>
          </div>
          <div class="review-stars">${stars}</div>
          <div class="review-comment">${r.comment ? r.comment.replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''}</div>
        </div>
      `;
    });
    $list.html(html);
  }

  $(document).on('click', '#detail-add-btn', function() {
    let p = $(this).data('product');
    let qty = parseInt($('#detail-qty').val());
    if (window.Cart && p) {
      window.Cart.add({ id: p.id, name: p.name, price: p.price, images: p.images || [] }, qty);
    }
  });

  $('#review-form').validate({
    rules: {
      rating: { required: true, min: 1, max: 5 },
      comment: { required: true }
    },
    messages: {
      rating: { required: 'Please select a rating' },
      comment: { required: 'Please provide a comment' }
    },
    submitHandler: function () {
      const $btn = $('#submit-review-btn');
      $btn.prop('disabled', true).text('Submitting...');

      const payload = {
        rating: parseInt($('#review-rating').val()),
        comment: $('#review-comment').val()
      };

      $.ajax({
        url: `${API_BASE}/api/products/${productId}/reviews`,
        method: 'POST',
        headers: window.Auth.authHeaders(),
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function () {
          window.showToast('Review submitted successfully!', 'success');
          $('#review-form')[0].reset();
          fetchReviews();
          checkEligibility(); // to hide the form again
        },
        error: function (xhr) {
          const msg = xhr.responseJSON ? xhr.responseJSON.error : 'Failed to submit review';
          window.showToast(msg, 'error');
        },
        complete: function () {
          $btn.prop('disabled', false).text('Submit Review');
        }
      });
    }
  });

  fetchProduct();
});
