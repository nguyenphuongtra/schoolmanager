package com.example.demo.course_registrations.exception;

public class RegistrationException extends RuntimeException {
    private final String errorCode;

    public RegistrationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }


    public static RegistrationException debt(String message) {
        return new RegistrationException("STUDENT_DEBT", message);
    }

    public static RegistrationException prerequisite(String message) {
        return new RegistrationException("PREREQUISITE_NOT_MET", message);
    }

    public static RegistrationException scheduleConflict(String message) {
        return new RegistrationException("SCHEDULE_CONFLICT", message);
    }

    public static RegistrationException creditLimit(String message) {
        return new RegistrationException("CREDIT_LIMIT_EXCEEDED", message);
    }

    public static RegistrationException sectionFull(String message) {
        return new RegistrationException("SECTION_FULL", message);
    }

    public static RegistrationException windowClosed(String message) {
        return new RegistrationException("REGISTRATION_WINDOW_CLOSED", message);
    }

    public static RegistrationException alreadyRegistered(String message) {
        return new RegistrationException("ALREADY_REGISTERED", message);
    }
}
