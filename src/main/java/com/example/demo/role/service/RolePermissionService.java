package com.example.demo.role.service;

import com.example.demo.role.model.RolePermission;
import com.example.demo.role.repository.RolePermissionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RolePermissionService {

    private final RolePermissionRepository repository;

    public RolePermissionService(RolePermissionRepository repository) {
        this.repository = repository;
    }

    public RolePermission assignPermission(UUID roleId, UUID permissionId) {
        RolePermission rp = repository.findByRoleIdAndPermissionId(roleId, permissionId)
            .orElseGet(() -> new RolePermission(roleId, permissionId));
        rp.setIsActive(true);
        rp.setDeletedAt(null);
        rp.setUpdatedAt(LocalDateTime.now());
        return repository.save(rp);
    }

    public void removePermission(UUID roleId, UUID permissionId) {
        repository.findByRoleIdAndPermissionId(roleId, permissionId)
            .ifPresent(repository::delete);
    }

    public List<RolePermission> getPermissionsByRoleId(UUID roleId) {
        return repository.findByRoleIdAndDeletedAtIsNull(roleId);
    }
}
