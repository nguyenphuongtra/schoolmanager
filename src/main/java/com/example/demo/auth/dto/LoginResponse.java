package com.example.demo.auth.dto;

import java.util.List;
import java.util.UUID;

public class LoginResponse {
    private String token;
    private UUID userId;
    private String username;
    private String fullName;
    private List<String> roles;

    public LoginResponse() {
    }

    public LoginResponse(String token, UUID userId, String username, String fullName, List<String> roles) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.fullName = fullName;
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
