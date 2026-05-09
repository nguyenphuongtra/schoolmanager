import { API_CONFIG } from '../core/config.js';
import { escapeHtml } from '../core/utils.js';
import { buildAuthHeaders } from '../services/http.js';

export function createRolePermissionsFeature(context) {
  var state = context.state;
  var refs = context.refs;
  var auth = context.auth;
  var showError = context.showError;
  var clearError = context.clearError;

  var cachedRoles = [];
  var cachedPermissions = [];
  var permissionsByModule = {};
  var selectedRoleId = null;
  var currentRolePermissions = []; // list of perm IDs assigned to the selected role

  /* ── data loading ──────────────────────────────────── */

  async function loadRoles() {
    try {
      var response = await fetch(API_CONFIG.roles, {
        headers: buildAuthHeaders(state.authState),
      });
      if (response.status === 401) {
        auth.handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      cachedRoles = await response.json();
      renderRolesList();
    } catch (err) {
      console.error('Lỗi tải danh sách vai trò', err);
      showError('Không thể tải danh sách vai trò: ' + err.message);
    }
  }

  async function loadPermissions() {
    try {
      var response = await fetch(API_CONFIG.permissions, {
        headers: buildAuthHeaders(state.authState),
      });
      if (response.status === 401) {
        auth.handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      cachedPermissions = await response.json();
      
      // Group by module
      permissionsByModule = {};
      cachedPermissions.forEach(function(p) {
        var mod = p.module || 'KHÁC';
        if (!permissionsByModule[mod]) {
          permissionsByModule[mod] = [];
        }
        permissionsByModule[mod].push(p);
      });
    } catch (err) {
      console.error('Lỗi tải danh sách quyền', err);
      showError('Không thể tải danh sách quyền: ' + err.message);
    }
  }

  async function loadRolePermissions(roleId) {
    if (!roleId) return;
    try {
      var response = await fetch(API_CONFIG.rolePermissions + '/' + roleId, {
        headers: buildAuthHeaders(state.authState),
      });
      if (response.status === 401) {
        auth.handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var rolePerms = await response.json();
      // map to array of permission IDs
      currentRolePermissions = rolePerms.map(function(rp) {
        return rp.permissionId;
      });
      renderPermissionsGrid();
    } catch (err) {
      console.error('Lỗi tải quyền của vai trò', err);
      showError('Không thể tải quyền của vai trò: ' + err.message);
    }
  }

  /* ── rendering ─────────────────────────────────────── */

  function renderRolesList() {
    if (!refs.rpRoleList) return;
    
    if (cachedRoles.length === 0) {
      refs.rpRoleList.innerHTML = '<div class="text-muted p-3 text-center">Không có vai trò nào</div>';
      return;
    }

    var html = '';
    cachedRoles.forEach(function(role) {
      var activeClass = (selectedRoleId === role.id) ? 'active bg-primary text-white border-primary' : '';
      html += '<a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center role-item ' + activeClass + '" data-id="' + escapeHtml(role.id) + '">' +
                '<div>' +
                  '<div class="fw-bold">' + escapeHtml(role.name) + '</div>' +
                  '<small class="' + (selectedRoleId === role.id ? 'text-white-50' : 'text-muted') + '">' + escapeHtml(role.code) + '</small>' +
                '</div>' +
                '<i class="bi bi-chevron-right"></i>' +
              '</a>';
    });
    refs.rpRoleList.innerHTML = html;
  }

  function renderPermissionsGrid() {
    if (!refs.rpPermissionsContainer || !refs.rpSelectedRoleTitle) return;
    
    var role = cachedRoles.find(function(r) { return r.id === selectedRoleId; });
    if (!role) return;

    refs.rpSelectedRoleTitle.innerHTML = 'QUYỀN CỦA VAI TRÒ: <span class="text-primary">' + escapeHtml(role.name) + '</span>';

    var html = '';
    
    // Sort modules for consistent rendering
    var modules = Object.keys(permissionsByModule).sort();
    
    modules.forEach(function(mod) {
      html += '<div class="mb-4">';
      html += '<h6 class="fw-bold text-dark border-bottom pb-2 mb-3"><i class="bi bi-box-seam me-2"></i>Module: ' + escapeHtml(mod) + '</h6>';
      html += '<div class="row g-3">';
      
      var perms = permissionsByModule[mod];
      perms.forEach(function(p) {
        var isChecked = currentRolePermissions.includes(p.id);
        var checkedAttr = isChecked ? 'checked' : '';
        
        html += '<div class="col-md-6">' +
                  '<div class="card shadow-sm h-100 border-0 bg-light">' +
                    '<div class="card-body p-3 d-flex align-items-center justify-content-between">' +
                      '<div>' +
                        '<div class="fw-semibold text-dark mb-1">' + escapeHtml(p.name) + '</div>' +
                        '<div class="small text-muted mb-1 font-monospace">' + escapeHtml(p.code) + '</div>' +
                        '<div class="small text-secondary">' + escapeHtml(p.description || '') + '</div>' +
                      '</div>' +
                      '<div class="form-check form-switch ms-3">' +
                        '<input class="form-check-input fs-4 perm-toggle" type="checkbox" role="switch" data-perm-id="' + escapeHtml(p.id) + '" ' + checkedAttr + '>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>';
      });
      
      html += '</div></div>';
    });

    refs.rpPermissionsContainer.innerHTML = html;
  }

  /* ── api actions ───────────────────────────────────── */

  async function togglePermission(permId, isChecked, toggleEl) {
    if (!selectedRoleId) return;
    
    // Disable temporarily
    toggleEl.disabled = true;

    try {
      var url = API_CONFIG.rolePermissions + '?roleId=' + encodeURIComponent(selectedRoleId) + '&permissionId=' + encodeURIComponent(permId);
      var method = isChecked ? 'POST' : 'DELETE';
      
      var response = await fetch(url, {
        method: method,
        headers: buildAuthHeaders(state.authState),
      });

      if (response.status === 401) {
        auth.handleUnauthorized();
        return;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);

      // Update local state
      if (isChecked) {
        if (!currentRolePermissions.includes(permId)) currentRolePermissions.push(permId);
      } else {
        currentRolePermissions = currentRolePermissions.filter(function(id) { return id !== permId; });
      }

    } catch (err) {
      console.error('Lỗi cập nhật quyền', err);
      showError('Lỗi cập nhật quyền: ' + err.message);
      // Revert toggle
      toggleEl.checked = !isChecked;
    } finally {
      toggleEl.disabled = false;
    }
  }

  /* ── initialization & events ───────────────────────── */

  async function loadInitialData() {
    clearError();
    refs.rpPermissionsContainer.innerHTML = '<div class="text-center text-muted p-5"><i class="bi bi-arrow-left-circle fs-3 d-block mb-2 text-secondary"></i>Vui lòng chọn một vai trò bên trái để phân quyền</div>';
    refs.rpSelectedRoleTitle.textContent = 'DANH SÁCH QUYỀN';
    selectedRoleId = null;
    
    await Promise.all([loadRoles(), loadPermissions()]);
  }

  function bindEvents() {
    if (refs.rpRoleList) {
      refs.rpRoleList.addEventListener('click', async function(e) {
        var item = e.target.closest('.role-item');
        if (!item) return;
        e.preventDefault();
        
        selectedRoleId = item.getAttribute('data-id');
        renderRolesList(); // update active state
        
        refs.rpPermissionsContainer.innerHTML = '<div class="text-center p-5"><span class="spinner-border text-primary" role="status"></span><div class="mt-2 text-muted">Đang tải phân quyền...</div></div>';
        
        await loadRolePermissions(selectedRoleId);
      });
    }

    if (refs.rpPermissionsContainer) {
      refs.rpPermissionsContainer.addEventListener('change', function(e) {
        if (e.target.classList.contains('perm-toggle')) {
          var permId = e.target.getAttribute('data-perm-id');
          var isChecked = e.target.checked;
          togglePermission(permId, isChecked, e.target);
        }
      });
    }
  }

  return {
    bindEvents: bindEvents,
    loadInitialData: loadInitialData
  };
}
