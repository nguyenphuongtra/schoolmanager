package com.example.demo.role.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.role.model.Role;
import com.example.demo.role.service.RoleService;

@RestController
@RequestMapping("/api/roles")
public class RoleApiController {

    private final RoleService roleService;

    public RoleApiController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public List<Role> listAll() {
        return roleService.findAll();
    }

    @PostMapping
    public Role create(@RequestBody Role role) {
        return roleService.createRole(role);
    }

    @PostMapping("/{roleId}/permissions/{permId}")
    public Role addPermission(@PathVariable UUID roleId,
                              @PathVariable UUID permId) {
        return roleService.addPermission(roleId, permId);
    }
}
