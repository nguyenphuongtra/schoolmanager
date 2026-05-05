import { API_CONFIG } from '../core/config.js';
import { escapeHtml } from '../core/utils.js';
import { buildAuthHeaders } from '../services/http.js';

const ROLE_COLORS = {
  SUPER_ADMIN: 'danger',
  ADMIN: 'primary',
  LECTURER: 'info',
  STUDENT: 'success',
  STAFF: 'warning',
};

function getRoleBadgeClass(code) {
  var upper = (code || '').toUpperCase();
  return ROLE_COLORS[upper] || 'secondary';
}

export function createUserRolesFeature(context) {
  var state = context.state;
  var refs = context.refs;
  var auth = context.auth;
  var showError = context.showError;
  var clearError = context.clearError;

  var cachedRoles = [];
  var cachedUsers = [];

  /* ── helpers ───────────────────────────────────────── */

  function renderTable(users) {
    var searchTerm = (refs.userRolesSearchInput.value || '').trim().toLowerCase();
    var filtered = users;
    if (searchTerm) {
      filtered = users.filter(function (u) {
        return (
          (u.username || '').toLowerCase().indexOf(searchTerm) !== -1 ||
          (u.fullName || '').toLowerCase().indexOf(searchTerm) !== -1 ||
          (u.email || '').toLowerCase().indexOf(searchTerm) !== -1
        );
      });
    }

    if (!filtered.length) {
      refs.userRolesTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted py-3">Không có dữ liệu người dùng</td></tr>';
      refs.userRolesPaginationInfo.textContent = '';
      return;
    }

    refs.userRolesTableBody.innerHTML = filtered
      .map(function (user, idx) {
        var roles = (user.roles || [])
          .map(function (r) {
            var code = r.code || r.name || '';
            return (
              '<span class="badge bg-' + getRoleBadgeClass(code) + ' me-1">' +
              escapeHtml(r.name || code) +
              '</span>'
            );
          })
          .join('');

        if (!roles) {
          roles = '<span class="text-muted fst-italic small">Chưa có vai trò</span>';
        }

        var statusBadge = user.isActive === false
          ? '<span class="badge bg-secondary">Vô hiệu</span>'
          : '<span class="badge bg-success">Hoạt động</span>';

        return (
          '<tr>' +
            '<td>' + (idx + 1) + '</td>' +
            '<td>' +
              '<div class="fw-semibold">' + escapeHtml(user.fullName || '') + '</div>' +
              '<small class="text-muted">' + escapeHtml(user.username || '') + '</small>' +
            '</td>' +
            '<td>' + escapeHtml(user.email || '') + '</td>' +
            '<td>' + roles + '</td>' +
            '<td class="text-center">' + statusBadge + '</td>' +
            '<td class="text-end">' +
              '<button class="btn btn-sm btn-outline-primary" data-id="' + escapeHtml(String(user.id)) + '" data-action="editRoles" title="Phân quyền">' +
                '<i class="bi bi-shield-lock me-1"></i>Phân quyền' +
              '</button>' +
            '</td>' +
          '</tr>'
        );
      })
      .join('');

    refs.userRolesPaginationInfo.textContent =
      'Tổng ' + filtered.length + ' người dùng' + (searchTerm ? ' (đã lọc)' : '');
  }

  /* ── load data ─────────────────────────────────────── */

  async function loadRoles() {
    try {
      var response = await fetch(API_CONFIG.roles, {
        headers: buildAuthHeaders(state.authState),
      });
      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn.');
        return;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      cachedRoles = await response.json();
    } catch (err) {
      console.error('Lỗi tải danh sách vai trò', err);
    }
  }

  async function loadUsers() {
    clearError();
    refs.userRolesTableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải...</td></tr>';

    try {
      if (!cachedRoles.length) await loadRoles();

      var response = await fetch(API_CONFIG.users, {
        headers: buildAuthHeaders(state.authState),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn.');
        return;
      }
      if (response.status === 403) {
        refs.userRolesTableBody.innerHTML =
          '<tr><td colspan="5" class="text-center text-danger py-3"><i class="bi bi-lock me-1"></i>Bạn không có quyền truy cập tính năng này</td></tr>';
        return;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);

      cachedUsers = await response.json();
      renderTable(cachedUsers);
    } catch (error) {
      showError(error.message);
      refs.userRolesTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải dữ liệu</td></tr>';
    }
  }

  /* ── role assignment modal ─────────────────────────── */

  function openRoleModal(user) {
    if (!refs.userRoleModal) return;

    refs.userRoleModalUserId.value = user.id || '';
    refs.userRoleModalUserInfo.innerHTML =
      '<div class="d-flex align-items-center gap-2 mb-3 p-3 bg-light rounded">' +
        '<i class="bi bi-person-circle fs-3 text-primary"></i>' +
        '<div>' +
          '<div class="fw-bold">' + escapeHtml(user.fullName || '') + '</div>' +
          '<small class="text-muted">' + escapeHtml(user.username || '') + ' • ' + escapeHtml(user.email || '') + '</small>' +
        '</div>' +
      '</div>';

    var currentRoleIds = (user.roles || []).map(function (r) { return r.id; });

    var html = '';
    cachedRoles.forEach(function (role) {
      var checked = currentRoleIds.indexOf(role.id) !== -1 ? ' checked' : '';
      var badgeClass = getRoleBadgeClass(role.code);
      html +=
        '<div class="form-check form-switch py-2 px-3 rounded mb-2 border">' +
          '<input class="form-check-input" type="checkbox" id="roleCheck_' + role.id + '" value="' + role.id + '"' + checked + '>' +
          '<label class="form-check-label d-flex align-items-center gap-2 w-100" for="roleCheck_' + role.id + '">' +
            '<span class="badge bg-' + badgeClass + '">' + escapeHtml(role.code || '') + '</span>' +
            '<span class="fw-semibold">' + escapeHtml(role.name || '') + '</span>' +
            (role.description ? '<small class="text-muted ms-auto">' + escapeHtml(role.description) + '</small>' : '') +
          '</label>' +
        '</div>';
    });

    if (!html) {
      html = '<div class="text-muted text-center py-3">Chưa có vai trò nào trong hệ thống</div>';
    }

    refs.userRoleModalRoleList.innerHTML = html;
    refs.userRoleModal.show();
  }

  async function saveUserRoles() {
    var userId = refs.userRoleModalUserId.value;
    if (!userId) return;

    var checkboxes = refs.userRoleModalRoleList.querySelectorAll('input[type="checkbox"]:checked');
    var roleIds = [];
    checkboxes.forEach(function (cb) {
      roleIds.push(cb.value);
    });

    refs.btnSaveUserRoles.disabled = true;
    refs.btnSaveUserRoles.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu...';

    try {
      var response = await fetch(API_CONFIG.users + '/' + userId + '/roles', {
        method: 'PUT',
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(roleIds),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn.');
        return;
      }
      if (!response.ok) {
        var errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
      }

      refs.userRoleModal.hide();
      await loadUsers();
    } catch (error) {
      console.error('Lỗi cập nhật vai trò', error);
      alert('Có lỗi xảy ra khi cập nhật vai trò:\n' + error.message);
    } finally {
      refs.btnSaveUserRoles.disabled = false;
      refs.btnSaveUserRoles.innerHTML = '<i class="bi bi-check-lg me-1"></i>Lưu thay đổi';
    }
  }

  /* ── event bindings ────────────────────────────────── */

  function bindEvents() {
    refs.btnSaveUserRoles.addEventListener('click', saveUserRoles);

    refs.userRolesSearchInput.addEventListener('input', function () {
      renderTable(cachedUsers);
    });

    refs.userRolesTableBody.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-action]');
      if (!button) return;

      var id = button.getAttribute('data-id');
      var action = button.getAttribute('data-action');

      if (action === 'editRoles') {
        var user = cachedUsers.find(function (u) { return String(u.id) === id; });
        if (user) openRoleModal(user);
      }
    });
  }

  /* ── state resets ──────────────────────────────────── */

  function resetLoggedOutState() {
    refs.userRolesTableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted py-3">Đăng nhập để xem dữ liệu</td></tr>';
    refs.userRolesPaginationInfo.textContent = '';
    cachedRoles = [];
    cachedUsers = [];
  }

  function showUnauthorizedState() {
    refs.userRolesTableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-danger py-3"><i class="bi bi-lock me-1"></i>Phiên đăng nhập đã hết hạn</td></tr>';
    refs.userRolesPaginationInfo.textContent = '';
  }

  return {
    bindEvents: bindEvents,
    loadUsers: loadUsers,
    resetLoggedOutState: resetLoggedOutState,
    showUnauthorizedState: showUnauthorizedState,
  };
}
