package com.example.demo.students.repository;

import com.example.demo.students.model.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {
    @Query("""
        SELECT s
        FROM Student s
        WHERE s.deletedAt IS NULL
          AND (s.isActive IS NULL OR s.isActive = true)
          AND (
                :keyword IS NULL
                OR TRIM(:keyword) = ''
                OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
        """)
    Page<Student> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    Optional<Student> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Student> findFirstByUserIdAndDeletedAtIsNull(UUID userId);
}
