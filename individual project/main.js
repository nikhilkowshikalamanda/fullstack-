/**
 * Full Stack E-Commerce Shopping Website
 * main.js - Core Shared Utility & Navigation Logic
 */

// Global App State & Config
const APP_CONFIG = {
  currency: '₹',
  fallbackImage: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22600%22%20height%3D%22450%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20450%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%2394a3b8%3Bfont-weight%3A600%3Bfont-family%3Asans-serif%3Bfont-size%3A24pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22600%22%20height%3D%22450%22%20fill%3D%22%23e2e8f0%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22180%22%20y%3D%22235%22%3EProduct%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E'
};

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight: 800; font-size: 1.1rem;">${iconMap[type] || '•'}</span>
    <div style="flex: 1;">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ==========================================
// CURRENCY & FORMATTING HELPERS
// ==========================================
function formatRupee(amount) {
  if (isNaN(amount) || amount === null) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==========================================
// SHOPPING CART (LOCALSTORAGE)
// ==========================================
const CartManager = {
  getCart() {
    try {
      const stored = localStorage.getItem('eshop_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
      return [];
    }
  },

  saveCart(cart) {
    try {
      localStorage.setItem('eshop_cart', JSON.stringify(cart));
      this.updateBadge();
    } catch (e) {
      console.error("Failed to save cart:", e);
    }
  },

  addItem(product, quantity = 1) {
    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.productId === product.id);

    const qty = parseInt(quantity) || 1;

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        showToast(`Cannot add more. Maximum available stock is ${product.stock}.`, 'warning');
        return false;
      }
      cart[existingIndex].quantity = newQty;
    } else {
      if (qty > product.stock) {
        showToast(`Cannot add ${qty}. Only ${product.stock} in stock.`, 'warning');
        return false;
      }
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock,
        quantity: qty
      });
    }

    this.saveCart(cart);
    showToast(`Added "${product.name}" to your cart!`, 'success');
    return true;
  },

  updateQuantity(productId, quantity) {
    let cart = this.getCart();
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    if (quantity > item.stock) {
      showToast(`Cannot increase. Only ${item.stock} in stock.`, 'warning');
      return;
    }

    item.quantity = quantity;
    this.saveCart(cart);
  },

  removeItem(productId) {
    let cart = this.getCart();
    cart = cart.filter(i => i.productId !== productId);
    this.saveCart(cart);
    showToast('Item removed from cart', 'info');
  },

  clearCart() {
    localStorage.removeItem('eshop_cart');
    this.updateBadge();
  },

  getCount() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = this.getCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-block' : 'inline-block';
    });
  }
};

// ==========================================
// AUTHENTICATION STATE & NAVBAR RENDERER
// ==========================================
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    const navAuthContainer = document.getElementById('nav-auth-container');
    if (!navAuthContainer) return null;

    if (data.authenticated && data.user) {
      const isAdmin = data.user.role === 'admin';
      navAuthContainer.innerHTML = `
        <div class="user-pill">
          <span>👤 ${escapeHtml(data.user.name)}</span>
          ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
        </div>
        ${isAdmin ? '<a href="admin.html" class="btn btn-outline btn-sm">⚙ Admin Panel</a>' : '<a href="orders.html" class="btn btn-secondary btn-sm">📦 My Orders</a>'}
        <button id="logout-btn" class="btn btn-secondary btn-sm" onclick="handleLogout()">Logout</button>
      `;
      return data.user;
    } else {
      navAuthContainer.innerHTML = `
        <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
        <a href="register.html" class="btn btn-primary btn-sm">Register</a>
      `;
      return null;
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    return null;
  }
}

async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    }
  } catch (e) {
    console.error("Logout error:", e);
  }
}

// Security: Escape user string before innerHTML insertion
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Mobile Navbar Toggle Helper
function setupMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show-mobile');
    });
  }
}

// Global initialization on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  CartManager.updateBadge();
  checkAuthStatus();
  setupMobileMenu();
});
