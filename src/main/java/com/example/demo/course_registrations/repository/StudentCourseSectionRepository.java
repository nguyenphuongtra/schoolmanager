package com.example.demo.course_registrations.repository;

import com.example.demo.course_registrations.model.StudentCourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StudentCourseSectionRepository extends JpaRepository<StudentCourseSection, UUID> {

    /** Lấy danh sách đăng ký của SV theo trạng thái */
    @Query("""
        SELECT scs FROM StudentCourseSection scs
        WHERE scs.studentId = :studentId
          AND scs.status IN :statuses
          AND scs.deletedAt IS NULL
          AND (scs.isActive IS NULL OR scs.isActive = true)
        """)
    List<StudentCourseSection> findByStudentIdAndStatusIn(
        @Param("studentId") UUID studentId,
        @Param("statuses") List<String> statuses
    );

    /** Đếm số SV đã đăng ký vào một lớp HP (ENROLLED hoặc PENDING) */
    @Query("""
        SELECT COUNT(scs) FROM StudentCourseSection scs
        WHERE scs.courseSectionId = :sectionId
          AND scs.status IN :statuses
          AND scs.deletedAt IS NULL
          AND (scs.isActive IS NULL OR scs.isActive = true)
        """)
    int countByCourseSectionIdAndStatusIn(
        @Param("sectionId") UUID sectionId,
        @Param("statuses") List<String> statuses
    );

    /** Lấy danh sách đăng ký ENROLLED của SV trong một học kỳ cụ thể */
    @Query("""
        SELECT scs FROM StudentCourseSection scs
        WHERE scs.studentId = :studentId
          AND scs.status IN :statuses
          AND scs.deletedAt IS NULL
          AND (scs.isActive IS NULL OR scs.isActive = true)
          AND scs.courseSectionId IN (
              SELECT cs.id FROM com.example.demo.course_registrations.model.CourseSection cs
              WHERE cs.semesterId = :semesterId
                AND cs.deletedAt IS NULL
          )
        """)
    List<StudentCourseSection> findByStudentIdAndSemesterIdAndStatusIn(
        @Param("studentId") UUID studentId,
        @Param("semesterId") UUID semesterId,
        @Param("statuses") List<String> statuses
    );

    /** Kiểm tra SV đã đăng ký một course (qua bất kỳ section nào) chưa */
    @Query("""
        SELECT COUNT(scs) FROM StudentCourseSection scs
        WHERE scs.studentId = :studentId
          AND scs.status IN ('ENROLLED', 'PENDING')
          AND scs.deletedAt IS NULL
          AND (scs.isActive IS NULL OR scs.isActive = true)
          AND scs.courseSectionId IN (
              SELECT cs.id FROM com.example.demo.course_registrations.model.CourseSection cs
              WHERE cs.courseId = :courseId AND cs.deletedAt IS NULL
          )
        """)
    int countByStudentIdAndCourseId(
        @Param("studentId") UUID studentId,
        @Param("courseId") UUID courseId
    );

    /** Lấy danh sách đăng ký theo lớp học phần */
    @Query("""
        SELECT scs FROM StudentCourseSection scs
        WHERE scs.courseSectionId = :courseSectionId
          AND scs.deletedAt IS NULL
          AND (scs.isActive IS NULL OR scs.isActive = true)
        """)
    List<StudentCourseSection> findByCourseSectionIdAndDeletedAtIsNull(
        @Param("courseSectionId") UUID courseSectionId
    );

    /** Lấy tất cả đăng ký của sinh viên */
    @Query("""
        SELECT scs FROM StudentCourseSection scs
        WHERE scs.studentId = :studentId
          AND scs.deletedAt IS NULL
          AND (scs.isActive IS NULL OR scs.isActive = true)
        """)
    List<StudentCourseSection> findByStudentIdAndDeletedAtIsNull(
        @Param("studentId") UUID studentId
    );
}
