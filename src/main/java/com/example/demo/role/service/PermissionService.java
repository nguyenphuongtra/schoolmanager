package com.example.demo.role.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.role.model.Permission;
import com.example.demo.role.repository.PermissionRepository;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepo;

    public PermissionService(PermissionRepository permissionRepo) {
        this.permissionRepo = permissionRepo;
    }

    public Permission create(Permission permission) {
        return permissionRepo.save(permission);
    }

    public List<Permission> findAll() {
        return permissionRepo.findAll();
    }

    public Permission findById(UUID id) {
        return permissionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found"));
    }

    public void delete(UUID id) {
        permissionRepo.deleteById(id);
    }
}