package com.example.demo.department.controller;

import com.example.demo.department.model.Department;
import com.example.demo.department.service.DepartmentService;

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
@RequestMapping("/api/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService service;

    public DepartmentController(DepartmentService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('DEPARTMENT_VIEW')")
    public List<Department> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('DEPARTMENT_VIEW')")
    public Department getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('DEPARTMENT_CREATE')")
    public Department create(@RequestBody Department department) {
        return service.create(department);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('DEPARTMENT_UPDATE')")
    public Department update(@PathVariable UUID id, @RequestBody Department department) {
        return service.update(id, department);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('DEPARTMENT_DELETE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('DEPARTMENT_VIEW')")
    public Page<Department> search(
        @RequestParam(name = "keyword", required = false) String keyword,
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "15") int size
    ) {
        return service.search(keyword, page, size);
    }
}
