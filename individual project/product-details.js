/**
 * Full Stack E-Commerce Shopping Website
 * product-details.js - Individual Product Detail View & Related Items
 */

let currentProduct = null;
let selectedQuantity = 1;

async function loadProductDetails() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❓</div>
        <h3>No Product Specified</h3>
        <p>Please browse our catalog and select a product to view its details.</p>
        <a href="products.html" class="btn btn-primary">Browse Catalogue</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 80px 0;">
      <div style="font-size: 2.5rem; margin-bottom: 12px;">⏳</div>
      <p style="color: var(--text-muted);">Fetching product specifications...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/products/${productId}`);
    const data = await res.json();

    if (data.success && data.product) {
      currentProduct = data.product;
      selectedQuantity = 1;
      renderProduct(data.product);
      renderRelated(data.related || []);
      document.title = `${data.product.name} — E-Shop Mini Project`;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Product Not Found</h3>
          <p>${data.message || 'The requested product ID does not exist in memory.'}</p>
          <a href="products.html" class="btn btn-primary">Back to Catalog</a>
        </div>
      `;
    }
  } catch (err) {
    console.error("Error loading product:", err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Server Connection Failed</h3>
        <p>Could not retrieve product from server. Please check your backend connection.</p>
        <a href="products.html" class="btn btn-secondary">Back to Catalog</a>
      </div>
    `;
  }
}

function renderProduct(product) {
  const container = document.getElementById('product-detail-container');
  if (!container) return;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-gallery">
        <img 
          src="${escapeHtml(product.image)}" 
          alt="${escapeHtml(product.name)}" 
          class="detail-main-img"
          onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';"
        />
      </div>
      <div class="detail-info">
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
          <span class="badge badge-primary">${escapeHtml(product.category)}</span>
          ${isOutOfStock 
            ? '<span class="badge badge-danger">Out of Stock</span>' 
            : isLowStock 
              ? `<span class="badge badge-warning">Only ${product.stock} Units Left</span>` 
              : '<span class="badge badge-success">In Stock</span>'}
        </div>
        <h1 class="detail-title">${escapeHtml(product.name)}</h1>
        <div class="product-rating" style="font-size: 0.95rem; margin-bottom: 16px;">
          <span class="star-rating">★★★★★</span>
          <span style="font-weight: 700; color: var(--text-main);">${product.rating || '4.8'}</span>
          <span>(${product.reviewsCount || 85} verified customer reviews)</span>
        </div>
        <div class="detail-price-box">
          <div class="detail-price">${formatRupee(product.price)}</div>
          <span style="color: var(--text-muted); font-size: 0.9rem;">Inclusive of all taxes & free shipping</span>
        </div>
        <div class="detail-desc">
          <h4 style="color: var(--text-main); margin-bottom: 8px; font-size: 1.05rem;">Product Description</h4>
          <p>${escapeHtml(product.description || 'No description provided for this product.')}</p>
        </div>

        <div style="margin-top: auto; padding-top: 24px; border-top: 1px solid var(--border);">
          ${isOutOfStock ? `
            <div style="padding: 16px; background: var(--danger-light); border-radius: var(--radius-md); color: var(--danger); font-weight: 600;">
              ⚠️ This item is currently out of stock. Please check back later or check similar items below.
            </div>
          ` : `
            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">QUANTITY</label>
                <div class="qty-selector">
                  <button type="button" class="qty-btn" onclick="changeQuantity(-1)">−</button>
                  <input type="number" id="detail-qty-input" class="qty-input" value="1" min="1" max="${product.stock}" readonly />
                  <button type="button" class="qty-btn" onclick="changeQuantity(1)">+</button>
                </div>
              </div>
              <div style="flex: 1; min-width: 200px; display: flex; align-items: flex-end;">
                <button class="btn btn-primary btn-lg btn-block" onclick="addProductToCart()">
                  🛒 Add to Shopping Cart
                </button>
              </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-muted);">
              Available stock in warehouse: <strong>${product.stock} units</strong>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function changeQuantity(delta) {
  if (!currentProduct) return;
  const input = document.getElementById('detail-qty-input');
  if (!input) return;

  let current = parseInt(input.value) || 1;
  let next = current + delta;

  if (next < 1) next = 1;
  if (next > currentProduct.stock) {
    next = currentProduct.stock;
    showToast(`Maximum available stock is ${currentProduct.stock}`, 'warning');
  }

  input.value = next;
  selectedQuantity = next;
}

function addProductToCart() {
  if (!currentProduct) return;
  const success = CartManager.addItem(currentProduct, selectedQuantity);
  if (success) {
    // Offer fast navigation option
    setTimeout(() => {
      showToast('<a href="cart.html" style="color: white; text-decoration: underline;">View Shopping Cart →</a>', 'info');
    }, 800);
  }
}

function renderRelated(related) {
  const container = document.getElementById('related-products-container');
  if (!container || !related || related.length === 0) {
    const section = document.getElementById('related-products-section');
    if (section) section.style.display = 'none';
    return;
  }

  container.innerHTML = related.map(product => `
    <div class="product-card">
      <div class="product-thumb-wrap">
        <a href="product-details.html?id=${product.id}">
          <img 
            src="${escapeHtml(product.image)}" 
            alt="${escapeHtml(product.name)}" 
            class="product-thumb"
            onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';"
          />
        </a>
      </div>
      <div class="product-card-body">
        <div class="product-category-text">${escapeHtml(product.category)}</div>
        <a href="product-details.html?id=${product.id}">
          <h3 class="product-title">${escapeHtml(product.name)}</h3>
        </a>
        <div class="product-price-row">
          <div class="product-price">${formatRupee(product.price)}</div>
        </div>
        <div class="product-actions">
          <a href="product-details.html?id=${product.id}" class="btn btn-outline btn-sm">View Details</a>
        </div>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadProductDetails);
