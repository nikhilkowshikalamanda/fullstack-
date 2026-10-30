/**
 * Full Stack E-Commerce Shopping Website
 * admin.js - Administrator Dashboard & Product/Order Management
 */

let adminProducts = [];
let adminOrders = [];

// ==========================================
// INITIALIZATION & AUTH GUARD
// ==========================================
async function initAdmin() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (!data.authenticated || !data.user || data.user.role !== 'admin') {
      alert("Access Denied: You must be logged in as an Administrator (admin@eshop.com) to access this dashboard.");
      window.location.href = 'login.html?redirect=admin.html';
      return;
    }

    // Set Admin Name
    const adminNameEl = document.getElementById('admin-user-name');
    if (adminNameEl) {
      adminNameEl.textContent = data.user.name;
    }

    // Load Metrics and Data
    await loadDashboardStats();
    await loadAdminProducts();
    await loadAdminOrders();
    setupAdminEvents();
  } catch (err) {
    console.error("Admin init failed:", err);
  }
}

// ==========================================
// METRICS & STATS
// ==========================================
async function loadDashboardStats() {
  try {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();

    if (data.success && data.stats) {
      const s = data.stats;
      document.getElementById('metric-total-products').textContent = s.totalProducts || 0;
      document.getElementById('metric-total-orders').textContent = s.totalOrders || 0;
      document.getElementById('metric-total-revenue').textContent = formatRupee(s.totalRevenue || 0);
      document.getElementById('metric-out-of-stock').textContent = s.outOfStock || 0;
    }
  } catch (err) {
    console.error("Error loading dashboard stats:", err);
  }
}

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================
async function loadAdminProducts(searchTerm = '') {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px;">Loading product inventory...</td></tr>`;

  try {
    let url = '/api/products';
    if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      adminProducts = data.products;
      renderAdminProductsTable(adminProducts);
    }
  } catch (err) {
    console.error("Failed to load admin products:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red;">Error loading products from server.</td></tr>`;
  }
}

function renderAdminProductsTable(products) {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">No products found matching criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const isOut = p.stock === 0;
    const isLow = p.stock > 0 && p.stock <= 10;
    const stockPill = isOut 
      ? `<span class="badge badge-danger">0 Out of Stock</span>` 
      : isLow 
        ? `<span class="badge badge-warning">${p.stock} Low Stock</span>` 
        : `<span class="badge badge-success">${p.stock} In Stock</span>`;

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-muted);">#${p.id}</td>
        <td>
          <img 
            src="${escapeHtml(p.image)}" 
            alt="${escapeHtml(p.name)}" 
            style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; background: #e2e8f0;"
            onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';"
          />
        </td>
        <td style="font-weight: 600; max-width: 250px;">
          <div>${escapeHtml(p.name)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 240px;">${escapeHtml(p.description)}</div>
        </td>
        <td><span class="badge badge-primary">${escapeHtml(p.category)}</span></td>
        <td style="font-weight: 700;">${formatRupee(p.price)}</td>
        <td>${stockPill}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="openEditProductModal(${p.id})">✏ Edit</button>
            <button class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: #fee2e2;" onclick="handleDeleteProduct(${p.id}, '${escapeHtml(p.name)}')">🗑 Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// ORDER MANAGEMENT
// ==========================================
async function loadAdminOrders(statusFilter = 'All', searchQuery = '') {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px;">Loading live orders...</td></tr>`;

  try {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'All') params.append('status', statusFilter);
    if (searchQuery) params.append('search', searchQuery);

    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      adminOrders = data.orders;
      renderAdminOrdersTable(adminOrders);
    }
  } catch (err) {
    console.error("Failed to load admin orders:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red;">Failed to retrieve orders.</td></tr>`;
  }
}

function renderAdminOrdersTable(orders) {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px; color: var(--text-muted);">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const statusClassMap = {
      'Pending': 'badge-warning',
      'Processing': 'badge-info',
      'Shipped': 'badge-primary',
      'Delivered': 'badge-success',
      'Cancelled': 'badge-danger'
    };
    const badgeClass = statusClassMap[o.orderStatus] || 'badge-neutral';

    return `
      <tr>
        <td style="font-family: monospace; font-weight: 700; color: var(--primary);">${o.id}</td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(o.customerName)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(o.customerEmail)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">📞 ${escapeHtml(o.shippingAddress.phone)}</div>
        </td>
        <td>
          <div style="font-size: 0.88rem; font-weight: 600;">${o.itemsCount} items</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(o.createdAt)}</div>
        </td>
        <td style="font-weight: 800; font-size: 1rem;">${formatRupee(o.total)}</td>
        <td>
          <span class="badge ${badgeClass}">${o.orderStatus}</span>
        </td>
        <td>
          <select 
            class="form-control" 
            style="padding: 4px 8px; font-size: 0.85rem; width: auto;" 
            onchange="handleUpdateOrderStatus('${o.id}', this.value)"
          >
            <option value="Pending"${o.orderStatus === 'Pending' ? ' selected' : ''}>Pending</option>
            <option value="Processing"${o.orderStatus === 'Processing' ? ' selected' : ''}>Processing</option>
            <option value="Shipped"${o.orderStatus === 'Shipped' ? ' selected' : ''}>Shipped</option>
            <option value="Delivered"${o.orderStatus === 'Delivered' ? ' selected' : ''}>Delivered</option>
            <option value="Cancelled"${o.orderStatus === 'Cancelled' ? ' selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="viewOrderDetails('${o.id}')">👁 View Details</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleUpdateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`Order ${orderId} status set to "${newStatus}"`, 'success');
      loadDashboardStats();
      loadAdminOrders(document.getElementById('admin-order-status-filter').value);
    } else {
      showToast(data.message || 'Failed to update order status', 'error');
    }
  } catch (e) {
    console.error("Order status update error:", e);
    showToast('Failed to connect to server', 'error');
  }
}

