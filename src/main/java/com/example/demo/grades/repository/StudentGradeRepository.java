package com.example.demo.grades.repository;

import com.example.demo.grades.model.StudentGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StudentGradeRepository extends JpaRepository<StudentGrade, UUID> {

    List<StudentGrade> findByRegistrationIdAndDeletedAtIsNull(UUID registrationId);

    @Query("""
        SELECT sg FROM StudentGrade sg
        WHERE sg.registrationId IN (
            SELECT scs.id FROM com.example.demo.course_registrations.model.StudentCourseSection scs
            WHERE scs.studentId = :studentId
              AND scs.deletedAt IS NULL
              AND (scs.isActive IS NULL OR scs.isActive = true)
        )
        AND sg.deletedAt IS NULL
        AND (sg.isActive IS NULL OR sg.isActive = true)
        ORDER BY sg.registrationId, sg.gradeComponentId
        """)
    List<StudentGrade> findAllByStudentId(@Param("studentId") UUID studentId);

    @Query("""
        SELECT sg FROM StudentGrade sg
        WHERE sg.registrationId IN (
            SELECT scs.id FROM com.example.demo.course_registrations.model.StudentCourseSection scs
            WHERE scs.courseSectionId = :courseSectionId
              AND scs.deletedAt IS NULL
              AND (scs.isActive IS NULL OR scs.isActive = true)
        )
        AND sg.deletedAt IS NULL
        AND (sg.isActive IS NULL OR sg.isActive = true)
        """)
    List<StudentGrade> findAllByCourseSectionId(@Param("courseSectionId") UUID courseSectionId);
}
