package com.example.demo.role.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.role.model.Permission;
import com.example.demo.role.model.Role;
import com.example.demo.role.model.RolePermission;
import com.example.demo.role.repository.PermissionRepository;
import com.example.demo.role.repository.RolePermissionRepository;
import com.example.demo.role.repository.RoleRepository;

@Service
public class RoleService {

    private final RoleRepository roleRepo;

    private final PermissionRepository permRepo;

    private final RolePermissionRepository rolePermissionRepository;

    public RoleService(RoleRepository roleRepo, PermissionRepository permRepo,
                       RolePermissionRepository rolePermissionRepository) {
        this.roleRepo = roleRepo;
        this.permRepo = permRepo;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    public List<Role> findAll() {
        return roleRepo.findAll();
    }

    public Role createRole(Role role) {
        return roleRepo.save(role);
    }

    public Role addPermission(UUID roleId, UUID permId) {
        Role r = roleRepo.findById(roleId).orElseThrow();
        Permission p = permRepo.findById(permId).orElseThrow();
        rolePermissionRepository.findByRoleIdAndPermissionIdAndDeletedAtIsNull(r.getId(), p.getId())
            .orElseGet(() -> rolePermissionRepository.save(new RolePermission(r.getId(), p.getId())));
        return roleRepo.findById(roleId).orElseThrow();
    }
}
