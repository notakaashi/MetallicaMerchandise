$(document).ready(function() {
  const token = window.Auth.getToken();
  if (!token) return;

  // Fetch Profile Data
  $.ajax({
    url: API_BASE + '/api/users/profile',
    type: 'GET',
    headers: window.Auth.authHeaders(),
    success: function(res) {
      const user = res.user;
      $('#profile-name').val(user.name);
      $('#profile-email').val(user.email);
      if (user.phone) $('#profile-phone').val(user.phone);
      if (user.address) $('#profile-address').val(user.address);
      if (user.city) $('#profile-city').val(user.city);
      if (user.zip) $('#profile-zip').val(user.zip);

      if (user.avatar) {
        $('#avatar-preview').attr('src', API_BASE + user.avatar).show();
        $('#avatar-placeholder').hide();
      }

      // Update local session if avatar is missing or changed
      const currentUser = window.Auth.getUser();
      if (currentUser && currentUser.avatar !== user.avatar) {
        currentUser.avatar = user.avatar;
        window.Auth.setSession(token, currentUser);
        window.renderNavbar({ showCart: true, showSearch: true });
      }
    },
    error: function(err) {
      window.showToast('Failed to load profile data', 'error');
    }
  });

  // Avatar Image Preview
  $('#avatar-upload').on('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        $('#avatar-preview').attr('src', e.target.result).show();
        $('#avatar-placeholder').hide();
      };
      reader.readAsDataURL(file);
    }
  });

  // Submit Profile Form
  $('#profile-form').on('submit', function(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', $('#profile-name').val());
    formData.append('phone', $('#profile-phone').val());
    formData.append('address', $('#profile-address').val());
    formData.append('city', $('#profile-city').val());
    formData.append('zip', $('#profile-zip').val());

    const avatarFile = $('#avatar-upload')[0].files[0];
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const $btn = $('#save-profile-btn');
    $btn.text('Saving...').prop('disabled', true);

    $.ajax({
      url: API_BASE + '/api/users/profile',
      type: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type for FormData, jQuery will handle it (boundary)
      },
      data: formData,
      processData: false,
      contentType: false,
      success: function(res) {
        window.showToast(res.message, 'success');
        $btn.text('Save Changes').prop('disabled', false);
        
        // Update local storage user info
        const currentUser = window.Auth.getUser();
        if (currentUser) {
          currentUser.name = res.user.name;
          if (res.user.avatar) currentUser.avatar = res.user.avatar;
          window.Auth.setSession(token, currentUser);
          
          // Re-render navbar to update avatar and name
          const $userBtn = $('#user-dropdown-btn span');
          if ($userBtn.length) {
            $userBtn.text(currentUser.name);
          }
          if (res.user.avatar && $('#navbar-avatar').length) {
            $('#navbar-avatar').attr('src', API_BASE + res.user.avatar).show();
            $('#navbar-avatar-placeholder').hide();
          }
        }
      },
      error: function(err) {
        window.showToast(err.responseJSON?.error || 'Failed to update profile', 'error');
        $btn.text('Save Changes').prop('disabled', false);
      }
    });
  });
});
