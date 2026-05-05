package com.example.demo.majors.repository;

import com.example.demo.majors.model.Major;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MajorRepository extends JpaRepository<Major, UUID> {
    @Query("""
        SELECT m
        FROM Major m
        WHERE m.deletedAt IS NULL
          AND (m.isActive IS NULL OR m.isActive = true)
          AND (
                :keyword IS NULL
                OR TRIM(:keyword) = ''
                OR LOWER(m.majorCode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(m.majorName) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
        """)
    Page<Major> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    Optional<Major> findByIdAndDeletedAtIsNull(UUID id);
}
