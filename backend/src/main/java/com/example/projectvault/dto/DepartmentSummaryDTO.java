package com.example.projectvault.dto;

import java.time.LocalDateTime;

public record DepartmentSummaryDTO(
        String name,
        long studentCount,
        long adminCount,
        long publicProjectCount,
        LocalDateTime latestPublicActivity) {}
