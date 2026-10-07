package com.example.projectvault.dto;

import java.util.List;

public record StudentProfileDTO(
        Long id,
        String name,
        String summary,
        String department,
        String course,
        String skills,
        boolean hasProfileImage,
        boolean recoveryDetailsComplete,
        String profileVisibility,
        long publicProjectCount,
        long ratedPublicProjectCount,
        long totalProjectStars,
        Double averageProjectRating,
        List<ProjectDTO> projects) {}
