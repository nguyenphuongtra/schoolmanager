import { API_CONFIG } from '../core/config.js';
import { parseErrorMessage } from '../core/utils.js';
import { clearStoredAuth, writeStoredAuth } from '../services/storage.js';

export function createAuthFeature(context) {
  const { state, refs, onUnauthorizedReset, onAuthenticated, onLoggedOut } = context;

  function isStudentOnly() {
    const roles = state.authState && Array.isArray(state.authState.roles) ? state.authState.roles : [];
    return roles.length > 0 && roles.every(function (role) {
      return role === 'STUDENT';
    });
  }

  function hasRole(roleName) {
    const roles = state.authState && Array.isArray(state.authState.roles) ? state.authState.roles : [];
    return roles.some(r => r === roleName);
  }

  function isSuperAdmin() {
    return hasRole('SUPER_ADMIN');
  }

  function isLecturer() {
    return hasRole('LECTURER') || isSuperAdmin();
  }

  /**
   * Giảng viên thuần (có LECTURER nhưng KHÔNG có SUPER_ADMIN)
   */
  function isLecturerOnly() {
    return hasRole('LECTURER') && !hasRole('SUPER_ADMIN');
  }

  function canManageDepartments() {
    return isSuperAdmin();
  }

  function canManageMajors() {
    return isSuperAdmin();
  }

  function canManageTrainingPrograms() {
    return isSuperAdmin();
  }

  function canManageUserRoles() {
    return isSuperAdmin();
  }

  function setAuthState(data) {
    state.authState = data;
  }

  function showLoginError(message) {
    refs.loginError.textContent = message;
    refs.loginError.classList.remove('d-none');
  }

  function clearLoginError() {
    refs.loginError.classList.add('d-none');
    refs.loginError.textContent = '';
  }

  function showLoginSuccess(message) {
    refs.loginSuccess.textContent = message;
    refs.loginSuccess.classList.remove('d-none');
  }

  function clearLoginSuccess() {
    refs.loginSuccess.classList.add('d-none');
    refs.loginSuccess.textContent = '';
  }

  function setLoginLoading(loading) {
    refs.loginButton.disabled = loading;
    refs.loginButton.querySelector('.login-button-text').textContent = loading ? 'Đang xác thực...' : 'Đăng nhập';
  }

  function getRoleHint() {
    if (!state.authState || !state.authState.token) {
      return '';
    }

    if (isStudentOnly()) {
      return 'Chế độ sinh viên: chỉ xem hồ sơ của bạn.';
    }

    if (isLecturerOnly()) {
      if (state.activeModule === 'lecturerSchedule') {
        return 'Lịch giảng dạy cá nhân của bạn.';
      }
      if (state.activeModule === 'lecturerCourseSections') {
        return 'Danh sách lớp học phần bạn đang phụ trách.';
      }
      if (state.activeModule === 'grades') {
        return 'Nhập và quản lý điểm cho lớp HP phụ trách.';
      }
      return 'Chế độ giảng viên.';
    }

    if (state.activeModule === 'departments') {
      return 'Chế độ quản trị: có thể tìm kiếm và quản lý khoa/phòng ban.';
    }

    if (state.activeModule === 'majors') {
      return 'Chế độ quản trị: có thể tìm kiếm và quản lý ngành học.';
    }

    if (state.activeModule === 'trainingPrograms') {
      return 'Chế độ quản trị: có thể tìm kiếm và quản lý chương trình đào tạo.';
    }

    if (state.activeModule === 'employees') {
      return 'Chế độ quản trị: quản lý danh sách giảng viên / nhân viên.';
    }

    if (state.activeModule === 'grades') {
      if (isStudentOnly()) return 'Xem bảng điểm cá nhân.';
      return 'Chế độ quản lý điểm: nhập và xem điểm theo lớp học phần.';
    }

    if (state.activeModule === 'profile') {
      return 'Xem và cập nhật hồ sơ cá nhân.';
    }

    if (state.activeModule === 'courseSections') {
      return 'Chế độ quản trị: quản lý lớp học phần.';
    }

    if (state.activeModule === 'lecturerSchedule') {
      return 'Lịch giảng dạy cá nhân.';
    }

    if (state.activeModule === 'lecturerCourseSections') {
      return 'Danh sách lớp HP phụ trách.';
    }

    return 'Chế độ quản trị: có thể tìm kiếm và quản lý danh sách sinh viên.';
  }

  function updateAuthUI() {
    const isAuthenticated = Boolean(state.authState && state.authState.token);

    document.body.classList.toggle('login-active', !isAuthenticated);
    refs.loginView.classList.toggle('d-none', isAuthenticated);
    refs.appWrapper.classList.toggle('app-hidden', !isAuthenticated);

    if (!isAuthenticated) {
      refs.currentUserName.textContent = 'Chưa đăng nhập';
      refs.currentUserRoles.textContent = 'Không có quyền';
      refs.roleViewHint.textContent = '';
      return;
    }

    refs.currentUserName.textContent = state.authState.fullName || state.authState.username || 'Người dùng';
    refs.currentUserRoles.textContent = (state.authState.roles || []).join(', ') || 'Không có role';
    refs.roleViewHint.textContent = getRoleHint();

    const lecturerOnly = isLecturerOnly();
    const studentOnly = isStudentOnly();

    // ===== Sidebar visibility by role =====

    // Admin-only items: hidden for LECTURER_ONLY and STUDENT
    refs.navStudents.closest('li').classList.toggle('d-none', lecturerOnly || studentOnly);
    refs.navDepartments.classList.toggle('d-none', !canManageDepartments());
    refs.navMajors.classList.toggle('d-none', !canManageMajors());
    refs.navTrainingPrograms.classList.toggle('d-none', !canManageTrainingPrograms());
    if (refs.navSemesters) refs.navSemesters.classList.toggle('d-none', lecturerOnly || studentOnly);
    refs.navSchedule.closest('li').classList.toggle('d-none', lecturerOnly);
    refs.navCourses.closest('li').classList.toggle('d-none', lecturerOnly || studentOnly);
    if (refs.navUserRoles) refs.navUserRoles.classList.toggle('d-none', !canManageUserRoles());
    if (refs.navEmployees) refs.navEmployees.classList.toggle('d-none', lecturerOnly || studentOnly);
    if (refs.navCourseSections) refs.navCourseSections.classList.toggle('d-none', lecturerOnly || studentOnly);

    // Lecturer-only items
    if (refs.navLecturerSchedule) {
      refs.navLecturerSchedule.closest('li').classList.toggle('d-none', !lecturerOnly);
    }
    if (refs.navLecturerCourseSections) {
      refs.navLecturerCourseSections.closest('li').classList.toggle('d-none', !lecturerOnly);
    }

    // Grades: visible to LECTURER (only + admin) and STUDENT
    if (refs.navGrades) refs.navGrades.classList.toggle('d-none', studentOnly && !lecturerOnly && !isSuperAdmin() ? true : false);
    // Actually grades should be visible to LECTURER, SUPER_ADMIN and STUDENT
    if (refs.navGrades) refs.navGrades.classList.toggle('d-none', false);

    // Profile: only for STUDENT
    if (refs.navProfile) refs.navProfile.classList.toggle('d-none', !studentOnly);

    // Search / Add buttons
    refs.btnAdd.classList.toggle('d-none', lecturerOnly || studentOnly);
    refs.searchInput.disabled = lecturerOnly || studentOnly;
    refs.searchInput.value = (lecturerOnly || studentOnly) ? '' : refs.searchInput.value;
    refs.searchInput.placeholder = studentOnly
      ? 'Sinh viên chỉ xem hồ sơ cá nhân'
      : (lecturerOnly ? '' : 'Tìm theo mã sinh viên / họ tên...');
    refs.btnAddDepartment.classList.toggle('d-none', !canManageDepartments());
    refs.btnAddMajor.classList.toggle('d-none', !canManageMajors());
    refs.btnAddTrainingProgram.classList.toggle('d-none', !canManageTrainingPrograms());
    if (refs.btnAddEmployee) refs.btnAddEmployee.classList.toggle('d-none', lecturerOnly || studentOnly);
    if (refs.btnAddCourseSection) refs.btnAddCourseSection.classList.toggle('d-none', lecturerOnly || studentOnly);
    refs.departmentSearchInput.disabled = !canManageDepartments();
    refs.majorSearchInput.disabled = !canManageMajors();
    refs.trainingProgramSearchInput.disabled = !canManageTrainingPrograms();
  }

  function persistAuth(data) {
    setAuthState(data);
    writeStoredAuth(data);
    updateAuthUI();
  }

  function resetAuth() {
    setAuthState(null);
    clearStoredAuth();
    updateAuthUI();
  }

  function handleUnauthorized(message) {
    resetAuth();
    onUnauthorizedReset();
    showLoginError(message || 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }

  async function submitLogin(event) {
    event.preventDefault();
    clearLoginError();
    clearLoginSuccess();
    setLoginLoading(true);

    try {
      const response = await fetch(API_CONFIG.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: refs.usernameInput.value.trim(),
          password: refs.passwordInput.value,
        }),
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response, 'Đăng nhập thất bại.');
        throw new Error(message);
      }

      const data = await response.json();
      persistAuth(data);
      clearLoginError();
      showLoginSuccess('Đăng nhập thành công.');
      refs.passwordInput.value = '';
      onAuthenticated();
    } catch (error) {
      showLoginError(error.message || 'Không thể kết nối tới API đăng nhập.');
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    resetAuth();
    onLoggedOut();
  }

  function bindEvents() {
    refs.loginForm.addEventListener('submit', submitLogin);
    refs.btnLogout.addEventListener('click', logout);
  }

  return {
    bindEvents,
    canManageDepartments,
    canManageMajors,
    canManageTrainingPrograms,
    canManageUserRoles,
    clearLoginSuccess,
    getRoleHint,
    handleUnauthorized,
    hasRole,
    isLecturer,
    isLecturerOnly,
    isSuperAdmin,
    isStudentOnly,
    showLoginSuccess,
    updateAuthUI,
  };
}
