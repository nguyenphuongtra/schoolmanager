package com.example.demo.course_sections.service;

import com.example.demo.course_registrations.model.CourseSection;
import com.example.demo.course_registrations.repository.CourseSectionRepository;
import com.example.demo.courses.model.Course;
import com.example.demo.courses.repository.CourseRepository;
import com.example.demo.employees.model.Employee;
import com.example.demo.employees.repository.EmployeeRepository;
import com.example.demo.semesters.model.Semester;
import com.example.demo.semesters.repository.SemesterRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourseSectionAdminService {

    private final CourseSectionRepository repo;
    private final CourseRepository courseRepo;
    private final SemesterRepository semesterRepo;
    private final EmployeeRepository employeeRepo;

    public CourseSectionAdminService(CourseSectionRepository repo,CourseRepository courseRepo, SemesterRepository semesterRepo,EmployeeRepository employeeRepo) {
        this.repo = repo;
        this.courseRepo = courseRepo;
        this.semesterRepo = semesterRepo;
        this.employeeRepo = employeeRepo;
    }

    public List<CourseSection> getAll() {
        List<CourseSection> sections = repo.findAll().stream()
            .filter(cs -> cs.getDeletedAt() == null)
            .filter(cs -> cs.getIsActive() == null || Boolean.TRUE.equals(cs.getIsActive()))
            .collect(Collectors.toList());
        enrichEmployeeNames(sections);
        return sections;
    }

    public CourseSection getById(UUID id) {
        CourseSection cs = repo.findByIdAndDeletedAtIsNull(id).orElse(null);
        if (cs != null) {
            enrichEmployeeName(cs);
        }
        return cs;
    }

    public CourseSection create(CourseSection cs) {
        cs.setId(null);
        cs.setIsActive(cs.getIsActive() == null ? true : cs.getIsActive());
        cs.setDeletedAt(null);
        cs.setUpdatedAt(LocalDateTime.now());
        return repo.save(cs);
    }

    public CourseSection update(UUID id, CourseSection cs) {
        CourseSection old = repo.findByIdAndDeletedAtIsNull(id).orElse(null);
        if (old == null) return null;

        if (cs.getCode() != null) old.setCode(cs.getCode());
        if (cs.getCourseId() != null) old.setCourseId(cs.getCourseId());
        if (cs.getSemesterId() != null) old.setSemesterId(cs.getSemesterId());
        if (cs.getAcademicYear() != null) old.setAcademicYear(cs.getAcademicYear());
        old.setEmployeeId(cs.getEmployeeId());
        if (cs.getRoomId() != null) old.setRoomId(cs.getRoomId());
        if (cs.getBuildingId() != null) old.setBuildingId(cs.getBuildingId());
        if (cs.getMaxStudents() != null) old.setMaxStudents(cs.getMaxStudents());
        if (cs.getMinStudents() != null) old.setMinStudents(cs.getMinStudents());
        if (cs.getClassType() != null) old.setClassType(cs.getClassType());
        if (cs.getStatus() != null) old.setStatus(cs.getStatus());
        if (cs.getRegistrationStart() != null) old.setRegistrationStart(cs.getRegistrationStart());
        if (cs.getRegistrationEnd() != null) old.setRegistrationEnd(cs.getRegistrationEnd());
        if (cs.getNote() != null) old.setNote(cs.getNote());
        old.setIsActive(cs.getIsActive() == null ? old.getIsActive() : cs.getIsActive());
        old.setUpdatedAt(LocalDateTime.now());

        return repo.save(old);
    }

    public void delete(UUID id) {
        CourseSection cs = repo.findByIdAndDeletedAtIsNull(id).orElse(null);
        if (cs == null) return;

        cs.setDeletedAt(LocalDateTime.now());
        cs.setIsActive(false);
        cs.setUpdatedAt(LocalDateTime.now());
        repo.save(cs);
    }

    public Page<CourseSection> search(String keyword, int page, int size) {
        Page<CourseSection> result = repo.searchByKeyword(keyword, PageRequest.of(page, size));
        enrichEmployeeNames(result.getContent());
        return result;
    }

    private void enrichEmployeeName(CourseSection cs) {
        if (cs.getEmployeeId() != null) {
            employeeRepo.findById(cs.getEmployeeId()).ifPresent(emp ->
                cs.setEmployeeName(emp.getFullName())
            );
        }
    }

    private void enrichEmployeeNames(List<CourseSection> sections) {
        List<UUID> empIds = sections.stream()
            .map(CourseSection::getEmployeeId)
            .filter(id -> id != null)
            .distinct()
            .collect(Collectors.toList());

        if (empIds.isEmpty()) return;

        Map<UUID, String> empNameMap = employeeRepo.findAllById(empIds).stream()
            .collect(Collectors.toMap(Employee::getId, Employee::getFullName, (a, b) -> a));

        sections.forEach(cs -> {
            if (cs.getEmployeeId() != null && empNameMap.containsKey(cs.getEmployeeId())) {
                cs.setEmployeeName(empNameMap.get(cs.getEmployeeId()));
            }
        });
    }
}
