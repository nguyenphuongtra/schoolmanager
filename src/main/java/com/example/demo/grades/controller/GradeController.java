package com.example.demo.grades.controller;

import com.example.demo.auth.security.AuthenticatedUser;
import com.example.demo.grades.dto.GradeEntryRequest;
import com.example.demo.grades.dto.TranscriptDTO;
import com.example.demo.grades.model.GradeComponent;
import com.example.demo.grades.model.StudentGrade;
import com.example.demo.grades.service.GradeService;
import com.example.demo.students.model.Student;
import com.example.demo.students.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/grades")
@CrossOrigin(origins = "*")
public class GradeController {

    private final GradeService gradeService;
    private final StudentRepository studentRepository;

    public GradeController(GradeService gradeService, StudentRepository studentRepository) {
        this.gradeService = gradeService;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/components/{courseSectionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('GRADE_VIEW')")
    public List<GradeComponent> getComponents(@PathVariable UUID courseSectionId) {
        return gradeService.getComponents(courseSectionId);
    }


    @GetMapping("/course-section/{courseSectionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('GRADE_VIEW')")
    public Map<String, Object> getGradesForCourseSection(@PathVariable UUID courseSectionId) {
        return gradeService.getGradesForCourseSection(courseSectionId);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('GRADE_INPUT')")
    public StudentGrade saveGrade(@RequestBody GradeEntryRequest request) {
        return gradeService.saveGrade(request);
    }

    @GetMapping("/transcript")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('GRADE_VIEW')")
    public ResponseEntity<TranscriptDTO> getOwnTranscript(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        Student student = studentRepository.findFirstByUserIdAndDeletedAtIsNull(user.getUserId()).orElse(null);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }

        TranscriptDTO transcript = gradeService.getTranscript(student.getId());
        return ResponseEntity.ok(transcript);
    }


    @GetMapping("/transcript/{studentId}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('GRADE_VIEW')")
    public ResponseEntity<TranscriptDTO> getStudentTranscript(@PathVariable UUID studentId) {
        TranscriptDTO transcript = gradeService.getTranscript(studentId);
        if (transcript == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(transcript);
    }
}
