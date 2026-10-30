/**
 * Full Stack E-Commerce Shopping Website
 * auth.js - User Registration, Login & Role Redirection
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Parse redirect query param if present
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTarget = urlParams.get('redirect') || 'index.html';

  // ==========================================
  // LOGIN HANDLER
  // ==========================================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please enter both email and password.', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showToast(`Welcome back, ${data.user.name}!`, 'success');

          // If admin, default redirect to admin dashboard unless specific redirect
          let destination = redirectTarget;
          if (data.user.role === 'admin' && redirectTarget === 'index.html') {
            destination = 'admin.html';
          }

          setTimeout(() => {
            window.location.href = destination;
          }, 600);
        } else {
          showToast(data.message || 'Login failed. Please verify credentials.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Log In';
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast('Network error while connecting to server.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
    });
  }

  // ==========================================
  // REGISTRATION HANDLER
  // ==========================================
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : password;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password) {
        showToast('All fields are required.', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'warning');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match. Please re-enter.', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.status === 201 && data.success) {
          showToast('Account created successfully! Welcome.', 'success');
          setTimeout(() => {
            window.location.href = redirectTarget;
          }, 600);
        } else {
          showToast(data.message || 'Registration failed.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Account';
        }
      } catch (err) {
        console.error('Registration error:', err);
        showToast('Network error during registration.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
});

// Helper for 1-click Demo Fillers
function fillDemoCredentials(role) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (!emailInput || !passwordInput) return;

  if (role === 'admin') {
    emailInput.value = 'admin@eshop.com';
    passwordInput.value = 'AdminPassword123';
    showToast('Loaded Demo Administrator credentials', 'info');
  } else if (role === 'customer') {
    emailInput.value = 'customer@eshop.com';
    passwordInput.value = 'CustomerPass123';
    showToast('Loaded Demo Customer credentials', 'info');
  }
}
