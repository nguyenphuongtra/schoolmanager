package com.example.demo.auth.security;

import com.example.demo.role.model.Permission;
import com.example.demo.role.model.Role;
import com.example.demo.users.model.User;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

public class AuthenticatedUser implements UserDetails {

    private final UUID userId;
    private final String username;
    private final String password;
    private final boolean active;
    private final Set<GrantedAuthority> authorities;

    public AuthenticatedUser(UUID userId, String username, String password, boolean active, Set<GrantedAuthority> authorities) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.active = active;
        this.authorities = authorities;
    }

    public static AuthenticatedUser from(User user) {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();

        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                if (role == null || role.getDeletedAt() != null || Boolean.FALSE.equals(role.getIsActive())) {
                    continue;
                }

                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getCode().trim().toUpperCase()));

                if (role.getPermissions() == null) {
                    continue;
                }

                for (Permission permission : role.getPermissions()) {
                    if (permission == null || permission.getDeletedAt() != null || Boolean.FALSE.equals(permission.getIsActive())) {
                        continue;
                    }

                    authorities.add(new SimpleGrantedAuthority(permission.getCode()));
                }
            }
        }

        return new AuthenticatedUser(
            user.getId(),
            user.getUsername(),
            user.getPasswordHash(),
            user.getIsActive() == null || Boolean.TRUE.equals(user.getIsActive()),
            authorities
        );
    }

    public UUID getUserId() {
        return userId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return active;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return active;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
