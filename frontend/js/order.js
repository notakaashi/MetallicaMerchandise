$(document).ready(function () {
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    $('#order-container').html(`
      <div class="empty-state">
        <h2 style="margin-bottom:16px">Invalid Order ID</h2>
        <a href="/orders.html" class="btn btn-primary">Back to Orders</a>
      </div>
    `);
    return;
  }

  $.ajax({
    url: `${API_BASE}/api/transactions/${id}`,
    method: 'GET',
    headers: window.Auth.authHeaders(),
    success: function (data) {
      const tx = data.transaction;
      let itemsHtml = '';
      let statusBadge = 'badge-silver';
      if (tx.status === 'completed') statusBadge = 'badge-success';
      if (tx.status === 'pending') statusBadge = 'badge-warning';
      if (tx.status === 'shipped') statusBadge = 'badge-info';
      if (tx.status === 'delivering') statusBadge = 'badge-primary';
      if (tx.status === 'cancelled') statusBadge = 'badge-danger';

      if (tx.items && tx.items.length) {
        tx.items.forEach(item => {
          let img = '<div class="order-item-img" style="background:#2a2a2a;display:flex;align-items:center;justify-content:center;color:#666">No Img</div>';
          if (item.product && item.product.images && item.product.images.length > 0) {
            img = `<img src="${API_BASE}/uploads/${item.product.images[0].image_path}" class="order-item-img" alt="${item.product.name}">`;
          }

          itemsHtml += `
            <div class="order-item-row">
              ${img}
              <div style="flex:1">
                <div class="order-item-name">${item.product ? item.product.name : 'Product'}</div>
                <div class="order-item-meta">Qty: ${item.quantity} × ₱${parseFloat(item.price).toFixed(2)}</div>
              </div>
              <div style="font-weight:800;font-family:var(--font-display);color:var(--color-accent)">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
            </div>`;
        });
      }

      let html = `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <div class="order-id">Order <span>#${tx.order_number || ('ORD-' + String(tx.id).padStart(3, '0'))}</span></div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <span class="badge ${statusBadge}">${tx.status}</span>
          </div>
          <div class="order-card-body">
            <div class="auth-card" style="margin-bottom:var(--space-xl)">
              <h3 style="margin-top:0;margin-bottom:var(--space-md);">Shipping Information</h3>
              <p class="text-muted" style="margin:0 0 4px 0;"><strong>Name:</strong> ${tx.full_name || 'N/A'}</p>
              <p class="text-muted" style="margin:0 0 4px 0;"><strong>Address:</strong> ${tx.address || 'N/A'}</p>
              <p class="text-muted" style="margin:0 0 4px 0;"><strong>City:</strong> ${tx.city || 'N/A'}</p>
              <p class="text-muted" style="margin:0;"><strong>ZIP Code:</strong> ${tx.zip || 'N/A'}</p>
            </div>
            <h3 style="margin-top:0;margin-bottom:var(--space-md);">Order Items</h3>
            ${itemsHtml}
            <div class="order-total-row">
              <span class="order-total-label">Order Total</span>
              <span class="order-total-value text-accent">₱${parseFloat(tx.total_price).toFixed(2)}</span>
            </div>
          </div>
        </div>`;
      
      $('#order-container').html(html);
    },
    error: function (xhr) {
      console.error(xhr);
      let msg = 'Failed to load order';
      if (xhr.status === 404) msg = 'Order not found';
      if (xhr.status === 403) msg = 'You do not have permission to view this order';
      
      $('#order-container').html(`
        <div class="empty-state">
          <h2 style="margin-bottom:16px;color:var(--color-danger)">${msg}</h2>
          <a href="/orders.html" class="btn btn-primary">Back to Orders</a>
        </div>
      `);
    }
  });
});
