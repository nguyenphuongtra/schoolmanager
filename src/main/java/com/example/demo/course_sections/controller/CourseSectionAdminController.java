package com.example.demo.course_sections.controller;

import com.example.demo.course_registrations.model.CourseSection;
import com.example.demo.course_sections.service.CourseSectionAdminService;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/course-sections")
@CrossOrigin(origins = "*")
public class CourseSectionAdminController {

    private final CourseSectionAdminService service;

    public CourseSectionAdminController(CourseSectionAdminService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS','LECTURER') or hasAuthority('CLASS_VIEW')")
    public List<CourseSection> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS','LECTURER') or hasAuthority('CLASS_VIEW')")
    public CourseSection getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('CLASS_CREATE')")
    public CourseSection create(@RequestBody CourseSection cs) {
        return service.create(cs);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('CLASS_UPDATE')")
    public CourseSection update(@PathVariable UUID id, @RequestBody CourseSection cs) {
        return service.update(id, cs);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('CLASS_DELETE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS','LECTURER') or hasAuthority('CLASS_VIEW')")
    public Page<CourseSection> search(
        @RequestParam(name = "keyword", required = false) String keyword,
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "15") int size
    ) {
        return service.search(keyword, page, size);
    }
}
