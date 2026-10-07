package com.example.projectvault.entity;

public enum ProjectVisibility {
    PRIVATE,
    DEPARTMENT,
    PUBLIC;

    public static ProjectVisibility normalize(String value) {
        if (value == null) return PRIVATE;
        try {
            return ProjectVisibility.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return PRIVATE;
        }
    }
}
