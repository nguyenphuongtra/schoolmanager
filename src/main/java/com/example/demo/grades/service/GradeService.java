package com.example.demo.grades.service;

import com.example.demo.course_registrations.model.CourseSection;
import com.example.demo.course_registrations.model.StudentCourseSection;
import com.example.demo.course_registrations.repository.CourseSectionRepository;
import com.example.demo.course_registrations.repository.StudentCourseSectionRepository;
import com.example.demo.courses.model.Course;
import com.example.demo.courses.repository.CourseRepository;
import com.example.demo.grades.dto.GradeEntryRequest;
import com.example.demo.grades.dto.TranscriptDTO;
import com.example.demo.grades.model.GradeComponent;
import com.example.demo.grades.model.GradeScale;
import com.example.demo.grades.model.StudentGrade;
import com.example.demo.grades.repository.GradeComponentRepository;
import com.example.demo.grades.repository.GradeScaleRepository;
import com.example.demo.grades.repository.StudentGradeRepository;
import com.example.demo.semesters.model.Semester;
import com.example.demo.semesters.repository.SemesterRepository;
import com.example.demo.students.model.Student;
import com.example.demo.students.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GradeService {

    private final StudentGradeRepository studentGradeRepo;
    private final GradeComponentRepository componentRepo;
    private final GradeScaleRepository scaleRepo;
    private final StudentCourseSectionRepository registrationRepo;
    private final CourseSectionRepository courseSectionRepo;
    private final CourseRepository courseRepo;
    private final StudentRepository studentRepo;
    private final SemesterRepository semesterRepo;

    public GradeService(StudentGradeRepository studentGradeRepo,
                        GradeComponentRepository componentRepo,
                        GradeScaleRepository scaleRepo,
                        StudentCourseSectionRepository registrationRepo,
                        CourseSectionRepository courseSectionRepo,
                        CourseRepository courseRepo,
                        StudentRepository studentRepo,
                        SemesterRepository semesterRepo) {
        this.studentGradeRepo = studentGradeRepo;
        this.componentRepo = componentRepo;
        this.scaleRepo = scaleRepo;
        this.registrationRepo = registrationRepo;
        this.courseSectionRepo = courseSectionRepo;
        this.courseRepo = courseRepo;
        this.studentRepo = studentRepo;
        this.semesterRepo = semesterRepo;
    }


    public List<GradeComponent> getComponents(UUID courseSectionId) {
        return componentRepo.findByCourseSectionIdAndDeletedAtIsNullOrderByDisplayOrderAsc(courseSectionId);
    }


    public Map<String, Object> getGradesForCourseSection(UUID courseSectionId) {
        List<GradeComponent> components = getComponents(courseSectionId);
        List<StudentGrade> allGrades = studentGradeRepo.findAllByCourseSectionId(courseSectionId);
        List<StudentCourseSection> registrations = registrationRepo.findByCourseSectionIdAndDeletedAtIsNull(courseSectionId);

        List<Map<String, Object>> studentRows = new ArrayList<>();
        for (StudentCourseSection reg : registrations) {
            Student student = studentRepo.findByIdAndDeletedAtIsNull(reg.getStudentId()).orElse(null);
            if (student == null) continue;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("registrationId", reg.getId());
            row.put("studentId", student.getId());
            row.put("studentCode", student.getStudentCode());
            row.put("studentName", student.getFullName());

            Map<String, Object> grades = new LinkedHashMap<>();
            for (StudentGrade grade : allGrades) {
                if (grade.getRegistrationId().equals(reg.getId())) {
                    String key = grade.getGradeComponentId() != null
                        ? grade.getGradeComponentId().toString()
                        : "total";
                    Map<String, Object> gradeInfo = new LinkedHashMap<>();
                    gradeInfo.put("id", grade.getId());
                    gradeInfo.put("score", grade.getScore());
                    gradeInfo.put("isLocked", grade.getIsLocked());
                    gradeInfo.put("letterGrade", grade.getLetterGrade());
                    gradeInfo.put("gpaValue", grade.getGpaValue());
                    gradeInfo.put("result", grade.getResult());
                    grades.put(key, gradeInfo);
                }
            }
            row.put("grades", grades);
            studentRows.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("components", components);
        result.put("students", studentRows);
        return result;
    }


    public StudentGrade saveGrade(GradeEntryRequest request) {
        List<StudentGrade> existing = studentGradeRepo
            .findByRegistrationIdAndDeletedAtIsNull(request.getRegistrationId());

        StudentGrade grade = existing.stream()
            .filter(g -> Objects.equals(g.getGradeComponentId(), request.getGradeComponentId()))
            .findFirst()
            .orElse(null);

        if (grade == null) {
            grade = new StudentGrade();
            grade.setRegistrationId(request.getRegistrationId());
            grade.setGradeComponentId(request.getGradeComponentId());
            grade.setIsTotal(request.getGradeComponentId() == null);
            grade.setIsRetake(false);
            grade.setIsLocked(false);
            grade.setIsFinalized(false);
            grade.setIsActive(true);
        }

        if (Boolean.TRUE.equals(grade.getIsLocked())) {
            throw new RuntimeException("Điểm đã bị khóa, không thể chỉnh sửa.");
        }

        grade.setScore(request.getScore());
        grade.setNote(request.getNote());
        grade.setUpdatedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(grade.getIsTotal()) && request.getScore() != null) {
            applyGradeScale(grade, request.getScore());
            return studentGradeRepo.save(grade);
        }

        studentGradeRepo.save(grade);
        
        recalculateTotalGrade(request.getRegistrationId());
        
        return grade;
    }

    private void recalculateTotalGrade(UUID registrationId) {
        StudentCourseSection reg = registrationRepo.findById(registrationId).orElse(null);
        if (reg == null) return;
        List<GradeComponent> components = getComponents(reg.getCourseSectionId());
        List<StudentGrade> currentGrades = studentGradeRepo.findByRegistrationIdAndDeletedAtIsNull(registrationId);
        
        BigDecimal totalScore = BigDecimal.ZERO;
        boolean hasAnyGrade = false;
        
        for (GradeComponent comp : components) {
            if (!Boolean.TRUE.equals(comp.getIsActive())) continue;
            BigDecimal compScore = currentGrades.stream()
                .filter(g -> comp.getId().equals(g.getGradeComponentId()))
                .map(StudentGrade::getScore)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
            
            if (comp.getWeight() != null) {
                totalScore = totalScore.add(
                    compScore.multiply(comp.getWeight()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                );
            }
            
            if (currentGrades.stream().anyMatch(g -> comp.getId().equals(g.getGradeComponentId()) && g.getScore() != null)) {
                hasAnyGrade = true;
            }
        }
        
        if (!hasAnyGrade) return;
        
        StudentGrade totalGrade = currentGrades.stream()
            .filter(g -> Boolean.TRUE.equals(g.getIsTotal()))
            .findFirst()
            .orElse(null);
        
        if (totalGrade == null) {
            totalGrade = new StudentGrade();
            totalGrade.setRegistrationId(registrationId);
            totalGrade.setIsTotal(true);
            totalGrade.setIsRetake(false);
            totalGrade.setIsLocked(false);
            totalGrade.setIsFinalized(false);
            totalGrade.setIsActive(true);
        }
        
        totalGrade.setScore(totalScore);
        totalGrade.setUpdatedAt(LocalDateTime.now());
        applyGradeScale(totalGrade, totalScore);
        
        studentGradeRepo.save(totalGrade);
    }


    public TranscriptDTO getTranscript(UUID studentId) {
        Student student = studentRepo.findByIdAndDeletedAtIsNull(studentId).orElse(null);
        if (student == null) return null;

        TranscriptDTO dto = new TranscriptDTO();
        dto.setStudentId(studentId);
        dto.setStudentCode(student.getStudentCode());
        dto.setStudentName(student.getFullName());

        List<StudentGrade> allGrades = studentGradeRepo.findAllByStudentId(studentId);

        Map<UUID, List<StudentGrade>> gradesByReg = allGrades.stream()
            .collect(Collectors.groupingBy(StudentGrade::getRegistrationId));

        List<TranscriptDTO.TranscriptRow> rows = new ArrayList<>();
        BigDecimal totalWeighted = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal earnedCredits = BigDecimal.ZERO;

        List<StudentCourseSection> registrations = registrationRepo
            .findByStudentIdAndDeletedAtIsNull(studentId);

        for (StudentCourseSection reg : registrations) {
            CourseSection cs = courseSectionRepo.findById(reg.getCourseSectionId()).orElse(null);
            if (cs == null) continue;

            Course course = courseRepo.findById(cs.getCourseId()).orElse(null);
            if (course == null) continue;

            TranscriptDTO.TranscriptRow row = new TranscriptDTO.TranscriptRow();
            row.setRegistrationId(reg.getId());
            row.setCourseSectionCode(cs.getCode());
            row.setCourseName(course.getName());
            row.setCredits(course.getCredits());

            if (cs.getSemesterId() != null) {
                semesterRepo.findById(cs.getSemesterId())
                    .ifPresent(s -> row.setSemesterName(s.getName()));
            }

            List<StudentGrade> regGrades = gradesByReg.getOrDefault(reg.getId(), Collections.emptyList());
            StudentGrade totalGrade = regGrades.stream()
                .filter(g -> Boolean.TRUE.equals(g.getIsTotal()))
                .findFirst()
                .orElse(null);

            if (totalGrade != null) {
                row.setTotalScore(totalGrade.getScore());
                row.setLetterGrade(totalGrade.getLetterGrade());
                row.setGpaValue(totalGrade.getGpaValue());
                row.setResult(totalGrade.getResult());

                if (course.getCredits() != null && totalGrade.getGpaValue() != null) {
                    totalWeighted = totalWeighted.add(
                        totalGrade.getGpaValue().multiply(course.getCredits()));
                    totalCredits = totalCredits.add(course.getCredits());

                    if ("PASS".equals(totalGrade.getResult())) {
                        earnedCredits = earnedCredits.add(course.getCredits());
                    }
                }
            }

            // Populate component scores
            Map<String, BigDecimal> compScores = new LinkedHashMap<>();
            List<GradeComponent> components = getComponents(cs.getId());
            for (GradeComponent c : components) {
                regGrades.stream()
                    .filter(g -> c.getId().equals(g.getGradeComponentId()) && g.getScore() != null)
                    .findFirst()
                    .ifPresent(g -> compScores.put(c.getName(), g.getScore()));
            }
            row.setComponentScores(compScores);

            rows.add(row);
        }

        dto.setRows(rows);
        dto.setTotalCredits(totalCredits);
        dto.setEarnedCredits(earnedCredits);

        if (totalCredits.compareTo(BigDecimal.ZERO) > 0) {
            dto.setGpa(totalWeighted.divide(totalCredits, 2, RoundingMode.HALF_UP));
        } else {
            dto.setGpa(BigDecimal.ZERO);
        }

        return dto;
    }

    private void applyGradeScale(StudentGrade grade, BigDecimal score) {
        List<GradeScale> scales = scaleRepo.findAllByDeletedAtIsNullOrderByMinScoreDesc();
        for (GradeScale scale : scales) {
            if (score.compareTo(scale.getMinScore()) >= 0 && score.compareTo(scale.getMaxScore()) <= 0) {
                grade.setLetterGrade(scale.getLetterGrade());
                grade.setGpaValue(scale.getGpaValue());
                grade.setResult(Boolean.TRUE.equals(scale.getIsPass()) ? "PASS" : "FAIL");
                grade.setScaleId(scale.getId());
                return;
            }
        }
    }
}
