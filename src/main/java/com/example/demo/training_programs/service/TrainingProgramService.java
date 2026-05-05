package com.example.demo.training_programs.service;

import com.example.demo.training_programs.model.TrainingProgram;
import com.example.demo.training_programs.repository.TrainingProgramRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TrainingProgramService {

    private final TrainingProgramRepository repo;

    public TrainingProgramService(TrainingProgramRepository repo) {
        this.repo = repo;
    }

    public List<TrainingProgram> getAll() {
        return repo.findAll().stream()
            .filter(tp -> tp.getDeletedAt() == null)
            .filter(tp -> tp.getIsActive() == null || Boolean.TRUE.equals(tp.getIsActive()))
            .collect(Collectors.toList());
    }

    public TrainingProgram getById(UUID id) {
        return repo.findByIdAndDeletedAtIsNull(id).orElse(null);
    }

    public TrainingProgram create(TrainingProgram trainingProgram) {
        trainingProgram.setId(null);
        trainingProgram.setIsActive(trainingProgram.getIsActive() == null ? true : trainingProgram.getIsActive());
        trainingProgram.setDeletedAt(null);
        trainingProgram.setUpdatedAt(LocalDateTime.now());
        return repo.save(trainingProgram);
    }

    public TrainingProgram update(UUID id, TrainingProgram trainingProgram) {
        TrainingProgram old = getById(id);
        if (old == null) {
            return null;
        }

        old.setCode(trainingProgram.getCode());
        old.setName(trainingProgram.getName());
        old.setNameEn(trainingProgram.getNameEn());
        old.setMajorId(trainingProgram.getMajorId());
        old.setDepartmentId(trainingProgram.getDepartmentId());
        old.setDegreeLevel(trainingProgram.getDegreeLevel());
        old.setEducationType(trainingProgram.getEducationType());
        old.setTotalCredits(trainingProgram.getTotalCredits());
        old.setRequiredCredits(trainingProgram.getRequiredCredits());
        old.setElectiveCredits(trainingProgram.getElectiveCredits());
        old.setInternshipCredits(trainingProgram.getInternshipCredits());
        old.setThesisCredits(trainingProgram.getThesisCredits());
        old.setAdmissionYear(trainingProgram.getAdmissionYear());
        old.setDurationYears(trainingProgram.getDurationYears());
        old.setMaxDurationYears(trainingProgram.getMaxDurationYears());
        old.setEffectiveDate(trainingProgram.getEffectiveDate());
        old.setExpiryDate(trainingProgram.getExpiryDate());
        old.setDescription(trainingProgram.getDescription());
        old.setObjectives(trainingProgram.getObjectives());
        old.setLearningOutcomes(trainingProgram.getLearningOutcomes());
        old.setVersion(trainingProgram.getVersion());
        old.setStatus(trainingProgram.getStatus());
        old.setIsActive(trainingProgram.getIsActive() == null ? old.getIsActive() : trainingProgram.getIsActive());
        old.setUpdatedAt(LocalDateTime.now());
        return repo.save(old);
    }

    public void delete(UUID id) {
        TrainingProgram trainingProgram = getById(id);
        if (trainingProgram == null) {
            return;
        }

        trainingProgram.setDeletedAt(LocalDateTime.now());
        trainingProgram.setIsActive(false);
        trainingProgram.setUpdatedAt(LocalDateTime.now());
        repo.save(trainingProgram);
    }

    public Page<TrainingProgram> search(String keyword, int page, int size) {
        return repo.searchByKeyword(keyword, PageRequest.of(page, size));
    }

    public List<TrainingProgram> getByDepartmentId(UUID departmentId) {
        return repo.findByDepartmentIdAndDeletedAtIsNull(departmentId);
    }

    public List<TrainingProgram> getByMajorId(UUID majorId) {
        return repo.findByMajorIdAndDeletedAtIsNull(majorId);
    }
}
