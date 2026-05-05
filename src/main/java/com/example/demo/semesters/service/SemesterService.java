package com.example.demo.semesters.service;

import com.example.demo.semesters.model.Semester;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface SemesterService {
    List<Semester> getAll();
    Semester getById(UUID id);
    Semester create(Semester semester);
    Semester update(UUID id, Semester semester);
    void delete(UUID id);
    Page<Semester> search(String keyword, int page, int size);
}
