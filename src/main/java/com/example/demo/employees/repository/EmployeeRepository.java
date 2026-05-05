package com.example.demo.employees.repository;

import com.example.demo.employees.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    @Query("""
        SELECT e
        FROM Employee e
        WHERE e.deletedAt IS NULL
          AND (e.isActive IS NULL OR e.isActive = true)
          AND (
                :keyword IS NULL
                OR TRIM(:keyword) = ''
                OR LOWER(e.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(e.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(e.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
        """)
    Page<Employee> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    Optional<Employee> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Employee> findFirstByUserIdAndDeletedAtIsNull(UUID userId);

    List<Employee> findAllByDeletedAtIsNullAndIsActiveTrue();
}
