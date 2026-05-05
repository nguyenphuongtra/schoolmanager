package com.example.demo.role.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.role.model.Permission;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
}
