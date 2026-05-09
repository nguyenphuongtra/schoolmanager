package com.example.demo.courses.controller;

import com.example.demo.courses.model.Course;
import com.example.demo.courses.service.CourseService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService service;

    public CourseController(CourseService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('COURSE_VIEW')")
    public List<Course> getAll() {
        return service.getAll();
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPARTMENT_VIEW') or hasAuthority('COURSE_VIEW')")
    public List<Course> getByDepartment(@PathVariable UUID departmentId) {
        return service.getByDepartmentId(departmentId);
    }
}
