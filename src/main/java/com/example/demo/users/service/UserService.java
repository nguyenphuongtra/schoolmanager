package com.example.demo.users.service;

import com.example.demo.role.model.Role;
import com.example.demo.users.model.User;
import com.example.demo.users.model.UserRole;
import com.example.demo.role.repository.RoleRepository;
import com.example.demo.users.repository.UserRepository;
import com.example.demo.users.repository.UserRoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepo, RoleRepository roleRepo,
                       UserRoleRepository userRoleRepository, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(String username, String password) {
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setFullName(username);
        u.setIsActive(true);
        u.setUpdatedAt(LocalDateTime.now());
        return userRepo.save(u);
    }

    public User assignRole(UUID userId, UUID roleId) {
        User u = userRepo.findById(userId).orElseThrow();
        Role r = roleRepo.findById(roleId).orElseThrow();
        userRoleRepository.findByUserIdAndRoleIdAndDeletedAtIsNull(u.getId(), r.getId())
            .orElseGet(() -> {
                UserRole userRole = new UserRole(u.getId(), r.getId());
                userRole.setIsActive(true);
                userRole.setUpdatedAt(LocalDateTime.now());
                return userRoleRepository.save(userRole);
            });
        u.setUpdatedAt(LocalDateTime.now());
        return userRepo.save(u);
    }

    @Transactional
    public User updateUserRoles(UUID userId, List<UUID> roleIds) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Delete all existing user_roles for this user
        userRoleRepository.deleteByUserId(userId);

        // Create new user_roles
        for (UUID roleId : roleIds) {
            Role role = roleRepo.findById(roleId)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleId));
            UserRole userRole = new UserRole(user.getId(), role.getId());
            userRole.setIsActive(true);
            userRole.setUpdatedAt(LocalDateTime.now());
            userRoleRepository.save(userRole);
        }

        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);

        // Re-fetch to get updated roles via ManyToMany
        return userRepo.findById(userId).orElseThrow();
    }

    @Transactional
    public User removeRole(UUID userId, UUID roleId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        userRoleRepository.findByUserIdAndRoleIdAndDeletedAtIsNull(userId, roleId)
                .ifPresent(userRoleRepository::delete);
        user.setUpdatedAt(LocalDateTime.now());
        userRepo.save(user);
        return userRepo.findById(userId).orElseThrow();
    }

    public User findById(UUID userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
    }

    public List<User> findAll() {
        return userRepo.findAll();
    }
}
