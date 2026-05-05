import { API_CONFIG } from '../core/config.js';
import { buildAuthHeaders, fetchJson } from '../services/http.js';
import { escapeHtml } from '../core/utils.js';

export function createProfileFeature(context) {
  const { state, refs, auth } = context;
  let profileData = null;
  let editMode = false;

  async function loadProfile() {
    try {
      const { response, data } = await fetchJson(API_CONFIG.students + '/me', {
        headers: buildAuthHeaders(state.authState),
      });

      if (!response.ok) {
        refs.profileContent.innerHTML = '<div class="alert alert-warning">Không thể tải hồ sơ.</div>';
        return;
      }

      profileData = data;
      renderProfile();
    } catch (err) {
      console.error('[Profile] Load error', err);
      refs.profileContent.innerHTML = '<div class="alert alert-danger">Lỗi kết nối.</div>';
    }
  }

  function renderProfile() {
    if (!profileData) return;
    const p = profileData;
    const isEditing = editMode;

    const infoField = (label, value, field, type) => {
      type = type || 'text';
      if (isEditing && field) {
        return '<div class="col-md-6 mb-3"><label class="form-label fw-bold">' + label + '</label>' +
          '<input type="' + type + '" class="form-control profile-field" data-field="' + field + '" value="' + escapeHtml(value || '') + '" /></div>';
      }
      return '<div class="col-md-6 mb-3"><label class="form-label fw-bold text-muted">' + label + '</label>' +
        '<div class="form-control-plaintext">' + escapeHtml(value || '—') + '</div></div>';
    };

    const readonlyField = (label, value) => {
      return '<div class="col-md-6 mb-3"><label class="form-label fw-bold text-muted">' + label + '</label>' +
        '<div class="form-control-plaintext">' + escapeHtml(value || '—') + '</div></div>';
    };

    let html = '<div class="row">' +
      '<div class="col-md-4">' +
        '<div class="card card-primary card-outline">' +
          '<div class="card-body box-profile text-center">' +
            '<div class="mb-3"><i class="bi bi-person-circle" style="font-size:80px;color:#007bff;"></i></div>' +
            '<h3 class="profile-username">' + escapeHtml(p.fullName || '') + '</h3>' +
            '<p class="text-muted">' + escapeHtml(p.studentCode || '') + '</p>' +
            '<ul class="list-group list-group-flush text-start">' +
              '<li class="list-group-item"><b>Email</b> <span class="float-end">' + escapeHtml(p.email || '—') + '</span></li>' +
              '<li class="list-group-item"><b>Trạng thái</b> <span class="float-end badge ' + (p.status === 'active' ? 'bg-success' : 'bg-secondary') + '">' + escapeHtml(p.status || '—') + '</span></li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="col-md-8">' +
        '<div class="card">' +
          '<div class="card-header d-flex justify-content-between align-items-center">' +
            '<h5 class="card-title mb-0"><i class="bi bi-person-lines-fill me-2"></i>Thông tin cá nhân</h5>' +
            (isEditing
              ? '<div><button class="btn btn-success btn-sm me-1" id="btnSaveProfile"><i class="bi bi-save me-1"></i>Lưu</button>' +
                '<button class="btn btn-secondary btn-sm" id="btnCancelProfile">Hủy</button></div>'
              : '<button class="btn btn-outline-primary btn-sm" id="btnEditProfile"><i class="bi bi-pencil me-1"></i>Chỉnh sửa</button>'
            ) +
          '</div>' +
          '<div class="card-body">' +
            '<div class="row">' +
              readonlyField('Mã sinh viên', p.studentCode) +
              infoField('Họ và tên', p.fullName, 'fullName') +
              infoField('Ngày sinh', p.dateOfBirth, 'dateOfBirth', 'date') +
              infoField('Giới tính', p.gender, 'gender') +
              infoField('Email', p.email, 'email', 'email') +
              infoField('CMND/CCCD', p.personalIdentificationNumber, 'personalIdentificationNumber') +
              infoField('Địa chỉ thường trú', p.address, 'address') +
              infoField('Địa chỉ hiện tại', p.currentAddress, 'currentAddress') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    refs.profileContent.innerHTML = html;

    // Bind edit/save/cancel
    document.getElementById('btnEditProfile')?.addEventListener('click', () => {
      editMode = true;
      renderProfile();
    });
    document.getElementById('btnCancelProfile')?.addEventListener('click', () => {
      editMode = false;
      renderProfile();
    });
    document.getElementById('btnSaveProfile')?.addEventListener('click', saveProfile);
  }

  async function saveProfile() {
    if (!profileData) return;
    const fields = document.querySelectorAll('.profile-field');
    const body = {};
    fields.forEach(f => { body[f.dataset.field] = f.value; });

    try {
      const { response } = await fetchJson(API_CONFIG.students + '/' + profileData.id, {
        method: 'PUT',
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      });

      if (response.ok) {
        editMode = false;
        await loadProfile();
      } else {
        alert('Lỗi cập nhật hồ sơ!');
      }
    } catch (err) {
      console.error('[Profile] Save error', err);
      alert('Lỗi kết nối!');
    }
  }

  return {
    bindEvents() { /* events bound dynamically in renderProfile */ },
    loadProfile() { 
      loadProfile(); 
    },
    showUnauthorizedState() {
      if (refs.profileContent) {
        refs.profileContent.innerHTML = '<div class="alert alert-danger">Không có quyền truy cập.</div>';
      }
    },
    resetLoggedOutState() {
      if (refs.profileContent) refs.profileContent.innerHTML = '';
    }
  };
}
