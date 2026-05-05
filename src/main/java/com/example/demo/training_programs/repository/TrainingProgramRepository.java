package com.example.demo.training_programs.repository;

import com.example.demo.training_programs.model.TrainingProgram;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TrainingProgramRepository extends JpaRepository<TrainingProgram, UUID> {
    @Query("""
        SELECT tp
        FROM TrainingProgram tp
        WHERE tp.deletedAt IS NULL
          AND (tp.isActive IS NULL OR tp.isActive = true)
          AND (
                :keyword IS NULL
                OR TRIM(:keyword) = ''
                OR LOWER(tp.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(tp.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(tp.nameEn) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(tp.degreeLevel) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(tp.educationType) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(tp.status) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(tp.version) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
        """)
    Page<TrainingProgram> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    Optional<TrainingProgram> findByIdAndDeletedAtIsNull(UUID id);

    List<TrainingProgram> findByDepartmentIdAndDeletedAtIsNull(UUID departmentId);

    List<TrainingProgram> findByMajorIdAndDeletedAtIsNull(UUID majorId);

    List<TrainingProgram> findAllByDeletedAtIsNull();
}
