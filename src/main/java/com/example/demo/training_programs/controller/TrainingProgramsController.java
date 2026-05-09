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
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_VIEW')")
    public List<TrainingProgram> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_VIEW')")
    public TrainingProgram getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_CREATE')")
    public TrainingProgram create(@RequestBody TrainingProgram trainingProgram) {
        return service.create(trainingProgram);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_UPDATE')")
    public TrainingProgram update(@PathVariable UUID id, @RequestBody TrainingProgram trainingProgram) {
        return service.update(id, trainingProgram);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_DELETE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_VIEW')")
    public Page<TrainingProgram> search(
        @RequestParam(name = "keyword", required = false) String keyword,
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "15") int size
    ) {
        return service.search(keyword, page, size);
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_VIEW')")
    public List<TrainingProgram> getByDepartmentId(@PathVariable UUID departmentId) {
        return service.getByDepartmentId(departmentId);
    }

    @GetMapping("/major/{majorId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('PROGRAM_VIEW')")
    public List<TrainingProgram> getByMajorId(@PathVariable UUID majorId) {
        return service.getByMajorId(majorId);
    }
}
