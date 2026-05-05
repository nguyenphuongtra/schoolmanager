package com.example.demo.role.repository;

import com.example.demo.role.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {

    List<RolePermission> findByRoleIdAndDeletedAtIsNull(UUID roleId);

    Optional<RolePermission> findByRoleIdAndPermissionIdAndDeletedAtIsNull(UUID roleId, UUID permissionId);
}
