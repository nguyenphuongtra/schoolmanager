package com.example.demo.majors.service;

import com.example.demo.majors.model.Major;
import com.example.demo.department.repository.DepartmentRepository;
import com.example.demo.majors.repository.MajorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MajorService {

    private final MajorRepository repo;
    private final DepartmentRepository departmentRepository;

    public MajorService(MajorRepository repo, DepartmentRepository departmentRepository) {
        this.repo = repo;
        this.departmentRepository = departmentRepository;
    }

    public List<Major> getAll() {
        return repo.findAll().stream()
            .filter(major -> major.getDeletedAt() == null)
            .filter(major -> major.getIsActive() == null || Boolean.TRUE.equals(major.getIsActive()))
            .map(this::attachDepartmentName)
            .collect(Collectors.toList());
    }

    public Major getById(UUID id) {
        return attachDepartmentName(repo.findByIdAndDeletedAtIsNull(id).orElse(null));
    }

    public Major create(Major major) {
        major.setId(null);
        major.setIsActive(major.getIsActive() == null ? true : major.getIsActive());
        major.setDeletedAt(null);
        major.setUpdatedAt(LocalDateTime.now());
        return attachDepartmentName(repo.save(major));
    }

    public Major update(UUID id, Major major) {
        Major old = getById(id);
        if (old == null) {
            return null;
        }

        old.setDepartmentId(major.getDepartmentId());
        old.setMajorCode(major.getMajorCode());
        old.setMajorName(major.getMajorName());
        old.setDescription(major.getDescription());
        old.setEffectiveDate(major.getEffectiveDate());
        old.setExpiryDate(major.getExpiryDate());
        old.setIsActive(major.getIsActive() == null ? old.getIsActive() : major.getIsActive());
        old.setUpdatedAt(LocalDateTime.now());
        return attachDepartmentName(repo.save(old));
    }

    public void delete(UUID id) {
        Major major = getById(id);
        if (major == null) {
            return;
        }

        major.setDeletedAt(LocalDateTime.now());
        major.setIsActive(false);
        major.setUpdatedAt(LocalDateTime.now());
        repo.save(major);
    }

    public Page<Major> search(String keyword, int page, int size) {
        return repo.searchByKeyword(keyword, PageRequest.of(page, size)).map(this::attachDepartmentName);
    }

    private Major attachDepartmentName(Major major) {
        if (major == null) {
            return null;
        }

        if (major.getDepartmentId() == null) {
            major.setDepartmentName(null);
            return major;
        }

        String departmentName = departmentRepository.findByIdAndDeletedAtIsNull(major.getDepartmentId())
            .map(department -> department.getName())
            .orElse(null);
        major.setDepartmentName(departmentName);
        return major;
    }
}
