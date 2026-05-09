package com.example.demo.employees.controller;

import com.example.demo.employees.model.Position;
import com.example.demo.employees.repository.PositionRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@CrossOrigin(origins = "*")
public class PositionController {

    private final PositionRepository repo;

    public PositionController(PositionRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('LECTURER_VIEW')")
    public List<Position> getAll() {
        return repo.findAllByDeletedAtIsNullAndIsActiveTrue();
    }
}
