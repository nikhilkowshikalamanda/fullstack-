/**
 * Full Stack E-Commerce Shopping Website
 * checkout.js - Checkout Processing, Delivery Information & Order Placement
 */

let currentUser = null;
let cartItems = [];

async function initCheckout() {
  // 1. Check Authentication
  try {
    const authRes = await fetch('/api/auth/me');
    const authData = await authRes.json();

    if (!authData.authenticated || !authData.user) {
      // User is not logged in
      const container = document.getElementById('checkout-page-container');
      if (container) {
        container.innerHTML = `
          <div class="empty-state" style="max-width: 540px; margin: 60px auto;">
            <div class="empty-state-icon">🔐</div>
            <h3>Authentication Required</h3>
            <p>Please log in or register an account to complete your checkout and place an order.</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <a href="login.html?redirect=checkout.html" class="btn btn-primary">Log In to Proceed</a>
              <a href="register.html" class="btn btn-secondary">Register New Account</a>
            </div>
          </div>
        `;
      }
      return;
    }

    currentUser = authData.user;
    prefillUserData(currentUser);
  } catch (e) {
    console.error("Auth check error during checkout:", e);
  }

  // 2. Check Cart
  cartItems = CartManager.getCart();
  if (!cartItems || cartItems.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // 3. Render Order Summary in Checkout
  renderCheckoutSummary(cartItems);

  // 4. Attach Form Submit Handler
  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', handlePlaceOrder);
  }
}

function prefillUserData(user) {
  const nameInput = document.getElementById('ship-name');
  if (nameInput && user.name && !nameInput.value) {
    nameInput.value = user.name;
  }
}

function renderCheckoutSummary(items) {
  const container = document.getElementById('checkout-summary-items');
  const totalEl = document.getElementById('checkout-grand-total');
  if (!container) return;

  let subtotal = 0;
  container.innerHTML = items.map(item => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.92rem;">
        <div style="display: flex; align-items: center; gap: 10px; max-width: 70%;">
          <img 
            src="${escapeHtml(item.image)}" 
            alt="${escapeHtml(item.name)}" 
            style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;"
            onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';"
          />
          <div>
            <div style="font-weight: 600; line-height: 1.2; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${escapeHtml(item.name)}</div>
            <div style="color: var(--text-muted); font-size: 0.8rem;">Qty: ${item.quantity} × ${formatRupee(item.price)}</div>
          </div>
        </div>
        <div style="font-weight: 700; color: var(--secondary);">${formatRupee(lineTotal)}</div>
      </div>
    `;
  }).join('');

  if (totalEl) {
    totalEl.textContent = formatRupee(subtotal);
  }
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('place-order-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳ Processing Order on Server...</span>`;
  }

  // Extract form fields
  const fullName = document.getElementById('ship-name').value.trim();
  const phone = document.getElementById('ship-phone').value.trim();
  const street = document.getElementById('ship-street').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const state = document.getElementById('ship-state').value.trim();
  const pincode = document.getElementById('ship-pincode').value.trim();

  // Basic Validation
  if (!fullName || !phone || !street || !city || !pincode) {
    showToast("Please fill in all required shipping address fields.", "warning");
    resetButton();
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    showToast("Please provide a valid 10-digit mobile number.", "warning");
    resetButton();
    return;
  }

  const cleanPin = pincode.replace(/[^0-9]/g, '');
  if (cleanPin.length !== 6) {
    showToast("Please enter a valid 6-digit Indian PIN Code.", "warning");
    resetButton();
    return;
  }

  const payload = {
    items: cartItems.map(i => ({
      productId: i.productId,
      quantity: i.quantity
    })),
    shippingAddress: {
      fullName,
      phone: cleanPhone,
      street,
      city,
      state: state || 'Karnataka',
      pincode: cleanPin
    },
    paymentMethod: 'cod'
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.status === 201 && data.success) {
      // Clear Cart from LocalStorage
      CartManager.clearCart();

      // Show Order Success Modal
      showOrderSuccessModal(data.order);
    } else {
      showToast(data.message || "Failed to place order. Please review your cart.", "error");
      resetButton();
    }
  } catch (err) {
    console.error("Order submit error:", err);
    showToast("Network error. Could not reach server to place order.", "error");
    resetButton();
  }
}

function resetButton() {
  const submitBtn = document.getElementById('place-order-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>Place Order (Cash on Delivery) ➔</span>`;
  }
}

function showOrderSuccessModal(order) {
  const modalContainer = document.getElementById('order-success-modal');
  if (!modalContainer) {
    // Fallback redirect
    showToast(`Order placed successfully! ID: ${order.id}`, 'success');
    setTimeout(() => { window.location.href = 'orders.html'; }, 1500);
    return;
  }

  modalContainer.innerHTML = `
    <div class="modal-backdrop show">
      <div class="modal-dialog" style="text-align: center; max-width: 520px;">
        <div class="modal-body" style="padding: 40px 32px;">
          <div style="width: 72px; height: 72px; background: var(--success-light); color: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 20px;">
            ✓
          </div>
          <h2 style="font-size: 1.8rem; margin-bottom: 8px;">Order Placed Successfully!</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px;">
            Thank you for shopping with us! Your order has been recorded in the server's in-memory store.
          </p>
          
          <div style="background: var(--bg-muted); border-radius: var(--radius-md); padding: 18px; text-align: left; margin-bottom: 24px; font-size: 0.9rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: var(--text-muted);">Order Reference ID:</span>
              <strong style="color: var(--primary); font-family: monospace;">${order.id}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: var(--text-muted);">Total Amount:</span>
              <strong>${formatRupee(order.total)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: var(--text-muted);">Payment Mode:</span>
              <span>${order.paymentMethod}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Delivery Address:</span>
              <span style="text-align: right; max-width: 60%;">${order.shippingAddress.street}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}</span>
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="orders.html" class="btn btn-primary btn-block">View My Orders</a>
            <a href="products.html" class="btn btn-secondary btn-block">Continue Shopping</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', initCheckout);
