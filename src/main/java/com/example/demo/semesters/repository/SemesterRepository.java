package com.example.demo.semesters.repository;

import com.example.demo.semesters.model.Semester;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, UUID>, JpaSpecificationExecutor<Semester> {
    Page<Semester> findAllByDeletedAtIsNull(Pageable pageable);
    Page<Semester> findByCodeContainingIgnoreCaseOrNameContainingIgnoreCaseAndDeletedAtIsNull(String code, String name, Pageable pageable);
}
