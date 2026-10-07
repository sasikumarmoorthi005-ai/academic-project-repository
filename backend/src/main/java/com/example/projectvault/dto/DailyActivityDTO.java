package com.example.projectvault.dto;

import java.time.LocalDate;

public record DailyActivityDTO(
        LocalDate date,
        long total,
        long projectsCreated,
        long projectsUpdated,
        long versionsSaved,
        long filesUploaded,
        long ratingsSet,
        long ratingsRemoved) {}
