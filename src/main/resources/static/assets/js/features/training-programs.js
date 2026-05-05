import { API_CONFIG, PAGE_SIZE } from '../core/config.js';
import { escapeHtml, highlightText, parseResponse } from '../core/utils.js';
import { buildAuthHeaders } from '../services/http.js';

function formatDecimal(value) {
  return value === null || value === undefined || value === '' ? '' : String(value);
}

function parseDecimalOrNull(value) {
  if (value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntegerOrNull(value) {
  if (value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function createTrainingProgramsFeature(context) {
  const { state, refs, auth, departments, showError, clearError } = context;

  function renderPagination() {
    const paginationState = state.pagination.trainingPrograms;
    if (paginationState.totalPages <= 1) {
      refs.trainingProgramPagination.innerHTML = '';
      return;
    }

    let html = '';
    html += '<li class="page-item ' + (paginationState.page === 0 ? 'disabled' : '') + '">';
    html += '<a class="page-link" href="#" data-page="' + (paginationState.page - 1) + '">&laquo;</a></li>';

    for (let index = 0; index < paginationState.totalPages; index += 1) {
      html += '<li class="page-item ' + (index === paginationState.page ? 'active' : '') + '">';
      html += '<a class="page-link" href="#" data-page="' + index + '">' + (index + 1) + '</a></li>';
    }

    html += '<li class="page-item ' + (paginationState.page === paginationState.totalPages - 1 ? 'disabled' : '') + '">';
    html += '<a class="page-link" href="#" data-page="' + (paginationState.page + 1) + '">&raquo;</a></li>';
    refs.trainingProgramPagination.innerHTML = html;
  }

  function renderTrainingPrograms(programs) {
    const term = refs.trainingProgramSearchInput.value.trim();
    const paginationState = state.pagination.trainingPrograms;

    if (!programs.length) {
      refs.trainingProgramTableBody.innerHTML =
        '<tr><td colspan="8" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
    } else {
      refs.trainingProgramTableBody.innerHTML = programs
        .map(function (program) {
          return (
            '<tr>' +
              '<td>' + highlightText(program.code || '', term) + '</td>' +
              '<td>' + highlightText(program.name || '', term) + '</td>' +
              '<td>' + escapeHtml(program.majorName || '') + '</td>' +
              '<td>' + escapeHtml(program.departmentName || '') + '</td>' +
              '<td>' + escapeHtml(String(program.admissionYear || '')) + '</td>' +
              '<td>' + escapeHtml(formatDecimal(program.totalCredits)) + '</td>' +
              '<td>' + escapeHtml(program.status || '') + '</td>' +
              '<td class="text-end">' +
                '<button class="btn btn-sm btn-outline-secondary me-1" data-id="' + escapeHtml(String(program.id)) + '" data-action="edit">' +
                  '<i class="bi bi-pencil"></i>' +
                '</button>' +
                '<button class="btn btn-sm btn-outline-danger" data-id="' + escapeHtml(String(program.id)) + '" data-action="delete">' +
                  '<i class="bi bi-trash"></i>' +
                '</button>' +
              '</td>' +
            '</tr>'
          );
        })
        .join('');
    }

    const from = paginationState.totalElements === 0 ? 0 : paginationState.page * PAGE_SIZE + 1;
    const to = Math.min((paginationState.page + 1) * PAGE_SIZE, paginationState.totalElements);
    refs.trainingProgramPaginationInfo.textContent =
      'Hiển thị ' + from + '–' + to + ' trên tổng ' + paginationState.totalElements + ' chương trình đào tạo';
    renderPagination();
  }

  function resetForm() {
    refs.trainingProgramIdInput.value = '';
    refs.trainingProgramDepartmentIdInput.value = '';
    refs.trainingProgramMajorIdInput.value = '';
    refs.trainingProgramCodeInput.value = '';
    refs.trainingProgramNameInput.value = '';
    refs.trainingProgramNameEnInput.value = '';
    refs.trainingProgramDegreeLevelInput.value = '';
    refs.trainingProgramEducationTypeInput.value = '';
    refs.trainingProgramTotalCreditsInput.value = '';
    refs.trainingProgramRequiredCreditsInput.value = '';
    refs.trainingProgramElectiveCreditsInput.value = '';
    refs.trainingProgramInternshipCreditsInput.value = '';
    refs.trainingProgramThesisCreditsInput.value = '';
    refs.trainingProgramAdmissionYearInput.value = '';
    refs.trainingProgramDurationYearsInput.value = '';
    refs.trainingProgramMaxDurationYearsInput.value = '';
    refs.trainingProgramEffectiveDateInput.value = '';
    refs.trainingProgramExpiryDateInput.value = '';
    refs.trainingProgramVersionInput.value = '';
    refs.trainingProgramStatusInput.value = 'ACTIVE';
    refs.trainingProgramDescriptionInput.value = '';
    refs.trainingProgramObjectivesInput.value = '';
    refs.trainingProgramLearningOutcomesInput.value = '';
  }

  async function openCreateModal() {
    if (!refs.trainingProgramModal) {
      return;
    }

    await departments.ensureDepartmentOptions();
    resetForm();
    refs.trainingProgramModalTitle.textContent = 'Thêm chương trình đào tạo';
    refs.btnSaveTrainingProgram.dataset.mode = 'create';
    refs.trainingProgramModal.show();
  }

  async function loadTrainingPrograms() {
    clearError();
    refs.trainingProgramTableBody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted py-3">Đang tải...</td></tr>';

    const keyword = encodeURIComponent(refs.trainingProgramSearchInput.value.trim() || '');
    const currentPage = state.pagination.trainingPrograms.page;
    const searchUrl = API_CONFIG.trainingPrograms + '/search?keyword=' + keyword + '&page=' + currentPage + '&size=' + PAGE_SIZE;
    const baseUrl = API_CONFIG.trainingPrograms;

    try {
      const response = await fetch(searchUrl, { headers: buildAuthHeaders(state.authState) });
      let data;

      if (response.status === 404) {
        const fallbackResponse = await fetch(baseUrl, { headers: buildAuthHeaders(state.authState) });
        if (fallbackResponse.status === 401) {
          auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
        if (!fallbackResponse.ok) {
          throw new Error('HTTP ' + fallbackResponse.status + ' – ' + fallbackResponse.statusText + ' (' + baseUrl + ')');
        }
        data = await fallbackResponse.json();
      } else if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      } else if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' – ' + response.statusText + ' (' + searchUrl + ')');
      } else {
        data = await response.json();
      }

      const parsed = parseResponse(data);
      state.pagination.trainingPrograms.totalPages = parsed.totalPages;
      state.pagination.trainingPrograms.totalElements = parsed.totalElements;
      renderTrainingPrograms(parsed.items);
    } catch (error) {
      showError(error.message);
      refs.trainingProgramTableBody.innerHTML =
        '<tr><td colspan="8" class="text-center text-danger py-3"><i class="bi bi-exclamation-triangle me-1"></i>Không thể tải dữ liệu</td></tr>';
    }
  }

  async function saveTrainingProgram() {
    const mode = refs.btnSaveTrainingProgram.dataset.mode;
    const departmentId = refs.trainingProgramDepartmentIdInput.value.trim();
    const code = refs.trainingProgramCodeInput.value.trim();
    const name = refs.trainingProgramNameInput.value.trim();

    if (!departmentId || !code || !name) {
      alert('Vui lòng chọn khoa và nhập đầy đủ mã, tên chương trình.');
      return;
    }

    const isUpdate = mode === 'update';
    const url = isUpdate ? API_CONFIG.trainingPrograms + '/' + refs.trainingProgramIdInput.value : API_CONFIG.trainingPrograms;
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: buildAuthHeaders(state.authState, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          departmentId: departmentId,
          majorId: refs.trainingProgramMajorIdInput.value.trim() || null,
          code: code,
          name: name,
          nameEn: refs.trainingProgramNameEnInput.value.trim() || null,
          degreeLevel: refs.trainingProgramDegreeLevelInput.value.trim() || null,
          educationType: refs.trainingProgramEducationTypeInput.value.trim() || null,
          totalCredits: parseDecimalOrNull(refs.trainingProgramTotalCreditsInput.value.trim()),
          requiredCredits: parseDecimalOrNull(refs.trainingProgramRequiredCreditsInput.value.trim()),
          electiveCredits: parseDecimalOrNull(refs.trainingProgramElectiveCreditsInput.value.trim()),
          internshipCredits: parseDecimalOrNull(refs.trainingProgramInternshipCreditsInput.value.trim()),
          thesisCredits: parseDecimalOrNull(refs.trainingProgramThesisCreditsInput.value.trim()),
          admissionYear: refs.trainingProgramAdmissionYearInput.value || null,
          durationYears: parseDecimalOrNull(refs.trainingProgramDurationYearsInput.value.trim()),
          maxDurationYears: parseDecimalOrNull(refs.trainingProgramMaxDurationYearsInput.value.trim()),
          effectiveDate: refs.trainingProgramEffectiveDateInput.value || null,
          expiryDate: refs.trainingProgramExpiryDateInput.value || null,
          version: refs.trainingProgramVersionInput.value.trim() || null,
          status: refs.trainingProgramStatusInput.value.trim() || 'ACTIVE',
          description: refs.trainingProgramDescriptionInput.value.trim() || null,
          objectives: refs.trainingProgramObjectivesInput.value.trim() || null,
          learningOutcomes: refs.trainingProgramLearningOutcomesInput.value.trim() || null,
          isActive: true,
        }),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
      }

      if (refs.trainingProgramModal) {
        refs.trainingProgramModal.hide();
      }
      await loadTrainingPrograms();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu chương trình đào tạo:\n' + error.message);
    }
  }

  async function deleteTrainingProgram(id) {
    try {
      const response = await fetch(API_CONFIG.trainingPrograms + '/' + id, {
        method: 'DELETE',
        headers: buildAuthHeaders(state.authState),
      });

      if (response.status === 401) {
        auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('HTTP ' + response.status + ': ' + errorText);
      }

      if (state.pagination.trainingPrograms.page > 0) {
        state.pagination.trainingPrograms.page -= 1;
      }
      await loadTrainingPrograms();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa chương trình đào tạo:\n' + error.message);
    }
  }

  function bindEvents() {
    refs.btnAddTrainingProgram.addEventListener('click', openCreateModal);
    refs.btnSaveTrainingProgram.addEventListener('click', saveTrainingProgram);

    refs.trainingProgramPagination.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A') {
        return;
      }

      event.preventDefault();
      const page = Number(event.target.getAttribute('data-page'));
      const totalPages = state.pagination.trainingPrograms.totalPages;
      if (Number.isNaN(page) || page === state.pagination.trainingPrograms.page || page < 0 || page >= totalPages) {
        return;
      }

      state.pagination.trainingPrograms.page = page;
      loadTrainingPrograms();
    });

    refs.trainingProgramSearchInput.addEventListener('input', function () {
      state.pagination.trainingPrograms.page = 0;
      loadTrainingPrograms();
    });

    refs.trainingProgramTableBody.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action]');
      if (!button) {
        return;
      }

      const id = button.getAttribute('data-id');
      const action = button.getAttribute('data-action');

      if (action === 'edit') {
        fetch(API_CONFIG.trainingPrograms + '/' + id, { headers: buildAuthHeaders(state.authState) })
          .then(async function (response) {
            if (response.status === 401) {
              auth.handleUnauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
              throw new Error('Unauthorized');
            }
            if (!response.ok) {
              throw new Error('HTTP ' + response.status);
            }
            await departments.ensureDepartmentOptions();
            return response.json();
          })
          .then(function (program) {
            if (!refs.trainingProgramModal) {
              return;
            }

            refs.trainingProgramIdInput.value = program.id || '';
            refs.trainingProgramDepartmentIdInput.value = program.departmentId || '';
            refs.trainingProgramMajorIdInput.value = program.majorId || '';
            refs.trainingProgramCodeInput.value = program.code || '';
            refs.trainingProgramNameInput.value = program.name || '';
            refs.trainingProgramNameEnInput.value = program.nameEn || '';
            refs.trainingProgramDegreeLevelInput.value = program.degreeLevel || '';
            refs.trainingProgramEducationTypeInput.value = program.educationType || '';
            refs.trainingProgramTotalCreditsInput.value = formatDecimal(program.totalCredits);
            refs.trainingProgramRequiredCreditsInput.value = formatDecimal(program.requiredCredits);
            refs.trainingProgramElectiveCreditsInput.value = formatDecimal(program.electiveCredits);
            refs.trainingProgramInternshipCreditsInput.value = formatDecimal(program.internshipCredits);
            refs.trainingProgramThesisCreditsInput.value = formatDecimal(program.thesisCredits);
            refs.trainingProgramAdmissionYearInput.value = program.admissionYear || '';
            refs.trainingProgramDurationYearsInput.value = formatDecimal(program.durationYears);
            refs.trainingProgramMaxDurationYearsInput.value = formatDecimal(program.maxDurationYears);
            refs.trainingProgramEffectiveDateInput.value = program.effectiveDate || '';
            refs.trainingProgramExpiryDateInput.value = program.expiryDate || '';
            refs.trainingProgramVersionInput.value = program.version || '';
            refs.trainingProgramStatusInput.value = program.status || 'ACTIVE';
            refs.trainingProgramDescriptionInput.value = program.description || '';
            refs.trainingProgramObjectivesInput.value = program.objectives || '';
            refs.trainingProgramLearningOutcomesInput.value = program.learningOutcomes || '';
            refs.trainingProgramModalTitle.textContent = 'Cập nhật chương trình đào tạo';
            refs.btnSaveTrainingProgram.dataset.mode = 'update';
            refs.trainingProgramModal.show();
          })
          .catch(function (error) {
            alert('Không tải được thông tin chương trình đào tạo: ' + error.message);
          });
      }

      if (action === 'delete' && confirm('Bạn có chắc chắn muốn xóa chương trình đào tạo này?')) {
        deleteTrainingProgram(id);
      }
    });
  }

  function resetLoggedOutState() {
    refs.trainingProgramTableBody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted py-3">Đăng nhập để tải dữ liệu chương trình đào tạo</td></tr>';
    refs.trainingProgramPagination.innerHTML = '';
    refs.trainingProgramPaginationInfo.textContent = '';
  }

  function showUnauthorizedState() {
    refs.trainingProgramTableBody.innerHTML =
      '<tr><td colspan="8" class="text-center text-danger py-3"><i class="bi bi-lock me-1"></i>Phiên đăng nhập đã hết hạn</td></tr>';
    refs.trainingProgramPagination.innerHTML = '';
    refs.trainingProgramPaginationInfo.textContent = '';
  }

  return {
    bindEvents,
    loadTrainingPrograms,
    resetLoggedOutState,
    showUnauthorizedState,
  };
}
