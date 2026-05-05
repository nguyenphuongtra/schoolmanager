package com.example.demo.course_registrations.repository;

import com.example.demo.course_registrations.model.CourseSection;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseSectionRepository extends JpaRepository<CourseSection, UUID> {

    @Query("""
        SELECT cs FROM CourseSection cs
        WHERE cs.semesterId = :semesterId
          AND cs.deletedAt IS NULL
          AND (cs.isActive IS NULL OR cs.isActive = true)
        """)
    List<CourseSection> findBySemesterId(@Param("semesterId") UUID semesterId);

    @Query("""
        SELECT cs FROM CourseSection cs
        WHERE cs.semesterId = :semesterId
          AND cs.deletedAt IS NULL
          AND (cs.isActive IS NULL OR cs.isActive = true)
          AND cs.courseId IN (
              SELECT c.id FROM com.example.demo.courses.model.Course c
              WHERE c.departmentId = :departmentId
                AND c.deletedAt IS NULL
                AND (c.isActive IS NULL OR c.isActive = true)
          )
        """)
    List<CourseSection> findBySemesterIdAndDepartmentId(
        @Param("semesterId") UUID semesterId,
        @Param("departmentId") UUID departmentId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cs FROM CourseSection cs WHERE cs.id = :id")
    Optional<CourseSection> findByIdWithLock(@Param("id") UUID id);

    Optional<CourseSection> findByIdAndDeletedAtIsNull(UUID id);

    @Query("""
        SELECT cs FROM CourseSection cs
        WHERE cs.employeeId = :employeeId
          AND cs.deletedAt IS NULL
          AND (cs.isActive IS NULL OR cs.isActive = true)
        """)
    List<CourseSection> findByEmployeeIdAndDeletedAtIsNull(@Param("employeeId") UUID employeeId);

    /** Lấy danh sách lớp HP theo giảng viên + học kỳ */
    @Query("""
        SELECT cs FROM CourseSection cs
        WHERE cs.employeeId = :employeeId
          AND cs.semesterId = :semesterId
          AND cs.deletedAt IS NULL
          AND (cs.isActive IS NULL OR cs.isActive = true)
        """)
    List<CourseSection> findByEmployeeIdAndSemesterIdAndDeletedAtIsNull(
        @Param("employeeId") UUID employeeId,
        @Param("semesterId") UUID semesterId
    );

    @Query("""
        SELECT cs FROM CourseSection cs
        WHERE cs.deletedAt IS NULL
          AND (cs.isActive IS NULL OR cs.isActive = true)
          AND (
                :keyword IS NULL
                OR TRIM(:keyword) = ''
                OR LOWER(cs.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
        """)
    Page<CourseSection> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
