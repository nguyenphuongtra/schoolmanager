package com.example.demo.course_registrations.controller;

import com.example.demo.auth.security.AuthenticatedUser;
import com.example.demo.course_registrations.dto.*;
import com.example.demo.course_registrations.service.CourseRegistrationService;
import com.example.demo.students.model.Student;
import com.example.demo.students.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;


@RestController
@RequestMapping("/api/registrations")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('SCHEDULE_VIEW')")
public class CourseRegistrationController {

    private final CourseRegistrationService service;
    private final StudentRepository studentRepository;

    public CourseRegistrationController(CourseRegistrationService service,
                                        StudentRepository studentRepository) {
        this.service = service;
        this.studentRepository = studentRepository;
    }


    @GetMapping("/sections")
    public ResponseEntity<List<CourseSectionDTO>> getAvailableSections(
            @RequestParam UUID semesterId,
            @RequestParam(required = false) UUID departmentId) {
        List<CourseSectionDTO> sections = service.getAvailableSections(semesterId, departmentId);
        return ResponseEntity.ok(sections);
    }


    @PostMapping("/cart/validate")
    public ResponseEntity<CartValidateResponse> validateCart(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody CartValidateRequest request) {
        UUID studentId = getStudentId(user);
        CartValidateResponse response = service.validateCart(studentId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitRegistration(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody RegistrationSubmitRequest request) {
        UUID studentId = getStudentId(user);
        Map<String, Object> result = service.submitRegistration(studentId, request);
        return ResponseEntity.ok(result);
    }


    @GetMapping("/my-schedule")
    public ResponseEntity<List<ScheduleDTO>> getMySchedule(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam UUID semesterId) {
        UUID studentId = getStudentId(user);
        List<ScheduleDTO> schedule = service.getMySchedule(studentId, semesterId);
        return ResponseEntity.ok(schedule);
    }

    private UUID getStudentId(AuthenticatedUser user) {
        Student student = studentRepository.findFirstByUserIdAndDeletedAtIsNull(user.getUserId())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin sinh viên cho tài khoản này."));
        return student.getId();
    }
}
