package com.example.demo.grades.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class GradeEntryRequest {
    private UUID registrationId;
    private UUID gradeComponentId;
    private BigDecimal score;
    private String note;

    public UUID getRegistrationId() { return registrationId; }
    public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

    public UUID getGradeComponentId() { return gradeComponentId; }
    public void setGradeComponentId(UUID gradeComponentId) { this.gradeComponentId = gradeComponentId; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
