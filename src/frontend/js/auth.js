import '../css/main.css';

// =============================================
// TOAST NOTIFICATIONS
// =============================================
window.showToast = function(message, type = 'info', title = '') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <div class="toast-content">
      <div class="toast-title">${title || titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// =============================================
// AUTH HELPERS
// =============================================
window.Auth = {
  getToken: () => localStorage.getItem('mm_token'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('mm_user')); }
    catch { return null; }
  },
  setSession: (token, user) => {
    localStorage.setItem('mm_token', token);
    localStorage.setItem('mm_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_user');
  },
  isLoggedIn: () => !!localStorage.getItem('mm_token'),
  isAdmin: () => {
    const user = window.Auth.getUser();
    return user && user.role === 'admin';
  },
  authHeaders: () => {
    const token = window.Auth.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },
};

// =============================================
// LOGIN FORM
// =============================================
$(document).ready(function () {
  // Update navbar user state
  updateNavbarUser();

  // Login form
  if ($('#login-form').length) {
    $('#login-form').validate({
      rules: {
        email: { required: true, email: true },
        password: { required: true, minlength: 6 },
      },
      messages: {
        email: { required: 'Email is required', email: 'Enter a valid email' },
        password: { required: 'Password is required', minlength: 'At least 6 characters' },
      },
      submitHandler: function (form) {
        const $btn = $('#login-btn');
        const originalText = $btn.html();
        $btn.prop('disabled', true).html('<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span>');

        $.ajax({
          url: '/api/auth/login',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            email: $('#login-email').val().trim(),
            password: $('#login-password').val(),
          }),
          success: function (data) {
            window.Auth.setSession(data.token, data.user);
            showToast('Welcome back, ' + data.user.name + '! 🤘', 'success');

            const redirect = new URLSearchParams(window.location.search).get('redirect') || '/';
            setTimeout(() => {
              window.location.href = data.user.role === 'admin' ? '/admin/dashboard' : redirect;
            }, 800);
          },
          error: function (xhr) {
            const msg = xhr.responseJSON ? xhr.responseJSON.error : 'Login failed';
            showToast(msg, 'error');
            $btn.prop('disabled', false).html(originalText);
          },
        });
      },
    });
  }

  // Register form
  if ($('#register-form').length) {
    $('#register-form').validate({
      rules: {
        name: { required: true, minlength: 2 },
        email: { required: true, email: true },
        password: { required: true, minlength: 6 },
        confirm_password: { required: true, equalTo: '#reg-password' },
      },
      messages: {
        name: { required: 'Name is required' },
        email: { required: 'Email is required', email: 'Enter a valid email' },
        password: { required: 'Password is required', minlength: 'At least 6 characters' },
        confirm_password: { required: 'Please confirm password', equalTo: 'Passwords do not match' },
      },
      submitHandler: function () {
        const $btn = $('#register-btn');
        $btn.prop('disabled', true).html('<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0"></span>');

        $.ajax({
          url: '/api/auth/register',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            name: $('#reg-name').val().trim(),
            email: $('#reg-email').val().trim(),
            password: $('#reg-password').val(),
          }),
          success: function () {
            showToast('Account created! Please log in. 🎸', 'success');
            setTimeout(() => window.location.href = '/login', 1200);
          },
          error: function (xhr) {
            const msg = xhr.responseJSON ? xhr.responseJSON.error : 'Registration failed';
            showToast(msg, 'error');
            $btn.prop('disabled', false).html('Create Account');
          },
        });
      },
    });
  }

  // Logout button
  $(document).on('click', '#logout-btn', function () {
    $.ajax({
      url: '/api/auth/logout',
      method: 'POST',
      headers: window.Auth.authHeaders(),
      complete: function () {
        window.Auth.clearSession();
        window.Cart.clear();
        showToast('Logged out. See you in the pit! 🤘', 'info');
        setTimeout(() => window.location.href = '/', 800);
      },
    });
  });
});

function updateNavbarUser() {
  const user = window.Auth.getUser();
  const $userArea = $('#navbar-user-area');
  if (!$userArea.length) return;

  if (user && window.Auth.isLoggedIn()) {
    $userArea.html(`
      <span style="font-size:13px;color:var(--text-secondary);">${user.name}</span>
      ${user.role === 'admin' ? `<a href="/admin/dashboard" class="btn btn-secondary btn-sm">Admin</a>` : `<a href="/orders" class="btn btn-secondary btn-sm">Orders</a>`}
      <button id="logout-btn" class="btn btn-outline btn-sm">Logout</button>
    `);
  } else {
    $userArea.html(`
      <a href="/login" class="btn btn-ghost btn-sm">Login</a>
      <a href="/register" class="btn btn-primary btn-sm">Join Now</a>
    `);
  }
}

window.updateNavbarUser = updateNavbarUser;
