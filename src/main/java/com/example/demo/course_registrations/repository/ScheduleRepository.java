package com.example.demo.course_registrations.repository;

import com.example.demo.course_registrations.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {

    /** Lấy lịch học theo danh sách course_section_id */
    @Query("""
        SELECT s FROM Schedule s
        WHERE s.courseSectionId IN :sectionIds
          AND s.deletedAt IS NULL
          AND (s.isActive IS NULL OR s.isActive = true)
        """)
    List<Schedule> findByCourseSectionIdIn(@Param("sectionIds") List<UUID> sectionIds);

    /** Lấy lịch học theo một section */
    List<Schedule> findByCourseSectionIdAndDeletedAtIsNull(UUID courseSectionId);

    /** Lấy lịch giảng dạy theo giảng viên */
    @Query("""
        SELECT s FROM Schedule s
        WHERE s.employeeId = :employeeId
          AND s.deletedAt IS NULL
          AND (s.isActive IS NULL OR s.isActive = true)
        """)
    List<Schedule> findByEmployeeIdAndDeletedAtIsNull(@Param("employeeId") UUID employeeId);

    /** Lấy lịch giảng dạy theo giảng viên + danh sách lớp HP */
    @Query("""
        SELECT s FROM Schedule s
        WHERE s.courseSectionId IN :sectionIds
          AND s.deletedAt IS NULL
          AND (s.isActive IS NULL OR s.isActive = true)
        """)
    List<Schedule> findByCourseSectionIds(@Param("sectionIds") List<UUID> sectionIds);
}
