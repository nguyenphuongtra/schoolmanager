package com.example.demo.course_registrations.model;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;


@Entity
@Table(name = "training_program_courses")
public class TrainingProgramCourse {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "UNIQUEIDENTIFIER", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "training_program_id")
    private UUID trainingProgramId;

    @Column(name = "course_id")
    private UUID courseId;

    @Column(name = "course_code", length = 100)
    private String courseCode;

    @Column(name = "course_name", length = 255)
    private String courseName;

    @Column(name = "semester_id")
    private UUID semesterId;

    @Column(name = "semester_code", length = 100)
    private String semesterCode;

    @Column(name = "academic_year", length = 20)
    private String academicYear;

    @Column(name = "is_required")
    private Boolean isRequired;

    @Column(name = "group_code", length = 50)
    private String groupCode;

    @Column(name = "credits", precision = 5, scale = 1)
    private BigDecimal credits;

    @Column(name = "prerequisite_course_id")
    private UUID prerequisiteCourseId;

    @Column(name = "is_prerequisite_required")
    private Boolean isPrerequisiteRequired;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_active")
    private Boolean isActive;

    // ===== Getters & Setters =====
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTrainingProgramId() { return trainingProgramId; }
    public void setTrainingProgramId(UUID trainingProgramId) { this.trainingProgramId = trainingProgramId; }

    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }

    public String getCourseCode() { return courseCode; }
    public String getCourseName() { return courseName; }

    public UUID getPrerequisiteCourseId() { return prerequisiteCourseId; }
    public void setPrerequisiteCourseId(UUID prerequisiteCourseId) { this.prerequisiteCourseId = prerequisiteCourseId; }

    public Boolean getIsPrerequisiteRequired() { return isPrerequisiteRequired; }
    public void setIsPrerequisiteRequired(Boolean isPrerequisiteRequired) { this.isPrerequisiteRequired = isPrerequisiteRequired; }

    public BigDecimal getCredits() { return credits; }
    public void setCredits(BigDecimal credits) { this.credits = credits; }

    public Boolean getIsRequired() { return isRequired; }
    public Boolean getIsActive() { return isActive; }
    public LocalDateTime getDeletedAt() { return deletedAt; }
}
