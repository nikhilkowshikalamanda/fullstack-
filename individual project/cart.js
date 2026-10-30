/**
 * Full Stack E-Commerce Shopping Website
 * cart.js - Shopping Cart Logic with Server-Side Stock & Price Validation
 */

let validatedCartItems = [];
let cartSubtotal = 0;

async function loadAndValidateCart() {
  const container = document.getElementById('cart-items-container');
  const summaryContainer = document.getElementById('cart-summary-container');
  if (!container) return;

  const localCart = CartManager.getCart();

  if (!localCart || localCart.length === 0) {
    renderEmptyCart();
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 0;">
      <div style="font-size: 2rem; margin-bottom: 8px;">🔄</div>
      <p style="color: var(--text-muted);">Verifying latest prices and stock availability with server...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/products/validate-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: localCart })
    });

    const data = await res.json();

    if (data.success) {
      validatedCartItems = data.items;
      cartSubtotal = data.subtotal;

      // Sync verified items back to localStorage
      CartManager.saveCart(validatedCartItems);

      // Display any backend warnings (e.g. stock lowered or item expired)
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach(w => showToast(w, 'warning'));
      }

      if (validatedCartItems.length === 0) {
        renderEmptyCart();
      } else {
        renderCartItems(validatedCartItems);
        renderCartSummary(cartSubtotal);
      }
    } else {
      showToast(data.message || 'Cart validation failed', 'error');
      renderCartItems(localCart);
    }
  } catch (error) {
    console.error("Cart sync error:", error);
    // Fallback to local rendering if server offline
    renderCartItems(localCart);
  }
}

function renderEmptyCart() {
  const container = document.getElementById('cart-items-container');
  const summaryContainer = document.getElementById('cart-summary-container');
  const layout = document.querySelector('.cart-layout');

  if (container) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🛒</div>
        <h3>Your Shopping Cart is Empty</h3>
        <p>You haven't added any items to your cart yet. Explore our curated catalog to find what you love!</p>
        <a href="products.html" class="btn btn-primary btn-lg">Explore Catalogue</a>
      </div>
    `;
  }
  if (summaryContainer) {
    summaryContainer.style.display = 'none';
  }
  if (layout) {
    layout.style.gridTemplateColumns = '1fr';
  }
}

function renderCartItems(items) {
  const container = document.getElementById('cart-items-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
      <h2 style="font-size: 1.4rem;">Cart Items (${items.reduce((s, i) => s + i.quantity, 0)})</h2>
      <button class="btn btn-secondary btn-sm" onclick="handleClearCart()">Clear Cart</button>
    </div>
    ${items.map(item => `
      <div class="cart-item" id="cart-item-${item.productId}">
        <img 
          src="${escapeHtml(item.image)}" 
          alt="${escapeHtml(item.name)}" 
          class="cart-item-img"
          onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';"
        />
        <div>
          <a href="product-details.html?id=${item.productId}" class="cart-item-title">${escapeHtml(item.name)}</a>
          <div class="cart-item-price">${formatRupee(item.price)} each</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Category: ${escapeHtml(item.category || 'General')}</div>
        </div>
        <div>
          <div class="qty-selector">
            <button class="qty-btn" onclick="updateItemQty(${item.productId}, ${item.quantity - 1})">−</button>
            <input type="number" class="qty-input" value="${item.quantity}" readonly />
            <button class="qty-btn" onclick="updateItemQty(${item.productId}, ${item.quantity + 1})">+</button>
          </div>
        </div>
        <div class="cart-item-subtotal">
          ${formatRupee(item.price * item.quantity)}
        </div>
        <div>
          <button class="btn btn-secondary btn-sm" title="Remove item" onclick="handleRemoveItem(${item.productId})" style="color: var(--danger); border-color: var(--border);">
            🗑
          </button>
        </div>
      </div>
    `).join('')}
  `;
}

function renderCartSummary(subtotal) {
  const summaryContainer = document.getElementById('cart-summary-container');
  if (!summaryContainer) return;
  summaryContainer.style.display = 'block';

  summaryContainer.innerHTML = `
    <div class="cart-card">
      <h3 style="font-size: 1.3rem; margin-bottom: 20px;">Order Summary</h3>
      
      <div class="order-summary-row">
        <span>Items Subtotal:</span>
        <span style="font-weight: 600; color: var(--text-main);">${formatRupee(subtotal)}</span>
      </div>
      
      <div class="order-summary-row">
        <span>Standard Delivery:</span>
        <span style="color: var(--success); font-weight: 700;">FREE</span>
      </div>

      <div class="order-summary-row">
        <span>Estimated GST / Taxes:</span>
        <span>${formatRupee(0)}</span>
      </div>

      <div class="order-summary-total">
        <span>Grand Total:</span>
        <span style="color: var(--primary);">${formatRupee(subtotal)}</span>
      </div>

      <div style="margin: 24px 0 16px;">
        <a href="checkout.html" class="btn btn-primary btn-lg btn-block">
          Proceed to Checkout →
        </a>
      </div>

      <div style="text-align: center;">
        <a href="products.html" style="font-size: 0.9rem; color: var(--text-muted); text-decoration: underline;">
          ← Continue Shopping
        </a>
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
        <span>🔒</span>
        <span>Safe & Encrypted Checkout (In-Memory College Demo)</span>
      </div>
    </div>
  `;
}

function updateItemQty(productId, newQty) {
  CartManager.updateQuantity(productId, newQty);
  loadAndValidateCart();
}

function handleRemoveItem(productId) {
  CartManager.removeItem(productId);
  loadAndValidateCart();
}

function handleClearCart() {
  if (confirm("Are you sure you want to remove all items from your cart?")) {
    CartManager.clearCart();
    renderEmptyCart();
    showToast('Shopping cart cleared', 'info');
  }
}

document.addEventListener('DOMContentLoaded', loadAndValidateCart);
