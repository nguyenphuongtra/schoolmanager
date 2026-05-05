package com.example.demo.auth.security;

import com.example.demo.students.repository.StudentRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StudentSecurityService {

    private final StudentRepository studentRepository;

    public StudentSecurityService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public boolean isOwner(UUID studentId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            return false;
        }

        return studentRepository.findByIdAndDeletedAtIsNull(studentId)
            .map(student -> student.getUserId() != null && student.getUserId().equals(principal.getUserId()))
            .orElse(false);
    }
}
