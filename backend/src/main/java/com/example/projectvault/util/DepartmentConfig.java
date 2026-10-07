package com.example.projectvault.util;

import java.util.Set;

public final class DepartmentConfig {
    private DepartmentConfig() {}

    public static final Set<String> ALLOWED_DEPARTMENTS = Set.of(
            "Computer Science",
            "Information Technology",
            "Electronics and Communication",
            "Mechanical Engineering",
            "Civil Engineering"
    );

    public static String normalize(String department) {
        if (department == null) return null;
        String trimmed = department.trim();
        if (trimmed.isEmpty()) return null;
        return ALLOWED_DEPARTMENTS.stream()
                .filter(option -> option.equalsIgnoreCase(trimmed))
                .findFirst()
                .orElse(null);
    }
}
