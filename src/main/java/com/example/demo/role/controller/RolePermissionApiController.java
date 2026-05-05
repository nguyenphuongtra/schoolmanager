package com.example.demo.role.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.role.model.RolePermission;
import com.example.demo.role.service.RolePermissionService;

@RestController
@RequestMapping("/api/role-permissions")
@CrossOrigin // cho phép frontend gọi
public class RolePermissionApiController {

    private final RolePermissionService service;

    public RolePermissionApiController(RolePermissionService service) {
        this.service = service;
    }

    @GetMapping("/{roleId}")
    public List<RolePermission> getByRole(@PathVariable UUID roleId) {
        return service.getPermissionsByRoleId(roleId);
    }

    @PostMapping
    public RolePermission assign(
            @RequestParam UUID roleId,
            @RequestParam UUID permissionId) {
        return service.assignPermission(roleId, permissionId);
    }

    @DeleteMapping
    public void remove(
            @RequestParam UUID roleId,
            @RequestParam UUID permissionId) {
        service.removePermission(roleId, permissionId);
    }
}