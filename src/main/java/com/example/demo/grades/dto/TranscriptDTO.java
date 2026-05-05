package com.example.demo.grades.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class TranscriptDTO {
    private UUID studentId;
    private String studentCode;
    private String studentName;
    private List<TranscriptRow> rows;
    private BigDecimal gpa;
    private BigDecimal totalCredits;
    private BigDecimal earnedCredits;

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public List<TranscriptRow> getRows() { return rows; }
    public void setRows(List<TranscriptRow> rows) { this.rows = rows; }

    public BigDecimal getGpa() { return gpa; }
    public void setGpa(BigDecimal gpa) { this.gpa = gpa; }

    public BigDecimal getTotalCredits() { return totalCredits; }
    public void setTotalCredits(BigDecimal totalCredits) { this.totalCredits = totalCredits; }

    public BigDecimal getEarnedCredits() { return earnedCredits; }
    public void setEarnedCredits(BigDecimal earnedCredits) { this.earnedCredits = earnedCredits; }

    public static class TranscriptRow {
        private UUID registrationId;
        private String courseSectionCode;
        private String courseName;
        private BigDecimal credits;
        private BigDecimal totalScore;
        private String letterGrade;
        private BigDecimal gpaValue;
        private String result;
        private String semesterName;
        private java.util.Map<String, BigDecimal> componentScores;

        public UUID getRegistrationId() { return registrationId; }
        public void setRegistrationId(UUID registrationId) { this.registrationId = registrationId; }

        public String getCourseSectionCode() { return courseSectionCode; }
        public void setCourseSectionCode(String courseSectionCode) { this.courseSectionCode = courseSectionCode; }

        public String getCourseName() { return courseName; }
        public void setCourseName(String courseName) { this.courseName = courseName; }

        public BigDecimal getCredits() { return credits; }
        public void setCredits(BigDecimal credits) { this.credits = credits; }

        public BigDecimal getTotalScore() { return totalScore; }
        public void setTotalScore(BigDecimal totalScore) { this.totalScore = totalScore; }

        public String getLetterGrade() { return letterGrade; }
        public void setLetterGrade(String letterGrade) { this.letterGrade = letterGrade; }

        public BigDecimal getGpaValue() { return gpaValue; }
        public void setGpaValue(BigDecimal gpaValue) { this.gpaValue = gpaValue; }

        public String getResult() { return result; }
        public void setResult(String result) { this.result = result; }

        public String getSemesterName() { return semesterName; }
        public void setSemesterName(String semesterName) { this.semesterName = semesterName; }

        public java.util.Map<String, BigDecimal> getComponentScores() { return componentScores; }
        public void setComponentScores(java.util.Map<String, BigDecimal> componentScores) { this.componentScores = componentScores; }
    }
}
