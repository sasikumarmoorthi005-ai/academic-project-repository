package com.example.projectvault.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record StudentProfileUpdateDTO(
        @Size(max = 2000, message = "Summary must be 2000 characters or fewer")
        String summary,
        @Size(max = 120, message = "Department must be 120 characters or fewer")
        String department,
        @Size(max = 120, message = "Course must be 120 characters or fewer")
        String course,
        @Size(max = 500, message = "Skills must be 500 characters or fewer")
        String skills,
        @Pattern(regexp = "PRIVATE|PUBLIC", flags = Pattern.Flag.CASE_INSENSITIVE,
                message = "Profile visibility must be PRIVATE or PUBLIC")
        String profileVisibility) {}
