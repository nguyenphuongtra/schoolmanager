package com.example.demo.course_registrations.dto;

import java.util.List;
import java.util.UUID;


public class RegistrationSubmitRequest {
    private List<UUID> sectionIds;

    public List<UUID> getSectionIds() { return sectionIds; }
    public void setSectionIds(List<UUID> sectionIds) { this.sectionIds = sectionIds; }
}