// ==========================================
// MODALS & EVENT HANDLERS
// ==========================================
function setupAdminEvents() {
  // Tabs
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabName = btn.getAttribute('data-tab');

      document.getElementById('tab-products').style.display = tabName === 'products' ? 'block' : 'none';
      document.getElementById('tab-orders').style.display = tabName === 'orders' ? 'block' : 'none';
    });
  });

  // Product Search
  const prodSearch = document.getElementById('admin-product-search');
  if (prodSearch) {
    prodSearch.addEventListener('input', (e) => {
      loadAdminProducts(e.target.value.trim());
    });
  }

  // Order Search & Filter
  const orderSearch = document.getElementById('admin-order-search');
  const orderFilter = document.getElementById('admin-order-status-filter');

  if (orderSearch) {
    orderSearch.addEventListener('input', () => {
      loadAdminOrders(orderFilter.value, orderSearch.value.trim());
    });
  }

  if (orderFilter) {
    orderFilter.addEventListener('change', () => {
      loadAdminOrders(orderFilter.value, orderSearch ? orderSearch.value.trim() : '');
    });
  }

  // Product Form (Add / Edit)
  const productForm = document.getElementById('admin-product-form');
  if (productForm) {
    productForm.addEventListener('submit', handleSaveProduct);
  }
}

function openAddProductModal() {
  const modal = document.getElementById('product-modal');
  const form = document.getElementById('admin-product-form');
  const title = document.getElementById('product-modal-title');

  if (!modal || !form) return;

  form.reset();
  document.getElementById('prod-form-id').value = '';
  title.textContent = 'Add New Inventory Product';
  modal.classList.add('show');
}

