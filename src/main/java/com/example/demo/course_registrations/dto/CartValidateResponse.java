package com.example.demo.course_registrations.dto;


public class CartValidateResponse {
    private boolean valid;
    private String message;
    private String conflictDetails;

    public CartValidateResponse() {}

    public CartValidateResponse(boolean valid, String message) {
        this.valid = valid;
        this.message = message;
    }

    public CartValidateResponse(boolean valid, String message, String conflictDetails) {
        this.valid = valid;
        this.message = message;
        this.conflictDetails = conflictDetails;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getConflictDetails() { return conflictDetails; }
    public void setConflictDetails(String conflictDetails) { this.conflictDetails = conflictDetails; }
}
