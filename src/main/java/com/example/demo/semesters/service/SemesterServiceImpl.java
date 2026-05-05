package com.example.demo.semesters.service;

import com.example.demo.semesters.model.Semester;
import com.example.demo.semesters.repository.SemesterRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository repository;

    public SemesterServiceImpl(SemesterRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Semester> getAll() {
        return repository.findAllByDeletedAtIsNull(PageRequest.of(0, 1000)).getContent();
    }

    @Override
    public Semester getById(UUID id) {
        return repository.findById(id)
                .filter(semester -> semester.getDeletedAt() == null)
                .orElse(null);
    }

    @Override
    public Semester create(Semester semester) {
        semester.setCreatedAt(LocalDateTime.now());
        semester.setUpdatedAt(LocalDateTime.now());
        if (semester.getIsActive() == null) {
            semester.setIsActive(true);
        }
        return repository.save(semester);
    }

    @Override
    public Semester update(UUID id, Semester semester) {
        Semester existing = getById(id);
        if (existing != null) {
            existing.setCode(semester.getCode());
            existing.setName(semester.getName());
            existing.setSchoolYearId(semester.getSchoolYearId());
            existing.setSchoolYearName(semester.getSchoolYearName());
            existing.setStartDate(semester.getStartDate());
            existing.setEndDate(semester.getEndDate());
            existing.setIsActive(semester.getIsActive());
            existing.setUpdatedAt(LocalDateTime.now());
            return repository.save(existing);
        }
        return null;
    }

    @Override
    public void delete(UUID id) {
        Semester existing = getById(id);
        if (existing != null) {
            existing.setDeletedAt(LocalDateTime.now());
            repository.save(existing);
        }
    }

    @Override
    public Page<Semester> search(String keyword, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        if (keyword == null || keyword.trim().isEmpty()) {
            return repository.findAllByDeletedAtIsNull(pageRequest);
        }
        return repository.findByCodeContainingIgnoreCaseOrNameContainingIgnoreCaseAndDeletedAtIsNull(keyword, keyword, pageRequest);
    }
}
