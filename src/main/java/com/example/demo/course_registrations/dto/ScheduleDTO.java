package com.example.demo.course_registrations.dto;

import java.util.UUID;

/**
 * DTO cho dữ liệu lịch học hiển thị trên calendar view
 */
public class ScheduleDTO {
    private UUID sectionId;
    private String sectionCode;
    private String courseName;
    private String courseCode;
    private int dayOfWeek;
    private int startPeriod;
    private int endPeriod;
    private String roomName;
    private String status;

    // ===== Getters & Setters =====
    public UUID getSectionId() { return sectionId; }
    public void setSectionId(UUID sectionId) { this.sectionId = sectionId; }

    public String getSectionCode() { return sectionCode; }
    public void setSectionCode(String sectionCode) { this.sectionCode = sectionCode; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public int getStartPeriod() { return startPeriod; }
    public void setStartPeriod(int startPeriod) { this.startPeriod = startPeriod; }

    public int getEndPeriod() { return endPeriod; }
    public void setEndPeriod(int endPeriod) { this.endPeriod = endPeriod; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
