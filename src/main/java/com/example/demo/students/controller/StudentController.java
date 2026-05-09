package com.example.demo.students.controller;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


import com.example.demo.students.model.Student;
import com.example.demo.auth.security.AuthenticatedUser;
import com.example.demo.students.service.StudentService;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*") // cho phép frontend gọi
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    // GET ALL
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('STUDENT_VIEW')")
    public List<Student> getAll() {
        return service.getAll();
    }

    // GET BY ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('STUDENT_VIEW') or ((hasRole('STUDENT') or hasAuthority('STUDENT_VIEW')) and @studentSecurityService.isOwner(#id, authentication))")
    public Student getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT') or hasAuthority('STUDENT_VIEW') or hasAuthority('STUDENT_UPDATE')")
    public Student getCurrentStudent(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            return null;
        }

        return service.getByUserId(user.getUserId());
    }

    // CREATE
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('STUDENT_CREATE')")
    public Student create(@RequestBody Student student) {
        return service.create(student);
    }

    // UPDATE
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('STUDENT_UPDATE') or ((hasRole('STUDENT') or hasAuthority('STUDENT_UPDATE')) and @studentSecurityService.isOwner(#id, authentication))")
    public Student update(@PathVariable UUID id,
                          @RequestBody Student student) {
        return service.update(id, student);
    }

    // DELETE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('STUDENT_DELETE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    // SEARCH BY NAME
    // SEARCH + PHÂN TRANG (gần đúng theo tên/email)
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ACADEMIC_AFFAIRS') or hasAuthority('STUDENT_VIEW')")
    public Page<Student> search(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "15") int size
    ) {
        return service.search(keyword, page, size);
    }
    

}
