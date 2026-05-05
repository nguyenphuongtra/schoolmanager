package com.example.demo.users.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.users.model.User;
import com.example.demo.users.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserApiController {

    private final UserService userService;

    public UserApiController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> list() {
        return userService.findAll();
    }

    @GetMapping("/{userId}")
    public User getById(@PathVariable UUID userId) {
        return userService.findById(userId);
    }

    @PostMapping
    public User create(@RequestParam String username,
                       @RequestParam String password) {
        return userService.createUser(username, password);
    }

    @PostMapping("/{userId}/roles/{roleId}")
    public User assignRole(@PathVariable UUID userId,
                           @PathVariable UUID roleId) {
        return userService.assignRole(userId, roleId);
    }

    @PutMapping("/{userId}/roles")
    public User updateRoles(@PathVariable UUID userId,
                            @RequestBody List<UUID> roleIds) {
        return userService.updateUserRoles(userId, roleIds);
    }

    @DeleteMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<Void> removeRole(@PathVariable UUID userId,
                                           @PathVariable UUID roleId) {
        userService.removeRole(userId, roleId);
        return ResponseEntity.noContent().build();
    }
}