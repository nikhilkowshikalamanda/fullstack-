/**
 * Full Stack E-Commerce Shopping Website
 * orders.js - Customer Order History & Status Tracking
 */

async function loadCustomerOrders() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  // 1. Authenticate check
  const authRes = await fetch('/api/auth/me');
  const authData = await authRes.json();

  if (!authData.authenticated || !authData.user) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔐</div>
        <h3>Please Log In to View Orders</h3>
        <p>You need to be logged in to view your order history and live delivery tracking.</p>
        <a href="login.html?redirect=orders.html" class="btn btn-primary">Log In Now</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 0;">
      <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
      <p style="color: var(--text-muted);">Fetching your order history...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/orders/my-orders');
    const data = await res.json();

    if (data.success && data.orders && data.orders.length > 0) {
      renderOrders(data.orders);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>No Orders Found</h3>
          <p>You haven't placed any orders in this session yet. Explore our products and order something great today!</p>
          <a href="products.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
    }
  } catch (err) {
    console.error("Orders fetch error:", err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to Load Orders</h3>
        <p>Could not connect to the backend server. Please verify the Express.js server status.</p>
      </div>
    `;
  }
}

function renderOrders(orders) {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  container.innerHTML = orders.map(order => {
    const statusClassMap = {
      'Pending': 'badge-warning',
      'Processing': 'badge-info',
      'Shipped': 'badge-primary',
      'Delivered': 'badge-success',
      'Cancelled': 'badge-danger'
    };
    const badgeClass = statusClassMap[order.orderStatus] || 'badge-neutral';

    return `
      <div class="order-history-card">
        <div class="order-history-header">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <span class="order-id-tag">${order.id}</span>
              <span class="badge ${badgeClass}">${order.orderStatus}</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">Placed on ${formatDate(order.createdAt)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--secondary);">${formatRupee(order.total)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${order.paymentMethod}</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Items in this order:</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${order.items.map(item => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-muted); border-radius: var(--radius-sm);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <img 
                    src="${escapeHtml(item.image)}" 
                    alt="${escapeHtml(item.name)}" 
                    style="width: 42px; height: 42px; border-radius: 6px; object-fit: cover;"
                    onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';"
                  />
                  <div>
                    <a href="product-details.html?id=${item.productId}" style="font-weight: 600; font-size: 0.92rem; color: var(--text-main);">${escapeHtml(item.name)}</a>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${formatRupee(item.price)} × ${item.quantity} qty</div>
                  </div>
                </div>
                <div style="font-weight: 700; font-size: 0.95rem;">${formatRupee(item.subtotal || (item.price * item.quantity))}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--text-muted); flex-wrap: gap;">
          <div>
            📍 <strong>Deliver to:</strong> ${escapeHtml(order.shippingAddress.fullName)}, ${escapeHtml(order.shippingAddress.street)}, ${escapeHtml(order.shippingAddress.city)} (${order.shippingAddress.pincode}) | 📞 ${order.shippingAddress.phone}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', loadCustomerOrders);
