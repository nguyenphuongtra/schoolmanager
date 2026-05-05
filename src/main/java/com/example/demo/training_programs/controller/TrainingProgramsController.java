package com.example.demo.training_programs.controller;

import com.example.demo.training_programs.model.TrainingProgram;
import com.example.demo.training_programs.service.TrainingProgramService;

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
@RequestMapping("/api/training-programs")
@CrossOrigin(origins = "*")
public class TrainingProgramsController {

    private final TrainingProgramService service;

    public TrainingProgramsController(TrainingProgramService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS','STUDENT') or hasAuthority('DEPT_VIEW')")
    public List<TrainingProgram> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPT_VIEW')")
    public TrainingProgram getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPT_CREATE')")
    public TrainingProgram create(@RequestBody TrainingProgram trainingProgram) {
        return service.create(trainingProgram);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPT_EDIT')")
    public TrainingProgram update(@PathVariable UUID id, @RequestBody TrainingProgram trainingProgram) {
        return service.update(id, trainingProgram);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPT_DELETE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPT_VIEW')")
    public Page<TrainingProgram> search(
        @RequestParam(name = "keyword", required = false) String keyword,
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "15") int size
    ) {
        return service.search(keyword, page, size);
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPT_VIEW')")
    public List<TrainingProgram> getByDepartmentId(@PathVariable UUID departmentId) {
        return service.getByDepartmentId(departmentId);
    }

    @GetMapping("/major/{majorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('DEPT_VIEW')")
    public List<TrainingProgram> getByMajorId(@PathVariable UUID majorId) {
        return service.getByMajorId(majorId);
    }
}
