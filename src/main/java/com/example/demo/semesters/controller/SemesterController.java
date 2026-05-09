package com.example.demo.semesters.controller;

import com.example.demo.semesters.model.Semester;
import com.example.demo.semesters.service.SemesterService;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/semesters")
@CrossOrigin(origins = "*")
public class SemesterController {

    private final SemesterService service;

    public SemesterController(SemesterService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS','STUDENT','LECTURER') or hasAuthority('COURSE_VIEW')")
    public List<Semester> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS','STUDENT','LECTURER') or hasAuthority('COURSE_VIEW')")
    public Semester getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('COURSE_CREATE')")
    public Semester create(@RequestBody Semester semester) {
        return service.create(semester);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('COURSE_UPDATE')")
    public Semester update(@PathVariable UUID id, @RequestBody Semester semester) {
        return service.update(id, semester);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('COURSE_DELETE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS','STUDENT','LECTURER') or hasAuthority('COURSE_VIEW')")
    public Page<Semester> search(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "15") int size
    ) {
        return service.search(keyword, page, size);
    }
}
