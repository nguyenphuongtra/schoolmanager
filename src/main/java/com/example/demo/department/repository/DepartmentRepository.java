package com.example.demo.department.repository;

import com.example.demo.department.model.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    @Query("""
        SELECT d
        FROM Department d
        WHERE d.deletedAt IS NULL
          AND (d.isActive IS NULL OR d.isActive = true)
          AND (
                :keyword IS NULL
                OR TRIM(:keyword) = ''
                OR LOWER(d.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
        """)
    Page<Department> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    Optional<Department> findByIdAndDeletedAtIsNull(UUID id);
}
