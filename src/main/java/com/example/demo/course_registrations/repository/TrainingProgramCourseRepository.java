package com.example.demo.course_registrations.repository;

import com.example.demo.course_registrations.model.TrainingProgramCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TrainingProgramCourseRepository extends JpaRepository<TrainingProgramCourse, UUID> {

    /** Tìm các môn tiên quyết bắt buộc của một môn học */
    @Query("""
        SELECT tpc FROM TrainingProgramCourse tpc
        WHERE tpc.courseId = :courseId
          AND tpc.prerequisiteCourseId IS NOT NULL
          AND (tpc.isPrerequisiteRequired IS NULL OR tpc.isPrerequisiteRequired = true)
          AND tpc.deletedAt IS NULL
          AND (tpc.isActive IS NULL OR tpc.isActive = true)
        """)
    List<TrainingProgramCourse> findPrerequisitesByCourseId(@Param("courseId") UUID courseId);
}
