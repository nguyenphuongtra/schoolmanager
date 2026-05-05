package com.example.demo.students.service;

import com.example.demo.students.model.Student;
import com.example.demo.users.model.User;
import com.example.demo.students.repository.StudentRepository;
import com.example.demo.users.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class StudentService {
    private final StudentRepository repo;
    private final UserRepository userRepository;

    public StudentService(StudentRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    public List<Student> getAll() {
        return repo.findAll().stream()
            .filter(student -> student.getDeletedAt() == null)
            .filter(student -> student.getIsActive() == null || Boolean.TRUE.equals(student.getIsActive()))
            .map(this::attachEmail)
            .collect(Collectors.toList());
    }

    public Student getById(UUID id) {
        return attachEmail(repo.findByIdAndDeletedAtIsNull(id).orElse(null));
    }

    public Student getByUserId(UUID userId) {
        if (userId == null) {
            return null;
        }

        return attachEmail(repo.findFirstByUserIdAndDeletedAtIsNull(userId).orElse(null));
    }

    public Student create(Student student) {
        student.setId(null);
        student.setIsActive(student.getIsActive() == null ? true : student.getIsActive());
        student.setDeletedAt(null);
        student.setUpdatedAt(LocalDateTime.now());
        Student saved = repo.save(student);
        syncUserProfile(saved.getUserId(), student.getFullName(), student.getEmail());
        return attachEmail(saved);
    }

    public Student update(UUID id, Student student) {
        Student old = repo.findByIdAndDeletedAtIsNull(id).orElse(null);
        if (old == null) {
            return null;
        }

        if (student.getUserId() != null) {
            old.setUserId(student.getUserId());
        }
        if (student.getStudentCode() != null) {
            old.setStudentCode(student.getStudentCode());
        }
        if (student.getFullName() != null) {
            old.setFullName(student.getFullName());
        }
        if (student.getDateOfBirth() != null) {
            old.setDateOfBirth(student.getDateOfBirth());
        }
        if (student.getGender() != null) {
            old.setGender(student.getGender());
        }
        if (student.getPersonalIdentificationNumber() != null) {
            old.setPersonalIdentificationNumber(student.getPersonalIdentificationNumber());
        }
        if (student.getDateOfIssue() != null) {
            old.setDateOfIssue(student.getDateOfIssue());
        }
        if (student.getCardPlace() != null) {
            old.setCardPlace(student.getCardPlace());
        }
        if (student.getAddress() != null) {
            old.setAddress(student.getAddress());
        }
        if (student.getCurrentAddress() != null) {
            old.setCurrentAddress(student.getCurrentAddress());
        }
        if (student.getDepartmentId() != null) {
            old.setDepartmentId(student.getDepartmentId());
        }
        if (student.getMajorId() != null) {
            old.setMajorId(student.getMajorId());
        }
        if (student.getProgramId() != null) {
            old.setProgramId(student.getProgramId());
        }
        if (student.getStatus() != null) {
            old.setStatus(student.getStatus());
        }
        if (student.getClassId() != null) {
            old.setClassId(student.getClassId());
        }
        if (student.getAdmissionYear() != null) {
            old.setAdmissionYear(student.getAdmissionYear());
        }
        old.setIsActive(student.getIsActive() == null ? old.getIsActive() : student.getIsActive());
        old.setUpdatedAt(LocalDateTime.now());

        Student saved = repo.save(old);
        syncUserProfile(saved.getUserId(), student.getFullName(), student.getEmail());
        return attachEmail(saved);
    }

    public void delete(UUID id) {
        Student student = getById(id);
        if (student == null) {
            return;
        }

        student.setDeletedAt(LocalDateTime.now());
        student.setIsActive(false);
        student.setUpdatedAt(LocalDateTime.now());
        repo.save(student);
    }

    public Page<Student> search(String keyword, int page, int size) {
        return repo.searchByKeyword(keyword, PageRequest.of(page, size)).map(this::attachEmail);
    }

    private Student attachEmail(Student student) {
        if (student == null) {
            return null;
        }

        if (student.getUserId() == null) {
            student.setEmail(null);
            return student;
        }

        String email = userRepository.findById(student.getUserId())
            .map(user -> user.getEmail())
            .orElse(null);
        student.setEmail(email);
        return student;
    }

    private void syncUserProfile(UUID userId, String fullName, String email) {
        if (userId == null) {
            if (email != null && !email.isBlank()) {
                throw new ResponseStatusException(
                    BAD_REQUEST,
                    "Sinh vien chua lien ket tai khoan nguoi dung, khong the cap nhat email"
                );
            }
            return;
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(
                BAD_REQUEST,
                "Khong tim thay tai khoan nguoi dung lien ket voi sinh vien"
            ));

        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName);
        }
        if (email != null) {
            user.setEmail(email.isBlank() ? null : email);
        }
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
