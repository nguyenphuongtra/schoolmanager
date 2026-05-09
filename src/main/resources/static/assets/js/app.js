import { createDomRefs } from './core/dom.js';
import { createState } from './core/state.js';
import { readStoredAuth } from './services/storage.js';
import { createAuthFeature } from './features/auth.js';
import { createStudentsFeature } from './features/students.js';
import { createDepartmentsFeature } from './features/departments.js';
import { createMajorsFeature } from './features/majors.js';
import { createTrainingProgramsFeature } from './features/training-programs.js';
import { createSemestersFeature } from './features/semesters.js';
import { createScheduleFeature } from './features/schedule.js';
import { createCoursesFeature } from './features/courses.js';
import { createUserRolesFeature } from './features/user-roles.js';
import { createRolePermissionsFeature } from './features/role-permissions.js';
import { createEmployeesFeature } from './features/employees.js';
import { createGradesFeature } from './features/grades.js';
import { createProfileFeature } from './features/profile.js';
import { createCourseSectionsFeature } from './features/course-sections.js';
import { createLecturerScheduleFeature } from './features/lecturer-schedule.js';
import { createLecturerCourseSectionsFeature } from './features/lecturer-course-sections.js';

document.addEventListener('DOMContentLoaded', function () {
  const refs = createDomRefs();
  const state = createState(readStoredAuth());
  let adminLteLoaded = false;

  function loadAdminLteScript() {
    if (adminLteLoaded) {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      const existingScript = document.querySelector('script[data-adminlte-runtime="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = '/adminlte/js/adminlte.js';
      script.dataset.adminlteRuntime = 'true';
      script.onload = function () {
        adminLteLoaded = true;
        resolve();
      };
      script.onerror = function () {
        reject(new Error('Không thể tải AdminLTE script.'));
      };
      document.body.appendChild(script);
    });
  }

  function showError(message) {
    refs.apiDebugMsg.textContent = message;
    refs.apiDebugBanner.classList.remove('d-none');
    console.error('[API Error]', message);
  }

  function clearError() {
    refs.apiDebugBanner.classList.add('d-none');
    refs.apiDebugMsg.textContent = '';
  }

  function clearDataTablesForUnauthorized() {
    students.showUnauthorizedState();
    departments.showUnauthorizedState();
    majors.showUnauthorizedState();
    trainingPrograms.showUnauthorizedState();
    semesters.showUnauthorizedState();
    schedule.showUnauthorizedState();
    courses.showUnauthorizedState();
    userRoles.showUnauthorizedState();
    if (typeof rolePermissions !== 'undefined') rolePermissions.showUnauthorizedState();
    if (typeof employees !== 'undefined') employees.showUnauthorizedState();
    if (typeof grades !== 'undefined') grades.showUnauthorizedState();
    if (typeof profile !== 'undefined') profile.showUnauthorizedState();
    if (typeof courseSections !== 'undefined') courseSections.showUnauthorizedState();
    if (typeof lecturerSchedule !== 'undefined') lecturerSchedule.showUnauthorizedState();
    if (typeof lecturerCourseSections !== 'undefined') lecturerCourseSections.showUnauthorizedState();
  }

  function resetDataViews() {
    clearError();
    state.departmentOptions = [];
    state.majorOptions = [];
    state.pagination.students = { page: 0, totalPages: 0, totalElements: 0 };
    state.pagination.departments = { page: 0, totalPages: 0, totalElements: 0 };
    state.pagination.majors = { page: 0, totalPages: 0, totalElements: 0 };
    state.pagination.trainingPrograms = { page: 0, totalPages: 0, totalElements: 0 };
    state.pagination.semesters = { page: 0, totalPages: 0, totalElements: 0 };
    state.pagination.employees = { page: 0, totalPages: 0, totalElements: 0 };
    state.pagination.courseSections = { page: 0, totalPages: 0, totalElements: 0 };
    students.resetLoggedOutState();
    departments.resetLoggedOutState();
    majors.resetLoggedOutState();
    trainingPrograms.resetLoggedOutState();
    semesters.resetLoggedOutState();
    schedule.resetLoggedOutState();
    courses.resetLoggedOutState();
    userRoles.resetLoggedOutState();
    if (typeof rolePermissions !== 'undefined') rolePermissions.resetLoggedOutState && rolePermissions.resetLoggedOutState();
    if (typeof employees !== 'undefined') employees.resetLoggedOutState();
    if (typeof grades !== 'undefined') grades.resetLoggedOutState();
    if (typeof profile !== 'undefined') profile.resetLoggedOutState();
    if (typeof courseSections !== 'undefined') courseSections.resetLoggedOutState();
    if (typeof lecturerSchedule !== 'undefined') lecturerSchedule.resetLoggedOutState();
    if (typeof lecturerCourseSections !== 'undefined') lecturerCourseSections.resetLoggedOutState();
  }

  const auth = createAuthFeature({
    state,
    refs,
    onUnauthorizedReset: clearDataTablesForUnauthorized,
    onAuthenticated: function () {
      state.pagination.students.page = 0;
      state.pagination.departments.page = 0;
      state.pagination.majors.page = 0;
      state.pagination.trainingPrograms.page = 0;
      state.pagination.semesters.page = 0;
      state.pagination.employees.page = 0;
      state.pagination.courseSections.page = 0;
      if (auth.isStudentOnly()) {
        state.activeModule = 'profile';
      } else if (auth.isLecturerOnly()) {
        state.activeModule = 'lecturerSchedule';
      } else if (state.activeModule === 'profile' && !auth.isStudentOnly()) {
        state.activeModule = 'students';
      }
      syncModuleUI();
      auth.clearLoginSuccess();
      loadAdminLteScript()
        .catch(function (error) {
          console.error(error);
        })
        .finally(loadActiveModule);
    },
    onLoggedOut: function () {
      resetDataViews();
    },
  });

  const students = createStudentsFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const departments = createDepartmentsFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const majors = createMajorsFeature({
    state,
    refs,
    auth,
    departments,
    showError,
    clearError,
  });

  const trainingPrograms = createTrainingProgramsFeature({
    state,
    refs,
    auth,
    departments,
    showError,
    clearError,
  });

  const semesters = createSemestersFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const schedule = createScheduleFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const courses = createCoursesFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const userRoles = createUserRolesFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const rolePermissions = createRolePermissionsFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const employees = createEmployeesFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const grades = createGradesFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const profile = createProfileFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const courseSections = createCourseSectionsFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const lecturerSchedule = createLecturerScheduleFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  const lecturerCourseSections = createLecturerCourseSectionsFeature({
    state,
    refs,
    auth,
    showError,
    clearError,
  });

  function syncModuleUI() {
    const isDepartments = state.activeModule === 'departments';
    const isMajors = state.activeModule === 'majors';
    const isTrainingPrograms = state.activeModule === 'trainingPrograms';
    const isSemesters = state.activeModule === 'semesters';
    const isSchedule = state.activeModule === 'schedule';
    const isCourses = state.activeModule === 'courses';
    const isUserRoles = state.activeModule === 'userRoles';
    const isRolePermissions = state.activeModule === 'rolePermissions';
    const isEmployees = state.activeModule === 'employees';
    const isGrades = state.activeModule === 'grades';
    const isProfile = state.activeModule === 'profile';
    const isCourseSections = state.activeModule === 'courseSections';
    const isLecturerSchedule = state.activeModule === 'lecturerSchedule';
    const isLecturerCourseSections = state.activeModule === 'lecturerCourseSections';

    const isNotStudents = isDepartments || isMajors || isTrainingPrograms || isSemesters || isSchedule || isCourses || isUserRoles || isRolePermissions || isEmployees || isGrades || isProfile || isCourseSections || isLecturerSchedule || isLecturerCourseSections;
    refs.studentsSection.classList.toggle('d-none', isNotStudents);
    refs.departmentsSection.classList.toggle('d-none', !isDepartments);
    refs.majorsSection.classList.toggle('d-none', !isMajors);
    refs.trainingProgramsSection.classList.toggle('d-none', !isTrainingPrograms);
    refs.semestersSection.classList.toggle('d-none', !isSemesters);
    refs.scheduleSection.classList.toggle('d-none', !isSchedule);
    refs.coursesSection.classList.toggle('d-none', !isCourses);
    refs.userRolesSection.classList.toggle('d-none', !isUserRoles);
    if (refs.rolePermissionsSection) refs.rolePermissionsSection.classList.toggle('d-none', !isRolePermissions);
    if (refs.employeesSection) refs.employeesSection.classList.toggle('d-none', !isEmployees);
    if (refs.gradesSection) refs.gradesSection.classList.toggle('d-none', !isGrades);
    if (refs.profileSection) refs.profileSection.classList.toggle('d-none', !isProfile);
    if (refs.courseSectionsSection) refs.courseSectionsSection.classList.toggle('d-none', !isCourseSections);
    if (refs.lecturerScheduleSection) refs.lecturerScheduleSection.classList.toggle('d-none', !isLecturerSchedule);
    if (refs.lecturerCourseSectionsSection) refs.lecturerCourseSectionsSection.classList.toggle('d-none', !isLecturerCourseSections);

    refs.navStudents.classList.toggle('active', !isNotStudents);
    refs.navDepartments.classList.toggle('active', isDepartments);
    refs.navMajors.classList.toggle('active', isMajors);
    refs.navTrainingPrograms.classList.toggle('active', isTrainingPrograms);
    refs.navSemesters.classList.toggle('active', isSemesters);
    refs.navSchedule.classList.toggle('active', isSchedule);
    refs.navCourses.classList.toggle('active', isCourses);
    if (refs.navUserRoles) refs.navUserRoles.classList.toggle('active', isUserRoles);
    if (refs.navRolePermissions) refs.navRolePermissions.classList.toggle('active', isRolePermissions);
    if (refs.navEmployees) refs.navEmployees.classList.toggle('active', isEmployees);
    if (refs.navGrades) refs.navGrades.classList.toggle('active', isGrades);
    if (refs.navProfile) refs.navProfile.classList.toggle('active', isProfile);
    if (refs.navCourseSections) refs.navCourseSections.classList.toggle('active', isCourseSections);
    if (refs.navLecturerSchedule) refs.navLecturerSchedule.classList.toggle('active', isLecturerSchedule);
    if (refs.navLecturerCourseSections) refs.navLecturerCourseSections.classList.toggle('active', isLecturerCourseSections);

    const MODULE_TITLES = {
      departments: 'Quản lý khoa/phòng ban',
      majors: 'Quản lý ngành học',
      trainingPrograms: 'Quản lý chương trình đào tạo',
      semesters: 'Quản lý học kỳ',
      schedule: 'Lịch học tuần',
      courses: 'Danh sách môn học',
      userRoles: 'Phân quyền người dùng',
      rolePermissions: 'Thiết lập quyền',
      employees: 'Giảng viên',
      grades: 'Quản lý Điểm số',
      profile: 'Hồ sơ Sinh viên',
      courseSections: 'Lớp học phần',
      lecturerSchedule: 'Lịch giảng dạy',
      lecturerCourseSections: 'Lớp HP phụ trách',
    };
    const MODULE_BREADCRUMBS = {
      departments: 'Departments',
      majors: 'Majors',
      trainingPrograms: 'Training Programs',
      semesters: 'Semesters',
      schedule: 'Schedule',
      courses: 'Courses',
      userRoles: 'User Roles',
      rolePermissions: 'Role Permissions',
      employees: 'Employees',
      grades: 'Grades',
      profile: 'Profile',
      courseSections: 'Course Sections',
      lecturerSchedule: 'Teaching Schedule',
      lecturerCourseSections: 'My Course Sections',
    };
    refs.pageTitle.textContent = MODULE_TITLES[state.activeModule] || 'Quản lý sinh viên';
    refs.pageBreadcrumb.textContent = MODULE_BREADCRUMBS[state.activeModule] || 'Students';
    refs.roleViewHint.textContent = auth.getRoleHint();
    auth.updateAuthUI();
  }

  function loadActiveModule() {
    if (!state.authState || !state.authState.token) {
      return;
    }

    if (state.activeModule === 'departments' && auth.canManageDepartments()) {
      departments.loadDepartments();
      return;
    }

    if (state.activeModule === 'majors' && auth.canManageMajors()) {
      majors.loadMajors();
      return;
    }

    if (state.activeModule === 'trainingPrograms' && auth.canManageTrainingPrograms()) {
      trainingPrograms.loadTrainingPrograms();
      return;
    }

    if (state.activeModule === 'semesters') {
      semesters.loadSemesters();
      return;
    }

    if (state.activeModule === 'schedule' && auth.canViewSchedule()) {
      schedule.loadSchedule();
      return;
    }

    if (state.activeModule === 'courses' && auth.canManageCourses()) {
      courses.loadCourses();
      return;
    }

    if (state.activeModule === 'userRoles' && auth.canManageUserRoles()) {
      userRoles.loadUsers();
      return;
    }

    if (state.activeModule === 'rolePermissions' && auth.isSuperAdmin()) {
      rolePermissions.loadInitialData();
      return;
    }

    if (state.activeModule === 'employees' && auth.canManageEmployees()) {
      employees.loadEmployees();
      return;
    }

    if (state.activeModule === 'grades' && auth.canManageGrades()) {
      grades.loadGrades();
      return;
    }

    if (state.activeModule === 'profile' && auth.isStudentOnly()) {
      profile.loadProfile();
      return;
    }

    if (state.activeModule === 'courseSections' && auth.canManageCourseSections()) {
      courseSections.loadCourseSections();
      return;
    }

    if (state.activeModule === 'lecturerSchedule' && (auth.isLecturerOnly() || auth.isSuperAdmin())) {
      lecturerSchedule.loadSchedule();
      return;
    }

    if (state.activeModule === 'lecturerCourseSections' && (auth.isLecturerOnly() || auth.isSuperAdmin())) {
      lecturerCourseSections.loadCourseSections();
      return;
    }

    // Fallback by role
    if (auth.isStudentOnly()) {
      state.activeModule = 'profile';
      syncModuleUI();
      profile.loadProfile();
      return;
    }

    if (auth.isLecturerOnly()) {
      state.activeModule = 'lecturerSchedule';
      syncModuleUI();
      lecturerSchedule.loadSchedule();
      return;
    }

    state.activeModule = 'students';
    syncModuleUI();
    students.loadStudents();
  }

  function switchModule(moduleName) {
    if (moduleName === 'departments' && !auth.canManageDepartments()) {
      return;
    }

    if (moduleName === 'majors' && !auth.canManageMajors()) {
      return;
    }

    if (moduleName === 'trainingPrograms' && !auth.canManageTrainingPrograms()) {
      return;
    }

    if (moduleName === 'userRoles' && !auth.canManageUserRoles()) {
      return;
    }

    if (moduleName === 'rolePermissions' && !auth.isSuperAdmin()) {
      return;
    }

    if (moduleName === 'employees' && !auth.canManageEmployees()) {
      return;
    }

    if (moduleName === 'profile' && !auth.isStudentOnly()) {
      return;
    }

    if (moduleName === 'courseSections' && !auth.canManageCourseSections()) {
      return;
    }

    if (moduleName === 'schedule' && !auth.canViewSchedule()) {
      return;
    }

    if (moduleName === 'courses' && !auth.canManageCourses()) {
      return;
    }

    if (moduleName === 'grades' && !auth.canManageGrades()) {
      return;
    }

    if ((moduleName === 'lecturerSchedule' || moduleName === 'lecturerCourseSections') && !auth.isLecturerOnly() && !auth.isSuperAdmin()) {
      return;
    }

    state.activeModule = moduleName;
    clearError();
    syncModuleUI();
    loadActiveModule();
  }

  function bindNavigation() {
    refs.navStudents.addEventListener('click', function (event) {
      event.preventDefault();
      switchModule('students');
    });

    refs.navDepartments.addEventListener('click', function (event) {
      event.preventDefault();
      switchModule('departments');
    });

    refs.navMajors.addEventListener('click', function (event) {
      event.preventDefault();
      switchModule('majors');
    });

    refs.navTrainingPrograms.addEventListener('click', function (event) {
      event.preventDefault();
      switchModule('trainingPrograms');
    });

    refs.navSemesters.addEventListener('click', function (event) {
      event.preventDefault();
      switchModule('semesters');
    });

    refs.navSchedule.addEventListener('click', function (event) {
      event.preventDefault();
      switchModule('schedule');
    });

    refs.navCourses.addEventListener('click', function (event) {
      event.preventDefault();
      switchModule('courses');
    });

    if (refs.navUserRoles) {
      refs.navUserRoles.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('userRoles');
      });
    }

    if (refs.navRolePermissions) {
      refs.navRolePermissions.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('rolePermissions');
      });
    }

    if (refs.navEmployees) {
      refs.navEmployees.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('employees');
      });
    }

    if (refs.navGrades) {
      refs.navGrades.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('grades');
      });
    }

    if (refs.navProfile) {
      refs.navProfile.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('profile');
      });
    }

    if (refs.navCourseSections) {
      refs.navCourseSections.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('courseSections');
      });
    }

    if (refs.navLecturerSchedule) {
      refs.navLecturerSchedule.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('lecturerSchedule');
      });
    }

    if (refs.navLecturerCourseSections) {
      refs.navLecturerCourseSections.addEventListener('click', function (event) {
        event.preventDefault();
        switchModule('lecturerCourseSections');
      });
    }
  }

  function initSidebar() {
    if (
      refs.sidebarWrapper &&
      window.OverlayScrollbarsGlobal &&
      window.OverlayScrollbarsGlobal.OverlayScrollbars
    ) {
      window.OverlayScrollbarsGlobal.OverlayScrollbars(refs.sidebarWrapper, {
        scrollbars: { theme: 'os-theme-light', autoHide: 'leave', clickScroll: true },
      });
    }
  }

  auth.bindEvents();
  students.bindEvents();
  departments.bindEvents();
  majors.bindEvents();
  trainingPrograms.bindEvents();
  semesters.bindEvents();
  schedule.bindEvents();
  courses.bindEvents();
  userRoles.bindEvents();
  rolePermissions.bindEvents();
  employees.bindEvents();
  grades.bindEvents();
  profile.bindEvents();
  courseSections.bindEvents();
  lecturerSchedule.bindEvents();
  lecturerCourseSections.bindEvents();
  bindNavigation();
  initSidebar();
  auth.updateAuthUI();
  syncModuleUI();
  if (state.authState && state.authState.token) {
    loadAdminLteScript()
      .catch(function (error) {
        console.error(error);
      })
      .finally(loadActiveModule);
  }
});
