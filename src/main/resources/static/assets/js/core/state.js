export function createState(initialAuth) {
  return {
    activeModule: 'students',
    authState: initialAuth,
    departmentOptions: [],
    majorOptions: [],
    pagination: {
      students: { page: 0, totalPages: 0, totalElements: 0 },
      departments: { page: 0, totalPages: 0, totalElements: 0 },
      majors: { page: 0, totalPages: 0, totalElements: 0 },
      trainingPrograms: { page: 0, totalPages: 0, totalElements: 0 },
      semesters: { page: 0, totalPages: 0, totalElements: 0 },
      employees: { page: 0, totalPages: 0, totalElements: 0 },
      courseSections: { page: 0, totalPages: 0, totalElements: 0 },
    },
  };
}
