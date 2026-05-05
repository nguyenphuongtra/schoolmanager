package com.example.demo.grades.model;

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
@Table(name = "student_grades")
public class StudentGrade {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "UNIQUEIDENTIFIER", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "registration_id")
    private UUID registrationId;

    @Column(name = "grade_component_id")
    private UUID gradeComponentId;

    @Column(precision = 4, scale = 2)
    private BigDecimal score;

    @Column(name = "is_total")
    private Boolean isTotal;

    @Column(name = "is_retake")
    private Boolean isRetake;

    @Column(name = "is_locked")
    private Boolean isLocked;

    @Column(length = 255)
    private String note;

    @Column(name = "letter_grade", length = 2)
    private String letterGrade;

    @Column(name = "gpa_value", precision = 3, scale = 2)
    private BigDecimal gpaValue;

    @Column(length = 10)
    private String result;

    @Column(name = "scale_id")
    private UUID scaleId;

    @Column(name = "is_finalized")
    private Boolean isFinalized;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ===== Getters & Setters =====
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public UUID getGradeComponentId() { return gradeComponentId; }
    public void setGradeComponentId(UUID gradeComponentId) { this.gradeComponentId = gradeComponentId; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public Boolean getIsTotal() { return isTotal; }
    public void setIsTotal(Boolean isTotal) { this.isTotal = isTotal; }

    public Boolean getIsRetake() { return isRetake; }
    public void setIsRetake(Boolean isRetake) { this.isRetake = isRetake; }

    public Boolean getIsLocked() { return isLocked; }
    public void setIsLocked(Boolean isLocked) { this.isLocked = isLocked; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getLetterGrade() { return letterGrade; }
    public void setLetterGrade(String letterGrade) { this.letterGrade = letterGrade; }

    public BigDecimal getGpaValue() { return gpaValue; }
    public void setGpaValue(BigDecimal gpaValue) { this.gpaValue = gpaValue; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public UUID getScaleId() { return scaleId; }
    public void setScaleId(UUID scaleId) { this.scaleId = scaleId; }

    public Boolean getIsFinalized() { return isFinalized; }
    public void setIsFinalized(Boolean isFinalized) { this.isFinalized = isFinalized; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
