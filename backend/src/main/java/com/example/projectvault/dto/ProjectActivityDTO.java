package com.example.projectvault.dto;

import com.example.projectvault.entity.ProjectActivity;
import java.time.LocalDateTime;

public record ProjectActivityDTO(
        Long id,
        Long projectId,
        String projectTitle,
        String ownerName,
        String activityType,
        String description,
        LocalDateTime createdAt) {

    public static ProjectActivityDTO from(ProjectActivity activity) {
        return new ProjectActivityDTO(
                activity.getId(),
                activity.getProject().getId(),
                activity.getProject().getTitle(),
                activity.getProject().getOwner().getName(),
                activity.getActivityType(),
                activity.getDescription(),
                activity.getCreatedAt());
    }
}