function openEditProductModal(productId) {
  const product = adminProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');

  document.getElementById('prod-form-id').value = product.id;
  document.getElementById('prod-form-name').value = product.name;
  document.getElementById('prod-form-category').value = product.category;
  document.getElementById('prod-form-price').value = product.price;
  document.getElementById('prod-form-stock').value = product.stock;
  document.getElementById('prod-form-image').value = product.image;
  document.getElementById('prod-form-desc').value = product.description;

  title.textContent = `Edit Product #${product.id}`;
  modal.classList.add('show');
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('show');
}

async function handleSaveProduct(e) {
  e.preventDefault();

  const id = document.getElementById('prod-form-id').value;
  const name = document.getElementById('prod-form-name').value.trim();
  const category = document.getElementById('prod-form-category').value.trim();
  const price = parseFloat(document.getElementById('prod-form-price').value);
  const stock = parseInt(document.getElementById('prod-form-stock').value);
  const image = document.getElementById('prod-form-image').value.trim();
  const description = document.getElementById('prod-form-desc').value.trim();

  if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
    showToast('Please provide valid product details, price, and stock.', 'warning');
    return;
  }

  const payload = { name, category, price, stock, image, description };
  const isEdit = !!id;
  const url = isEdit ? `/api/products/${id}` : '/api/products';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(isEdit ? 'Product updated successfully!' : 'New product created!', 'success');
      closeProductModal();
      loadDashboardStats();
      loadAdminProducts();
    } else {
      showToast(data.message || 'Failed to save product', 'error');
    }
  } catch (err) {
    console.error("Save product error:", err);
    showToast('Network error while saving product.', 'error');
  }
}

async function handleDeleteProduct(productId, productName) {
  if (!confirm(`Are you sure you want to delete "${productName}" from the store catalog?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`Product deleted successfully`, 'success');
      loadDashboardStats();
      loadAdminProducts();
    } else {
      showToast(data.message || 'Failed to delete product', 'error');
    }
  } catch (err) {
    console.error("Delete product error:", err);
    showToast('Network error while deleting product', 'error');
  }
}

function viewOrderDetails(orderId) {
  const order = adminOrders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById('order-detail-modal');
  const body = document.getElementById('order-detail-modal-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h3 style="font-family: monospace; color: var(--primary); font-size: 1.3rem;">${order.id}</h3>
        <span class="badge badge-primary">${order.orderStatus}</span>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Placed on: ${formatDate(order.createdAt)}</div>
    </div>

    <div style="background: var(--bg-muted); padding: 14px; border-radius: var(--radius-md); margin-bottom: 20px; font-size: 0.9rem;">
      <h4 style="margin-bottom: 6px; font-size: 0.95rem;">Customer & Shipping Address:</h4>
      <div><strong>${escapeHtml(order.customerName)}</strong> (${escapeHtml(order.customerEmail)})</div>
      <div>📞 ${escapeHtml(order.shippingAddress.phone)}</div>
      <div>📍 ${escapeHtml(order.shippingAddress.street)}, ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} - ${escapeHtml(order.shippingAddress.pincode)}</div>
    </div>

    <h4 style="margin-bottom: 10px; font-size: 0.95rem;">Purchased Items:</h4>
    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
      ${order.items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${escapeHtml(item.image)}" alt="" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover;" onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';" />
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(item.name)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${formatRupee(item.price)} × ${item.quantity}</div>
            </div>
          </div>
          <div style="font-weight: 700;">${formatRupee(item.subtotal || (item.price * item.quantity))}</div>
        </div>
      `).join('')}
    </div>

    <div style="border-top: 2px dashed var(--border); padding-top: 14px; display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800;">
      <span>Total Order Amount:</span>
      <span style="color: var(--primary);">${formatRupee(order.total)}</span>
    </div>
  `;

  modal.classList.add('show');
}

function closeOrderDetailModal() {
  const modal = document.getElementById('order-detail-modal');
  if (modal) modal.classList.remove('show');
}

document.addEventListener('DOMContentLoaded', initAdmin);
