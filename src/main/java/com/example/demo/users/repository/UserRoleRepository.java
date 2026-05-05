package com.example.demo.users.repository;

import com.example.demo.users.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    Optional<UserRole> findByUserIdAndRoleIdAndDeletedAtIsNull(UUID userId, UUID roleId);

    List<UserRole> findByUserId(UUID userId);

    @Transactional
    void deleteByUserId(UUID userId);
}
