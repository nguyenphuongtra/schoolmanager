package com.example.demo.grades.repository;

import com.example.demo.grades.model.GradeScale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GradeScaleRepository extends JpaRepository<GradeScale, UUID> {
    List<GradeScale> findAllByDeletedAtIsNullOrderByMinScoreDesc();
}
