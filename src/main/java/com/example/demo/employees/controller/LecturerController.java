package com.example.demo.employees.controller;

import com.example.demo.auth.security.AuthenticatedUser;
import com.example.demo.employees.model.Employee;
import com.example.demo.employees.service.LecturerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lecturer")
@CrossOrigin(origins = "*")
public class LecturerController {

    private final LecturerService lecturerService;

    public LecturerController(LecturerService lecturerService) {
        this.lecturerService = lecturerService;
    }

    @GetMapping("/my-course-sections")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','LECTURER')")
    public ResponseEntity<?> getMyCourseSections(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(name = "semesterId", required = false) UUID semesterId) {

        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.status(404)
                .body(Map.of("error", "Không tìm thấy hồ sơ giảng viên cho tài khoản này."));
        }

        List<Map<String, Object>> sections = lecturerService.getMyCourseSections(employee.getId(), semesterId);
        return ResponseEntity.ok(sections);
    }
    @GetMapping("/my-schedule")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','LECTURER')")
    public ResponseEntity<?> getMySchedule(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(name = "semesterId", required = false) UUID semesterId) {

        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.status(404)
                .body(Map.of("error", "Không tìm thấy hồ sơ giảng viên cho tài khoản này."));
        }

        List<Map<String, Object>> schedule = lecturerService.getMySchedule(employee.getId(), semesterId);
        return ResponseEntity.ok(schedule);
    }

    @GetMapping("/course-section/{courseSectionId}/students")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','LECTURER')")
    public ResponseEntity<?> getStudentsInCourseSection(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID courseSectionId) {

        Employee employee = resolveEmployee(user);
        if (employee == null) {
            return ResponseEntity.status(404)
                .body(Map.of("error", "Không tìm thấy hồ sơ giảng viên cho tài khoản này."));
        }

        Map<String, Object> result = lecturerService.getStudentsInCourseSection(employee.getId(), courseSectionId);
        if (result == null) {
            return ResponseEntity.status(403)
                .body(Map.of("error", "Bạn không phụ trách lớp học phần này."));
        }

        return ResponseEntity.ok(result);
    }

    private Employee resolveEmployee(AuthenticatedUser user) {
        if (user == null) return null;
        return lecturerService.findEmployeeByUserId(user.getUserId());
    }
}
