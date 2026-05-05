package com.example.demo.department.service;

import com.example.demo.department.model.Department;
import com.example.demo.department.repository.DepartmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
public class DepartmentService {

    private final DepartmentRepository repo;

    public DepartmentService(DepartmentRepository repo) {
        this.repo = repo;
    }

    public List<Department> getAll() {
        return repo.findAll().stream()
            .filter(department -> department.getDeletedAt() == null)
            .filter(department -> department.getIsActive() == null || Boolean.TRUE.equals(department.getIsActive()))
            .collect(Collectors.toList());
    }

    public Department getById(UUID id) {
        return repo.findByIdAndDeletedAtIsNull(id).orElse(null);
    }

    public Department create(Department department) {
        department.setId(null);
        department.setIsActive(department.getIsActive() == null ? true : department.getIsActive());
        department.setDeletedAt(null);
        department.setUpdatedAt(LocalDateTime.now());
        return repo.save(department);
    }

    public Department update(UUID id, Department department) {
        Department old = getById(id);
        if (old == null) {
            return null;
        }

        old.setCode(department.getCode());
        old.setName(department.getName());
        old.setDescription(department.getDescription());
        old.setEstablishedDate(department.getEstablishedDate());
        old.setIsActive(department.getIsActive() == null ? old.getIsActive() : department.getIsActive());
        old.setUpdatedAt(LocalDateTime.now());
        return repo.save(old);
    }

    public void delete(UUID id) {
        Department department = getById(id);
        if (department == null) {
            return;
        }

        department.setDeletedAt(LocalDateTime.now());
        department.setIsActive(false);
        department.setUpdatedAt(LocalDateTime.now());
        repo.save(department);
    }

    public Page<Department> search(String keyword, int page, int size) {
        return repo.searchByKeyword(keyword, PageRequest.of(page, size));
    }
}
