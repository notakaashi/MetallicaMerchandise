$(document).ready(function () {
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    $('#order-container').html(`
      <div style="text-align:center;padding:60px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg)">
        <h2 style="margin-bottom:16px">Invalid Order ID</h2>
        <a href="/orders" class="btn btn-primary">Back to Orders</a>
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
              <div style="font-weight:700;color:var(--accent-red)">₱${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
            </div>`;
        });
      }

      let html = `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <div class="order-id">Order <span>#${tx.id}</span></div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <span class="badge ${statusBadge}">${tx.status}</span>
          </div>
          <div class="order-card-body">
            <div style="background:#1e1e1e;padding:20px;border-radius:var(--radius);margin-bottom:24px">
              <h3 style="margin-top:0;margin-bottom:12px;font-size:16px;color:#fff">Shipping Information</h3>
              <p style="margin:0 0 4px 0;color:var(--text-muted)"><strong>Name:</strong> ${tx.full_name || 'N/A'}</p>
              <p style="margin:0 0 4px 0;color:var(--text-muted)"><strong>Address:</strong> ${tx.address || 'N/A'}</p>
              <p style="margin:0 0 4px 0;color:var(--text-muted)"><strong>City:</strong> ${tx.city || 'N/A'}</p>
              <p style="margin:0;color:var(--text-muted)"><strong>ZIP Code:</strong> ${tx.zip || 'N/A'}</p>
            </div>
            <h3 style="margin-top:0;margin-bottom:12px;font-size:16px;color:#fff">Order Items</h3>
            ${itemsHtml}
            <div class="order-total-row">
              <span class="order-total-label">Order Total</span>
              <span class="order-total-value">₱${parseFloat(tx.total_price).toFixed(2)}</span>
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
        <div style="text-align:center;padding:60px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg)">
          <h2 style="margin-bottom:16px;color:var(--danger)">${msg}</h2>
          <a href="/orders" class="btn btn-primary">Back to Orders</a>
        </div>
      `);
    }
  });
});
