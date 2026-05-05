package com.example.demo.grades.repository;

import com.example.demo.grades.model.GradeComponent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GradeComponentRepository extends JpaRepository<GradeComponent, UUID> {
    List<GradeComponent> findByCourseSectionIdAndDeletedAtIsNullOrderByDisplayOrderAsc(UUID courseSectionId);
}
