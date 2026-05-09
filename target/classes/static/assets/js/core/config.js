const BASE_URL ='http://localhost:8080/api';

export const API_CONFIG = {
  auth: `${BASE_URL}/auth/login`,
  students: `${BASE_URL}/students`,
  departments: `${BASE_URL}/departments`,
  majors: `${BASE_URL}/majors`,
  trainingPrograms: `${BASE_URL}/training-programs`,
  courses: `${BASE_URL}/courses`,
  semesters: `${BASE_URL}/semesters`,
  users: `${BASE_URL}/users`,
  roles: `${BASE_URL}/roles`,
  employees: `${BASE_URL}/employees`,
  positions: `${BASE_URL}/positions`,
  grades: `${BASE_URL}/grades`,
  courseSections: `${BASE_URL}/course-sections`,
  lecturer: `${BASE_URL}/lecturer`,
  permissions: `${BASE_URL}/permissions`,
  rolePermissions: `${BASE_URL}/role-permissions`,
};

export const PAGE_SIZE = 15;
export const AUTH_STORAGE_KEY = 'schoolManagerAuth';