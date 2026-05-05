package com.example.demo.course_registrations.dto;

import java.util.List;
import java.util.UUID;

public class CartValidateRequest {
    private UUID sectionId;
    private List<UUID> cartSectionIds;

    public UUID getSectionId() { return sectionId; }
    public void setSectionId(UUID sectionId) { this.sectionId = sectionId; }

    public List<UUID> getCartSectionIds() { return cartSectionIds; }
    public void setCartSectionIds(List<UUID> cartSectionIds) { this.cartSectionIds = cartSectionIds; }
}
