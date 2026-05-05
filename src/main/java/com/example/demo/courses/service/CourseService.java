package com.example.demo.courses.service;

import com.example.demo.courses.model.Course;
import com.example.demo.courses.repository.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository repo;

    public CourseService(CourseRepository repo) {
        this.repo = repo;
    }

    public List<Course> getByDepartmentId(UUID departmentId) {
        return repo.findByDepartmentIdAndDeletedAtIsNull(departmentId).stream()
            .filter(c -> c.getIsActive() == null || Boolean.TRUE.equals(c.getIsActive()))
            .collect(Collectors.toList());
    }

    public List<Course> getAll() {
        return repo.findAll().stream()
            .filter(c -> c.getDeletedAt() == null)
            .filter(c -> c.getIsActive() == null || Boolean.TRUE.equals(c.getIsActive()))
            .collect(Collectors.toList());
    }
}
