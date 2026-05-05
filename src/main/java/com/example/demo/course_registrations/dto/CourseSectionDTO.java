package com.example.demo.course_registrations.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


public class CourseSectionDTO {
    private UUID sectionId;
    private String sectionCode;
    private UUID courseId;
    private String courseCode;
    private String courseName;
    private BigDecimal credits;
    private String courseType;
    private String employeeName;
    private String roomName;
    private Integer maxStudents;
    private int currentEnrollment;
    private int remainingSlots;
    private String status;
    private UUID departmentId;
    private List<ScheduleInfo> schedules;

    /** Thông tin lịch học của một buổi */
    public static class ScheduleInfo {
        private int dayOfWeek;
        private int startPeriod;
        private int endPeriod;
        private String roomName;

        public ScheduleInfo() {}
        public ScheduleInfo(int dayOfWeek, int startPeriod, int endPeriod, String roomName) {
            this.dayOfWeek = dayOfWeek;
            this.startPeriod = startPeriod;
            this.endPeriod = endPeriod;
            this.roomName = roomName;
        }

        public int getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }
        public int getStartPeriod() { return startPeriod; }
        public void setStartPeriod(int startPeriod) { this.startPeriod = startPeriod; }
        public int getEndPeriod() { return endPeriod; }
        public void setEndPeriod(int endPeriod) { this.endPeriod = endPeriod; }
        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
    }

    // ===== Getters & Setters =====
    public UUID getSectionId() { return sectionId; }
    public void setSectionId(UUID sectionId) { this.sectionId = sectionId; }

    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }

    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public BigDecimal getCredits() { return credits; }
    public void setCredits(BigDecimal credits) { this.credits = credits; }

    public String getCourseType() { return courseType; }
    public void setCourseType(String courseType) { this.courseType = courseType; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }

    public int getCurrentEnrollment() { return currentEnrollment; }
    public void setCurrentEnrollment(int currentEnrollment) { this.currentEnrollment = currentEnrollment; }

    public int getRemainingSlots() { return remainingSlots; }
    public void setRemainingSlots(int remainingSlots) { this.remainingSlots = remainingSlots; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }

    public List<ScheduleInfo> getSchedules() { return schedules; }
    public void setSchedules(List<ScheduleInfo> schedules) { this.schedules = schedules; }
}
