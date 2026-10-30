/**
 * Full Stack E-Commerce Shopping Website
 * products.js - Product Catalogue, Filtering, Sorting & Search
 */

let allProducts = [];
let currentCategory = 'All';
let currentSearch = '';
let currentSort = 'featured';

async function fetchProducts() {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0;">
      <div style="font-size: 2rem; margin-bottom: 12px; animation: spin 1s linear infinite;">⏳</div>
      <p style="color: var(--text-muted); font-weight: 500;">Loading fresh products from inventory...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (currentSearch) params.append('search', currentSearch);
    if (currentCategory && currentCategory !== 'All') params.append('category', currentCategory);
    if (currentSort && currentSort !== 'featured') params.append('sort', currentSort);

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      allProducts = data.products;
      renderCategories(data.categories);
      renderProductCards(allProducts);
      updateResultsCount(data.count, data.totalCount);
    } else {
      container.innerHTML = `<div class="empty-state"><h3>Failed to load products</h3><p>${data.message}</p></div>`;
    }
  } catch (error) {
    console.error("Failed to load products:", error);
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3>Unable to Connect to Server</h3>
        <p>Please make sure the Express.js server is running on http://localhost:3000</p>
      </div>
    `;
  }
}

function renderProductCards(products) {
  const container = document.getElementById('products-grid-container');
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <h3>No Products Found</h3>
        <p>We couldn't find any products matching your search criteria. Try a different keyword or category filter.</p>
        <button class="btn btn-secondary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => {
    const isOutOfStock = product.stock === 0;
    const isLowStock = product.stock > 0 && product.stock <= 10;

    let stockBadge = '';
    if (isOutOfStock) {
      stockBadge = '<span class="badge badge-danger">Out of Stock</span>';
    } else if (isLowStock) {
      stockBadge = `<span class="badge badge-warning">Only ${product.stock} Left</span>`;
    }

    return `
      <div class="product-card">
        <div class="product-thumb-wrap">
          <div class="product-badge-overlay">
            ${stockBadge}
          </div>
          <a href="product-details.html?id=${product.id}">
            <img 
              src="${escapeHtml(product.image)}" 
              alt="${escapeHtml(product.name)}" 
              class="product-thumb"
              onerror="this.onerror=null; this.src='${APP_CONFIG.fallbackImage}';"
              loading="lazy"
            />
          </a>
        </div>
        <div class="product-card-body">
          <div class="product-category-text">${escapeHtml(product.category)}</div>
          <a href="product-details.html?id=${product.id}">
            <h3 class="product-title" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h3>
          </a>
          <div class="product-rating">
            <span class="star-rating">★</span>
            <span style="font-weight: 600; color: var(--text-main);">${product.rating || '4.5'}</span>
            <span>(${product.reviewsCount || 10}+ reviews)</span>
          </div>
          <div class="product-price-row">
            <div class="product-price">${formatRupee(product.price)}</div>
            <div class="stock-indicator ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}">
              ${isOutOfStock ? 'Sold Out' : `${product.stock} in stock`}
            </div>
          </div>
          <div class="product-actions">
            ${isOutOfStock 
              ? `<button class="btn btn-secondary btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">Unavailable</button>` 
              : `<button class="btn btn-primary btn-sm" onclick="handleAddToCart(${product.id})">🛒 Add to Cart</button>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleAddToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (product) {
    CartManager.addItem(product, 1);
  }
}

function renderCategories(categories) {
  const categoryFilter = document.getElementById('category-filter');
  if (!categoryFilter) return;

  // Preserve current selection
  const currentVal = categoryFilter.value;
  
  let options = `<option value="All">All Categories</option>`;
  categories.forEach(cat => {
    options += `<option value="${escapeHtml(cat)}"${currentVal === cat ? ' selected' : ''}>${escapeHtml(cat)}</option>`;
  });
  categoryFilter.innerHTML = options;
}

function updateResultsCount(count, total) {
  const countEl = document.getElementById('results-count');
  if (countEl) {
    countEl.textContent = `Showing ${count} of ${total} products`;
  }
}

function resetFilters() {
  currentCategory = 'All';
  currentSearch = '';
  currentSort = 'featured';

  const searchInput = document.getElementById('search-input');
  const catFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');

  if (searchInput) searchInput.value = '';
  if (catFilter) catFilter.value = 'All';
  if (sortFilter) sortFilter.value = 'featured';

  fetchProducts();
}

// Debounced Search Input Handler
let searchTimer = null;
function handleSearchInput(e) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = e.target.value.trim();
    fetchProducts();
  }, 350);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');

  // Check URL query parameters (e.g. from homepage category click)
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('category');
  const searchParam = urlParams.get('search');

  if (catParam) {
    currentCategory = catParam;
  }
  if (searchParam) {
    currentSearch = searchParam;
    if (searchInput) searchInput.value = searchParam;
  }

  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      fetchProducts();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      currentSort = e.target.value;
      fetchProducts();
    });
  }

  fetchProducts();
});
