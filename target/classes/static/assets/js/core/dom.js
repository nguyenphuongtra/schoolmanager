function getModal(element) {
  if (!window.bootstrap || !element) {
    return null;
  }

  return new window.bootstrap.Modal(element);
}

function createModalWrapper(elementRef) {
  return {
    _element: elementRef,
    _modal: null,
    
    show() {
      if (!this._modal) {
        this._modal = getModal(this._element);
      }
      if (this._modal) {
        this._modal.show();
      }
    },
    
    hide() {
      if (this._modal) {
        this._modal.hide();
      }
    }
  };
}

export function createDomRefs() {
  const refs = {
    loginView: document.getElementById('loginView'),
    appWrapper: document.getElementById('appWrapper'),
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    loginButton: document.getElementById('loginButton'),
    loginError: document.getElementById('loginError'),
    loginSuccess: document.getElementById('loginSuccess'),
    currentUserName: document.getElementById('currentUserName'),
    currentUserRoles: document.getElementById('currentUserRoles'),
    pageTitle: document.getElementById('pageTitle'),
    pageBreadcrumb: document.getElementById('pageBreadcrumb'),
    roleViewHint: document.getElementById('roleViewHint'),
    navStudents: document.getElementById('navStudents'),
    navDepartments: document.getElementById('navDepartments'),
    navMajors: document.getElementById('navMajors'),
    navTrainingPrograms: document.getElementById('navTrainingPrograms'),
    navSemesters: document.getElementById('navSemesters'),
    navSchedule: document.getElementById('navSchedule'),
    navCourses: document.getElementById('navCourses'),
    btnLogout: document.getElementById('btnLogout'),
    studentsSection: document.getElementById('studentsSection'),
    departmentsSection: document.getElementById('departmentsSection'),
    majorsSection: document.getElementById('majorsSection'),
    trainingProgramsSection: document.getElementById('trainingProgramsSection'),
    semestersSection: document.getElementById('semestersSection'),
    scheduleSection: document.getElementById('scheduleSection'),
    coursesSection: document.getElementById('coursesSection'),
    studentTableBody: document.getElementById('studentTableBody'),
    pagination: document.getElementById('pagination'),
    paginationInfo: document.getElementById('paginationInfo'),
    searchInput: document.getElementById('searchInput'),
    departmentTableBody: document.getElementById('departmentTableBody'),
    departmentPagination: document.getElementById('departmentPagination'),
    departmentPaginationInfo: document.getElementById('departmentPaginationInfo'),
    departmentSearchInput: document.getElementById('departmentSearchInput'),
    majorTableBody: document.getElementById('majorTableBody'),
    majorPagination: document.getElementById('majorPagination'),
    majorPaginationInfo: document.getElementById('majorPaginationInfo'),
    majorSearchInput: document.getElementById('majorSearchInput'),
    trainingProgramTableBody: document.getElementById('trainingProgramTableBody'),
    trainingProgramPagination: document.getElementById('trainingProgramPagination'),
    trainingProgramPaginationInfo: document.getElementById('trainingProgramPaginationInfo'),
    trainingProgramSearchInput: document.getElementById('trainingProgramSearchInput'),
    apiDebugBanner: document.getElementById('apiDebugBanner'),
    apiDebugMsg: document.getElementById('apiDebugMsg'),
    studentModalEl: document.getElementById('studentModal'),
    studentModalTitle: document.getElementById('studentModalTitle'),
    studentIdInput: document.getElementById('studentId'),
    studentCodeInput: document.getElementById('studentCode'),
    studentFullNameInput: document.getElementById('studentFullName'),
    studentEmailInput: document.getElementById('studentEmail'),
    btnSaveStudent: document.getElementById('btnSaveStudent'),
    btnAdd: document.getElementById('btnAdd'),
    departmentModalEl: document.getElementById('departmentModal'),
    departmentModalTitle: document.getElementById('departmentModalTitle'),
    departmentIdInput: document.getElementById('departmentId'),
    departmentCodeInput: document.getElementById('departmentCode'),
    departmentNameInput: document.getElementById('departmentName'),
    departmentEstablishedYearInput: document.getElementById('departmentEstablishedYear'),
    departmentDescriptionInput: document.getElementById('departmentDescription'),
    btnSaveDepartment: document.getElementById('btnSaveDepartment'),
    btnAddDepartment: document.getElementById('btnAddDepartment'),
    majorModalEl: document.getElementById('majorModal'),
    majorModalTitle: document.getElementById('majorModalTitle'),
    majorIdInput: document.getElementById('majorId'),
    majorDepartmentIdInput: document.getElementById('majorDepartmentId'),
    majorCodeInput: document.getElementById('majorCode'),
    majorNameInput: document.getElementById('majorName'),
    majorEffectiveDateInput: document.getElementById('majorEffectiveDate'),
    majorExpiryDateInput: document.getElementById('majorExpiryDate'),
    majorDescriptionInput: document.getElementById('majorDescription'),
    btnSaveMajor: document.getElementById('btnSaveMajor'),
    btnAddMajor: document.getElementById('btnAddMajor'),
    trainingProgramModalEl: document.getElementById('trainingProgramModal'),
    trainingProgramModalTitle: document.getElementById('trainingProgramModalTitle'),
    trainingProgramIdInput: document.getElementById('trainingProgramId'),
    trainingProgramDepartmentIdInput: document.getElementById('trainingProgramDepartmentId'),
    trainingProgramMajorIdInput: document.getElementById('trainingProgramMajorId'),
    trainingProgramCodeInput: document.getElementById('trainingProgramCode'),
    trainingProgramNameInput: document.getElementById('trainingProgramName'),
    trainingProgramNameEnInput: document.getElementById('trainingProgramNameEn'),
    trainingProgramDegreeLevelInput: document.getElementById('trainingProgramDegreeLevel'),
    trainingProgramEducationTypeInput: document.getElementById('trainingProgramEducationType'),
    trainingProgramTotalCreditsInput: document.getElementById('trainingProgramTotalCredits'),
    trainingProgramRequiredCreditsInput: document.getElementById('trainingProgramRequiredCredits'),
    trainingProgramElectiveCreditsInput: document.getElementById('trainingProgramElectiveCredits'),
    trainingProgramInternshipCreditsInput: document.getElementById('trainingProgramInternshipCredits'),
    trainingProgramThesisCreditsInput: document.getElementById('trainingProgramThesisCredits'),
    trainingProgramAdmissionYearInput: document.getElementById('trainingProgramAdmissionYear'),
    trainingProgramDurationYearsInput: document.getElementById('trainingProgramDurationYears'),
    trainingProgramMaxDurationYearsInput: document.getElementById('trainingProgramMaxDurationYears'),
    trainingProgramEffectiveDateInput: document.getElementById('trainingProgramEffectiveDate'),
    trainingProgramExpiryDateInput: document.getElementById('trainingProgramExpiryDate'),
    trainingProgramVersionInput: document.getElementById('trainingProgramVersion'),
    trainingProgramStatusInput: document.getElementById('trainingProgramStatus'),
    trainingProgramDescriptionInput: document.getElementById('trainingProgramDescription'),
    trainingProgramObjectivesInput: document.getElementById('trainingProgramObjectives'),
    trainingProgramLearningOutcomesInput: document.getElementById('trainingProgramLearningOutcomes'),
    btnSaveTrainingProgram: document.getElementById('btnSaveTrainingProgram'),
    btnAddTrainingProgram: document.getElementById('btnAddTrainingProgram'),
    semesterTableBody: document.getElementById('semesterTableBody'),
    semesterPagination: document.getElementById('semesterPagination'),
    semesterPaginationInfo: document.getElementById('semesterPaginationInfo'),
    semesterSearchInput: document.getElementById('semesterSearchInput'),
    semesterModalEl: document.getElementById('semesterModal'),
    semesterModalTitle: document.getElementById('semesterModalTitle'),
    semesterIdInput: document.getElementById('semesterId'),
    semesterCodeInput: document.getElementById('semesterCode'),
    semesterNameInput: document.getElementById('semesterName'),
    semesterSchoolYearNameInput: document.getElementById('semesterSchoolYearName'),
    semesterStartDateInput: document.getElementById('semesterStartDate'),
    semesterEndDateInput: document.getElementById('semesterEndDate'),
    semesterIsActiveInput: document.getElementById('semesterIsActive'),
    btnSaveSemester: document.getElementById('btnSaveSemester'),
    btnAddSemester: document.getElementById('btnAddSemester'),
    
    // Schedule
    scheduleSemesterFilter: document.getElementById('scheduleSemesterFilter'),
    scheduleBody: document.getElementById('scheduleBody'),

    // Courses
    coursesTableBody: document.getElementById('coursesTableBody'),
    coursesSearchInput: document.getElementById('coursesSearchInput'),

    // User Roles
    navUserRoles: document.getElementById('navUserRoles'),
    userRolesSection: document.getElementById('userRolesSection'),
    userRolesTableBody: document.getElementById('userRolesTableBody'),
    userRolesSearchInput: document.getElementById('userRolesSearchInput'),
    userRolesPaginationInfo: document.getElementById('userRolesPaginationInfo'),
    userRoleModalEl: document.getElementById('userRoleModal'),
    userRoleModalUserId: document.getElementById('userRoleModalUserId'),
    userRoleModalUserInfo: document.getElementById('userRoleModalUserInfo'),
    userRoleModalRoleList: document.getElementById('userRoleModalRoleList'),
    btnSaveUserRoles: document.getElementById('btnSaveUserRoles'),

    // Employees
    navEmployees: document.getElementById('navEmployees'),
    employeesSection: document.getElementById('employeesSection'),
    employeeTableBody: document.getElementById('employeeTableBody'),
    employeePagination: document.getElementById('employeePagination'),
    employeePaginationInfo: document.getElementById('employeePaginationInfo'),
    employeeSearchInput: document.getElementById('employeeSearchInput'),
    employeeModalTitle: document.getElementById('employeeModalTitle'),
    employeeId: document.getElementById('employeeId'),
    employeeCode: document.getElementById('employeeCode'),
    employeeFullName: document.getElementById('employeeFullName'),
    employeeEmail: document.getElementById('employeeEmail'),
    employeePhone: document.getElementById('employeePhone'),
    employeeAcademicDegree: document.getElementById('employeeAcademicDegree'),
    employeeSpecialization: document.getElementById('employeeSpecialization'),
    employeeDepartmentId: document.getElementById('employeeDepartmentId'),
    employeeUserId: document.getElementById('employeeUserId'),
    btnAddEmployee: document.getElementById('btnAddEmployee'),
    btnSaveEmployee: document.getElementById('btnSaveEmployee'),

    // Grades
    navGrades: document.getElementById('navGrades'),
    gradesSection: document.getElementById('gradesSection'),
    gradesContent: document.getElementById('gradesContent'),

    // Profile
    navProfile: document.getElementById('navProfile'),
    profileSection: document.getElementById('profileSection'),
    profileContent: document.getElementById('profileContent'),

    // Course Sections
    navCourseSections: document.getElementById('navCourseSections'),
    courseSectionsSection: document.getElementById('courseSectionsSection'),
    courseSectionTableBody: document.getElementById('courseSectionTableBody'),
    courseSectionPagination: document.getElementById('courseSectionPagination'),
    courseSectionPaginationInfo: document.getElementById('courseSectionPaginationInfo'),
    courseSectionSearchInput: document.getElementById('courseSectionSearchInput'),
    courseSectionModalTitle: document.getElementById('courseSectionModalTitle'),
    courseSectionId: document.getElementById('courseSectionId'),
    courseSectionCode: document.getElementById('courseSectionCode'),
    courseSectionAcademicYear: document.getElementById('courseSectionAcademicYear'),
    courseSectionMaxStudents: document.getElementById('courseSectionMaxStudents'),
    courseSectionClassType: document.getElementById('courseSectionClassType'),
    courseSectionStatus: document.getElementById('courseSectionStatus'),
    courseSectionNote: document.getElementById('courseSectionNote'),
    courseSectionEmployee: document.getElementById('courseSectionEmployee'),
    btnAddCourseSection: document.getElementById('btnAddCourseSection'),
    btnSaveCourseSection: document.getElementById('btnSaveCourseSection'),

    // Lecturer Schedule
    navLecturerSchedule: document.getElementById('navLecturerSchedule'),
    lecturerScheduleSection: document.getElementById('lecturerScheduleSection'),
    lecturerScheduleContent: document.getElementById('lecturerScheduleContent'),
    lecturerScheduleSemesterFilter: document.getElementById('lecturerScheduleSemesterFilter'),

    // Lecturer Course Sections
    navLecturerCourseSections: document.getElementById('navLecturerCourseSections'),
    lecturerCourseSectionsSection: document.getElementById('lecturerCourseSectionsSection'),
    lecturerCourseSectionsContent: document.getElementById('lecturerCourseSectionsContent'),
    lecturerCsSemesterFilter: document.getElementById('lecturerCsSemesterFilter'),

    sidebarWrapper: document.querySelector('.sidebar-wrapper'),
  };

  refs.studentModal = createModalWrapper(refs.studentModalEl);
  refs.departmentModal = createModalWrapper(refs.departmentModalEl);
  refs.majorModal = createModalWrapper(refs.majorModalEl);
  refs.trainingProgramModal = createModalWrapper(refs.trainingProgramModalEl);
  refs.semesterModal = createModalWrapper(refs.semesterModalEl);
  refs.userRoleModal = createModalWrapper(refs.userRoleModalEl);

  return refs;
}
