package com.example.demo.employees.repository;

import com.example.demo.employees.model.Position;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PositionRepository extends JpaRepository<Position, UUID> {
    List<Position> findAllByDeletedAtIsNullAndIsActiveTrue();
}
