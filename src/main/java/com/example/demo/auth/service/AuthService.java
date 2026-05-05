package com.example.demo.auth.service;

import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.LoginResponse;
import com.example.demo.role.model.Role;
import com.example.demo.users.model.User;
import com.example.demo.users.repository.UserRepository;
import com.example.demo.auth.security.AuthenticatedUser;
import com.example.demo.auth.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            throw new BadCredentialsException("Username hoặc password không hợp lệ");
        }

        User user = userRepository.findFirstByUsernameAndDeletedAtIsNull(request.getUsername())
            .filter(found -> found.getIsActive() == null || Boolean.TRUE.equals(found.getIsActive()))
            .orElseThrow(() -> new BadCredentialsException("Sai tài khoản hoặc mật khẩu"));

        if (!matchesPassword(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Sai tài khoản hoặc mật khẩu");
        }

        upgradeLegacyPasswordIfNeeded(user, request.getPassword());
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(user);
        String token = jwtService.generateToken(authenticatedUser);
        List<String> roles = user.getRoles().stream()
            .filter(role -> role.getDeletedAt() == null)
            .filter(role -> role.getIsActive() == null || Boolean.TRUE.equals(role.getIsActive()))
            .map(role -> role.getCode().trim().toUpperCase())
            .sorted(Comparator.naturalOrder())
            .toList();

        return new LoginResponse(token, user.getId(), user.getUsername(), user.getFullName(), roles);
    }

    private boolean matchesPassword(String rawPassword, String storedPassword) {
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        if (passwordEncoder.matches(rawPassword, storedPassword)) {
            return true;
        }

        return rawPassword.equals(storedPassword);
    }

    private void upgradeLegacyPasswordIfNeeded(User user, String rawPassword) {
        String storedPassword = user.getPasswordHash();
        if (storedPassword != null && !storedPassword.startsWith("$2")) {
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
        }
    }
}
