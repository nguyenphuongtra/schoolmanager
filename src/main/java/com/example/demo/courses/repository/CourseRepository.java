package com.example.demo.courses.repository;

import com.example.demo.courses.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findByDepartmentIdAndDeletedAtIsNullAndIsActiveTrue(UUID departmentId);

    List<Course> findByDepartmentIdAndDeletedAtIsNull(UUID departmentId);
}
