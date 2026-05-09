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

  function hasPermission(permCode) {
    const perms = state.authState && Array.isArray(state.authState.permissions) ? state.authState.permissions : [];
    return perms.some(p => p === permCode);
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
    return isSuperAdmin() || hasPermission('DEPARTMENT_VIEW');
  }

  function canManageMajors() {
    return isSuperAdmin() || hasPermission('MAJOR_VIEW');
  }

  function canManageTrainingPrograms() {
    return isSuperAdmin() || hasPermission('PROGRAM_VIEW');
  }

  function canManageUserRoles() {
    return isSuperAdmin() || hasPermission('ROLE_VIEW');
  }

  function canManageStudents() {
    return isSuperAdmin() || hasPermission('STUDENT_VIEW');
  }

  function canManageEmployees() {
    return isSuperAdmin() || hasPermission('LECTURER_VIEW');
  }

  function canManageCourseSections() {
    return isSuperAdmin() || hasPermission('CLASS_VIEW');
  }

  function canManageCourses() {
    return isSuperAdmin() || hasPermission('COURSE_VIEW');
  }

  function canManageSemesters() {
    return isSuperAdmin() || hasPermission('SEMESTER_VIEW');
  }

  function canManageGrades() {
    return isSuperAdmin() || hasPermission('GRADE_VIEW');
  }

  function canViewSchedule() {
    return isSuperAdmin() || hasPermission('SCHEDULE_VIEW');
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

    // ===== Sidebar visibility by permission =====

    // Students nav
    refs.navStudents.closest('li').classList.toggle('d-none', !canManageStudents());
    // Department / Major / Training Programs
    refs.navDepartments.closest('li').classList.toggle('d-none', !canManageDepartments());
    refs.navMajors.closest('li').classList.toggle('d-none', !canManageMajors());
    refs.navTrainingPrograms.closest('li').classList.toggle('d-none', !canManageTrainingPrograms());
    // Semesters
    if (refs.navSemesters) refs.navSemesters.closest('li').classList.toggle('d-none', !canManageSemesters());
    // Schedule (admin-only for now)
    const showAdminSchedule = isSuperAdmin() || (!lecturerOnly && hasPermission('SCHEDULE_VIEW'));
    refs.navSchedule.closest('li').classList.toggle('d-none', !showAdminSchedule);
    // Courses
    refs.navCourses.closest('li').classList.toggle('d-none', !canManageCourses());
    // User roles
    if (refs.navUserRoles) refs.navUserRoles.closest('li').classList.toggle('d-none', !canManageUserRoles());
    // Role permissions
    if (refs.navRolePermissions) refs.navRolePermissions.closest('li').classList.toggle('d-none', !isSuperAdmin());
    // Employees
    if (refs.navEmployees) refs.navEmployees.closest('li').classList.toggle('d-none', !canManageEmployees());
    // Course Sections
    const showAdminCourseSections = isSuperAdmin() || (!lecturerOnly && hasPermission('CLASS_VIEW'));
    if (refs.navCourseSections) refs.navCourseSections.closest('li').classList.toggle('d-none', !showAdminCourseSections);

    // Lecturer-only items
    if (refs.navLecturerSchedule) {
      const showLecturerSchedule = lecturerOnly && hasPermission('SCHEDULE_VIEW');
      refs.navLecturerSchedule.closest('li').classList.toggle('d-none', !showLecturerSchedule);
    }
    if (refs.navLecturerCourseSections) {
      const showLecturerCourseSections = lecturerOnly && hasPermission('CLASS_VIEW');
      refs.navLecturerCourseSections.closest('li').classList.toggle('d-none', !showLecturerCourseSections);
    }

    // Grades: visible to LECTURER, SUPER_ADMIN, STUDENT, or anyone with GRADE_VIEW
    if (refs.navGrades) refs.navGrades.closest('li').classList.toggle('d-none', !canManageGrades());

    // Profile: only for STUDENT
    if (refs.navProfile) refs.navProfile.closest('li').classList.toggle('d-none', !studentOnly);

    // Search / Add buttons
    refs.btnAdd.classList.toggle('d-none', !canManageStudents());
    refs.searchInput.disabled = !canManageStudents();
    refs.searchInput.value = !canManageStudents() ? '' : refs.searchInput.value;
    refs.searchInput.placeholder = studentOnly
      ? 'Sinh viên chỉ xem hồ sơ cá nhân'
      : (lecturerOnly ? '' : 'Tìm theo mã sinh viên / họ tên...');
    refs.btnAddDepartment.classList.toggle('d-none', !(isSuperAdmin() || hasPermission('DEPARTMENT_CREATE')));
    refs.btnAddMajor.classList.toggle('d-none', !(isSuperAdmin() || hasPermission('DEPARTMENT_CREATE')));
    refs.btnAddTrainingProgram.classList.toggle('d-none', !(isSuperAdmin() || hasPermission('DEPARTMENT_CREATE')));
    if (refs.btnAddEmployee) refs.btnAddEmployee.classList.toggle('d-none', !(isSuperAdmin() || hasPermission('LECTURER_CREATE')));
    if (refs.btnAddCourseSection) refs.btnAddCourseSection.classList.toggle('d-none', !(isSuperAdmin() || hasPermission('CLASS_CREATE')));
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
    canManageStudents,
    canManageEmployees,
    canManageCourseSections,
    canManageCourses,
    canManageSemesters,
    canManageGrades,
    canViewSchedule,
    clearLoginSuccess,
    getRoleHint,
    handleUnauthorized,
    hasPermission,
    hasRole,
    isLecturer,
    isLecturerOnly,
    isSuperAdmin,
    isStudentOnly,
    showLoginSuccess,
    updateAuthUI,
  };
}
