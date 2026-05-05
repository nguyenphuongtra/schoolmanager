package com.example.demo.courses.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "UNIQUEIDENTIFIER", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(length = 20)
    private String code;

    @Column(length = 255)
    private String name;

    @Column(name = "name_en", length = 255)
    private String nameEn;

    @Column(precision = 5, scale = 1)
    private BigDecimal credits;

    @Column(name = "course_type", length = 20)
    private String courseType;

    @Column(name = "theory_hours", precision = 5, scale = 1)
    private BigDecimal theoryHours;

    @Column(name = "practice_hours", precision = 5, scale = 1)
    private BigDecimal practiceHours;

    @Column(name = "self_study_hours", precision = 5, scale = 1)
    private BigDecimal selfStudyHours;

    @Column(name = "internship_credits", precision = 5, scale = 1)
    private BigDecimal internshipCredits;

    @Column(columnDefinition = "nvarchar(max)")
    private String description;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_active")
    private Boolean isActive;

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public BigDecimal getCredits() { return credits; }
    public void setCredits(BigDecimal credits) { this.credits = credits; }

    public String getCourseType() { return courseType; }
    public void setCourseType(String courseType) { this.courseType = courseType; }

    public BigDecimal getTheoryHours() { return theoryHours; }
    public void setTheoryHours(BigDecimal theoryHours) { this.theoryHours = theoryHours; }

    public BigDecimal getPracticeHours() { return practiceHours; }
    public void setPracticeHours(BigDecimal practiceHours) { this.practiceHours = practiceHours; }

    public BigDecimal getSelfStudyHours() { return selfStudyHours; }
    public void setSelfStudyHours(BigDecimal selfStudyHours) { this.selfStudyHours = selfStudyHours; }

    public BigDecimal getInternshipCredits() { return internshipCredits; }
    public void setInternshipCredits(BigDecimal internshipCredits) { this.internshipCredits = internshipCredits; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
