package com.example.demo.employees.service;

import com.example.demo.course_registrations.model.CourseSection;
import com.example.demo.course_registrations.model.Schedule;
import com.example.demo.course_registrations.model.StudentCourseSection;
import com.example.demo.course_registrations.repository.CourseSectionRepository;
import com.example.demo.course_registrations.repository.ScheduleRepository;
import com.example.demo.course_registrations.repository.StudentCourseSectionRepository;
import com.example.demo.courses.model.Course;
import com.example.demo.courses.repository.CourseRepository;
import com.example.demo.employees.model.Employee;
import com.example.demo.employees.repository.EmployeeRepository;
import com.example.demo.semesters.model.Semester;
import com.example.demo.semesters.repository.SemesterRepository;
import com.example.demo.students.model.Student;
import com.example.demo.students.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LecturerService {

    private final EmployeeRepository employeeRepo;
    private final CourseSectionRepository courseSectionRepo;
    private final ScheduleRepository scheduleRepo;
    private final StudentCourseSectionRepository registrationRepo;
    private final StudentRepository studentRepo;
    private final CourseRepository courseRepo;
    private final SemesterRepository semesterRepo;

    public LecturerService(EmployeeRepository employeeRepo,
                           CourseSectionRepository courseSectionRepo,
                           ScheduleRepository scheduleRepo,
                           StudentCourseSectionRepository registrationRepo,
                           StudentRepository studentRepo,
                           CourseRepository courseRepo,
                           SemesterRepository semesterRepo) {
        this.employeeRepo = employeeRepo;
        this.courseSectionRepo = courseSectionRepo;
        this.scheduleRepo = scheduleRepo;
        this.registrationRepo = registrationRepo;
        this.studentRepo = studentRepo;
        this.courseRepo = courseRepo;
        this.semesterRepo = semesterRepo;
    }

    /**
     * Tìm Employee từ userId
     */
    public Employee findEmployeeByUserId(UUID userId) {
        return employeeRepo.findFirstByUserIdAndDeletedAtIsNull(userId).orElse(null);
    }

    /**
     * Lấy danh sách lớp HP mà giảng viên phụ trách
     */
    public List<Map<String, Object>> getMyCourseSections(UUID employeeId, UUID semesterId) {
        List<CourseSection> sections;
        if (semesterId != null) {
            sections = courseSectionRepo.findByEmployeeIdAndSemesterIdAndDeletedAtIsNull(employeeId, semesterId);
        } else {
            sections = courseSectionRepo.findByEmployeeIdAndDeletedAtIsNull(employeeId);
        }

        return sections.stream().map(cs -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", cs.getId());
            row.put("code", cs.getCode());
            row.put("academicYear", cs.getAcademicYear());
            row.put("maxStudents", cs.getMaxStudents());
            row.put("classType", cs.getClassType());
            row.put("status", cs.getStatus());
            row.put("note", cs.getNote());
            row.put("semesterId", cs.getSemesterId());

            // Attach course name
            if (cs.getCourseId() != null) {
                courseRepo.findById(cs.getCourseId()).ifPresent(course -> {
                    row.put("courseName", course.getName());
                    row.put("courseCode", course.getCode());
                    row.put("credits", course.getCredits());
                });
            }

            // Attach semester name
            if (cs.getSemesterId() != null) {
                semesterRepo.findById(cs.getSemesterId()).ifPresent(sem -> {
                    row.put("semesterName", sem.getName());
                    row.put("schoolYearName", sem.getSchoolYearName());
                });
            }

            // Count enrolled students
            List<StudentCourseSection> regs = registrationRepo
                .findByCourseSectionIdAndDeletedAtIsNull(cs.getId());
            long enrolledCount = regs.stream()
                .filter(r -> "ENROLLED".equals(r.getStatus()) || "PENDING".equals(r.getStatus()))
                .count();
            row.put("enrolledStudents", enrolledCount);

            return row;
        }).collect(Collectors.toList());
    }

    /**
     * Lấy lịch giảng dạy cá nhân của giảng viên
     */
    public List<Map<String, Object>> getMySchedule(UUID employeeId, UUID semesterId) {
        List<CourseSection> sections;
        if (semesterId != null) {
            sections = courseSectionRepo.findByEmployeeIdAndSemesterIdAndDeletedAtIsNull(employeeId, semesterId);
        } else {
            sections = courseSectionRepo.findByEmployeeIdAndDeletedAtIsNull(employeeId);
        }

        if (sections.isEmpty()) {
            return Collections.emptyList();
        }

        List<UUID> sectionIds = sections.stream()
            .map(CourseSection::getId)
            .collect(Collectors.toList());

        // Build lookup maps
        Map<UUID, CourseSection> sectionMap = sections.stream()
            .collect(Collectors.toMap(CourseSection::getId, cs -> cs));

        Map<UUID, Course> courseMap = new HashMap<>();
        for (CourseSection cs : sections) {
            if (cs.getCourseId() != null) {
                courseRepo.findById(cs.getCourseId()).ifPresent(c -> courseMap.put(cs.getId(), c));
            }
        }

        // Get schedules for these sections
        List<Schedule> schedules = scheduleRepo.findByCourseSectionIds(sectionIds);

        return schedules.stream().map(sch -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", sch.getId());
            row.put("dayOfWeek", sch.getDayOfWeek());
            row.put("startPeriod", sch.getStartPeriod());
            row.put("endPeriod", sch.getEndPeriod());
            row.put("shift", sch.getShift());
            row.put("mode", sch.getMode());
            row.put("status", sch.getStatus());
            row.put("note", sch.getNote());

            CourseSection cs = sectionMap.get(sch.getCourseSectionId());
            if (cs != null) {
                row.put("sectionCode", cs.getCode());
                Course course = courseMap.get(cs.getId());
                if (course != null) {
                    row.put("courseName", course.getName());
                    row.put("courseCode", course.getCode());
                }
            }

            return row;
        }).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách sinh viên trong một lớp HP (chỉ cho GV phụ trách)
     */
    public Map<String, Object> getStudentsInCourseSection(UUID employeeId, UUID courseSectionId) {
        // Verify that this course section belongs to the lecturer
        CourseSection cs = courseSectionRepo.findByIdAndDeletedAtIsNull(courseSectionId).orElse(null);
        if (cs == null) {
            return null;
        }

        if (!employeeId.equals(cs.getEmployeeId())) {
            return null; // Lecturer doesn't own this section
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("courseSectionId", cs.getId());
        result.put("courseSectionCode", cs.getCode());

        // Attach course info
        if (cs.getCourseId() != null) {
            courseRepo.findById(cs.getCourseId()).ifPresent(course -> {
                result.put("courseName", course.getName());
                result.put("courseCode", course.getCode());
                result.put("credits", course.getCredits());
            });
        }

        // Get enrolled students
        List<StudentCourseSection> registrations = registrationRepo
            .findByCourseSectionIdAndDeletedAtIsNull(courseSectionId);

        List<Map<String, Object>> studentRows = new ArrayList<>();
        for (StudentCourseSection reg : registrations) {
            Student student = studentRepo.findByIdAndDeletedAtIsNull(reg.getStudentId()).orElse(null);
            if (student == null) continue;

            Map<String, Object> studentRow = new LinkedHashMap<>();
            studentRow.put("registrationId", reg.getId());
            studentRow.put("studentId", student.getId());
            studentRow.put("studentCode", student.getStudentCode());
            studentRow.put("fullName", student.getFullName());
            studentRow.put("email", student.getEmail());
            studentRow.put("status", reg.getStatus());
            studentRows.add(studentRow);
        }

        result.put("students", studentRows);
        result.put("totalStudents", studentRows.size());

        return result;
    }
}
